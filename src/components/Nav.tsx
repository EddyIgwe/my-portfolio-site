import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { cvLink, hero, nav, person, socialById } from '../content';
import { scrollToHash } from '../lib/hooks';
import { ThemeToggle } from './ThemeToggle';
import { Arrow } from './Arrow';

/** Page regions that sit behind the menu; they are made inert while it is open. */
const BEHIND = '#main, .footer, .skip';

export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // The link for the section in view is marked as current.
  useEffect(() => {
    const heroEl = document.getElementById('top');

    const sections = nav.map((l) => document.querySelector(l.href)).filter(Boolean) as Element[];
    const sectionIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((s) => sectionIO.observe(s));
    const heroIO = new IntersectionObserver(([entry]) => entry.isIntersecting && setActive(''), {
      rootMargin: '-40% 0px -55% 0px',
    });
    if (heroEl) heroIO.observe(heroEl);

    return () => {
      sectionIO.disconnect();
      heroIO.disconnect();
    };
  }, []);

  // Browser chrome (Android Chrome's address bar) follows the page colour.
  useEffect(() => {
    const sync = () => {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', getComputedStyle(document.body).backgroundColor);
    };
    sync();
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('themechange', sync);
    system.addEventListener('change', sync);
    return () => {
      window.removeEventListener('themechange', sync);
      system.removeEventListener('change', sync);
    };
  }, []);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) toggle.current?.focus({ preventScroll: true });
  }, []);

  // While open: page behind is inert and does not scroll, Escape closes, desktop widths close it.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const behind = Array.from(document.querySelectorAll<HTMLElement>(BEHIND));
    behind.forEach((el) => el.setAttribute('inert', ''));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    const wide = window.matchMedia('(min-width: 900px)');
    const onWide = () => wide.matches && close(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      root.style.overflow = previous;
      behind.forEach((el) => el.removeAttribute('inert'));
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [open, close]);

  const go = (href: string) => (e: MouseEvent) => {
    e.preventDefault();
    close(false);
    requestAnimationFrame(() => scrollToHash(href));
  };

  const behance = socialById('behance');
  const linkedin = socialById('linkedin');

  return (
    <>
      <header ref={header} className={`nav${open ? ' is-open' : ''}`}>
        <div className="wrap nav__bar">
          <a className="nav__name" href="#top" onClick={go('#top')}>
            {person.name}
          </a>
          <div className="nav__right">
            <nav aria-label="Primary">
              <ul className="nav__links">
                {nav.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} aria-current={active === l.href ? 'true' : undefined}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="nav__tools">
              <ThemeToggle />
              <a className="btn nav__cv" {...cvLink}>
                Download CV
              </a>
              <button
                ref={toggle}
                type="button"
                className="icon-btn nav__toggle"
                aria-expanded={open}
                aria-controls="menu"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((o) => !o)}
              >
                <span className="burger" aria-hidden="true">
                  <i />
                  <i />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        id="menu"
        className={`menu${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        {...(!open ? { inert: '' } : {})}
      >
        <div className="wrap menu__wrap">
          <div className="menu__frame">
            <nav aria-label="Menu">
              <ul className="menu__links">
                {nav.map((l, i) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={go(l.href)} style={{ ['--i' as string]: i }}>
                      <span>{l.label}</span>
                      <small aria-hidden="true">{String(i + 1).padStart(2, '0')}</small>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="menu__foot">
              <div className="menu__status">
                <p>
                  <span className="status-dot" aria-hidden="true" />
                  {hero.status}
                </p>
                <p>{hero.statusDetail}</p>
              </div>
              <a className="link menu__email" href={`mailto:${person.email}`}>
                {person.email}
              </a>
              <div className="menu__actions">
                <a className="btn btn--ink btn--sm" {...cvLink}>
                  Download CV
                </a>
                <a className="btn btn--quiet btn--sm" href={behance.href} target="_blank" rel="noopener noreferrer">
                  Behance <Arrow />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <a className="btn btn--quiet btn--sm" href={linkedin.href} target="_blank" rel="noopener noreferrer">
                  LinkedIn <Arrow />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
