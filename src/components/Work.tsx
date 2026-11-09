import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { cover, filters, projects, work, type FilterId } from '../content';
import { prefersReducedMotion } from '../lib/hooks';
import { SectionRule } from './SectionRule';
import { Arrow } from './Arrow';

type Filter = 'all' | FilterId;

const counts = Object.fromEntries(
  filters.map((f) => [f.id, f.id === 'all' ? projects.length : projects.filter((p) => p.tags.includes(f.id as FilterId)).length]),
) as Record<Filter, number>;

// Server and client render the same markup; the isomorphic layout effect avoids SSR warnings.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const pad = (n: number) => String(n).padStart(2, '0');

type View = { index: number; atStart: boolean; atEnd: boolean };
type Drag = { id: number; startX: number; startLeft: number; lastX: number; lastT: number; v: number; moved: boolean };

/** Card geometry: where the first card starts and the distance from one card to the next. */
function geometry(track: HTMLElement) {
  const cards = track.children as HTMLCollectionOf<HTMLElement>;
  const first = cards[0];
  if (!first) return { cards, edge: 0, step: 1, width: 1 };
  const edge = first.offsetLeft;
  const step = cards.length > 1 ? cards[1].offsetLeft - edge : first.offsetWidth;
  return { cards, edge, step: Math.max(1, step), width: first.offsetWidth };
}

/** Carousel moves are interface motion: a spring with a slight overshoot (ζ ≈ 0.74, about 3%). */
const SPRING = { stiffness: 150, damping: 2 * 0.74 * Math.sqrt(150) };

/**
 * Springs the track to `left` with snapping off, then hands snapping back to the
 * browser once it has settled. Any wheel, touch or press takes over at once.
 * `velocity` (px/s) carries a fling into the spring. Returns a cancel function.
 */
function springTo(track: HTMLElement, left: number, velocity = 0) {
  track.classList.add('is-gliding');
  track.dataset.target = String(left);
  let raf = 0;
  const finish = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    track.removeEventListener('wheel', finish);
    track.removeEventListener('touchstart', finish);
    track.removeEventListener('pointerdown', finish);
    track.classList.remove('is-gliding', 'is-dragging');
    delete track.dataset.target;
  };
  if (prefersReducedMotion()) {
    track.scrollLeft = left;
    finish();
    return finish;
  }
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  let x = track.scrollLeft;
  let v = velocity;
  let last = 0;
  const frame = (now: number) => {
    let dt = last ? Math.min(0.064, (now - last) / 1000) : 1 / 60;
    last = now;
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      v += (SPRING.stiffness * (left - x) - SPRING.damping * v) * h;
      x += v * h;
      dt -= h;
    }
    // Past either end there is nothing to overshoot into: arrive and stop.
    if (x <= 0 || x >= max) {
      x = Math.max(0, Math.min(max, x));
      if (Math.abs(left - x) < 1) v = 0;
    }
    track.scrollLeft = x;
    if (Math.abs(left - x) < 0.5 && Math.abs(v) < 12) {
      track.scrollLeft = left;
      finish();
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  track.addEventListener('wheel', finish, { passive: true });
  track.addEventListener('touchstart', finish, { passive: true });
  track.addEventListener('pointerdown', finish);
  raf = requestAnimationFrame(frame);
  return finish;
}

