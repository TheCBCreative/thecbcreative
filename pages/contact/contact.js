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

function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Basic bot mitigation — there's no backend yet to do this server-side,
  // so for now it's: (1) a honeypot field real users never see or fill
  // (see .field--hp in contact.html/.css), and (2) a minimum time-since-
  // page-load, since spam bots that auto-fill-and-submit typically do so
  // near-instantly. Neither is bulletproof alone, but together they filter
  // out the vast majority of unsophisticated form bots without a
  // third-party captcha/script.
  // IMPORTANT: once a real backend/serverless endpoint exists, it MUST
  // re-check both server-side too — a bot that POSTs directly to the
  // endpoint skips this client-side JS entirely.
  const loadedAt = Date.now();
  const MIN_SUBMIT_DELAY_MS = 1500;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const honeypot = form.querySelector('input[name="website"]');
    const honeypotFilled = !!honeypot && honeypot.value.trim() !== '';
    const submittedTooFast = Date.now() - loadedAt < MIN_SUBMIT_DELAY_MS;

    if (honeypotFilled || submittedTooFast) {
      // Fail silently (no error shown) rather than tipping the bot off
      // that it was caught.
      console.log('Form submission blocked (bot heuristic triggered).');
      return;
    }

    // TODO: wire up to a real form backend once hosting is finalized
    // (Netlify Forms won't carry over to Vercel — needs a replacement
    // service or serverless endpoint).
    console.log('Form submit — backend not yet connected.');
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
