import { asset, person } from '../content';
import { useYear } from '../lib/hooks';
import { ThemeToggle } from './ThemeToggle';

export function NotFound() {
  const year = useYear();
  return (
    <div className="missing">
      <header className="wrap missing__bar">
        <a className="nav__name" href={asset('')}>
          {person.name}
        </a>
        <ThemeToggle />
      </header>
      <main className="wrap missing__main">
        <h1 className="display">This page isn’t here.</h1>
        <p className="lead">The link may be out of date, or the page has moved. Everything on the site starts from the overview.</p>
        <a className="btn btn--ink btn--lg" href={asset('')}>
          Back to Overview
        </a>
      </main>
      <footer className="wrap missing__foot">
        © <span suppressHydrationWarning>{year}</span> {person.name}
      </footer>
    </div>
  );
}
