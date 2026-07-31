// home.js — page-specific behavior: smooth-scroll for same-page anchor
// links (e.g. nav links to #services, the hero's "Explore Services" link).

function initSmoothScroll() {
  document.querySelectorAll('a[href*="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const url = new URL(a.getAttribute('href'), window.location.href);
      if (url.pathname !== window.location.pathname) return;
      const target = document.querySelector(url.hash);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initSmoothScroll);
