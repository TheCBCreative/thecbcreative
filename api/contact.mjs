// Contact form webhook (Vercel Function): re-validates the form and emails it through Resend.
// Needs RESEND_API_KEY, CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL (see .env.example).

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

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif', '.avif'];

// Some browsers send no type (or octet-stream) for webp and heic, so fall back to the extension.
function looksLikeImage(file) {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  if (type && type !== 'application/octet-stream') return false;
  const name = (file.name || '').toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

// Bot checks: a filled honeypot, or a form sent faster than a person could.
const MIN_SUBMIT_ELAPSED_MS = 1500;
const HONEYPOT_FIELD = 'website';

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
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405);
  }

  const apiKey = env('RESEND_API_KEY');
  if (!apiKey) {
    // Our config problem: log it, but don't tell the browser why.
    console.error('[contact] RESEND_API_KEY is not set.');
    return json({ ok: false, error: 'The form is temporarily unavailable.' }, 500);
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

  const elapsed = Number.parseInt(text('elapsed'), 10);
  if (!Number.isFinite(elapsed) || elapsed < MIN_SUBMIT_ELAPSED_MS) {
    console.warn(`[contact] Blocked: submitted too fast (elapsed=${text('elapsed')}).`);
    return json({ ok: true });
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

  const files = form.getAll('images').filter((f) => f && typeof f === 'object' && 'arrayBuffer' in f && f.size > 0);

  if (files.length > MAX_FILES) {
    return json({ ok: false, error: `Please attach ${MAX_FILES} images or fewer.` }, 400);
  }

  let totalBytes = 0;
  const attachments = [];
  for (const file of files) {
    if (!looksLikeImage(file)) {
      return json({ ok: false, error: 'Attachments need to be images (PNG, JPG, or WEBP).' }, 400);
    }
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
    subject: `New Inquiry from ${fields.name}`,
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