export function Work() {
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>({ index: 0, atStart: true, atEnd: false });
  const trackRef = useRef<HTMLOListElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const update = useRef<() => void>(() => {});
  const drag = useRef<Drag | null>(null);
  const scrub = useRef<{ id: number; x: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const cancelResnap = useRef<() => void>(() => {});
  const filterChanged = useRef(false);

  const visible = useMemo(
    () => (filter === 'all' ? projects : projects.filter((p) => p.tags.includes(filter))),
    [filter],
  );

  // Counter, arrows, progress hairline and cover parallax all follow the track's scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const still = prefersReducedMotion();

    update.current = () => {
      const { cards, step } = geometry(track);
      const n = cards.length;
      if (!n) return;
      const x = track.scrollLeft;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      // The track is padded so card i sits in the centre at scrollLeft = i * step.
      const index = Math.min(n - 1, Math.max(0, Math.round(x / step)));
      const atStart = index === 0 && x <= 2;
      const atEnd = index === n - 1 && x >= max - 2;
      setView((v) => (v.index === index && v.atStart === atStart && v.atEnd === atEnd ? v : { index, atStart, atEnd }));

      const thumb = thumbRef.current;
      if (thumb) {
        const size = Math.min(1, Math.max(0.06, 1 / n));
        const pos = max > 0 ? x / max : 0;
        thumb.style.width = `${size * 100}%`;
        thumb.style.transform = `translateX(${((pos * (1 - size)) / size) * 100}%)`;
      }

      // Focus: the card in the centre faces the viewer, lifted on its shadow; the
      // others swing away round a shallow curve, set back and fade with distance.
      const vw = window.innerWidth;
      for (let i = 0; i < n; i++) {
        const card = cards[i];
        const d = (i * step - x) / step;
        const a = Math.abs(d);
        // Nothing follows the scroll linearly. Focus eases out as a card arrives (and so
        // eases in as it leaves); the lift, swing and depth settle on smoothsteps.
        const f = Math.max(0, 1 - Math.min(1, a));
        const focus = 1 - (1 - f) * (1 - f);
        const lift = f * f * (3 - 2 * f);
        const g = Math.min(2, a);
        const far = (g * g * (3 - g)) / 2; // 0 → 1 → 2 over two cards, flat at both ends
        const swing = Math.sign(d) * Math.min(1.6, far);
        card.style.setProperty('--focus', focus.toFixed(3));
        card.style.setProperty('--lift', lift.toFixed(3));
        card.style.setProperty('--d', swing.toFixed(3));
        card.style.setProperty('--far', far.toFixed(3));
        card.style.zIndex = String(100 - Math.round(a * 10));
        // Once settled in the centre the card drops its 3D transform (same position) so it renders sharp.
        if (a < 0.01) card.dataset.flat = '';
        else delete card.dataset.flat;
        if (!still && a < 3) {
          const box = card.getBoundingClientRect();
          const offset = (box.left + box.width / 2) / vw - 0.5;
          card.style.setProperty('--px', `${(offset * -30).toFixed(2)}px`);
        }
      }
    };

    let raf = 0;
    const request = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          update.current();
        });
    };
    update.current();
    track.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    const ro = new ResizeObserver(request);
    ro.observe(track);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      track.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      ro.disconnect();
    };
  }, []);

  // A new filter starts the row from the beginning, and the cards slide in.
  useIsoLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !filterChanged.current) return;
    filterChanged.current = false;
    track.classList.add('is-dragging');
    track.scrollLeft = 0;
    track.classList.remove('is-dragging');
    update.current();
    if (prefersReducedMotion()) return;
    Array.from(track.children)
      .slice(0, 8)
      .forEach((card, i) => {
        (card as HTMLElement).animate(
          [
            { opacity: 0, translate: '140px 40px', rotate: 'y -38deg' },
            { opacity: 1, translate: '0 0', rotate: 'y 0deg' },
          ],
          { duration: 900, delay: i * 70, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' },
        );
      });
  }, [filter]);

  const choose = (next: Filter) => {
    if (next === filter) return;
    filterChanged.current = true;
    setFilter(next);
  };

  const scrollToCard = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const { cards, step } = geometry(track);
    const target = Math.max(0, Math.min(cards.length - 1, index));
    cancelResnap.current();
    cancelResnap.current = springTo(track, target * step);
  };

  const stepBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const { step } = geometry(track);
    // Mid-spring, count from where the track is heading, so quick presses add up.
    const from = track.dataset.target !== undefined ? Number(track.dataset.target) : track.scrollLeft;
    scrollToCard(Math.round(from / step) + dir);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    const track = trackRef.current;
    if (!track) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBy(e.key === 'ArrowRight' ? 1 : -1);
    } else if ((e.key === 'Home' || e.key === 'End') && e.target === e.currentTarget) {
      e.preventDefault();
      scrollToCard(e.key === 'Home' ? 0 : track.children.length - 1);
    }
  };

  // Mouse drag to scroll. Touch and trackpads already scroll natively.
  const onPointerDown = (e: PointerEvent<HTMLOListElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    // No text selection or native link dragging; the click still fires.
    e.preventDefault();
    const track = trackRef.current!;
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startLeft: track.scrollLeft,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
      moved: false,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLOListElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const track = trackRef.current!;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      cancelResnap.current();
      track.setPointerCapture(e.pointerId);
      track.classList.add('is-dragging');
    }
    track.scrollLeft = d.startLeft - dx;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = 0.75 * ((e.clientX - d.lastX) / dt) + 0.25 * d.v;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
  };

  const endDrag = (e: PointerEvent<HTMLOListElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    const track = trackRef.current!;
    if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
    // The click that follows a drag must not open a project.
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    // Carry the fling a little, then settle on the nearest card.
    const { step } = geometry(track);
    const max = track.scrollWidth - track.clientWidth;
    const projected = track.scrollLeft - Math.max(-3, Math.min(3, d.v)) * 240;
    const target = Math.max(0, Math.min(max, Math.round(projected / step) * step));
    cancelResnap.current = springTo(track, target, -Math.max(-3, Math.min(3, d.v)) * 600);
  };

  const cardIndexOf = (el: EventTarget | null) => {
    const track = trackRef.current;
    const card = el instanceof Element ? el.closest('.card') : null;
    return track && card ? Array.prototype.indexOf.call(track.children, card) : -1;
  };

  const onClickCapture = (e: MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // A card beside the centre comes into focus first; the focused card opens on Behance.
    const i = cardIndexOf(e.target);
    if (i >= 0 && i !== view.index) {
      e.preventDefault();
      e.stopPropagation();
      scrollToCard(i);
    }
  };

  // Tabbing to a project's link brings its card to the centre.
  const onFocusCapture = (e: FocusEvent) => {
    const i = cardIndexOf(e.target);
    if (i >= 0 && i !== view.index) scrollToCard(i);
  };

  // The progress hairline can be clicked (glides to that point) or scrubbed (follows the pointer).
  const fractionAt = (clientX: number) => {
    const box = progressRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - box.left) / box.width));
  };
  const onScrubDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !trackRef.current) return;
    scrub.current = { id: e.pointerId, x: e.clientX, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onScrubMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = scrub.current;
    const track = trackRef.current;
    if (!s || s.id !== e.pointerId || !track) return;
    if (!s.moved) {
      if (Math.abs(e.clientX - s.x) < 4) return;
      s.moved = true;
      cancelResnap.current();
      track.classList.add('is-dragging');
    }
    track.scrollLeft = fractionAt(e.clientX) * (track.scrollWidth - track.clientWidth);
  };
  const onScrubEnd = (e: PointerEvent<HTMLDivElement>) => {
    const s = scrub.current;
    const track = trackRef.current;
    if (!s || s.id !== e.pointerId || !track) return;
    scrub.current = null;
    const { step } = geometry(track);
    const max = track.scrollWidth - track.clientWidth;
    if (!s.moved) {
      if (e.type === 'pointercancel') return;
      const target = Math.min(max, Math.round((fractionAt(e.clientX) * max) / step) * step);
      cancelResnap.current();
      cancelResnap.current = springTo(track, target);
      return;
    }
    cancelResnap.current = springTo(track, Math.min(max, Math.round(track.scrollLeft / step) * step));
  };

  const n = visible.length;
  const position = pad(view.index + 1);
  const filterLabel = filters.find((f) => f.id === filter)!.label;

  return (
    <section id="work" className="section work" aria-labelledby="work-title">
      <SectionRule />
      <div className="wrap grid work__head">
        <h2 id="work-title" className="display" data-reveal="">
          {work.title}
        </h2>
        <p className="work__intro measure" data-reveal="" style={{ ['--d' as string]: 1 }}>
          {work.intro}
        </p>
      </div>

      <div className="wrap work__bar" data-reveal="" style={{ ['--d' as string]: 2 }}>
        <div className="filters" role="group" aria-label="Filter projects by discipline">
          {filters.map((f) => (
            <button key={f.id} type="button" className="filter" aria-pressed={filter === f.id} onClick={() => choose(f.id)}>
              {f.label}
              <sup aria-label={`${counts[f.id]} projects`}>{counts[f.id]}</sup>
            </button>
          ))}
        </div>
        <div className="carousel__nav">
          <p className="carousel__count" aria-hidden="true">
            <b key={position}>{position}</b> <span>/ {pad(n)}</span>
          </p>
          <button
            type="button"
            className="icon-btn carousel__btn"
            aria-label="Previous project"
            aria-controls="projects-track"
            disabled={view.atStart}
            onClick={() => stepBy(-1)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M17 10H3.5M9 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn carousel__btn"
            aria-label="Next project"
            aria-controls="projects-track"
            disabled={view.atEnd}
            onClick={() => stepBy(1)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M3 10h13.5M11 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {filter === 'all' ? `Showing all ${n} projects` : `Showing ${n} ${filterLabel} projects`}
      </p>

      <div className="carousel" data-reveal="" style={{ ['--d' as string]: 3 }}>
        <ol
          ref={trackRef}
          id="projects-track"
          className="track"
          tabIndex={0}
          aria-label="Projects, most appreciated first. Use the arrow keys to move through them."
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          onFocusCapture={onFocusCapture}
          onDragStart={(e) => e.preventDefault()}
        >
          {visible.map((p, i) => {
            const img = cover(p.id);
            return (
              <li key={p.id} className={`card${i === view.index ? ' is-focus' : ''}`} aria-label={`${i + 1} of ${n}`}>
                {/* The li is the (untransformed) snap target; the inner sheet carries the 3D motion and shadow. */}
                <div className="card__inner">
                <div className="card__top" aria-hidden="true">
                  <span>{pad(i + 1)}</span>
                  <span>{p.year}</span>
                </div>
                <div className="card__media">
                  <img
                    src={img.src}
                    srcSet={img.srcSet}
                    sizes="(max-width: 767px) 74vw, (max-width: 1575px) 33vw, 520px"
                    width={img.width}
                    height={img.height}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </div>
                <div className="card__body">
                  <h3 className="card__title">{p.title}</h3>
                  <p className="card__meta">
                    <span>{p.discipline}</span>
                    {p.client && <span>{p.client}</span>}
                  </p>
                  <a className="card__link" href={p.href} target="_blank" rel="noopener noreferrer" draggable={false}>
                    <span>View full project on Behance</span> <Arrow />
                    <span className="sr-only">: {p.title} (opens in a new tab)</span>
                  </a>
                </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="wrap" data-reveal="" style={{ ['--d' as string]: 3 }}>
        <div
          ref={progressRef}
          className="carousel__progress"
          aria-hidden="true"
          onPointerDown={onScrubDown}
          onPointerMove={onScrubMove}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
        >
          <span ref={thumbRef} className="carousel__thumb" />
        </div>
      </div>
    </section>
  );
}
