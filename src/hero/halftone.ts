/**
 * Monogram Field: Edwin's EI monogram built out of halftone dots in 3D.
 * ----------------------------------------------------------------------------
 * Rendered with WebGL2. Dots exist only where the mark is (the script letters
 * and the ring); there is no background sheet. Every dot is a small quad on
 * the mark's surface, so dots foreshorten and shrink with distance.
 *
 *  - On load the mark is a flat grid of square dots. It lifts into 3D from the
 *    top-left, the way it would be written, and the squares turn round.
 *  - The strokes are rounded in relief (taller in the middle, sloping to the
 *    edges) and sit on three fainter layers behind, so the mark reads as a
 *    solid object when it turns. Dot size follows the light on the surface.
 *  - The mark turns slowly, tilts back as the page scrolls, and the pointer
 *    presses into it like a fingertip.
 *
 * The surface formulas exist twice: in GLSL (rendering) and in JS (pointer
 * picking and fitting). Keep `shape()` / `placed()` in sync if you change one.
 */

export type HalftoneController = {
  start(): void;
  setActive(active: boolean): void;
  /** 0 at the top of the page, 1 once the hero has scrolled away. */
  setScroll(value: number): void;
  resize(): void;
  /** Render one frame at a fixed time and assembly progress (for stills). */
  renderFrame(time: number, progress: number): void;
  /** New dot and background colours (0 to 1), e.g. after the theme changes. */
  setColors(ink: [number, number, number], paper: [number, number, number]): void;
  destroy(): void;
};

export type HalftoneOptions = {
  /** The mark: green = coverage (where the mark is), blue = rounded height. Must be same-origin or a data URL. */
  map: HTMLImageElement | HTMLCanvasElement | ImageBitmap;
  /** Dot colour (the "ink"), 0 to 1. */
  ink?: [number, number, number];
  /** Background colour behind the canvas; hidden layers are painted with it. */
  paper?: [number, number, number];
  /** Dot pitch in CSS pixels. */
  pitch?: number;
  maxDpr?: number;
  assembleSeconds?: number;
  holdSeconds?: number;
  interactive?: boolean;
};

const SHAPE = {
  yaw: 0.18,
  pitch: -0.12,
  roll: -0.04,
  relief: 0.07,
  layerGap: 0.03,
  layers: 3,
  pressDepth: 0.09,
  pressRadius: 0.22,
  stagger: 0.8,
};

/** The fingertip press: a slightly under-damped spring (ζ ≈ 0.72, about 4% overshoot). */
const PRESS_SPRING = { stiffness: 120, damping: 2 * 0.72 * Math.sqrt(120) };

const VERT = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 aCell; // uv on the mark, layer (0 = face, 1.. = behind)

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform float uHalf;
uniform float uCell;
uniform float uTime;
uniform float uProgress;
uniform float uScroll;
uniform vec3 uLight;
uniform vec4 uPress;
uniform vec2 uFade;
uniform float uScale;
uniform vec2 uOffset;
uniform sampler2D uMap;

out vec2 vLocal;
out float vRadius;
out float vMorph;

const float PI = 3.14159265;
const float YAW = ${SHAPE.yaw.toFixed(4)};
const float PITCH = ${SHAPE.pitch.toFixed(4)};
const float ROLL = ${SHAPE.roll.toFixed(4)};
const float RELIEF = ${SHAPE.relief.toFixed(4)};
const float GAP = ${SHAPE.layerGap.toFixed(4)};
const float DEPTH = ${SHAPE.pressDepth.toFixed(4)};
const float STAGGER = ${SHAPE.stagger.toFixed(4)};

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

// An entrance, so it eases out: each dot leaves at speed and settles softly.
float easeOut(float x) {
  float k = 1.0 - x;
  return 1.0 - k * k * k;
}

