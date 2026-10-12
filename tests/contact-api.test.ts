import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/contact.mjs';

// Drives the contact webhook with synthetic FormData and a stubbed Resend call, so nothing is emailed
// and no API key is needed: happy path, both bot checks, validation, attachment limits and failure modes.
// The clock is faked so each form token is issued a few seconds before the submission it's used in.

type Sent = { url: string; init: RequestInit & { headers: Record<string, string> }; body: any };
let sent: Sent | null = null;
let nextResendResponse = () => new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 });

const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
  if (String(url).includes('api.resend.com')) {
    sent = { url: String(url), init: init as Sent['init'], body: JSON.parse(String(init?.body)) };
    return nextResendResponse();
  }
  return realFetch(url, init);
}) as typeof fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});

const OPENED_AT = new Date('2026-09-30T17:00:00Z').getTime();
let token = '';

// A token from GET /api/contact, issued at `at`; the clock is then moved to five seconds after the form opened.
async function tokenIssuedAt(at: number) {
  vi.setSystemTime(at);
  const { token } = await (await handler.fetch(new Request('https://thecbcreative.com/api/contact'))).json();
  vi.setSystemTime(OPENED_AT + 5000);
  return token as string;
}

function post(
  fields: Record<string, string | undefined> = {},
  files: File[] = [],
  { method = 'POST', ip }: { method?: string; ip?: string } = {}
) {
  const fd = new FormData();
  const defaults = {
    name: 'Jane Smith',
    business: 'Smith & Co.',
    email: 'jane@smithco.com',
    phone: '(425) 555-0123',
    message: 'Hi! I need a new site.\n\nSecond paragraph here.',
    links: 'https://pinterest.com/board',
    website: '',
    token,
  };
  for (const [k, v] of Object.entries({ ...defaults, ...fields })) if (v !== undefined) fd.set(k, v);
  for (const f of files) fd.append('images', f);
  const headers = ip ? { 'x-forwarded-for': ip } : undefined;
  return new Request('https://thecbcreative.com/api/contact', { method, headers, body: method === 'POST' ? fd : undefined });
}

// Real file signatures, padded out to the requested size.
const SIGNATURES: Record<string, number[]> = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  webp: [...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBP')],
  heic: [0, 0, 0, 0x18, ...Buffer.from('ftypheic')],
};
const bytesOf = (kind: string, size: number) => {
  const bytes = new Uint8Array(size);
  bytes.set(SIGNATURES[kind]);
  return bytes;
};
const imageFile = (name: string, bytes: number, type = 'image/png') =>
  new File([bytesOf(type === 'image/webp' ? 'webp' : 'png', bytes)], name, { type });

