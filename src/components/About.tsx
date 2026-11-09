import { useEffect, useRef, useState } from 'react';
import { about, cover, projectById } from '../content';
import { useScrollFrame } from '../lib/hooks';
import { SectionRule } from './SectionRule';
import { Arrow } from './Arrow';

/** "A, b and c." with only the first item capitalised. */
const sentence = (items: string[]) =>
  items.map((t, i) => (i === 0 ? t : t.charAt(0).toLowerCase() + t.slice(1))).join(', ') + '.';

const exampleIds = Array.from(new Set(about.disciplines.map((d) => d.example).filter((id) => id !== 'video')));

/** How long the pointer must rest on a discipline before the preview changes. */
const HOVER_INTENT_MS = 90;

/**
 * The split page. The heading and a preview stay put on the left while the
 * disciplines scroll past on the right, divided by a hairline. The preview
 * shows the discipline under the reading line or under the pointer, keeps
 * showing it after the pointer leaves, and opens the project when clicked.
 */
export function About() {
  const listRef = useRef<HTMLOListElement>(null);
  const [selected, setSelected] = useState(0);
  const lastScrollIndex = useRef(-1);
  const hoverTimer = useRef(0);

  // Scrolling moves the selection only when the discipline under the reading line changes,
  // so a choice made with the pointer survives until the visitor scrolls on.
  useScrollFrame(() => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll<HTMLElement>('.discipline');
    const line = window.innerHeight * 0.5;
    let best = 0;
    let bestDist = Infinity;
    items.forEach((item, i) => {
      const r = item.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - line);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (best !== lastScrollIndex.current) {
      lastScrollIndex.current = best;
      setSelected(best);
    }
  });

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  // A short hover intent stops the preview flickering while the pointer crosses other rows on its way to the preview.
  const hover = (i: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setSelected(i), HOVER_INTENT_MS);
  };
  const unhover = () => window.clearTimeout(hoverTimer.current);

  const example = about.disciplines[selected].example;
  const project = example === 'video' ? undefined : projectById(example);

  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <SectionRule />
      <div className="wrap grid about__grid">
        <div className="about__aside">
          <h2 id="about-title" className="display about__title">
            {about.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>

          <figure className="about__preview">
            {(() => {
              const inner = (
                <>
                  {exampleIds.map((id) => {
                    const img = cover(id);
                    return (
                      <img
                        key={id}
                        className={id === example ? 'is-active' : undefined}
                        src={img.src}
                        srcSet={img.srcSet}
                        sizes="(min-width: 900px) 36vw, 1px"
                        width={img.width}
                        height={img.height}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    );
                  })}
                  <div className={`preview__panel${project ? '' : ' is-active'}`} aria-hidden="true">
                    <p>Short-form video editing and light motion graphics.</p>
                  </div>
                  {project && (
                    <span className="preview__cta" aria-hidden="true">
                      View on Behance <Arrow />
                    </span>
                  )}
                </>
              );
              // Projects open on Behance; the video and motion disciplines have no link.
              return project ? (
                <a
                  className="preview__frame"
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${project.title} on Behance (opens in a new tab)`}
                >
                  {inner}
                </a>
              ) : (
                <div className="preview__frame">{inner}</div>
              );
            })()}
            <figcaption className="preview__caption">
              {project ? `${project.title}, ${project.year}` : 'Video and motion work'}
            </figcaption>
          </figure>
        </div>

        <div className="about__body">
          <p className="lead" data-reveal="">
            {about.lead}
          </p>
          <p className="body-soft measure" data-reveal="" style={{ ['--d' as string]: 1 }}>
            {about.body}
          </p>

          <ul className="stats" aria-label="In numbers">
            {about.stats.map((s, i) => (
              <li key={s.label} data-reveal="" style={{ ['--d' as string]: i }}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>

          <div className="disciplines">
            <h3 className="h3">Disciplines</h3>
            <ol ref={listRef} className="disciplines__list">
              {about.disciplines.map((d, i) => (
                <li key={d.name}>
                  <span
                    className={`discipline${i === selected ? ' is-active' : ''}`}
                    onMouseEnter={() => hover(i)}
                    onMouseLeave={unhover}
                  >
                    {d.name}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="about__more">
            <div data-reveal="">
              <h3 className="h3">Working strengths</h3>
              <p>{sentence(about.strengths)}</p>
            </div>
            <div data-reveal="" style={{ ['--d' as string]: 1 }}>
              <h3 className="h3">Software</h3>
              <p>{about.software.join(', ')}.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
