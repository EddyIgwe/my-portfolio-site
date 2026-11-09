import { useEffect, useRef, useState } from 'react';
import { currentTheme, setTheme } from '../lib/theme';

/** Light / dark switch. The server renders it as "light"; the real state is read after mount. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const read = () => setDark(currentTheme() === 'dark');
    read();
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    system.addEventListener('change', read);
    window.addEventListener('themechange', read);
    return () => {
      system.removeEventListener('change', read);
      window.removeEventListener('themechange', read);
    };
  }, []);

  return (
    <button
      ref={button}
      type="button"
      className={`icon-btn theme-toggle ${className}`.trim()}
      aria-pressed={dark}
      aria-label="Dark theme"
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(currentTheme() === 'dark' ? 'light' : 'dark', button.current)}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
      </svg>
    </button>
  );
}
