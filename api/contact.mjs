// Contact form webhook (Vercel Function): re-validates the form and emails it through Resend.
// Needs RESEND_API_KEY, CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL (see .env.example).
// GET hands the form a signed timestamp; POST checks it, then sends.

import { createHmac, timingSafeEqual } from 'node:crypto';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Strips surrounding quotes, which a dashboard keeps if a .env line is pasted in as-is (Resend rejects them).
function env(name) {
  const raw = (process.env[name] || '').trim();
  return raw.replace(/^(["'])([\s\S]*)\1$/, '$2').trim();
}

const DEFAULT_TO = 'cait@thecbcreative.com';
const DEFAULT_FROM = 'The CB Creative <inquiries@thecbcreative.com>';

// Kept below Vercel's 4.5 MB request limit so we can answer with a friendly error.
// The form applies the same limits (app/data/contact.ts); these are the ones that count.
const MAX_TOTAL_ATTACHMENT_BYTES = 3.5 * 1024 * 1024;
const MAX_FILES = 10;

// No SVG: it's a document that can carry script, not a photo.
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif', '.avif'];

// HEIC, HEIF and AVIF share one container; the brand after "ftyp" says which.
const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'avif', 'avis'];

// The browser's type is ignored (it's often blank for webp and heic, and easy to fake):
// the name has to end in an image extension and the first bytes have to be a real image.
function isImage(name, bytes) {
  const lower = (name || '').toLowerCase();
  if (!IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
  const ascii = (start, end) => bytes.subarray(start, end).toString('latin1');
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return true;
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return true;
  return ascii(4, 8) === 'ftyp' && HEIF_BRANDS.includes(ascii(8, 12));
}

// Bot checks: a filled honeypot, or a form sent faster than a person could.
// The time is measured from a timestamp the server signed when the form opened, so it can't be faked.
const MIN_SUBMIT_MS = 1500;
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;
const HONEYPOT_FIELD = 'website';

// Signs with CONTACT_FORM_SECRET, or a key derived from RESEND_API_KEY when that isn't set.
function signingKey() {
  const secret = env('CONTACT_FORM_SECRET');
  return secret || createHmac('sha256', env('RESEND_API_KEY')).update('contact-form-token').digest();
}

function sign(issuedAt) {
  return createHmac('sha256', signingKey()).update(String(issuedAt)).digest('base64url');
}

function issueToken() {
  const issuedAt = Date.now();
  return `${issuedAt}.${sign(issuedAt)}`;
}

// The token's issue time, or null if it's missing or wasn't signed here.
function tokenIssuedAt(token) {
  const [issuedAt, signature = ''] = token.split('.');
  if (!/^\d+$/.test(issuedAt || '')) return null;
  const expected = Buffer.from(sign(issuedAt));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected) ? Number(issuedAt) : null;
}

// Longest each field can be. The form uses the same numbers (app/data/contact.ts).
const MAX_LENGTH = { name: 100, business: 150, email: 254, phone: 40, message: 5000, links: 2000 };

// A few sends per visitor per window. Each server instance counts on its own, so this slows a flood
// rather than stopping it outright; Vercel's firewall rate limit is the hard backstop.
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const recentSends = new Map();

function rateLimited(ip, now = Date.now()) {
  for (const [key, times] of recentSends) {
    if (times.every((t) => now - t > RATE_LIMIT.windowMs)) recentSends.delete(key);
  }
  const times = (recentSends.get(ip) || []).filter((t) => now - t <= RATE_LIMIT.windowMs);
  if (times.length >= RATE_LIMIT.max) return true;
  recentSends.set(ip, [...times, now]);
  return false;
}

function clientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || '';
}

const FIELD_LABELS = {
  name: 'Name',
  business: 'Business',
  email: 'Email',
  phone: 'Phone',
  message: 'Project details',
  links: 'Inspiration links',
};

// Palette from app/styles/tokens.css, inlined because email clients don't support CSS variables.
const PINE = '#1b2318';
const SNOW = '#f6f6f1';
const MIST = '#e2e3dc';
const BRASS_LIGHT = '#d1bd9e';
const BRASS_DEEP = '#85663a';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Deliberately loose: catches typos without risking a real address being rejected.
function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

// Free text to escaped HTML paragraphs.
function paragraphsHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block.trim()).replace(/\n/g, '<br>'))
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:${PINE};">${block}</p>`
    )
    .join('');
}

