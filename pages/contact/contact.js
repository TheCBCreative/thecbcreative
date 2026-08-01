// contact.js — page-specific behavior: upload zone + form submit handling.

function initUploadZone() {
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const dropzone = document.getElementById('dropzone');
  if (!fileInput || !fileList || !dropzone) return;

  fileInput.addEventListener('change', () => {
    const names = Array.from(fileInput.files).map((f) => f.name);
    fileList.textContent = names.length ? names.join(', ') : '';
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-dragover');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    fileInput.files = e.dataTransfer.files;
    fileList.textContent = Array.from(e.dataTransfer.files).map((f) => f.name).join(', ');
  });
}

// Keep in sync with MAX_TOTAL_ATTACHMENT_BYTES in api/contact.mjs. Checking
// here too is purely so an oversize batch fails instantly with a clear
// message rather than after a slow upload — the server's copy is the one
// that actually enforces it.
const MAX_TOTAL_ATTACHMENT_BYTES = 3.5 * 1024 * 1024;

function totalFileBytes(form) {
  const input = form.querySelector('input[type="file"]');
  if (!input || !input.files) return 0;
  return Array.from(input.files).reduce((sum, f) => sum + f.size, 0);
}

function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');
  const messages = JSON.parse(form.dataset.status || '{}');
  const submitLabel = submitBtn ? submitBtn.textContent : '';
  const submittingLabel = form.dataset.submittingLabel || 'Sending…';

  const setStatus = (text, kind) => {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.classList.toggle('form__status--error', kind === 'error');
    statusEl.classList.toggle('form__status--success', kind === 'success');
  };

  // Bot mitigation, client half: (1) a honeypot field real users never see
  // or fill (see .field--hp), and (2) a minimum time since page load, since
  // spam bots that auto-fill-and-submit usually do so near-instantly.
  // api/contact.mjs re-checks BOTH server-side — that's the check that
  // counts, since a bot POSTing straight at the endpoint never runs this.
  const loadedAt = Date.now();
  const MIN_SUBMIT_DELAY_MS = 1500;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const honeypot = form.querySelector('input[name="website"]');
    const honeypotFilled = !!honeypot && honeypot.value.trim() !== '';
    const submittedTooFast = Date.now() - loadedAt < MIN_SUBMIT_DELAY_MS;

    if (honeypotFilled || submittedTooFast) {
      // Show the same success message a real submission gets rather than
      // an error, so a bot can't tell it was caught.
      setStatus(messages.success, 'success');
      return;
    }

    if (totalFileBytes(form) > MAX_TOTAL_ATTACHMENT_BYTES) {
      setStatus(messages.tooLarge, 'error');
      return;
    }

    const data = new FormData(form);
    // How long the form sat open before submitting — the server's timing
    // check reads this rather than trusting a client timestamp.
    data.set('elapsed', String(Date.now() - loadedAt));

    setStatus('');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = submittingLabel;
    }

    try {
      const response = await fetch(form.action, { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        form.reset();
        const fileList = document.getElementById('fileList');
        if (fileList) fileList.textContent = '';
        setStatus(messages.success, 'success');
      } else {
        // Prefer the server's specific reason ("that email doesn't look
        // right") over the generic fallback when it sent one.
        setStatus(result.error || messages.error, 'error');
      }
    } catch (err) {
      console.error('Contact form submit failed:', err);
      setStatus(messages.error, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    }
  });
}

// The photo/"Let's connect" panel is static — it should never scroll, and
// scrolling while the cursor happens to be over it shouldn't do nothing
// either (that'd feel broken). Instead, any wheel scroll anywhere over the
// .contact section drives the form panel's own internal scroll, no matter
// where the cursor is. Only once the form has hit its own scroll limit does
// the event fall through untouched, so the page can scroll normally and
// reveal the footer below.
function initFixedPanelScroll() {
  const contact = document.querySelector('.contact');
  const formPanel = document.querySelector('.contact__form-panel');
  if (!contact || !formPanel) return;

  const mq = window.matchMedia('(min-width: 769px)');

  contact.addEventListener(
    'wheel',
    (e) => {
      if (!mq.matches) return; // stacked mobile layout scrolls normally

      const { scrollTop, scrollHeight, clientHeight } = formPanel;
      const scrollingDown = e.deltaY > 0;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if ((scrollingDown && atBottom) || (!scrollingDown && atTop)) {
        return; // let the browser handle it (page scroll / rubber-band)
      }

      e.preventDefault();
      formPanel.scrollTop += e.deltaY;
    },
    { passive: false }
  );
}

document.addEventListener('DOMContentLoaded', () => {
  initUploadZone();
  initForm();
  initFixedPanelScroll();
});