// Lifts from the top-left first, the direction the letters are written.
float localProgress(vec2 uv) {
  float far = length(uv - vec2(-1.0, 1.0)) / 2.8284;
  return easeOut(clamp(uProgress * (1.0 + STAGGER) - far * STAGGER, 0.0, 1.0));
}

vec2 texel(vec2 uv) { return vec2(uv.x * 0.5 + 0.5, 0.5 - uv.y * 0.5); }

// The mark in its own space: rounded strokes on the face, flat layers stacked behind.
vec3 shape(vec2 uv, float layer, float t, float relief) {
  vec2 p = uv * uHalf;
  float z = layer < 0.5 ? textureLod(uMap, texel(uv), 0.0).b * RELIEF * relief : -layer * GAP;
  z += -0.08 * p.x * p.x + 0.015 * sin(2.2 * uv.x + 1.6 * uv.y - t * 0.6);
  return vec3(p, z);
}

vec3 placed(vec2 uv, float layer, float t, float e, float relief) {
  vec3 flatPos = vec3(uv * uHalf, -layer * 0.002);
  float yaw = YAW + 0.42 * sin(t * 0.11);
  float pitch = PITCH + 0.12 * sin(t * 0.08 + 0.8) + 0.55 * uScroll;
  float roll = ROLL + 0.03 * sin(t * 0.05 + 2.0);
  vec3 lifted = rotY(yaw) * rotX(pitch) * rotZ(roll) * (shape(uv, layer, t, relief) * uScale) + vec3(uOffset, -0.9 * uScroll);
  return mix(flatPos, lifted, e);
}

void main() {
  vec2 uv = aCell.xy;
  float layer = aCell.z;
  float e = localProgress(uv);
  float mask = textureLod(uMap, texel(uv), 0.0).g;

  vec2 uvU = uv + vec2(uCell, 0.0);
  vec2 uvV = uv + vec2(0.0, uCell);
  float eU = localProgress(uvU);
  float eV = localProgress(uvV);
  vec3 p = placed(uv, layer, uTime, e, 1.0);
  // Lighting follows the rounded relief...
  vec3 n = normalize(cross(placed(uvU, layer, uTime, eU, 1.0) - p, placed(uvV, layer, uTime, eV, 1.0) - p));
  // ...while each dot lies on the smooth surface underneath, so dots stay round at stroke edges.
  vec3 base = placed(uv, layer, uTime, e, 0.0);
  vec3 tu = placed(uvU, layer, uTime, eU, 0.0) - base;
  vec3 tv = placed(uvV, layer, uTime, eV, 0.0) - base;
  vec3 tx = normalize(tu);
  vec3 ty = normalize(tv);

  // Fingertip press: a gaussian dent along the surface normal.
  vec2 d = (uv - uPress.xy) * uHalf;
  float r2 = uPress.w * uPress.w;
  float g = exp(-dot(d, d) / r2) * uPress.z;
  p -= n * DEPTH * g;
  vec2 slope = 2.0 * DEPTH * g * d / r2;
  vec3 nPressed = normalize(n - slope.x * tx - slope.y * ty);

  vec3 viewDir = normalize(uCamPos - p);
  bool back = dot(n, viewDir) < 0.0;
  vec3 np = back ? -nPressed : nPressed;
  float lit = max(dot(np, uLight), 0.0);

  // Dot area follows the light: the face is bright, the layers behind step down.
  float shade = layer < 0.5 ? 0.3 + 0.62 * lit : (0.16 - 0.04 * layer) * (0.5 + 0.5 * lit);
  if (back) shade = 0.1 + 0.25 * lit;
  float coverage = clamp(shade, 0.0, 1.0) * smoothstep(0.12, 0.6, mask);

  float radius = min(sqrt(coverage / PI), 0.62);
  float flatHalfSide = layer < 0.5 ? 0.34 * step(0.35, mask) : 0.0;

  vec3 world = p + aCorner.x * tu + aCorner.y * tv;
  vec4 centreClip = uViewProj * vec4(p, 1.0);
  vec2 ndc = centreClip.xy / centreClip.w;
  float fade = (1.0 - smoothstep(uFade.x, 1.0, abs(ndc.x))) * (1.0 - smoothstep(uFade.y, 1.0, abs(ndc.y)));

  gl_Position = uViewProj * vec4(world, 1.0);
  vLocal = aCorner;
  vMorph = e;
  vRadius = mix(flatHalfSide, radius, e) * fade;
}
`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vLocal;
in float vRadius;
in float vMorph;

uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uPass;
out vec4 outColor;

void main() {
  // Pass 0 fills each cell of the mark with the background colour so nearer
  // parts hide the layers behind them.
  if (uPass < 0.5) {
    outColor = vec4(uPaper, 1.0);
    return;
  }
  float square = max(abs(vLocal.x), abs(vLocal.y));
  float circle = length(vLocal);
  float d = mix(square, circle, smoothstep(0.0, 1.0, vMorph));
  float w = max(fwidth(d), 1e-4) * 0.85;
  float a = 1.0 - smoothstep(vRadius - w, vRadius + w, d);
  if (a < 0.004) discard;
  outColor = vec4(uInk * a, a);
}
`;

