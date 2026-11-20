(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const dialog = document.getElementById('product-dialog');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;

  function updatePlayback() {
    hero.classList.toggle('hero-scene-running', inView && !document.hidden && !dialog.open && !reducedMotion.matches);
  }

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  });
  observer.observe(hero);
  new MutationObserver(updatePlayback).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', updatePlayback);
})();
