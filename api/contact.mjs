/**
 * api/contact.mjs — contact form webhook (Vercel Function, Node.js runtime)
 *
 * Receives the contact form POST (multipart/form-data, so image attachments
 * can ride along), re-validates it server-side, and emails the inquiry to
 * CONTACT_TO_EMAIL via Resend's REST API.
 *
 * Deliberately dependency-free. It uses the Web-standard function signature
 * Vercel recommends for /api routes, which means `request.formData()` parses
 * the multipart body natively and `fetch` talks to Resend directly — no
 * busboy/formidable, no Resend SDK, no node_modules for the whole project.
 * Named .mjs (not .js) so it's parsed as an ES module without having to set
 * "type": "module" in package.json, which would break scripts/build.js.
 *
 * Required environment variables (set these in the Vercel dashboard):
 *   RESEND_API_KEY     — API key from resend.com
 *   CONTACT_FROM_EMAIL — sender, must be on a Resend-verified domain
 *   CONTACT_TO_EMAIL   — where inquiries land (defaults to cait@thecbcreative.com)
 * See .env.example.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * Reads an environment variable, trimming whitespace and stripping a matching
 * pair of surrounding quotes.
 *
 * A .env file needs quotes around a value containing spaces (`CONTACT_FROM_EMAIL=
 * "Name <a@b.com>"`) and the shell removes them. Pasting that same line into a
 * hosting dashboard keeps the quotes as literal characters, so the value
 * arrives as `"Name <a@b.com>"` — which Resend rejects with a 422 on the
 * `from` field. Tolerating both forms means the variable works wherever it's
 * set, rather than failing in a way that's only visible in the server logs.
 */
function env(name) {
  const raw = (process.env[name] || '').trim();
  return raw.replace(/^(["'])([\s\S]*)\1$/, '$2').trim();
}

const DEFAULT_TO = 'cait@thecbcreative.com';
const DEFAULT_FROM = 'The CB Creative <inquiries@thecbcreative.com>';

// Vercel caps a function's entire request body at 4.5 MB and returns a hard
// 413 before our code ever runs if it's exceeded. Cap attachments a good
// margin below that so the text fields and multipart overhead always fit,
// and so we can return a friendly error rather than an opaque platform one.
// The form enforces the same number client-side (see contact.js) — this is
// the copy that actually counts, since a direct POST skips the browser.
const MAX_TOTAL_ATTACHMENT_BYTES = 3.5 * 1024 * 1024;
const MAX_FILES = 10;

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif', '.avif'];

/**
 * Browsers usually set a real MIME type on an upload, but not reliably —
 * some send application/octet-stream or an empty type for less common
 * formats (webp and heic are frequent offenders), and non-browser clients
 * often send nothing useful at all. Rejecting on MIME alone would bounce
 * legitimate screenshots, so fall back to the file extension whenever the
 * declared type is missing or generic.
 */
function looksLikeImage(file) {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  if (type && type !== 'application/octet-stream') return false;
  const name = (file.name || '').toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

// Same two bot heuristics the form applies in the browser, re-checked here.
// The client-side versions are a UX nicety; these are the real ones, since a
// bot POSTing straight at this endpoint never runs our JS at all.
const MIN_SUBMIT_ELAPSED_MS = 1500;
const HONEYPOT_FIELD = 'website';

const FIELD_LABELS = {
  name: 'Name',
  business: 'Business',
  email: 'Email',
  message: 'Project details',
  links: 'Inspiration links',
};

// Brand tokens, inlined — email clients don't support CSS custom properties
// or external stylesheets, so these are duplicated from common/styles/brand.css
// rather than referenced. Keep in sync if the palette ever changes.
const INK = '#1c1f16';
const PAPER = '#f6f3ec';
const FOREST = '#2f3a1f';
const SAGE = '#93a876';
const MUTED = '#6b6f60';
const BORDER = '#ddd8cc';

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

/**
 * Deliberately loose — the goal is catching typos ("jane@smithco"), not
 * enforcing RFC 5322. Anything stricter reliably rejects addresses that
 * are in fact valid, and we'd rather let a bad address through than lose
 * a real inquiry.
 */
function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Multi-line free text -> HTML paragraphs, with each line escaped. */
function paragraphsHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block.trim()).replace(/\n/g, '<br>'))
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:${INK};">${block}</p>`
    )
    .join('');
}

