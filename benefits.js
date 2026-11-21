(() => {
  'use strict';

  const grid = document.querySelector('.everyday-grid');
  const dialog = document.getElementById('benefit-dialog');
  if (!grid || typeof dialog?.showModal !== 'function') return;

  const figure = dialog.querySelector('.benefit-figure');
  const title = dialog.querySelector('#benefit-expanded-title');
  const details = dialog.querySelector('.benefit-details');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let opener;

  grid.querySelectorAll('.benefit-open').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
  });

  grid.addEventListener('click', event => {
    const link = event.target.closest('.benefit-open');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    const card = link.closest('.everyday-card');
    const from = card.getBoundingClientRect();
    const content = card.querySelector('template').content.cloneNode(true);
    const image = content.querySelector('img') || card.querySelector('.everyday-object').cloneNode();
    image.removeAttribute('class');
    image.removeAttribute('loading');
    figure.replaceChildren(image);
    title.textContent = link.textContent;
    details.replaceChildren(content);
    dialog.dataset.theme = link.dataset.benefit;
    dialog.style.setProperty('--benefit-paper', getComputedStyle(card).backgroundColor);
    dialog.showModal();
    dialog.scrollTop = 0;

    if (reducedMotion.matches) return;
    const to = dialog.getBoundingClientRect();
    const x = from.left + from.width / 2 - to.left - to.width / 2;
    const y = from.top + from.height / 2 - to.top - to.height / 2;
    const scale = Math.min(1, from.width / to.width, from.height / to.height);
    dialog.animate([
      { transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: .6 },
      { transform: 'none', opacity: 1 }
    ], { duration: 235, easing: 'cubic-bezier(.22,.75,.25,1)' });
  });

  dialog.querySelector('.benefit-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const next = event.target.closest('.benefit-details a');
    if (event.target !== dialog && !next) return;
    dialog.close();
    if (next?.dataset.benefitFilter) {
      document.querySelector(`#filters [data-filter="${next.dataset.benefitFilter}"]`)?.click();
    }
  });
  dialog.addEventListener('close', () => {
    if (document.activeElement === document.body) opener?.focus({ preventScroll: true });
  });
})();
