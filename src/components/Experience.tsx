import { experience } from '../content';
import { SectionRule } from './SectionRule';

export function Experience() {
  return (
    <section id="experience" className="section experience" aria-labelledby="experience-title">
      <SectionRule />
      <div className="wrap">
        <h2 id="experience-title" className="display" data-reveal="">
          {experience.title}
        </h2>

        <ol className="roles">
          {experience.roles.map((role) => (
            <li key={`${role.company}-${role.start}`} className="grid role">
              <span className="role__rule" data-reveal="rule" aria-hidden="true" />
              <div className="role__when" data-reveal="">
                <p className="role__dates">
                  {role.start} to {role.end}
                </p>
                <p className="role__type">{role.type}</p>
              </div>
              <div className="role__what" data-reveal="" style={{ ['--d' as string]: 1 }}>
                <h3 className="role__title">{role.title}</h3>
                <p className="role__company">{role.company}</p>
                {role.descriptor && <p className="role__desc">{role.descriptor}</p>}
              </div>
              <ul className="role__points" data-reveal="" style={{ ['--d' as string]: 2 }}>
                {role.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="education">
          <h3 className="display display--sm" data-reveal="">
            {experience.educationTitle}
          </h3>
          <ul className="edu__list">
            {experience.education.map((e) => (
              <li key={e.what} className="grid edu">
                <span className="edu__rule" data-reveal="rule" aria-hidden="true" />
                <p className="edu__when" data-reveal="">
                  {e.when}
                </p>
                <p className="edu__what" data-reveal="" style={{ ['--d' as string]: 1 }}>
                  {e.what}
                </p>
                <p className="edu__where" data-reveal="" style={{ ['--d' as string]: 2 }}>
                  {e.where}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
