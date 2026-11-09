import { useEffect, useState } from 'react';

/** Reveal-on-scroll for every [data-reveal] element, including ones added later. */
export function useRevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('motion') || !('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.08 },
    );
    const watch = (scope: ParentNode) => scope.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    watch(document);
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) {
            if (n.matches('[data-reveal]:not(.is-in)')) io.observe(n);
            watch(n);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

export function useMediaQuery(query: string, initial = false) {
  const [matches, setMatches] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/** Runs `fn` at most once per animation frame while the page scrolls or resizes. */
export function useScrollFrame(fn: () => void, deps: unknown[] = []) {
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      fn();
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    request();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** The current year, corrected on the client if the build is from an earlier year. */
export function useYear() {
  const [year, setYear] = useState(2026);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return year;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Smooth-scrolls to an in-page target and keeps the URL hash in step. */
export function scrollToHash(hash: string) {
  const target = document.querySelector(hash);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', hash);
}
