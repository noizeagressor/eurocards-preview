(() => {
  'use strict';

  const products = [
    {
      id: 'orange', name: 'Orange Card', country: 'Великобритания', flag: 'gb',
      primaryFilter: 'travel', filters: ['travel', 'subscriptions', 'europe', 'us'], price: '24 000 ₽',
      criteria: ['physical', 'iban', 'sepa', 'ach', 'rubTopup', 'stablecoins'],
      summary: 'Для поездок, подписок и переводов по Европе.',
      wallets: ['applepay', 'googlepay'],
      highlights: ['Личный IBAN в евро и реквизиты ACH в долларах', 'К виртуальной карте можно заказать пластик', 'Без годовой платы за обслуживание карты'],
      task: 'Поездки и ежедневные покупки',
      format: 'Виртуальная и физическая',
      bin: 'Великобритания',
      transfers: 'IBAN и SEPA в евро, ACH в долларах, Faster Payments в фунтах',
      description: 'Для тех, кто хочет платить одной картой в поездках и дома. Виртуальную карту можно добавить в Apple Pay или Google Pay, а в дополнение заказать пластик.',
      fundingShort: 'Банковский перевод, стейблкоины, варианты из РФ',
      funding: 'Пополнить счёт можно переводом по реквизитам или стейблкоинами. Для рублей проверим доступный маршрут из ВТБ или Т-Банка и посчитаем, сколько придёт после обмена.',
      feeShort: 'Виртуальный выпуск и годовое обслуживание — 0 USD',
      feeScope: 'Выпуск и обслуживание у поставщика карты.',
      fees: [['Выпуск виртуальной карты', '0 USD'], ['Годовое обслуживание', '0 USD'], ['Обычный пластик на начальных тарифах', '5 USD']],
      check: 'Если нужен пластик, доставка в Россию стоит отдельно 150 USD. Ориентир после передачи в доставку — 10–20 дней.'
    },
    {
      id: 'gold', name: 'Gold Card', country: 'Болгария', flag: 'bg',
      primaryFilter: 'europe', filters: ['travel', 'europe'], price: '20 000 ₽',
      criteria: ['physical', 'iban', 'sepa', 'swift', 'rubTopup', 'sepaInstant'],
      summary: 'Для зарплаты в евро и европейских переводов.',
      wallets: ['applepay'],
      highlights: ['Личный IBAN, SEPA Instant и SWIFT', 'Виртуальная карта и пластик на заказ'],
      task: 'Европейские выплаты и переводы',
      format: 'Виртуальная и физическая',
      bin: 'Болгария',
      transfers: 'Болгарский IBAN, SEPA Instant и SWIFT',
      description: 'Подходит, когда работодателю или заказчику нужен европейский IBAN. Можно принимать выплаты и отправлять переводы в другие банки.',
      fundingShort: 'Перевод на IBAN, варианты из РФ',
      funding: 'Деньги можно получить на болгарский IBAN. Для пополнения из рублей проверим варианты через ВТБ или Т-Банк, курс обмена и комиссию за зачисление.',
      feeShort: 'SEPA — 0,60 €, входящий перевод — 2% на тарифе Standard для граждан стран вне ЕЭЗ',
      feeScope: 'Тариф Standard для граждан стран вне Европейской экономической зоны, действует с 16 ноября 2026 года.',
      fees: [['Исходящий SEPA / SEPA Instant', '0,60 €'], ['Входящий перевод', '2%'], ['Исходящий SWIFT', '0,5%, минимум 20 USD']],
      feeNote: 'Проверка клиента перед открытием счёта стоит 50 € для граждан или постоянных жителей стран вне ЕС, ЕЭЗ и Швейцарии.',
      check: 'Перед крупной выплатой сверим лимит входящего перевода. Если нужен пластик, доставка в Россию стоит 150 USD и обычно занимает 10–20 дней после передачи в доставку.'
    },
    {
      id: 'ocean', name: 'Ocean Card', country: 'США', flag: 'us',
      primaryFilter: 'us', filters: ['us'], price: '24 000 ₽',
      criteria: ['virtualOnly', 'ach', 'wire', 'stablecoins'],
      summary: 'Для выплат в долларах и переводов внутри США.',
      wallets: ['applepay', 'googlepay'],
      highlights: ['Входящие переводы по ACH и Wire', 'Виртуальная карта с BIN США'],
      task: 'Выплаты в долларах из США',
      format: 'Виртуальная',
      bin: 'США',
      transfers: 'Американские реквизиты для ACH и Wire',
      description: 'Если американский заказчик просит routing number и account number, ему можно дать местные реквизиты для выплаты в долларах. Карту можно добавить в Apple Pay или Google Pay.',
      fundingShort: 'Переводы в USD, USDC или USDT',
      funding: 'Можно получить доллары на американские реквизиты или пополнить баланс стейблкоинами. При пополнении USDC комиссия сервиса составляет 0%, при пополнении USDT — 0,1%.',
      feeShort: 'Покупки в USD — 0%, в другой валюте — 1,5%',
      feeScope: 'Комиссии сервиса за покупки виртуальной картой.',
      fees: [['Покупка в долларах США', '0%'], ['Покупка в другой валюте', '1,5%'], ['Ежемесячное обслуживание карты', '0 USD']],
      check: 'Уточните у отправителя, как он перечислит доллары — по ACH или Wire. Перед оплатой проверим доступность реквизитов для вашей страны проживания.'
    },
    {
      id: 'ruby', name: 'Ruby Card', country: 'Гонконг', flag: 'hk',
      primaryFilter: 'subscriptions', filters: ['subscriptions'], price: '9 000 ₽',
      criteria: ['virtualOnly', 'stablecoins'],
      summary: 'Для подписок и покупок в зарубежных магазинах.',
      wallets: ['googlepay'],
      highlights: ['Пополнение в USDT или USDC', 'Виртуальная карта в долларах'],
      task: 'Подписки и онлайн-покупки',
      format: 'Виртуальная',
      bin: 'Уточним до оплаты',
      transfers: 'Банковские реквизиты в предложение не входят',
      description: 'Для подписок и покупок в зарубежных магазинах. Можно платить по реквизитам виртуальной карты или добавить её в Google Pay на Android.',
      fundingShort: 'Стейблкоины USDT или USDC',
      funding: 'Карту можно пополнять USDT или USDC. Перед переводом проверьте в приложении сеть пополнения. Комиссию сети показывает отправитель.',
      feeShort: 'Покупки в USD — 0%, в другой валюте — 1%',
      feeScope: 'Комиссии сервиса за долларовую виртуальную карту.',
      fees: [['Покупка в долларах США', '0%'], ['Покупка в другой валюте', '1%'], ['Активация', '5 USD']],
      feeNote: 'После активации 5 USD начисляются на баланс для покупок.',
      check: 'Гонконг — страна сервиса. Если для подписки нужна карта конкретной страны, до оплаты сверим BIN и требования продавца.'
    }
  ];

  window.euroCardsProducts = products;
  const grid = document.getElementById('product-grid');
  const filters = document.getElementById('filters');
  const dialog = document.getElementById('product-dialog');
  if (!grid || !filters || !dialog) return;

  const arrow = '<svg class="icon" aria-hidden="true"><use href="#i-diagonal"/></svg>';
  const closeButton = '<button type="button" class="dialog-close" data-dismiss aria-label="Закрыть окно"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>';
  let opener;
  let comparisonScroll = 0;
  let issueFormat = '';
  const required = new Set();
  const formats = [
    ['', 'Любой формат'], ['physical', 'С пластиком'], ['virtualOnly', 'Только виртуальный выпуск']
  ];
  const capabilities = [
    ['sepa', 'SEPA в евро'], ['iban', 'Европейский IBAN'], ['swift', 'Переводы SWIFT'],
    ['ach', 'Получать USD по ACH'], ['wire', 'Wire внутри США'], ['rubTopup', 'Пополнение из банка РФ']
  ];
  const comparisonRows = [
    ['Для чего', 'task'], ['Формат выпуска', 'format'], ['Реквизиты и переводы', 'transfers'],
    ['Страна BIN', 'bin'], ['Пополнение', 'fundingShort'], ['Комиссии', 'feeShort']
  ];

  function artwork(product) {
    return `<span class="product-stage" aria-hidden="true"><span class="product-model">
      <img class="product-face" src="assets/catalog-${product.id}-face.webp" alt="" width="1104" height="696" loading="lazy" decoding="async" draggable="false">
    </span></span>`;
  }

  function countryLabel(product) {
    return `<span class="product-country"><span aria-hidden="true" class="flag flag-${product.flag}"></span>${product.country}</span>`;
  }

  function contactUrl(product) {
    const message = `Здравствуйте! Хочу обсудить ${product.name} (${product.country}).`;
    return `https://t.me/vladethlemon?text=${encodeURIComponent(message)}`;
  }

  function showProducts(filter) {
    const overview = filter === 'all';
    const visible = overview ? products : products
      .filter(product => product.filters.includes(filter))
      .sort((a, b) => Number(b.primaryFilter === filter) - Number(a.primaryFilter === filter));
    grid.classList.toggle('catalog-filtered', !overview);
    grid.innerHTML = visible.map(product => {
      const featured = overview && product.id === 'orange';
      const facts = overview ? product.highlights : product.highlights.slice(0, 2);
      return `
      <article class="product-tile catalog-${product.id}${featured ? ' catalog-featured' : ''}" aria-labelledby="tile-${product.id}">
        <div class="catalog-scene">
          ${artwork(product)}
          ${featured ? `<a class="catalog-service-link" href="#services">
            <span class="catalog-service-marks" aria-hidden="true"><img src="assets/services/chatgpt.webp" alt=""><img src="assets/services/booking.webp" alt=""><img src="assets/services/uber.webp" alt=""></span>
            <span>Подобрать по сервису</span>${arrow}
          </a>` : ''}
        </div>
        <div class="product-body">
          <div class="catalog-meta">${countryLabel(product)}
            <span class="catalog-wallets">${product.wallets.map(wallet => `<img src="assets/brands/${wallet}.svg" alt="${wallet === 'applepay' ? 'Apple Pay' : 'Google Pay'}">`).join('')}</span>
          </div>
          <h3 class="product-title" id="tile-${product.id}">${product.name}</h3>
          <p class="product-copy">${product.summary}</p>
          <ul class="catalog-highlights">${facts.map(fact => `<li>${fact}</li>`).join('')}</ul>
          <div class="catalog-order">
            <div class="product-price"><strong>${product.price}</strong><small>Сопровождение Base</small></div>
            <div class="catalog-actions">
              <a class="catalog-apply" href="${contactUrl(product)}" target="_blank" rel="noopener noreferrer" aria-label="Выпустить ${product.name} — написать в Telegram">Выпустить карту</a>
              <button class="catalog-conditions" type="button" data-product="${product.id}" aria-haspopup="dialog" aria-controls="product-dialog" aria-label="Условия ${product.name}">Условия ${arrow}</button>
            </div>
          </div>
        </div>
      </article>`;
    }).join('');
    const count = document.getElementById('catalog-count');
    if (count) count.textContent = `Показано карт: ${visible.length} из ${products.length}.`;
    filters.querySelectorAll('[data-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    });
  }

  function openDialog(title, markup, variant, trigger, returnToProduct = '') {
    if (!dialog.open) opener = trigger;
    dialog.dataset.variant = variant;
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    dialog.innerHTML = `
      <header class="dialog-bar"><div>
        ${returnToProduct ? `<button type="button" class="dialog-back" data-compare data-return-to="${returnToProduct}">← К сравнению</button>` : ''}
        <h2 id="dialog-title" tabindex="-1">${title}</h2>
      </div>${closeButton}</header>${markup}`;
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('catalog-dialog-open');
    dialog.scrollTop = 0;
    dialog.querySelector('#dialog-title').focus({ preventScroll: true });
  }

  function showDetail(product, trigger, fromComparison = false) {
    if (fromComparison) comparisonScroll = dialog.scrollTop;
    openDialog(product.name, `
      <div class="detail-content">
        <div class="detail-header">
          <div class="catalog-scene product-art catalog-${product.id}">${artwork(product)}</div>
          <div>
            ${countryLabel(product)}
            <p class="dialog-intro">${product.description}</p>
          </div>
        </div>
        <dl class="detail-specs">
          <div><dt>Страна выпуска (BIN)</dt><dd>${product.bin}</dd></div>
          <div><dt>Формат карты</dt><dd>${product.format}</dd></div>
          <div><dt>Реквизиты и переводы</dt><dd>${product.transfers}</dd></div>
        </dl>
        <div class="detail-facts">
          <div class="detail-use">
            <section><h3>Как пополнять</h3><p>${product.funding}</p></section>
            <section><h3>${product.id === 'orange' ? 'Доставка пластика' : 'Перед оформлением'}</h3><p>${product.check}</p></section>
          </div>
          <section class="detail-fees">
            <h3>Комиссии сервиса</h3>
            <p class="fee-scope">${product.feeScope}</p>
            <dl>${product.fees.map(([operation, cost]) => `<div><dt>${operation}</dt><dd>${cost}</dd></div>`).join('')}</dl>
            ${product.feeNote ? `<p class="fee-footnote">${product.feeNote}</p>` : ''}
          </section>
        </div>
        <div class="dialog-purchase">
          <div><small>Сопровождение Base</small><strong>${product.price}</strong></div>
          <a class="dialog-contact" href="${contactUrl(product)}" target="_blank" rel="noopener noreferrer">Обсудить в Telegram ${arrow}</a>
        </div>
        <p class="dialog-note">В стоимость входят подбор сервиса и инструкция по самостоятельной регистрации. Решение о выпуске принимает финансовая организация.</p>
      </div>`, 'detail', trigger, fromComparison ? product.id : '');
  }

  function matchingProducts(conditions) {
    return products.filter(product => conditions.every(id => product.criteria.includes(id)));
  }

  function comparisonLink(product, label) {
    return `<button type="button" class="comparison-link" data-product="${product.id}" aria-label="Открыть условия ${product.name}">${label} ${arrow}</button>`;
  }

  function comparisonValue(product, field) {
    const value = product[field];
    const highlight = text => `<mark>${text}</mark>`;
    if (field === 'transfers') {
      return value.replace(/\b(SEPA(?: Instant)?|SWIFT|IBAN|ACH|Wire)\b/gi, term =>
        required.has(term.split(' ')[0].toLowerCase()) ? highlight(term) : term
      );
    }
    if (field === 'format' && issueFormat) {
      return value.replace(issueFormat === 'physical' ? /физическая/gi : /виртуальная/gi, highlight);
    }
    if (field === 'fundingShort' && required.has('rubTopup')) return value.replace(/из (?:банка )?РФ/gi, highlight);
    return value;
  }

  function resultCard(product, single) {
    const fact = ([label, key]) => `<div><dt>${label}</dt><dd>${comparisonValue(product, key)}</dd></div>`;
    return `<article class="match-card">
      <div class="match-header">
        <img class="match-art" alt="" src="assets/card-${product.id}.webp" width="112" height="70">
        <div><h4>${product.name}</h4>${countryLabel(product)}</div>
        <div class="match-price"><span>Пакет Base</span><strong>${product.price}</strong></div>
      </div>
      <p class="match-task">${product.task}</p>
      <dl class="match-facts">${comparisonRows.slice(1, 3).map(fact).join('')}</dl>
      <details class="match-more" ${single ? 'open' : ''}><summary>Пополнение, комиссии и BIN</summary>
        <dl class="match-facts">${comparisonRows.slice(3).map(fact).join('')}</dl>
      </details>
      ${comparisonLink(product, single ? `Открыть условия ${product.name}` : 'Открыть условия')}
    </article>`;
  }

  function comparisonTable(matches) {
    return `<table class="comparison-table">
      <caption class="visually-hidden">Условия выбранных карт</caption>
      <thead><tr><td></td>${matches.map(product => `<th scope="col">
        <img class="match-art" alt="" src="assets/card-${product.id}.webp" width="84" height="52">
        ${comparisonLink(product, product.name)}${countryLabel(product)}
      </th>`).join('')}</tr></thead>
      <tbody><tr class="price-row"><th scope="row">Сопровождение Base</th>${matches.map(product => `<td>${product.price}</td>`).join('')}</tr>
      ${comparisonRows.map(([label, key]) => `<tr><th scope="row">${label}</th>${matches.map(product => `<td>${comparisonValue(product, key)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  }

  function updateComparison() {
    const conditions = issueFormat ? [issueFormat, ...required] : [...required];
    const matches = matchingProducts(conditions);
    const count = matches.length;
    const resultHeading = count === 1 ? 'Подходит 1 карта' : `Подходят ${count} карты`;
    dialog.querySelector('#format-help').textContent = issueFormat === 'virtualOnly'
      ? 'В подборке останутся только направления без выпуска пластика.'
      : 'Во всех четырёх направлениях виртуальную карту можно оформить отдельно.';
    dialog.querySelector('#match-count').textContent = conditions.length ? (count ? resultHeading : 'Совпадений нет') : 'Все 4 карты';
    dialog.querySelector('[data-reset-requirements]').disabled = !conditions.length;
    const results = dialog.querySelector('#match-results');
    if (count) {
      results.innerHTML = `${count > 1 ? comparisonTable(matches) : ''}
        <div class="match-cards ${count === 1 ? 'single-match' : ''}">${matches.map(product => resultCard(product, count === 1)).join('')}</div>`;
      return;
    }
    const alternatives = [...formats, ...capabilities].filter(([id]) =>
      conditions.includes(id) && matchingProducts(conditions.filter(condition => condition !== id)).length
    );
    results.innerHTML = `<div class="no-matches">
      <p>${alternatives.length ? 'Если снять одно из этих требований, появятся подходящие карты.' : 'Ни одна карта не сочетает все выбранные возможности. Снимите несколько требований или сбросьте выбор.'}</p>
      ${alternatives.map(([id, label]) => `<button type="button" data-relax="${id}">Снять «${label}»</button>`).join('')}
    </div>`;
  }

  function showComparison(trigger) {
    openDialog('Сравнение карт', `
      <div class="comparison-content">
        <p class="comparison-intro">Отметьте обязательные условия. В подборке останутся карты, которые отвечают каждому из них.</p>
        <div class="comparison-controls">
          <fieldset class="format-filter" aria-describedby="format-help"><legend>Формат выпуска</legend>
            <div class="format-options">${formats.map(([id, label]) => `<label><input type="radio" name="issue-format" value="${id}" ${issueFormat === id ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div>
            <p id="format-help"></p>
          </fieldset>
          <fieldset class="capability-filter"><legend>Переводы и пополнение</legend>
            <div>${capabilities.map(([id, label]) => `<label><input type="checkbox" name="required-capability" value="${id}" ${required.has(id) ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div>
            <details class="transfer-guide"><summary>Как выбрать способ перевода</summary>
              <dl>
                <div><dt>SEPA</dt><dd>Для переводов в евро между банками и сервисами, которые участвуют в SEPA.</dd></div>
                <div><dt>IBAN</dt><dd>Международный формат номера счёта. Отметьте, если отправитель просит IBAN получателя.</dd></div>
                <div><dt>SWIFT</dt><dd>Для международного перевода, когда отправитель указывает SWIFT и просит код банка BIC.</dd></div>
                <div><dt>ACH и Wire</dt><dd>Два способа перевода долларов в США. Спросите у отправителя, какой из них он использует.</dd></div>
                <div><dt>Пополнение из банка РФ</dt><dd>У Orange и Gold маршрут может включать обмен валюты. Доступность, курс и комиссии уточним для вашего банка.</dd></div>
              </dl>
            </details>
          </fieldset>
        </div>
        <div class="comparison-status"><h3 id="match-count" role="status" aria-live="polite" aria-atomic="true"></h3>
          <button type="button" data-reset-requirements>Сбросить выбор</button>
        </div>
        <div id="match-results"></div>
      </div>`, 'compare', trigger);
    updateComparison();
    if (trigger.dataset.returnTo) {
      const links = dialog.querySelectorAll(`.comparison-link[data-product="${trigger.dataset.returnTo}"]`);
      const previous = Array.from(links).find(link => link.getClientRects().length);
      dialog.scrollTop = comparisonScroll;
      if (previous) {
        previous.focus({ preventScroll: true });
        previous.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }
    }
  }

  dialog.addEventListener('change', event => {
    const input = event.target;
    if (input.name === 'issue-format') issueFormat = input.value;
    else if (input.name === 'required-capability') {
      if (input.checked) required.add(input.value);
      else required.delete(input.value);
    } else return;
    updateComparison();
  });

  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-relax], [data-reset-requirements]');
    if (!action) return;
    const relaxed = action.dataset.relax;
    if (!relaxed) {
      required.clear();
      issueFormat = '';
    } else if (relaxed === issueFormat) issueFormat = '';
    else required.delete(relaxed);
    let focusTarget;
    for (const input of dialog.querySelectorAll('.comparison-controls input')) {
      input.checked = input.type === 'radio' ? input.value === issueFormat : required.has(input.value);
      if ((input.type === 'checkbox' && input.value === relaxed) || (input.type === 'radio' && !input.value && !focusTarget)) {
        focusTarget = input;
      }
    }
    focusTarget.focus({ preventScroll: true });
    updateComparison();
  });

  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button || button.getAttribute('aria-pressed') === 'true') return;
    showProducts(button.dataset.filter);
    if (event.isTrusted && grid.firstElementChild?.getBoundingClientRect().bottom > innerHeight &&
        filters.getBoundingClientRect().top > innerHeight / 3) {
      filters.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-product], [data-compare], [data-dismiss]');
    if (!button) return;
    if (button.hasAttribute('data-dismiss')) dialog.close();
    else if (button.hasAttribute('data-compare')) showComparison(button);
    else {
      const product = products.find(item => item.id === button.dataset.product);
      if (product) showDetail(product, button, dialog.open && dialog.dataset.variant === 'compare');
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('catalog-dialog-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
  showProducts('all');
})();
