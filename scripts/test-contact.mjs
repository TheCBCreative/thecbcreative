/**
 * test-contact.mjs — tests for the contact form webhook (api/contact.mjs).
 *
 * Drives the handler with synthetic FormData requests and a stubbed Resend
 * call, so nothing is actually emailed and no API key is needed. Covers the
 * happy path, both bot heuristics, field validation, attachment limits, and
 * the failure modes (missing config, provider error, HTML injection).
 *
 * Run with: npm test
 */
import handler from '../api/contact.mjs';

let sent = null;
let nextResendResponse = () => new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 });

const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('api.resend.com')) {
    sent = { url, init, body: JSON.parse(init.body) };
    return nextResendResponse();
  }
  return realFetch(url, init);
};

function post(fields = {}, files = [], { method = 'POST' } = {}) {
  const fd = new FormData();
  const defaults = {
    name: 'Jane Smith',
    business: 'Smith & Co.',
    email: 'jane@smithco.com',
    message: 'Hi! I need a new site.\n\nSecond paragraph here.',
    links: 'https://pinterest.com/board',
    website: '',
    elapsed: '5000',
  };
  for (const [k, v] of Object.entries({ ...defaults, ...fields })) {
    if (v !== undefined) fd.set(k, v);
  }
  for (const f of files) fd.append('images', f);
  return new Request('https://thecbcreative.com/api/contact', { method, body: method === 'POST' ? fd : undefined });
}

function imageFile(name, bytes, type = 'image/png') {
  return new File([new Uint8Array(bytes)], name, { type });
}

