import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import handler from '../api/contact.mjs';

// Drives the contact webhook with synthetic FormData and a stubbed Resend call, so nothing is emailed
// and no API key is needed: happy path, both bot checks, validation, attachment limits and failure modes.

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

function post(fields: Record<string, string | undefined> = {}, files: File[] = [], { method = 'POST' } = {}) {
  const fd = new FormData();
  const defaults = {
    name: 'Jane Smith',
    business: 'Smith & Co.',
    email: 'jane@smithco.com',
    phone: '(425) 555-0123',
    message: 'Hi! I need a new site.\n\nSecond paragraph here.',
    links: 'https://pinterest.com/board',
    website: '',
    elapsed: '5000',
  };
  for (const [k, v] of Object.entries({ ...defaults, ...fields })) if (v !== undefined) fd.set(k, v);
  for (const f of files) fd.append('images', f);
  return new Request('https://thecbcreative.com/api/contact', { method, body: method === 'POST' ? fd : undefined });
}

const imageFile = (name: string, bytes: number, type = 'image/png') => new File([new Uint8Array(bytes)], name, { type });

describe('contact webhook', () => {
  beforeEach(() => {
    sent = null;
    nextResendResponse = () => new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 });
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.CONTACT_TO_EMAIL = 'cait@thecbcreative.com';
    process.env.CONTACT_FROM_EMAIL = 'The CB Creative <inquiries@thecbcreative.com>';
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
    const res = await handler.fetch(post({ elapsed: '200' }));
    const body = await res.json();
    expect(res.status === 200, 'returns 200 (silent)').toBe(true);
    expect(body.ok === true, 'ok: true').toBe(true);
    expect(sent === null, 'no email sent').toBe(true);
  });

  it('Missing elapsed field entirely', async () => {
    const res = await handler.fetch(post({ elapsed: undefined }));
    expect(sent === null, 'blocked, no email sent').toBe(true);
    expect(res.status === 200, 'returns 200').toBe(true);
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

  it('Image with a generic MIME type is accepted via its extension', async () => {
    // Real-world case: some browsers/clients send application/octet-stream
    // or an empty type for .webp / .heic instead of a proper image/* type.
    const res = await handler.fetch(
      post({}, [
        new File([new Uint8Array(64)], 'screenshot.webp', { type: 'application/octet-stream' }),
        new File([new Uint8Array(64)], 'photo.HEIC', { type: '' }),
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

  it('GET rejected', async () => {
    const res = await handler.fetch(post({}, [], { method: 'GET' }));
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
