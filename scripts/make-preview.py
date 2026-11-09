"""
Turn dist-single/index.html into a page body for a hosted preview: strips the
document wrappers and the tags only the real site needs. Usage:
  python3 scripts/make-preview.py <out-dir>
"""
import re
import shutil
import sys
from pathlib import Path

out_dir = Path(sys.argv[1])
out_dir.mkdir(parents=True, exist_ok=True)
src = Path('dist-single/index.html').read_text(encoding='utf-8')
out = re.sub(r'^\s*<!doctype html>\s*', '', src, flags=re.I)
out = re.sub(r'<html[^>]*>', '', out, count=1).replace('</html>', '')
out = out.replace('<head>', '', 1).replace('</head>', '', 1)
out = re.sub(r'<body[^>]*>', '', out, count=1).replace('</body>', '')
out = re.sub(r'\s*<meta charset="UTF-8" />', '', out, count=1)
out = re.sub(r'\s*<meta name="viewport"[^>]*>', '', out, count=1)
out = re.sub(r'\s*<link rel="(icon|apple-touch-icon|manifest|canonical)"[^>]*>', '', out)
out = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', '', out, count=1, flags=re.S)
out = re.sub(r'\s*<!-- Static twin.*?</form>', '', out, count=1, flags=re.S)
title = re.search(r'<title>.*?</title>', out, re.S).group(0)
out = title + '\n<meta name="claude:viewport-fit-sides" content="cover">\n' + out.replace(title, '', 1).strip()
(out_dir / 'edwin-igwebuike.html').write_text(out, encoding='utf-8')
for sub in ('work', 'hero', 'portrait'):
    (out_dir / sub).mkdir(exist_ok=True)
    for f in Path('public', sub).glob('*.webp'):
        shutil.copy(f, out_dir / sub / f.name)
(out_dir / 'assets').mkdir(exist_ok=True)
shutil.copy('public/assets/Edwin-Igwebuike-CV.pdf', out_dir / 'assets' / 'Edwin-Igwebuike-CV.pdf')
print(f'preview page: {len(out) / 1024:.0f} KB')