/* ----------------------------------------------------------------------------
 * JS mirror of the surface (pointer picking and fitting). Relief is left out:
 * it is small next to the turn, and picking only needs to be close.
 * ------------------------------------------------------------------------- */
type Vec3 = [number, number, number];
type Fit = { scale: number; ox: number; oy: number };

function easeOut(x: number) {
  return 1 - (1 - x) ** 3;
}

function localProgressJS(u: number, v: number, progress: number) {
  const far = Math.hypot(u + 1, v - 1) / 2.8284;
  return easeOut(Math.min(1, Math.max(0, progress * (1 + SHAPE.stagger) - far * SHAPE.stagger)));
}

function placedJS(u: number, v: number, t: number, e: number, H: number, fit: Fit, scroll: number, z0 = 0): Vec3 {
  const px = u * H;
  const py = v * H;
  const pz = z0 - 0.08 * px * px + 0.015 * Math.sin(2.2 * u + 1.6 * v - t * 0.6);
  const [sx, sy, sz] = [px * fit.scale, py * fit.scale, pz * fit.scale];
  const yaw = SHAPE.yaw + 0.42 * Math.sin(t * 0.11);
  const pitch = SHAPE.pitch + 0.12 * Math.sin(t * 0.08 + 0.8) + 0.55 * scroll;
  const roll = SHAPE.roll + 0.03 * Math.sin(t * 0.05 + 2.0);
  const cz = Math.cos(roll), sr = Math.sin(roll);
  let x = cz * sx - sr * sy;
  let y = sr * sx + cz * sy;
  let z = sz;
  const cx = Math.cos(pitch), sp = Math.sin(pitch);
  const y2 = cx * y - sp * z;
  const z2 = sp * y + cx * z;
  y = y2;
  z = z2;
  const cy = Math.cos(yaw), sw = Math.sin(yaw);
  const x3 = cy * x + sw * z;
  const z3 = -sw * x + cy * z;
  x = x3 + fit.ox;
  y = y + fit.oy;
  z = z3 - 0.9 * scroll;
  return [px + (x - px) * e, py + (y - py) * e, z * e];
}

/* ----------------------------------------------------------------------------
 * Matrices (column-major, WebGL convention).
 * ------------------------------------------------------------------------- */
function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function translateZ(m: Float32Array, z: number) {
  const out = new Float32Array(m);
  out[12] = m[8] * z + m[12];
  out[13] = m[9] * z + m[13];
  out[14] = m[10] * z + m[14];
  out[15] = m[11] * z + m[15];
  return out;
}

function project(m: Float32Array, p: Vec3): [number, number, number] {
  const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
  const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
  const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
  return [x / w, y / w, w];
}