let pass = 0;
let fail = 0;
function check(label, cond, detail = '') {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label} ${detail}`);
  }
}

async function run(label, fn) {
  sent = null;
  nextResendResponse = () => new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 });
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.CONTACT_TO_EMAIL = 'cait@thecbcreative.com';
  process.env.CONTACT_FROM_EMAIL = 'The CB Creative <inquiries@thecbcreative.com>';
  console.log(`\n${label}`);
  await fn();
}

// ---------------------------------------------------------------------------

await run('1. Valid submission with two attachments', async () => {
  const res = await handler.fetch(
    post({}, [imageFile('inspo-1.png', 1024), imageFile('inspo-2.webp', 2048, 'image/webp')])
  );
  const body = await res.json();
  check('returns 200', res.status === 200, `got ${res.status}`);
  check('ok: true', body.ok === true);
  check('called Resend', sent !== null);
  check('subject is "New Inquiry from Jane Smith"', sent?.body.subject === 'New Inquiry from Jane Smith', sent?.body.subject);
  check('to cait@thecbcreative.com', sent?.body.to?.[0] === 'cait@thecbcreative.com');
  check('reply_to is the submitter', sent?.body.reply_to === 'jane@smithco.com');
  check('auth header set', sent?.init.headers.Authorization === 'Bearer re_test_key');
  check('2 attachments forwarded', sent?.body.attachments?.length === 2, String(sent?.body.attachments?.length));
  check('attachment base64 decodes to right size', Buffer.from(sent.body.attachments[0].content, 'base64').length === 1024);
  check('attachment filename preserved', sent?.body.attachments[0].filename === 'inspo-1.png');
  check('html includes name', sent?.body.html.includes('Jane Smith'));
  check('html includes message', sent?.body.html.includes('I need a new site'));
  check('html splits paragraphs', (sent?.body.html.match(/<p style="margin:0 0 14px/g) || []).length === 2);
  check('html lists attachment names', sent?.body.html.includes('inspo-2.webp'));
  check('text alternative present', typeof sent?.body.text === 'string' && sent.body.text.includes('NEW INQUIRY'));
  check('business escaped in html (& -> &amp;)', sent?.body.html.includes('Smith &amp; Co.'));
});

await run('2. Honeypot filled', async () => {
  const res = await handler.fetch(post({ website: 'http://spam.example' }));
  const body = await res.json();
  check('returns 200 (silent)', res.status === 200);
  check('ok: true (does not tip off bot)', body.ok === true);
  check('no email sent', sent === null);
});

await run('3. Submitted too fast', async () => {
  const res = await handler.fetch(post({ elapsed: '200' }));
  const body = await res.json();
  check('returns 200 (silent)', res.status === 200);
  check('ok: true', body.ok === true);
  check('no email sent', sent === null);
});

await run('4. Missing elapsed field entirely', async () => {
  const res = await handler.fetch(post({ elapsed: undefined }));
  check('blocked, no email sent', sent === null);
  check('returns 200', res.status === 200);
});

await run('5. Missing required field (message)', async () => {
  const res = await handler.fetch(post({ message: '   ' }));
  const body = await res.json();
  check('returns 400', res.status === 400, `got ${res.status}`);
  check('ok: false', body.ok === false);
  check('has an error message', typeof body.error === 'string' && body.error.length > 0);
  check('no email sent', sent === null);
});

await run('6. Malformed email address', async () => {
  const res = await handler.fetch(post({ email: 'jane@smithco' }));
  const body = await res.json();
  check('returns 400', res.status === 400, `got ${res.status}`);
  check('no email sent', sent === null);
  check('error mentions the email', /email/i.test(body.error));
});

await run('7. Attachments over the 3.5MB cap', async () => {
  const res = await handler.fetch(post({}, [imageFile('huge.png', 4 * 1024 * 1024)]));
  const body = await res.json();
  check('returns 413', res.status === 413, `got ${res.status}`);
  check('no email sent', sent === null);
  check('error names the limit', body.error.includes('3.5 MB'), body.error);
});

await run('8. Non-image attachment rejected', async () => {
  const res = await handler.fetch(post({}, [new File([new Uint8Array(64)], 'resume.pdf', { type: 'application/pdf' })]));
  check('returns 400', res.status === 400, `got ${res.status}`);
  check('no email sent', sent === null);
});

await run('8b. Image with a generic MIME type is accepted via its extension', async () => {
  // Real-world case: some browsers/clients send application/octet-stream
  // or an empty type for .webp / .heic instead of a proper image/* type.
  const res = await handler.fetch(
    post({}, [
      new File([new Uint8Array(64)], 'screenshot.webp', { type: 'application/octet-stream' }),
      new File([new Uint8Array(64)], 'photo.HEIC', { type: '' }),
    ])
  );
  check('returns 200', res.status === 200, `got ${res.status}`);
  check('both attachments forwarded', sent?.body.attachments?.length === 2);
});

await run('8c. Generic MIME type with a non-image extension still rejected', async () => {
  const res = await handler.fetch(
    post({}, [new File([new Uint8Array(64)], 'payload.exe', { type: 'application/octet-stream' })])
  );
  check('returns 400', res.status === 400, `got ${res.status}`);
  check('no email sent', sent === null);
});

await run('9. Attachments just under the cap are accepted', async () => {
  const res = await handler.fetch(post({}, [imageFile('big.png', 3.4 * 1024 * 1024)]));
  check('returns 200', res.status === 200, `got ${res.status}`);
  check('email sent', sent !== null);
});

await run('10. Zero attachments is fine', async () => {
  const res = await handler.fetch(post({}, []));
  check('returns 200', res.status === 200);
  check('attachments array empty', sent?.body.attachments.length === 0);
  check('html has no Attachments row', !sent?.body.html.includes('>Attachments<'));
});

await run('11. GET rejected', async () => {
  const res = await handler.fetch(post({}, [], { method: 'GET' }));
  check('returns 405', res.status === 405, `got ${res.status}`);
  check('no email sent', sent === null);
});

await run('12. Missing RESEND_API_KEY', async () => {
  delete process.env.RESEND_API_KEY;
  const res = await handler.fetch(post());
  const body = await res.json();
  check('returns 500', res.status === 500, `got ${res.status}`);
  check('generic error, no config leak', !/RESEND|API_KEY/i.test(body.error), body.error);
});

await run('13. Resend returns an error', async () => {
  nextResendResponse = () => new Response('{"message":"domain not verified"}', { status: 403 });
  const res = await handler.fetch(post());
  const body = await res.json();
  check('returns 502', res.status === 502, `got ${res.status}`);
  check('does not leak provider detail', !body.error.includes('domain not verified'), body.error);
});

await run('14. HTML injection in fields is escaped', async () => {
  const res = await handler.fetch(
    post({ name: '<script>alert(1)</script>', message: 'Hi <img src=x onerror=alert(1)>' })
  );
  check('returns 200', res.status === 200);
  check('no raw <script> in html', !sent?.body.html.includes('<script>alert'));
  check('name escaped', sent?.body.html.includes('&lt;script&gt;'));
  check('no raw <img onerror in html', !sent?.body.html.includes('<img src=x'));
  check('subject carries raw name (header, not markup)', sent?.body.subject.includes('<script>'));
});

await run('15. Optional fields omitted', async () => {
  const res = await handler.fetch(post({ business: '', links: '' }));
  check('returns 200', res.status === 200);
  check('no empty Business row', !sent?.body.html.includes('>Business<'));
  check('no empty Inspiration row', !sent?.body.html.includes('>Inspiration links<'));
  check('text has no Business line', !sent?.body.text.includes('Business:'));
});

console.log(`\n${'='.repeat(46)}\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
