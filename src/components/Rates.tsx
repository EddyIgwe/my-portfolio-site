import type { MouseEvent } from 'react';
import { rates } from '../content';
import { scrollToHash } from '../lib/hooks';
import { SectionRule } from './SectionRule';
import { Arrow } from './Arrow';

export type PrefillDetail = { topic: string; details: string };

export function requestPrefill(detail: PrefillDetail) {
  window.dispatchEvent(new CustomEvent<PrefillDetail>('contact:prefill', { detail }));
}

export function Rates() {
  const enquire = (service: string, price: string) => (e: MouseEvent) => {
    e.preventDefault();
    requestPrefill({
      topic: 'Freelance project',
      details: `I’d like to talk about ${service.toLowerCase()} (${price.replace(/^From/, 'from')}).`,
    });
    scrollToHash('#contact');
  };

  return (
    <section id="rates" className="section rates" aria-labelledby="rates-title">
      <SectionRule />
      <div className="wrap">
        <h2 id="rates-title" className="display" data-reveal="">
          {rates.title}
        </h2>
        <ul className="rates__list">
          {rates.items.map((r, i) => (
            <li key={r.service} data-reveal="" style={{ ['--d' as string]: i }}>
              <a className="rate" href="#contact" onClick={enquire(r.service, r.price)}>
                <span className="rate__name">{r.service}</span>
                <span className="rate__price">{r.price}</span>
                <span className="rate__detail">{r.detail}</span>
                <span className="rate__cta" aria-hidden="true">
                  Enquire <Arrow dir="se" />
                </span>
                <span className="sr-only">. Enquire about {r.service.toLowerCase()}.</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="rates__note" data-reveal="">
          <span>{rates.note}</span>
          <a
            className="link"
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              requestPrefill({ topic: 'Full-time role', details: '' });
              scrollToHash('#contact');
            }}
          >
            Talk about a role <Arrow dir="se" />
          </a>
        </p>
      </div>
    </section>
  );
}