/**
 * Scale and centre the mark so that, across its whole slow turn (front face
 * and the deepest layer), it stays inside the canvas with a margin.
 */
function fitMark(viewProj: Float32Array, H: number, aspect: number): Fit {
  // The mark is a disc: sample its rim.
  const rim: Array<[number, number]> = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    rim.push([Math.cos(a) * 0.95, Math.sin(a) * 0.95]);
  }
  const back = -SHAPE.layers * SHAPE.layerGap;
  let fit: Fit = { scale: 1, ox: 0, oy: 0 };
  for (let pass = 0; pass < 3; pass++) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let t = 0; t < 120; t += 2.5) {
      for (const [u, v] of rim) {
        for (const z0 of [SHAPE.relief, back]) {
          const q = project(viewProj, placedJS(u, v, t, 1, H, fit, 0, z0));
          minX = Math.min(minX, q[0]);
          maxX = Math.max(maxX, q[0]);
          minY = Math.min(minY, q[1]);
          maxY = Math.max(maxY, q[1]);
        }
      }
    }
    const k = Math.min(0.92 / ((maxX - minX) / 2), 0.92 / ((maxY - minY) / 2));
    const cxN = (maxX + minX) / 2;
    const cyN = (maxY + minY) / 2;
    fit = { scale: fit.scale * k, ox: fit.ox * k - cxN * aspect * k, oy: fit.oy * k - cyN * k };
  }
  return fit;
}

