import { useEffect, useRef, useState } from 'react';
import { asset, hero, person, socialById } from '../content';
import { scrollToHash } from '../lib/hooks';
import monogramMapUrl from '../hero/monogram-map.webp';
import { Arrow } from './Arrow';

type RGB = [number, number, number];

/** The hero's ink and paper colours, as 0 to 1, from whichever theme is in force. */
function themeColors(el: Element): { ink: RGB; paper: RGB } {
  const parse = (c: string) => (c.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => Number(v) / 255) as RGB;
  const style = getComputedStyle(el);
  return { ink: parse(style.color), paper: parse(style.backgroundColor) };
}

function useLagosTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const format = () =>
      setTime(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' }).format(new Date()));
    format();
    const id = window.setInterval(format, 20_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

/**
 * The hero: a sheet of hairline cells. Name and introduction on the left,
 * Edwin's EI monogram printed as a live halftone in the centre, availability,
 * numbers and a way to get in touch on the right.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [still, setStill] = useState(false);
  const [live, setLive] = useState(false);
  const time = useLagosTime();
  const video = socialById('video');

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    if (!mq.matches) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [{ createHalftoneField }, map] = await Promise.all([
        import('../hero/halftone'),
        (async () => {
          const img = new Image();
          img.src = monogramMapUrl;
          await img.decode();
          return img;
        })(),
      ]);
      const canvas = canvasRef.current;
      const field = fieldRef.current;
      const section = sectionRef.current;
      if (disposed || !canvas || !field || !section) return;

      const controller = createHalftoneField(canvas, {
        map,
        ...themeColors(field),
        interactive: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
      });
      if (!controller) {
        setStill(true);
        return;
      }
      setLive(true);
      const startTimer = window.setTimeout(() => controller.start(), 450);

      let onScreen = true;
      const sync = () => controller.setActive(onScreen && !document.hidden);
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      });
      io.observe(section);
      document.addEventListener('visibilitychange', sync);

      // The dots follow the light or dark theme.
      const recolor = () => {
        const { ink, paper } = themeColors(field);
        controller.setColors(ink, paper);
      };
      const system = window.matchMedia('(prefers-color-scheme: dark)');
      window.addEventListener('themechange', recolor);
      system.addEventListener('change', recolor);

      // The mark tilts back as the hero scrolls away.
      const onScroll = () => {
        const h = section.offsetHeight || 1;
        controller.setScroll(window.scrollY / h);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      let resizeRaf = 0;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => controller.resize());
      });
      ro.observe(field);

      cleanup = () => {
        window.clearTimeout(startTimer);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', sync);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('themechange', recolor);
        system.removeEventListener('change', recolor);
        controller.destroy();
      };
    })().catch(() => setStill(true));

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <section id="top" ref={sectionRef} className={`hero${still ? ' is-still' : ''}`} aria-labelledby="hero-title">
      <div className="wrap hero__wrap">
        <div className="hero__grid">
          <div className="hero__cell hero__title">
            <h1 id="hero-title" className="hero__name">
              <span className="hero__line">
                <span>{person.firstName}</span>
              </span>
              <span className="hero__line">
                <span>{person.lastName}</span>
              </span>
            </h1>
            <div className="hero__intro" data-hero-fade="">
              <p className="hero__role">{hero.role}</p>
              <p>{hero.intro}</p>
            </div>
          </div>

          <div className="hero__cell hero__media" data-hero-fade="">
            <img
              className="hero__photo"
              src={hero.photo.src}
              alt={hero.photo.alt}
              width={hero.photo.width}
              height={hero.photo.height}
              decoding="async"
            />
            <p className="hero__detail">{hero.detail}</p>
            <div className="hero__ctas">
              <a
                className="btn btn--ink btn--sm"
                href="#work"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHash('#work');
                }}
              >
                See the work
              </a>
              <a className="btn btn--quiet btn--sm" href={video.href} target="_blank" rel="noopener noreferrer">
                Watch the intro <Arrow />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>

          <div className={`hero__cell hero__field${live ? ' is-live' : ''}`} ref={fieldRef}>
            <span className="hero__reg" aria-hidden="true" />
            <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
            {/* The still is a mask filled with the current ink, so one image serves both themes. */}
            <div
              className="hero__still"
              role="img"
              aria-label="Edwin Igwebuike's initials, EI, in calligraphic script inside a circle, built in 3D from halftone dots"
              style={{
                ['--still' as string]: `url("${asset('hero/monogram-still.webp')}")`,
                ['--still-mobile' as string]: `url("${asset('hero/monogram-still-mobile.webp')}")`,
              }}
            />
            <span className="crop crop--tl" aria-hidden="true" />
            <span className="crop crop--tr" aria-hidden="true" />
            <span className="crop crop--bl" aria-hidden="true" />
            <span className="crop crop--br" aria-hidden="true" />
            <p className="hero__caption" aria-hidden="true">
              <span className="hero__caption-live">{hero.caption}</span>
              <span className="hero__caption-still">{hero.captionStill}</span>
            </p>
          </div>

          <div className="hero__cell hero__status" data-hero-fade="">
            <p className="hero__avail">
              <span className="status-dot" aria-hidden="true" />
              {hero.status}
            </p>
            <p className="hero__status-detail">{hero.statusDetail}</p>
            <p className="hero__clock">
              <span>Lagos</span> <span suppressHydrationWarning>{time}</span> <span>UTC+1</span>
            </p>
          </div>

          <ul className="hero__cell hero__stats" aria-label="In numbers" data-hero-fade="">
            {hero.stats.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>

          <a
            className="hero__cell hero__cta"
            href="#contact"
            data-hero-fade=""
            onClick={(e) => {
              e.preventDefault();
              scrollToHash('#contact');
            }}
          >
            <span>Write to Edwin</span>
            <Arrow dir="se" />
          </a>
        </div>
      </div>
    </section>
  );
}
