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
  const successRedirect = form.dataset.successRedirect || '/thank-you.html';

  // Only ever shows errors now — success navigates to the thank-you page.
  const setError = (text) => {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.classList.toggle('form__status--error', Boolean(text));
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
      // Send them to the same thank-you page a real submission gets, so a
      // bot can't tell from the response that it was caught.
      window.location.assign(successRedirect);
      return;
    }

    if (totalFileBytes(form) > MAX_TOTAL_ATTACHMENT_BYTES) {
      setError(messages.tooLarge);
      return;
    }

    const data = new FormData(form);
    // How long the form sat open before submitting — the server's timing
    // check reads this rather than trusting a client timestamp.
    data.set('elapsed', String(Date.now() - loadedAt));

    setError('');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = submittingLabel;
    }

    try {
      const response = await fetch(form.action, { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        // Reset before navigating so the browser's back button lands on an
        // empty form rather than a filled one that looks unsent.
        form.reset();
        window.location.assign(successRedirect);
        return;
      }

      // Prefer the server's specific reason ("that email doesn't look
      // right") over the generic fallback when it sent one.
      setError(result.error || messages.error);
    } catch (err) {
      console.error('Contact form submit failed:', err);
      setError(messages.error);
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
function initFixedPanelScroll(onScrolled) {
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
      // Setting scrollTop in script doesn't always dispatch a scroll event as
      // promptly as a real user scroll, so nudge dependent UI directly.
      if (onScrolled) onScrolled();
    },
    { passive: false }
  );
}

// Shows the shadow over the bottom of the form column while there's more to
// scroll to, and fades it out at the end. Stays hidden when the form is short
// enough not to scroll at all, so it never points at nothing.
// Returns its update function so callers that scroll the panel in script can
// refresh the cue directly.
function initScrollCue() {
  const formPanel = document.querySelector('.contact__form-panel');
  const cue = document.getElementById('scrollCue');
  if (!formPanel || !cue) return null;

  // Scroll offsets are fractional at some zoom levels and can land a pixel
  // short of the true maximum, which would leave the cue stuck on.
  const EPSILON = 4;
  const mq = window.matchMedia('(max-width: 768px)');

  const update = () => {
    if (mq.matches) {
      // Stacked mobile layout: the page scrolls, not the panel. The cue's job
      // is just to say "there's more below the intro", so it goes as soon as
      // they start moving — any longer turns a hint into an obstruction.
      const started = window.scrollY > 40;
      const atPageBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - EPSILON;
      cue.classList.toggle('is-hidden', started || atPageBottom);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = formPanel;
    const scrollable = scrollHeight - clientHeight > EPSILON;
    const atBottom = scrollTop + clientHeight >= scrollHeight - EPSILON;
    cue.classList.toggle('is-hidden', !scrollable || atBottom);
  };

  formPanel.addEventListener('scroll', update, { passive: true });
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  mq.addEventListener('change', update);
  update();

  return update;
}

document.addEventListener('DOMContentLoaded', () => {
  initUploadZone();
  initForm();
  // Cue first, so its update can be handed to the wheel-forwarding handler.
  const updateScrollCue = initScrollCue();
  initFixedPanelScroll(updateScrollCue);
});