function detailRowHtml(label, value) {
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${BORDER};vertical-align:top;width:150px;">
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${escapeHtml(
          label
        )}</span>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid ${BORDER};vertical-align:top;">
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${INK};">${value}</span>
      </td>
    </tr>`;
}

function buildEmailHtml({ fields, attachments, submittedAt }) {
  const rows = [];

  rows.push(
    detailRowHtml(
      FIELD_LABELS.email,
      `<a href="mailto:${escapeHtml(fields.email)}" style="color:${FOREST};">${escapeHtml(
        fields.email
      )}</a>`
    )
  );
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
          .map((a) => `${escapeHtml(a.filename)} <span style="color:${MUTED};">(${formatBytes(a.bytes)})</span>`)
          .join('<br>')
      )
    );
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${BORDER};">

          <tr>
            <td style="background:${INK};padding:28px 32px;">
              <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${SAGE};">New Inquiry</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${PAPER};">${escapeHtml(
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
              <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${escapeHtml(
                FIELD_LABELS.message
              )}</p>
              <div style="font-family:Helvetica,Arial,sans-serif;">${paragraphsHtml(fields.message)}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;background:${PAPER};border-top:1px solid ${BORDER};">
              <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${MUTED};">
                Reply directly to this email to reach ${escapeHtml(fields.name)}.
              </p>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${MUTED};">
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

/** Plain-text alternative, for clients that don't render HTML. */
function buildEmailText({ fields, attachments, submittedAt }) {
  const lines = [
    `NEW INQUIRY — ${fields.name}`,
    '',
    `${FIELD_LABELS.email}: ${fields.email}`,
  ];
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
    // Config problem on our side, not the sender's — log loudly, but don't
    // leak the reason to the browser.
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
    // Browsers encode textarea line breaks as CRLF in multipart bodies.
    // Normalize to \n up front so downstream splitting on blank lines
    // works on real submissions, not just synthetic ones.
    return value.replace(/\r\n/g, '\n').trim();
  };

  // ---- Bot heuristics ----------------------------------------------------
  // Both failure modes return a normal-looking success so a bot can't tell
  // its submission was discarded and start probing for what tripped it.
  if (text(HONEYPOT_FIELD)) {
    console.warn('[contact] Blocked: honeypot filled.');
    return json({ ok: true });
  }

  const elapsed = Number.parseInt(text('elapsed'), 10);
  if (!Number.isFinite(elapsed) || elapsed < MIN_SUBMIT_ELAPSED_MS) {
    console.warn(`[contact] Blocked: submitted too fast (elapsed=${text('elapsed')}).`);
    return json({ ok: true });
  }

  // ---- Field validation --------------------------------------------------
  const fields = {
    name: text('name'),
    business: text('business'),
    email: text('email'),
    message: text('message'),
    links: text('links'),
  };

  if (!fields.name || !fields.email || !fields.message) {
    return json({ ok: false, error: 'Please fill in your name, email, and a note about your project.' }, 400);
  }
  if (!looksLikeEmail(fields.email)) {
    return json({ ok: false, error: 'That email address doesn’t look quite right.' }, 400);
  }

  // ---- Attachments -------------------------------------------------------
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

  // ---- Send --------------------------------------------------------------
  const submittedAt = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const view = { fields, attachments, submittedAt: `${submittedAt} PT` };

  const payload = {
    from: env('CONTACT_FROM_EMAIL') || DEFAULT_FROM,
    to: [env('CONTACT_TO_EMAIL') || DEFAULT_TO],
    // So hitting "reply" in the inbox goes straight back to the sender
    // rather than to the no-reply sending address.
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
    // Log the provider's reason for debugging; never surface it to the
    // browser, since it can echo back internal config details.
    const detail = await response.text().catch(() => '');
    console.error(`[contact] Resend returned ${response.status}: ${detail}`);
    return json({ ok: false, error: 'That message couldn’t be sent. Please try again in a moment.' }, 502);
  }

  return json({ ok: true });
}

export default {
  fetch: handleContact,
};
