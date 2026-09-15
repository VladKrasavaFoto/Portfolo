// main.js
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 80);
});

// Мобільне меню (гамбургер)
(() => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  const overlay = document.getElementById('nav-overlay');
  if (!toggle || !nav || !overlay) return; // на цій сторінці немає nav (напр. session.html)

  function openNav() {
    nav.classList.add('nav-open');
    overlay.classList.add('active');
    toggle.textContent = '✕';
  }

  function closeNav() {
    nav.classList.remove('nav-open');
    overlay.classList.remove('active');
    toggle.textContent = '☰';
  }

  toggle.addEventListener('click', () => {
    nav.classList.contains('nav-open') ? closeNav() : openNav();
  });

  overlay.addEventListener('click', closeNav);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
})();

// Плавна поява секцій при скролі
(() => {
  const sections = document.querySelectorAll('section:not(.hero)');
  if (!sections.length) return;

  sections.forEach(s => s.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    // Немає підтримки — просто показуємо одразу, без анімації
    sections.forEach(s => s.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(s => observer.observe(s));
})();