/** Reads the map's coverage channel once, so only cells on the mark get dots. */
function readCoverage(map: HalftoneOptions['map']) {
  const w = 'naturalWidth' in map ? map.naturalWidth : map.width;
  const h = 'naturalHeight' in map ? map.naturalHeight : map.height;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(map, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  // Same mapping as texel() in the shader: v = +1 is the top row.
  return (u: number, v: number) => {
    const x = Math.min(w - 1, Math.max(0, Math.floor((u * 0.5 + 0.5) * w)));
    const y = Math.min(h - 1, Math.max(0, Math.floor((0.5 - v * 0.5) * h)));
    return data[(y * w + x) * 4 + 1] / 255;
  };
}

/* ----------------------------------------------------------------------------
 * Controller
 * ------------------------------------------------------------------------- */
const CAMERA_DISTANCE = 4.2;

export function createHalftoneField(canvas: HTMLCanvasElement, options: HalftoneOptions): HalftoneController | null {
  let ink = options.ink ?? [0.949, 0.945, 0.925];
  let paper = options.paper ?? [0.043, 0.043, 0.039];
  const pitchCss = options.pitch ?? 4;
  const maxDpr = options.maxDpr ?? 2;
  const assembleSeconds = options.assembleSeconds ?? 3.4;
  const holdSeconds = options.holdSeconds ?? 0.5;
  const interactive = options.interactive ?? true;

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, depth: true });
  if (!gl) return null;
  const program = buildProgram(gl, VERT, FRAG);
  if (!program) return null;
  const coverageAt = readCoverage(options.map);

  const loc = (name: string) => gl.getUniformLocation(program, name);
  const U = {
    viewProj: loc('uViewProj'),
    camPos: loc('uCamPos'),
    half: loc('uHalf'),
    cell: loc('uCell'),
    time: loc('uTime'),
    progress: loc('uProgress'),
    scroll: loc('uScroll'),
    light: loc('uLight'),
    press: loc('uPress'),
    fade: loc('uFade'),
    scale: loc('uScale'),
    offset: loc('uOffset'),
    map: loc('uMap'),
    ink: loc('uInk'),
    paper: loc('uPaper'),
    pass: loc('uPass'),
  };

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  // The map is data, not a picture: no colour management, no premultiplication.
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, options.map);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const cornerBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const cellBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cellBuf);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.bindVertexArray(null);

  const light = normalize([-0.38, 0.5, 0.78]);

  let count = 0;
  let H = 1;
  let cellUV = 0.1;
  let viewProj = new Float32Array(16);
  let cssW = 1;
  let cssH = 1;
  let pickGrid: Array<[number, number]> = [];
  let fit: Fit = { scale: 1, ox: 0, oy: 0 };

  let raf = 0;
  let active = true;
  let started = false;
  let startStamp = 0;
  let lastStamp = 0;
  let time = 0;
  let progress = 0;
  let scroll = 0;
  let scrollTarget = 0;

  let dprCap = maxDpr;
  let slowFrames = 0;
  let sampledFrames = 0;
  let frozen = false;

  const pointer = { inside: false, down: false, x: 0, y: 0 };
  const press = { u: 0, v: 0, tu: 0, tv: 0, strength: 0, velocity: 0, hit: false };

  function rebuild() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl!.viewport(0, 0, w, h);

    const aspect = cssW / cssH;
    const fovy = 2 * Math.atan(1 / CAMERA_DISTANCE);
    viewProj = translateZ(perspective(fovy, aspect, 0.1, 40), -CAMERA_DISTANCE);

    // World units: the canvas spans [-aspect, aspect] x [-1, 1] at z = 0. The mark is square.
    const unitsPerPx = 2 / cssH;
    const pitchW = pitchCss * unitsPerPx;
    const half = 0.92 * Math.min(1, aspect);
    const cols = Math.max(24, Math.round((2 * half) / pitchW));
    H = (cols * pitchW) / 2;
    cellUV = 2 / cols;
    fit = fitMark(viewProj, H, aspect);

    // Only cells on the mark get dots: the face plus the layers behind it.
    const cells: number[] = [];
    pickGrid = [];
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        const u = -1 + cellUV * (c + 0.5);
        const v = -1 + cellUV * (r + 0.5);
        if (coverageAt(u, v) < 0.1) continue;
        for (let layer = 0; layer < SHAPE.layers; layer++) cells.push(u, v, layer);
        if (r % 2 === 0 && c % 2 === 0) pickGrid.push([u, v]);
      }
    }
    count = cells.length / 3;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, cellBuf);
    gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array(cells), gl!.STATIC_DRAW);
  }

  function draw(t: number, p: number) {
    gl!.clearColor(0, 0, 0, 0);
    gl!.clearDepth(1);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
    gl!.enable(gl!.DEPTH_TEST);
    gl!.depthFunc(gl!.LEQUAL);
    gl!.useProgram(program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.uniform1i(U.map, 0);
    gl!.uniformMatrix4fv(U.viewProj, false, viewProj);
    gl!.uniform3f(U.camPos, 0, 0, CAMERA_DISTANCE);
    gl!.uniform1f(U.half, H);
    gl!.uniform1f(U.cell, cellUV);
    gl!.uniform1f(U.time, t);
    gl!.uniform1f(U.progress, p);
    gl!.uniform1f(U.scroll, scroll);
    gl!.uniform3f(U.light, light[0], light[1], light[2]);
    gl!.uniform4f(U.press, press.u, press.v, press.strength, SHAPE.pressRadius);
    gl!.uniform2f(U.fade, 1 - (14 / cssW) * 2, 1 - (14 / cssH) * 2);
    gl!.uniform1f(U.scale, fit.scale);
    gl!.uniform2f(U.offset, fit.ox, fit.oy);
    gl!.uniform3f(U.ink, ink[0], ink[1], ink[2]);
    gl!.uniform3f(U.paper, paper[0], paper[1], paper[2]);
    gl!.bindVertexArray(vao);
    // Pass 0: background-coloured cells, writes depth so nearer parts hide farther ones.
    gl!.disable(gl!.BLEND);
    gl!.depthMask(true);
    gl!.uniform1f(U.pass, 0);
    gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, 4, count);
    // Pass 1: ink dots on the visible surface only.
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.depthMask(false);
    gl!.uniform1f(U.pass, 1);
    gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, 4, count);
    gl!.depthMask(true);
    gl!.bindVertexArray(null);
  }

  function pick() {
    const px = (pointer.x / cssW) * 2 - 1;
    const py = 1 - (pointer.y / cssH) * 2;
    let best = Infinity;
    let bu = 0;
    let bv = 0;
    for (const [u, v] of pickGrid) {
      const q = project(viewProj, placedJS(u, v, time, localProgressJS(u, v, progress), H, fit, scroll));
      const dx = (q[0] - px) * cssW;
      const dy = (q[1] - py) * cssH;
      const dd = dx * dx + dy * dy;
      if (dd < best) {
        best = dd;
        bu = u;
        bv = v;
      }
    }
    press.hit = best < (pitchCss * 6) ** 2;
    press.tu = bu;
    press.tv = bv;
  }

  function frame(stamp: number) {
    raf = 0;
    if (!active) return;
    if (!lastStamp) lastStamp = stamp;
    const dt = Math.min(0.05, (stamp - lastStamp) / 1000);
    lastStamp = stamp;
    time += dt;
    if (started) progress = Math.min(1, Math.max(0, ((stamp - startStamp) / 1000 - holdSeconds) / assembleSeconds));
    scroll += (scrollTarget - scroll) * (1 - Math.exp(-dt * 8));

    if (interactive && pointer.inside) pick();
    const target = interactive && pointer.inside && press.hit ? (pointer.down ? 1 : 0.6) : 0;
    // The press is interface, so it rides a spring: in, a slight overshoot, settle.
    // Under-damped (ζ ≈ 0.72) for about 4% overshoot; small steps keep it stable.
    for (let left = dt; left > 0; left -= 1 / 240) {
      const h = Math.min(left, 1 / 240);
      press.velocity += (PRESS_SPRING.stiffness * (target - press.strength) - PRESS_SPRING.damping * press.velocity) * h;
      press.strength += press.velocity * h;
    }
    const kp = 1 - Math.exp(-dt * 12);
    press.u += (press.tu - press.u) * kp;
    press.v += (press.tv - press.v) * kp;

    draw(time, progress);

    if (progress >= 1 && !frozen) {
      sampledFrames++;
      if (dt > 1 / 28) slowFrames++;
      if (sampledFrames >= 120) {
        if (slowFrames > 60) {
          if (dprCap > 1) {
            dprCap = 1;
            rebuild();
          } else {
            frozen = true;
          }
        }
        sampledFrames = 0;
        slowFrames = 0;
      }
    }
    if (frozen) return;
    raf = requestAnimationFrame(frame);
  }

  function onMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    if (!pointer.inside) pointer.down = false;
  }
  function onDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && pointer.inside) pointer.down = true;
  }
  function onUp() {
    pointer.down = false;
  }
  function onLeave() {
    pointer.inside = false;
    pointer.down = false;
  }
  if (interactive) {
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
  }

  rebuild();
  draw(0, 0);

  const wake = () => {
    if (active && !raf && !frozen) {
      lastStamp = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  return {
    start() {
      if (started) return;
      started = true;
      startStamp = performance.now();
      wake();
    },
    setActive(next) {
      active = next;
      if (active) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    setScroll(value) {
      scrollTarget = Math.min(1, Math.max(0, value));
      if (frozen) draw(time, progress);
    },
    resize() {
      rebuild();
      draw(time, progress);
    },
    setColors(nextInk, nextPaper) {
      ink = nextInk;
      paper = nextPaper;
      draw(time, progress);
    },
    renderFrame(t, p) {
      time = t;
      progress = p;
      press.strength = 0;
      press.velocity = 0;
      rebuild();
      draw(t, p);
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      gl.deleteTexture(texture);
      gl.deleteBuffer(cornerBuf);
      gl.deleteBuffer(cellBuf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

function buildProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  };
  const v = compile(gl.VERTEX_SHADER, vs);
  const f = compile(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}
