import { person, social } from '../content';
import { scrollToHash, useYear } from '../lib/hooks';
import { Arrow } from './Arrow';

const footerLinks = ['behance', 'linkedin', 'dribbble'];

export function Footer() {
  const year = useYear();
  const links = social.filter((s) => s.enabled && footerLinks.includes(s.id));
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__frame">
          <div className="footer__main">
            <p className="footer__name">
              <span>{person.firstName}</span>
              <span>{person.lastName}</span>
            </p>
            <ul className="footer__links">
              <li>
                <a className="link" href={`mailto:${person.email}`}>
                  {person.email}
                </a>
              </li>
              {links.map((s) => (
                <li key={s.id}>
                  <a className="link" href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label} <Arrow />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer__base">
            <p>
              © <span suppressHydrationWarning>{year}</span> {person.name}
            </p>
            <a
              className="link"
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                scrollToHash('#top');
              }}
            >
              Back to top <span className="arrow arrow--up" aria-hidden="true">↑</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
