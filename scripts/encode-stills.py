"""
Encode the rendered stills as small lossless WebP files.

The renders are light dots on black. Each pixel's position between the two is
snapped to one of 16 steps and stored as transparency: the stills are masks.
The page fills them with the current ink colour, so one file works in both
the light and the dark theme. Edges stay smooth and the files stay small.
Usage: python3 scripts/encode-stills.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

LEVELS = 16
PAPER = np.array([11, 11, 10], dtype=np.float64)  # --black
INK = np.array([242, 241, 236], dtype=np.float64)  # --white

src = Path('.stills')
dst = Path('public/hero')
dst.mkdir(parents=True, exist_ok=True)
for png in sorted(src.glob('*.png')):
    rgba = np.array(Image.open(png).convert('RGBA')).astype(np.float64)
    alpha = rgba[..., 3:4] / 255
    over = rgba[..., :3] * alpha + PAPER * (1 - alpha)
    t = ((over - PAPER) @ (INK - PAPER)) / ((INK - PAPER) @ (INK - PAPER))
    t = np.round(np.clip(t, 0, 1) * (LEVELS - 1)) / (LEVELS - 1)
    out = np.zeros(t.shape + (4,), dtype=np.uint8)
    out[..., :3] = 255
    out[..., 3] = np.round(t * 255).astype(np.uint8)
    target = dst / (png.stem + '.webp')
    Image.fromarray(out, 'RGBA').save(target, 'WEBP', lossless=True, method=6, quality=100, exact=False)
    print(f'{target}: {target.stat().st_size / 1024:.0f} KB ({rgba.shape[1]}x{rgba.shape[0]})')
