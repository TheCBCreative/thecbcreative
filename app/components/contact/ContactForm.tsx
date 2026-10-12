import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { Button } from '~/components/ui/Button';
import { ATTACHMENT_LIMITS, CONTACT, HONEYPOT_FIELD, IMAGE_TYPES, MAX_LENGTH } from '~/data/contact';
import { Field, fieldInput } from './Field';

type Status = 'idle' | 'sending' | 'failed';
type Required = 'name' | 'email' | 'message';
type Errors = Partial<Record<Required | 'images', string>>;

const REQUIRED: Required[] = ['name', 'email', 'message'];
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|heic|heif|avif)$/i;

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
// By name, not type: browsers report SVG as image/*, and the API turns it away.
const isImage = (file: File) => IMAGE_EXTENSIONS.test(file.name);

// The API only accepts a form that's been open a moment, timed from a token it signed.
const MIN_OPEN_MS = 1600;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchToken() {
  try {
    const response = await fetch('/api/contact', { cache: 'no-store' });
    const { token } = (await response.json()) as { token?: string };
    return token ? { token, fetchedAt: Date.now() } : null;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validate(name: Required, value: string) {
  const text = value.trim();
  if (name === 'name' && !text) return CONTACT.errors.name;
  if (name === 'email') return !text ? CONTACT.errors.email : looksLikeEmail(text) ? undefined : CONTACT.errors.emailFormat;
  if (name === 'message' && !text) return CONTACT.errors.message;
  return undefined;
}

// F2 / G from the interaction states: errors show on leaving a field and on submit (focus moves to the first),
// the button reads "Sending…" while it posts, and success hands over to the thank-you card (onSent).
export function ContactForm({ onSent }: { onSent: () => void }) {
  const token = useRef<ReturnType<typeof fetchToken>>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    token.current = fetchToken();
  }, []);

  const onBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = event.target.name as Required;
    if (!REQUIRED.includes(name)) return;
    setErrors((current) => ({ ...current, [name]: validate(name, event.target.value) }));
  };

  // Once a field is showing an error, re-check it as it's edited so the message clears as soon as it's fixed.
  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = event.target.name as Required;
    if (!errors[name]) return;
    setErrors((current) => ({ ...current, [name]: validate(name, event.target.value) }));
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (picked.some((file) => !isImage(file))) return setErrors((current) => ({ ...current, images: CONTACT.errors.notImage }));
    const next = [...files, ...picked.filter((file) => !files.some((f) => f.name === file.name && f.size === file.size))];
    if (next.length > ATTACHMENT_LIMITS.files) return setErrors((current) => ({ ...current, images: CONTACT.errors.tooMany }));
    if (next.reduce((sum, file) => sum + file.size, 0) > ATTACHMENT_LIMITS.bytes)
      return setErrors((current) => ({ ...current, images: CONTACT.errors.tooLarge }));
    setErrors((current) => ({ ...current, images: undefined }));
    setFiles(next);
  };

  const removeFile = (file: File) => {
    setFiles((current) => current.filter((f) => f !== file));
    setErrors((current) => ({ ...current, images: undefined }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const data = new FormData(element);
    const found: Errors = {};
    for (const name of REQUIRED) found[name] = validate(name, String(data.get(name) ?? ''));
    setErrors((current) => ({ ...current, ...found }));
    const first = REQUIRED.find((name) => found[name]);
    if (first) return element.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();

    data.delete('images');
    files.forEach((file) => data.append('images', file));

    setStatus('sending');
    try {
      // A token that failed to load is fetched again now, then given the same moment to age.
      let issued = await token.current;
      if (!issued) issued = await (token.current = fetchToken());
      if (!issued) return setStatus('failed');
      await wait(MIN_OPEN_MS - (Date.now() - issued.fetchedAt));
      data.set('token', issued.token);

      const response = await fetch('/api/contact', { method: 'POST', body: data });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean };
      if (response.ok && result.ok) return onSent();
      setStatus('failed');
    } catch {
      setStatus('failed');
    }
    // A fresh token, so trying again works even if this one had expired.
    token.current = fetchToken();
  };

  const describe = (name: keyof Errors) => (errors[name] ? `${name}-error` : undefined);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <form noValidate onSubmit={onSubmit} className="grid grid-cols-2 gap-x-8 gap-y-6 max-lg:grid-cols-1">
      <Field id="name" label={CONTACT.fields.name} error={errors.name}>
        <input id="name" name="name" autoComplete="name" maxLength={MAX_LENGTH.name} required aria-invalid={Boolean(errors.name)} aria-describedby={describe('name')} onBlur={onBlur} onChange={onChange} className={fieldInput} />
      </Field>
      <Field id="business" label={CONTACT.fields.business}>
        <input id="business" name="business" autoComplete="organization" maxLength={MAX_LENGTH.business} className={fieldInput} />
      </Field>
      <Field id="email" label={CONTACT.fields.email} error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" maxLength={MAX_LENGTH.email} required aria-invalid={Boolean(errors.email)} aria-describedby={describe('email')} onBlur={onBlur} onChange={onChange} className={fieldInput} />
      </Field>
      <Field id="phone" label={CONTACT.fields.phone}>
        <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={MAX_LENGTH.phone} className={fieldInput} />
      </Field>
      <Field id="message" label={CONTACT.fields.message} error={errors.message} className="col-span-2 max-lg:col-span-1">
        <textarea
          id="message"
          name="message"
          rows={2}
          maxLength={MAX_LENGTH.message}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describe('message')}
          onBlur={onBlur}
          onChange={onChange}
          className={`${fieldInput} field-sizing-content resize-none`}
        />
      </Field>
      <Field id="links" label={CONTACT.fields.links}>
        <input id="links" name="links" autoComplete="url" maxLength={MAX_LENGTH.links} className={fieldInput} />
      </Field>
      <div>
        {/* The file input stays keyboard-reachable; its label is the visible "field". */}
        <input id="images" type="file" accept={IMAGE_TYPES} multiple onChange={onFiles} aria-describedby={describe('images')} className="peer sr-only" />
        <label
          htmlFor="images"
          className="flex cursor-pointer items-end justify-between border-b border-pine/(--opacity-input-line) pb-2 text-label peer-focus:border-pine peer-focus:shadow-field-focus"
        >
          {CONTACT.fields.images}
          <span aria-hidden className="font-body text-heading-xs leading-none font-extralight text-brass-deep">
            +
          </span>
        </label>
        {errors.images && (
          <p id="images-error" className="mt-2 text-label text-error-text">
            {errors.images}
          </p>
        )}
      </div>
      {files.length > 0 && (
        <div className="col-span-2 flex flex-wrap items-center gap-3 max-lg:col-span-1">
          <ul className="flex flex-wrap gap-3">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="flex items-center gap-3 border border-pine/(--opacity-hairline-on-cream) px-4 py-2 text-label">
                {file.name} <span aria-hidden>·</span> {formatBytes(file.size)}
                <button type="button" onClick={() => removeFile(file)} aria-label={`Remove ${file.name}`} className="text-body leading-none">
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className="text-caption text-pine/(--opacity-muted-text)">
            {files.length} of {ATTACHMENT_LIMITS.files} images · {formatBytes(totalBytes)} of {formatBytes(ATTACHMENT_LIMITS.bytes)}
          </p>
        </div>
      )}

      {/* Hidden from people; bots that fill every field give themselves away. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor={HONEYPOT_FIELD}>Website</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="col-span-2 mt-4 max-lg:col-span-1">
        <p role="alert" className="mb-5 text-label text-error-text empty:hidden">
          {status === 'failed' ? CONTACT.errors.failed : ''}
        </p>
        <Button type="submit" disabled={status === 'sending'} className="disabled:cursor-wait disabled:opacity-70">
          {status === 'sending' ? CONTACT.sending : CONTACT.submit}
        </Button>
      </div>
    </form>
  );
}
