import { useEffect, useRef, useState } from 'react';
import { availability, cvLink, person, socialById } from '../content';
import { useScrollFrame } from '../lib/hooks';
import { Arrow } from './Arrow';

const words = availability.statement.split(' ');

function useClocks() {
  const [line, setLine] = useState('');
  useEffect(() => {
    const format = () => {
      const now = new Date();
      const parts = availability.clocks.map(({ city, zone }) => {
        const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zone }).format(now);
        return `${time} in ${city}`;
      });
      setLine(`Right now it’s ${parts[0]}, ${parts[1]} and ${parts[2]}.`);
    };
    format();
    const id = window.setInterval(format, 20_000);
    return () => window.clearInterval(id);
  }, []);
  return line;
}

export function Availability() {
  const statementRef = useRef<HTMLHeadingElement>(null);
  const inked = useRef(-1);
  const clock = useClocks();
  const video = socialById('video');

  // Words take the ink one by one as the statement scrolls through the screen.
  useScrollFrame(() => {
    const el = statementRef.current;
    if (!el || !document.documentElement.classList.contains('motion')) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    // Fully inked once the statement's top reaches the upper third of the screen.
    const progress = (vh * 0.95 - rect.top) / (vh * 0.6);
    const count = Math.max(0, Math.min(words.length, Math.round(progress * words.length)));
    if (count === inked.current) return;
    inked.current = count;
    el.querySelectorAll('.w').forEach((w, i) => w.classList.toggle('is-inked', i < count));
  });

  return (
    <section className="section availability" aria-labelledby="availability-title">
      <div className="wrap grid">
        <h2 id="availability-title" ref={statementRef} className="statement" data-ink="">
          {words.map((w, i) => (
            <span key={i}>
              <span className="w">{w}</span>
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h2>
      </div>
      <div className="wrap grid availability__grid">
        <div className="availability__text" data-reveal="">
          <p className="lead">{availability.hours}</p>
          <p className="body-soft measure">{availability.setup}</p>
          <p className="availability__clock" aria-live="off">
            {clock}
          </p>
        </div>
        <div className="availability__actions" data-reveal="" style={{ ['--d' as string]: 1 }}>
          <a className="btn btn--ink" {...cvLink}>
            Download CV <span aria-hidden="true">(PDF)</span>
          </a>
          <a className="btn" href={`mailto:${person.email}`}>
            {person.email}
          </a>
          <a className="link" href={video.href} target="_blank" rel="noopener noreferrer">
            Watch the introduction video <Arrow />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