describe('contact webhook', () => {
  beforeEach(() => {
    sent = null;
    nextResendResponse = () => new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 });
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.CONTACT_TO_EMAIL = 'cait@thecbcreative.com';
    process.env.CONTACT_FROM_EMAIL = 'The CB Creative <inquiries@thecbcreative.com>';
    vi.useFakeTimers({ toFake: ['Date'] });
    return tokenIssuedAt(OPENED_AT).then((issued) => {
      token = issued;
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });


  it('Valid submission with two attachments', async () => {
    const res = await handler.fetch(
      post({}, [imageFile('inspo-1.png', 1024), imageFile('inspo-2.webp', 2048, 'image/webp')])
    );
    const body = await res.json();
    expect(res.status === 200, 'returns 200').toBe(true);
    expect(body.ok === true, 'ok: true').toBe(true);
    expect(sent !== null, 'called Resend').toBe(true);
    expect(sent?.body.subject === 'New Inquiry from Jane Smith', 'subject is "New Inquiry from Jane Smith"').toBe(true);
    expect(sent?.body.to?.[0] === 'cait@thecbcreative.com', 'to cait@thecbcreative.com').toBe(true);
    expect(sent?.body.reply_to === 'jane@smithco.com', 'reply_to is the submitter').toBe(true);
    expect(sent?.init.headers.Authorization === 'Bearer re_test_key', 'auth header set').toBe(true);
    expect(sent?.body.attachments?.length === 2, '2 attachments forwarded').toBe(true);
    expect(Buffer.from(sent!.body.attachments[0].content, 'base64').length === 1024, 'attachment base64 decodes to right size').toBe(true);
    expect(sent?.body.attachments[0].filename === 'inspo-1.png', 'attachment filename preserved').toBe(true);
    expect(sent?.body.html.includes('Jane Smith'), 'html includes name').toBe(true);
    expect(sent?.body.html.includes('I need a new site'), 'html includes message').toBe(true);
    expect((sent?.body.html.match(/<p style="margin:0 0 14px/g) || []).length === 2, 'html splits paragraphs').toBe(true);
    expect(sent?.body.html.includes('inspo-2.webp'), 'html lists attachment names').toBe(true);
    expect(typeof sent?.body.text === 'string' && sent!.body.text.includes('NEW INQUIRY'), 'text alternative present').toBe(true);
    expect(sent?.body.html.includes('Smith &amp; Co.'), 'business escaped in html (& -> &amp;)').toBe(true);
  });

  it('Honeypot filled', async () => {
    const res = await handler.fetch(post({ website: 'http://spam.example' }));
    const body = await res.json();
    expect(res.status === 200, 'returns 200 (silent)').toBe(true);
    expect(body.ok === true, 'ok: true (does not tip off bot)').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Submitted too fast', async () => {
    const res = await handler.fetch(post({ token: await tokenIssuedAt(OPENED_AT + 4800) }));
    const body = await res.json();
    expect(res.status === 200, 'returns 200 (silent)').toBe(true);
    expect(body.ok === true, 'ok: true').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Missing token is refused out loud, so a stale page never loses a message silently', async () => {
    const res = await handler.fetch(post({ token: undefined }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/reload/i);
    expect(sent).toBe(null);
  });

  it('Spoofed elapsed value is ignored', async () => {
    const res = await handler.fetch(post({ token: undefined, elapsed: '999999' }));
    expect(res.status === 400, 'refused: elapsed alone is not enough').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Forged token rejected', async () => {
    const backdated = `${OPENED_AT - 60_000}.${token.split('.')[1]}`;
    const res = await handler.fetch(post({ token: backdated }));
    expect(res.status === 200, 'returns 200 (silent)').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Token older than a day asks for a reload', async () => {
    const res = await handler.fetch(post({ token: await tokenIssuedAt(OPENED_AT - 25 * 60 * 60 * 1000) }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/reload/i);
    expect(sent).toBe(null);
  });

  it('Token is not cached', async () => {
    const res = await handler.fetch(new Request('https://thecbcreative.com/api/contact'));
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('Missing required field (message)', async () => {
    const res = await handler.fetch(post({ message: '   ' }));
    const body = await res.json();
    expect(res.status === 400, 'returns 400').toBe(true);
    expect(body.ok === false, 'ok: false').toBe(true);
    expect(typeof body.error === 'string' && body.error.length > 0, 'has an error message').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Malformed email address', async () => {
    const res = await handler.fetch(post({ email: 'jane@smithco' }));
    const body = await res.json();
    expect(res.status === 400, 'returns 400').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
    expect(/email/i.test(body.error), 'error mentions the email').toBe(true);
  });

  it('Attachments over the 3.5MB cap', async () => {
    const res = await handler.fetch(post({}, [imageFile('huge.png', 4 * 1024 * 1024)]));
    const body = await res.json();
    expect(res.status === 413, 'returns 413').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
    expect(body.error.includes('3.5 MB'), 'error names the limit').toBe(true);
  });

  it('Non-image attachment rejected', async () => {
    const res = await handler.fetch(post({}, [new File([new Uint8Array(64)], 'resume.pdf', { type: 'application/pdf' })]));
    expect(res.status === 400, 'returns 400').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Image with a generic MIME type is accepted via its extension and bytes', async () => {
    // Real-world case: some browsers/clients send application/octet-stream
    // or an empty type for .webp / .heic instead of a proper image/* type.
    const res = await handler.fetch(
      post({}, [
        new File([bytesOf('webp', 64)], 'screenshot.webp', { type: 'application/octet-stream' }),
        new File([bytesOf('heic', 64)], 'photo.HEIC', { type: '' }),
      ])
    );
    expect(res.status === 200, 'returns 200').toBe(true);
    expect(sent?.body.attachments?.length === 2, 'both attachments forwarded').toBe(true);
  });

  it('Generic MIME type with a non-image extension still rejected', async () => {
    const res = await handler.fetch(
      post({}, [new File([new Uint8Array(64)], 'payload.exe', { type: 'application/octet-stream' })])
    );
    expect(res.status === 400, 'returns 400').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Fake image type rejected: image name and type, but not image bytes', async () => {
    const res = await handler.fetch(post({}, [new File(['MZ fake program'], 'photo.png', { type: 'image/png' })]));
    expect(res.status === 400, 'returns 400').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('SVG rejected even with an image type', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const res = await handler.fetch(post({}, [new File([svg], 'logo.svg', { type: 'image/svg+xml' })]));
    expect(res.status === 400, 'returns 400').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Real image bytes under a non-image name rejected', async () => {
    const res = await handler.fetch(post({}, [new File([bytesOf('png', 64)], 'photo.html', { type: 'image/png' })]));
    expect(res.status === 400, 'returns 400').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it.each([
    ['name', 101],
    ['business', 151],
    ['phone', 41],
    ['message', 5001],
    ['links', 2001],
  ])('Oversized %s rejected', async (field, length) => {
    const res = await handler.fetch(post({ [field]: 'a'.repeat(length) }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/up to/);
    expect(sent).toBe(null);
  });

  it('Oversized email rejected', async () => {
    const res = await handler.fetch(post({ email: `${'a'.repeat(250)}@smithco.com` }));
    expect(res.status).toBe(400);
    expect(sent).toBe(null);
  });

  it('Fields at their limits are accepted', async () => {
    const res = await handler.fetch(post({ name: 'a'.repeat(100), message: 'a'.repeat(5000) }));
    expect(res.status).toBe(200);
  });

  it('Line breaks in the name are flattened out of the subject', async () => {
    const res = await handler.fetch(post({ name: 'Jane\r\nBcc: victim@example.com' }));
    expect(res.status).toBe(200);
    expect(sent?.body.subject).toBe('New Inquiry from Jane Bcc: victim@example.com');
  });

  it('Sixth send from one IP in ten minutes is rate limited', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await handler.fetch(post({}, [], { ip: '203.0.113.7' }))).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect((await handler.fetch(post({}, [], { ip: '203.0.113.8' }))).status, 'other visitors unaffected').toBe(200);
    vi.setSystemTime(OPENED_AT + 5000 + 10 * 60 * 1000 + 1);
    expect((await handler.fetch(post({}, [], { ip: '203.0.113.7' }))).status, 'allowed again after the window').toBe(200);
  });

  it('Attachments just under the cap are accepted', async () => {
    const res = await handler.fetch(post({}, [imageFile('big.png', 3.4 * 1024 * 1024)]));
    expect(res.status === 200, 'returns 200').toBe(true);
    expect(sent !== null, 'email sent').toBe(true);
  });

  it('Zero attachments is fine', async () => {
    const res = await handler.fetch(post({}, []));
    expect(res.status === 200, 'returns 200').toBe(true);
    expect(sent?.body.attachments.length === 0, 'attachments array empty').toBe(true);
    expect(!sent?.body.html.includes('>Attachments<'), 'html has no Attachments row').toBe(true);
  });

  it('PUT rejected', async () => {
    const res = await handler.fetch(post({}, [], { method: 'PUT' }));
    expect(res.status === 405, 'returns 405').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Missing RESEND_API_KEY', async () => {
    delete process.env.RESEND_API_KEY;
    const res = await handler.fetch(post());
    const body = await res.json();
    expect(res.status === 500, 'returns 500').toBe(true);
    expect(!/RESEND|API_KEY/i.test(body.error), 'generic error, no config leak').toBe(true);
  });

  it('Resend returns an error', async () => {
    nextResendResponse = () => new Response('{"message":"domain not verified"}', { status: 403 });
    const res = await handler.fetch(post());
    const body = await res.json();
    expect(res.status === 502, 'returns 502').toBe(true);
    expect(!body.error.includes('domain not verified'), 'does not leak provider detail').toBe(true);
  });

  it('HTML injection in fields is escaped', async () => {
    const res = await handler.fetch(
      post({ name: '<script>alert(1)</script>', message: 'Hi <img src=x onerror=alert(1)>' })
    );
    expect(res.status === 200, 'returns 200').toBe(true);
    expect(!sent?.body.html.includes('<script>alert'), 'no raw <script> in html').toBe(true);
    expect(sent?.body.html.includes('&lt;script&gt;'), 'name escaped').toBe(true);
    expect(!sent?.body.html.includes('<img src=x'), 'no raw <img onerror in html').toBe(true);
    expect(sent?.body.subject.includes('<script>'), 'subject carries raw name (header, not markup)').toBe(true);
  });

  it('Optional fields omitted', async () => {
    const res = await handler.fetch(post({ business: '', links: '' }));
    expect(res.status === 200, 'returns 200').toBe(true);
    expect(!sent?.body.html.includes('>Business<'), 'no empty Business row').toBe(true);
    expect(!sent?.body.html.includes('>Inspiration links<'), 'no empty Inspiration row').toBe(true);
    expect(!sent?.body.text.includes('Business:'), 'text has no Business line').toBe(true);
  });

  it('includes the phone number when given', async () => {
    const res = await handler.fetch(post());
    expect(res.status).toBe(200);
    expect(sent?.body.html.includes('(425) 555-0123')).toBe(true);
    expect(sent?.body.text.includes('Phone: (425) 555-0123')).toBe(true);
  });
});
