(() => {
  'use strict';

  const launch = document.getElementById('finder-launch');
  const dialog = document.getElementById('finder-dialog');
  const products = window.euroCardsProducts;
  if (!launch || !dialog || !products?.length || typeof dialog.showModal !== 'function') return;

  const funding = {
    title: 'Как удобнее пополнять карту?',
    options: [['rubTopup', 'Из российского банка'], ['iban', 'Переводом на свой IBAN'], ['stablecoins', 'В USDT или USDC'], ['', 'Пока не знаю']]
  };
  const goals = {
    travel: { label: 'Покупки в поездках', question: funding },
    subscriptions: { label: 'Подписки и онлайн-покупки', question: funding },
    europe: {
      label: 'Переводы в евро',
      question: { title: 'Какие переводы нужны?', options: [['sepa', 'Обычные переводы SEPA'], ['sepaInstant', 'Мгновенные SEPA Instant'], ['swift', 'Международные SWIFT'], ['', 'Пока не знаю']] }
    },
    us: {
      label: 'Выплаты из США',
      question: { title: 'Как отправитель переведёт доллары?', options: [['ach', 'По ACH'], ['wire', 'По Wire внутри США'], ['', 'Ещё не согласовали']] }
    }
  };
  const extras = [['physical', 'Физическая карта'], ['applepay', 'Apple Pay'], ['googlepay', 'Google Pay']];
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const chevron = '<svg class="icon finder-chevron" aria-hidden="true" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>';
  let step = 0;
  let goal = '';
  let feature = null;
  const required = new Set();

  function choices(options, selected) {
    return `<div class="finder-options">${options.map(([value, label]) =>
      `<button type="button" class="finder-option" data-finder-choice="${value}" aria-pressed="${value === selected}"><span>${label}</span>${chevron}</button>`
    ).join('')}</div>`;
  }

  function render() {
    let title;
    let content;
    if (step === 0) {
      title = 'Для чего вам карта?';
      content = choices(Object.entries(goals).map(([value, item]) => [value, item.label]), goal);
    } else if (step === 1) {
      const { question } = goals[goal];
      title = question.title;
      content = choices(question.options, feature);
    } else if (step === 2) {
      title = 'Что ещё обязательно?';
      content = `<p class="finder-hint">Можно выбрать несколько пунктов или пропустить этот шаг.</p>
        <fieldset class="finder-checks"><legend class="visually-hidden">Обязательные возможности карты</legend>
        ${extras.map(([id, label]) => `<label><input type="checkbox" value="${id}" ${required.has(id) ? 'checked' : ''}>${label}</label>`).join('')}
        </fieldset>
        <button type="button" class="finder-primary" data-finder-result>Показать результат ${chevron}</button>`;
    } else {
      const matches = products.filter(product => product.filters.includes(goal)
        && (!feature || product.criteria.includes(feature))
        && Array.from(required).every(id => product.criteria.includes(id) || product.wallets.includes(id)));
      matches.sort((a, b) => Number(b.primaryFilter === goal) - Number(a.primaryFilter === goal));
      const [best, alternate] = matches;
      const selectedFeature = feature && goals[goal].question.options.find(([id]) => id === feature)?.[1];
      const brief = [goals[goal].label, selectedFeature, ...extras.filter(([id]) => required.has(id)).map(([, label]) => label)].filter(Boolean);
      const selected = `<p class="finder-selected"><strong>Ваш выбор</strong>${brief.join(' · ')}</p>`;
      const contact = new URL('https://t.me/vladethlemon');
      contact.searchParams.set('text', `Здравствуйте! Меня интересует ${best ? best.name : 'подбор карты'}. Мои пожелания — ${brief.join(', ')}.`);
      title = best ? 'Вам подойдёт' : 'Точного совпадения нет';
      content = best
        ? `<div class="finder-product">
            <img src="assets/card-${best.id}.webp" alt="" width="92" height="58">
            <div><h3>${best.name}</h3><p>${best.country}</p></div>
          </div>
          <p class="finder-reason">${best.highlights[0]}.</p>
          ${selected}
          <p class="finder-cost">Сопровождение Base <strong>${best.price}</strong></p>
          <button type="button" class="finder-primary" data-product="${best.id}" aria-haspopup="dialog" aria-controls="product-dialog">Посмотреть условия ${icon('diagonal')}</button>
          ${alternate ? `<button type="button" class="finder-alternate" data-product="${alternate.id}" aria-haspopup="dialog" aria-controls="product-dialog">Также подходит ${alternate.name} ${chevron}</button>` : ''}`
        : `<p class="finder-hint">В каталоге нет карты, которая сочетает все выбранные условия. Вернитесь к ответам или обсудите их с нами.</p>${selected}`;
      content += `<div class="finder-result-actions"><a href="${contact.href}" target="_blank" rel="noopener noreferrer">Обсудить в Telegram ${icon('diagonal')}</a>
        <button type="button" data-finder-restart>Начать заново</button></div>`;
    }
    dialog.innerHTML = `<div class="finder-toolbar">
      ${step ? '<button type="button" class="finder-back" data-finder-back aria-label="Вернуться к предыдущему вопросу">' + chevron + '</button>' : ''}
      <span>${step < 3 ? `Шаг ${step + 1} из 3` : 'Результат подбора'}</span>
      <button type="button" class="finder-close" data-finder-close aria-label="Закрыть подбор">${icon('close')}</button>
      </div>
      <h2 id="finder-title" tabindex="-1">${title}</h2>${content}`;
    dialog.scrollTop = 0;
    if (dialog.open) dialog.querySelector('h2').focus({ preventScroll: true });
  }

  launch.hidden = false;
  launch.addEventListener('click', () => {
    render();
    dialog.showModal();
    document.documentElement.classList.add('finder-open');
    dialog.querySelector('h2').focus({ preventScroll: true });
  });
  dialog.addEventListener('change', event => {
    if (!event.target.matches('input[type="checkbox"]')) return;
    if (event.target.checked) required.add(event.target.value);
    else required.delete(event.target.value);
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const { left, right, top, bottom } = dialog.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) dialog.close();
      return;
    }
    const button = event.target.closest('button');
    if (!button || button.hasAttribute('data-product')) return;
    if (button.hasAttribute('data-finder-close')) return dialog.close();
    if (button.hasAttribute('data-finder-back')) step--;
    else if (button.hasAttribute('data-finder-restart')) {
      step = 0;
      goal = '';
      feature = null;
      required.clear();
    } else if (button.hasAttribute('data-finder-result')) step = 3;
    else if (button.hasAttribute('data-finder-choice')) {
      const value = button.dataset.finderChoice;
      if (step === 0) {
        if (goal !== value) feature = null;
        goal = value;
      } else feature = value;
      step++;
    } else return;
    render();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('finder-open');
    launch.focus({ preventScroll: true });
  });

  // Keep the fixed button clear of the hero artwork and the last footer links.
  const protectedAreas = [document.querySelector('.hero'), document.querySelector('.footer-legal')].filter(Boolean);
  let dockObserver;
  function watchDock() {
    dockObserver?.disconnect();
    const height = document.documentElement.clientHeight;
    const clearFrom = Math.max(0, height - 78);
    function checkSpace() {
      const rightEdge = document.documentElement.clientWidth - 214;
      const covered = protectedAreas.some(area => {
        const bounds = area.getBoundingClientRect();
        return bounds.right > rightEdge && bounds.bottom >= clearFrom && bounds.top <= height;
      });
      launch.classList.toggle('finder-obstructed', covered);
    }
    checkSpace();
    dockObserver = new IntersectionObserver(checkSpace, { rootMargin: `-${clearFrom}px 0px 0px 0px` });
    protectedAreas.forEach(area => dockObserver.observe(area));
  }
  watchDock();
  window.addEventListener('resize', watchDock);
})();
