import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { contact, person, social } from '../content';
import type { PrefillDetail } from './Rates';
import { SectionRule } from './SectionRule';
import { Arrow } from './Arrow';

type Values = { topic: string; name: string; email: string; company: string; details: string };
type Field = keyof Values;
type Errors = Partial<Record<Field, string>>;
type Status = 'idle' | 'sending' | 'sent' | 'failed';

const EMPTY: Values = { topic: '', name: '', email: '', company: '', details: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ORDER: Field[] = ['topic', 'name', 'email', 'details'];

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.topic) e.topic = 'Choose what this is about.';
  if (!v.name.trim()) e.name = 'Add your name.';
  if (!v.email.trim()) e.email = 'Add an email address Edwin can reply to.';
  else if (!EMAIL_PATTERN.test(v.email.trim())) e.email = 'Check the email address. It should look like name@company.com.';
  if (!v.details.trim()) e.details = 'Add a few lines about the role or project.';
  return e;
}

/** Posts to Netlify Forms (the static twin of this form lives in index.html). */
async function submitToNetlify(values: Values, botField: string) {
  const body = new URLSearchParams({
    'form-name': 'contact',
    'bot-field': botField,
    topic: values.topic,
    name: values.name.trim(),
    email: values.email.trim(),
    company: values.company.trim(),
    details: values.details.trim(),
  });
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Form endpoint answered ${res.status}`);
  } finally {
    window.clearTimeout(timer);
  }
}

export function Contact() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [copy, setCopy] = useState<'idle' | 'copied' | 'selected'>('idle');
  const [hydrated, setHydrated] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLAnchorElement>(null);
  const copyTimer = useRef<number>();

  useEffect(() => setHydrated(true), []);

  // Rate cards and "Talk about a role" pre-fill the form.
  useEffect(() => {
    const onPrefill = (event: Event) => {
      const { topic, details } = (event as CustomEvent<PrefillDetail>).detail;
      setStatus((s) => (s === 'sent' || s === 'failed' ? 'idle' : s));
      setValues((v) => ({ ...v, topic, details: v.details.trim() || !details ? v.details : details }));
      setErrors((e) => ({ ...e, topic: undefined }));
      window.setTimeout(() => document.getElementById('contact-name')?.focus({ preventScroll: true }), 750);
    };
    window.addEventListener('contact:prefill', onPrefill);
    return () => window.removeEventListener('contact:prefill', onPrefill);
  }, []);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const update = (field: Field) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const found = validate(values);
    setErrors(found);
    const first = ORDER.find((f) => found[f]);
    if (first) {
      const target =
        first === 'topic'
          ? formRef.current?.querySelector<HTMLInputElement>('input[name="topic"]')
          : document.getElementById(`contact-${first}`);
      target?.focus();
      return;
    }
    setStatus('sending');
    const bot = (event.currentTarget.elements.namedItem('bot-field') as HTMLInputElement | null)?.value ?? '';
    try {
      await submitToNetlify(values, bot);
      setStatus('sent');
      setValues(EMPTY);
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch {
      setStatus('failed');
    }
  }

  async function copyEmail() {
    window.clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(person.email);
      setCopy('copied');
    } catch {
      const el = emailRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setCopy('selected');
    }
    copyTimer.current = window.setTimeout(() => setCopy('idle'), 2600);
  }

  const describedBy = (field: Field) => (errors[field] ? `contact-${field}-error` : undefined);
  const elsewhere = social.filter((s) => s.enabled);

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <SectionRule />
      <div className="wrap grid contact__head">
        <h2 id="contact-title" className="display" data-reveal="">
          {contact.title}
        </h2>
        <p className="lead contact__lede" data-reveal="" style={{ ['--d' as string]: 1 }}>
          {contact.lede}
        </p>
        <div className="contact__email" data-reveal="" style={{ ['--d' as string]: 2 }}>
          <a ref={emailRef} className="link" href={`mailto:${person.email}`}>
            {person.email}
          </a>
          <button type="button" className="btn" onClick={copyEmail}>
            <span aria-live="polite">
              {copy === 'copied' ? 'Copied' : copy === 'selected' ? 'Selected. Press Ctrl or ⌘ + C' : 'Copy email'}
            </span>
          </button>
        </div>
      </div>

      <div className="wrap grid contact__grid">
        {status === 'sent' ? (
          <div ref={doneRef} className="form__done" tabIndex={-1} role="status">
            <p>{contact.success}</p>
            <button type="button" className="btn" onClick={() => setStatus('idle')}>
              Send another message
            </button>
          </div>
        ) : (
          <form
            ref={formRef}
            className="form"
            name="contact"
            method="POST"
            action="/"
            noValidate={hydrated}
            onSubmit={onSubmit}
            aria-describedby="contact-status"
          >
            <input type="hidden" name="form-name" value="contact" />
            <p className="form__honey" aria-hidden="true">
              <label>
                Leave this empty <input name="bot-field" tabIndex={-1} autoComplete="off" />
              </label>
            </p>

            <fieldset
              className="topics"
              aria-invalid={errors.topic ? true : undefined}
              aria-describedby={describedBy('topic')}
            >
              <legend>What’s this about?</legend>
              <div className="topics__options">
                {contact.topics.map((t) => (
                  <label key={t} className="topic">
                    <input
                      type="radio"
                      name="topic"
                      value={t}
                      checked={values.topic === t}
                      onChange={update('topic')}
                      required
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
              {errors.topic && (
                <p id="contact-topic-error" className="field__error">
                  {errors.topic}
                </p>
              )}
            </fieldset>

            <div className="form__row">
              <div className="field">
                <label className="field__label" htmlFor="contact-name">
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={update('name')}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={describedBy('name')}
                  required
                />
                {errors.name && (
                  <p id="contact-name-error" className="field__error">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="contact-email">
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={update('email')}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={describedBy('email')}
                  required
                />
                {errors.email && (
                  <p id="contact-email-error" className="field__error">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="contact-company">
                Company <em>(optional)</em>
              </label>
              <input id="contact-company" name="company" autoComplete="organization" value={values.company} onChange={update('company')} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="contact-details">
                Details
              </label>
              <textarea
                id="contact-details"
                name="details"
                rows={6}
                placeholder="The role or project, the timeline, and anything else Edwin should know."
                value={values.details}
                onChange={update('details')}
                aria-invalid={errors.details ? true : undefined}
                aria-describedby={describedBy('details')}
                required
              />
              {errors.details && (
                <p id="contact-details-error" className="field__error">
                  {errors.details}
                </p>
              )}
            </div>

            <div className="form__actions">
              <button type="submit" className="btn btn--ink btn--lg" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
              <p id="contact-status" className="form__status" role="status" aria-live="polite">
                {status === 'failed' && (
                  <>
                    That didn’t send. Email{' '}
                    <a className="link" href={`mailto:${person.email}`}>
                      {person.email}
                    </a>{' '}
                    directly and it’ll get through.
                  </>
                )}
              </p>
            </div>
          </form>
        )}

        <aside className="elsewhere" aria-labelledby="elsewhere-title">
          <h3 id="elsewhere-title" className="h3">
            Elsewhere
          </h3>
          <ul className="elsewhere__list">
            {elsewhere.map((s) => (
              <li key={s.id}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  <span className="elsewhere__label">
                    {s.label} <Arrow />
                  </span>
                  <span className="elsewhere__handle">{s.handle}</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