function detailRowHtml(label, value) {
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${MIST};vertical-align:top;width:150px;">
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${BRASS_DEEP};">${escapeHtml(
          label
        )}</span>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid ${MIST};vertical-align:top;">
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${PINE};">${value}</span>
      </td>
    </tr>`;
}

function buildEmailHtml({ fields, attachments, submittedAt }) {
  const rows = [];

  rows.push(
    detailRowHtml(
      FIELD_LABELS.email,
      `<a href="mailto:${escapeHtml(fields.email)}" style="color:${PINE};">${escapeHtml(
        fields.email
      )}</a>`
    )
  );
  if (fields.phone) {
    rows.push(detailRowHtml(FIELD_LABELS.phone, escapeHtml(fields.phone)));
  }
  if (fields.business) {
    rows.push(detailRowHtml(FIELD_LABELS.business, escapeHtml(fields.business)));
  }
  if (fields.links) {
    rows.push(detailRowHtml(FIELD_LABELS.links, escapeHtml(fields.links)));
  }
  if (attachments.length) {
    rows.push(
      detailRowHtml(
        'Attachments',
        attachments
          .map((a) => `${escapeHtml(a.filename)} <span style="color:${BRASS_DEEP};">(${formatBytes(a.bytes)})</span>`)
          .join('<br>')
      )
    );
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${SNOW};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SNOW};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${MIST};">

          <tr>
            <td style="background:${PINE};padding:28px 32px;">
              <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${BRASS_LIGHT};">New Inquiry</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${SNOW};">${escapeHtml(
                fields.name
              )}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${rows.join('')}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${BRASS_DEEP};">${escapeHtml(
                FIELD_LABELS.message
              )}</p>
              <div style="font-family:Helvetica,Arial,sans-serif;">${paragraphsHtml(fields.message)}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;background:${SNOW};border-top:1px solid ${MIST};">
              <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${BRASS_DEEP};">
                Reply directly to this email to reach ${escapeHtml(fields.name)}.
              </p>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${BRASS_DEEP};">
                Sent from the contact form at thecbcreative.com &middot; ${escapeHtml(submittedAt)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Plain-text version for clients that don't render HTML.
function buildEmailText({ fields, attachments, submittedAt }) {
  const lines = [
    `NEW INQUIRY — ${fields.name}`,
    '',
    `${FIELD_LABELS.email}: ${fields.email}`,
  ];
  if (fields.phone) lines.push(`${FIELD_LABELS.phone}: ${fields.phone}`);
  if (fields.business) lines.push(`${FIELD_LABELS.business}: ${fields.business}`);
  if (fields.links) lines.push(`${FIELD_LABELS.links}: ${fields.links}`);
  if (attachments.length) {
    lines.push(
      `Attachments: ${attachments.map((a) => `${a.filename} (${formatBytes(a.bytes)})`).join(', ')}`
    );
  }
  lines.push('', `${FIELD_LABELS.message}:`, fields.message, '');
  lines.push(`Reply directly to this email to reach ${fields.name}.`);
  lines.push(`Sent from the contact form at thecbcreative.com — ${submittedAt}`);
  return lines.join('\n');
}

async function handleContact(request) {
  if (request.method !== 'POST' && request.method !== 'GET') {
    return json({ ok: false, error: 'Method not allowed.' }, 405);
  }

  const apiKey = env('RESEND_API_KEY');
  if (!apiKey) {
    // Our config problem: log it, but don't tell the browser why.
    console.error('[contact] RESEND_API_KEY is not set.');
    return json({ ok: false, error: 'The form is temporarily unavailable.' }, 500);
  }

  if (request.method === 'GET') {
    return new Response(JSON.stringify({ token: issueToken() }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const ip = clientIp(request);
  if (ip && rateLimited(ip)) {
    console.warn(`[contact] Blocked: rate limit for ${ip}.`);
    return json({ ok: false, error: 'That’s a lot of messages in a short time. Please try again in a few minutes.' }, 429);
  }

  let form;
  try {
    form = await request.formData();
  } catch (err) {
    console.error('[contact] Could not parse form body:', err);
    return json({ ok: false, error: 'That submission could not be read.' }, 400);
  }

  const text = (key) => {
    const value = form.get(key);
    if (typeof value !== 'string') return '';
    // Browsers send textarea line breaks as CRLF.
    return value.replace(/\r\n/g, '\n').trim();
  };

  // Bots get a normal-looking success, so they can't tell they were caught.
  if (text(HONEYPOT_FIELD)) {
    console.warn('[contact] Blocked: honeypot filled.');
    return json({ ok: true });
  }

  // No token means a person whose form couldn't fetch one (or a page from before tokens): tell them, don't drop it.
  if (!text('token')) {
    console.warn('[contact] Rejected: no form token.');
    return json({ ok: false, error: 'That submission could not be verified. Please reload the page and try again.' }, 400);
  }
  const issuedAt = tokenIssuedAt(text('token'));
  if (issuedAt === null) {
    console.warn('[contact] Blocked: forged form token.');
    return json({ ok: true });
  }
  const age = Date.now() - issuedAt;
  if (age < MIN_SUBMIT_MS) {
    console.warn(`[contact] Blocked: submitted too fast (${age}ms).`);
    return json({ ok: true });
  }
  // A real person who left the tab open for a day: ask them to reload rather than dropping the message.
  if (age > MAX_TOKEN_AGE_MS) {
    return json({ ok: false, error: 'This form has expired. Please reload the page and send it again.' }, 400);
  }

  const fields = {
    name: text('name'),
    business: text('business'),
    email: text('email'),
    phone: text('phone'),
    message: text('message'),
    links: text('links'),
  };

  if (!fields.name || !fields.email || !fields.message) {
    return json({ ok: false, error: 'Please fill in your name, email, and a note about your project.' }, 400);
  }
  if (!looksLikeEmail(fields.email)) {
    return json({ ok: false, error: 'That email address doesn’t look quite right.' }, 400);
  }
  const tooLong = Object.keys(MAX_LENGTH).find((key) => fields[key].length > MAX_LENGTH[key]);
  if (tooLong) {
    return json(
      { ok: false, error: `${FIELD_LABELS[tooLong]} can be up to ${MAX_LENGTH[tooLong].toLocaleString('en-US')} characters.` },
      400
    );
  }

  const files = form.getAll('images').filter((f) => f && typeof f === 'object' && 'arrayBuffer' in f && f.size > 0);

  if (files.length > MAX_FILES) {
    return json({ ok: false, error: `Please attach ${MAX_FILES} images or fewer.` }, 400);
  }

  let totalBytes = 0;
  const attachments = [];
  for (const file of files) {
    totalBytes += file.size;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      return json(
        {
          ok: false,
          error: `Those images add up to more than ${formatBytes(
            MAX_TOTAL_ATTACHMENT_BYTES
          )}. Try sending fewer, or email them over directly.`,
        },
        413
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isImage(file.name, buffer)) {
      return json({ ok: false, error: 'Attachments need to be images (PNG, JPG, or WEBP).' }, 400);
    }
    attachments.push({
      filename: file.name || 'attachment',
      bytes: file.size,
      content: buffer.toString('base64'),
    });
  }

  const submittedAt = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const view = { fields, attachments, submittedAt: `${submittedAt} PT` };

  const payload = {
    from: env('CONTACT_FROM_EMAIL') || DEFAULT_FROM,
    to: [env('CONTACT_TO_EMAIL') || DEFAULT_TO],
    // Replying from the inbox goes straight to the sender.
    reply_to: fields.email,
    // The subject is an email header, so line breaks in the name are flattened.
    subject: `New Inquiry from ${fields.name.replace(/\s+/g, ' ')}`,
    html: buildEmailHtml(view),
    text: buildEmailText(view),
    attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })),
  };

  let response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[contact] Network error calling Resend:', err);
    return json({ ok: false, error: 'That message couldn’t be sent. Please try again in a moment.' }, 502);
  }

  if (!response.ok) {
    // Log Resend's reason; never pass it to the browser, as it can echo config details.
    const detail = await response.text().catch(() => '');
    console.error(`[contact] Resend returned ${response.status}: ${detail}`);
    return json({ ok: false, error: 'That message couldn’t be sent. Please try again in a moment.' }, 502);
  }

  return json({ ok: true });
}

export default {
  fetch: handleContact,
};
