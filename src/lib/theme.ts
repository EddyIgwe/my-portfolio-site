export type Theme = 'light' | 'dark';

/** The theme in force: the visitor's choice if they made one, otherwise the system's. */
export function currentTheme(): Theme {
  const chosen = document.documentElement.getAttribute('data-theme');
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

/**
 * Switches the page theme and remembers the choice. Where the browser supports
 * view transitions, the new colours wipe in as a circle from `origin`.
 */
export function setTheme(next: Theme, origin?: HTMLElement | null) {
  const root = document.documentElement;
  const commit = () => {
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* Storage can be blocked; the choice then lasts for this visit only. */
    }
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  };

  const doc = document as TransitionDocument;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!origin || reduce || typeof doc.startViewTransition !== 'function') {
    commit();
    return;
  }

  const box = origin.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transition = doc.startViewTransition(commit);
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 760, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    })
    .catch(() => {});
}
