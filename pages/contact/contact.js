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

  // TODO: wire up to a real form backend once hosting is finalized
  // (Netlify Forms won't carry over to Vercel — needs a replacement
  // service or serverless endpoint).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submit — backend not yet connected.');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initUploadZone();
  initForm();
});
