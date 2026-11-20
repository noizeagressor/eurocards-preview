(() => {
  'use strict';

  const menu = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('primary-nav');
  function setMenu(open) {
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    setMenu(open);
    if (open) navigation.querySelector('a').focus({ preventScroll: true });
  });
  navigation.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link && menu.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      const destination = link.hash && document.getElementById(link.hash.slice(1));
      if (destination) {
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
      }
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header') && menu.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  document.querySelector('.site-header').addEventListener('focusout', event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && menu.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menu.focus();
    }
  });
  window.matchMedia('(max-width: 700px)').addEventListener('change', () => setMenu(false));

  const deck = document.getElementById('services');
  const groups = deck.querySelector('.service-tabs');
  const buttons = Array.from(groups.querySelectorAll('[data-group]'));
  const field = deck.querySelector('#merchant-search');
  const clear = deck.querySelector('[data-clear-search]');
  const empty = deck.querySelector('.service-empty');
  const status = deck.querySelector('#service-status');
  const note = deck.querySelector('#service-note');
  const notesByGroup = new Map(buttons.map(button => [button.dataset.group, button.dataset.note]));
  const generalNote = notesByGroup.get('popular');
  let groupIndex = 0;

  function normalize(text) {
    return text.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/[^а-яa-z0-9]+/g, '');
  }

  const entries = Array.from(deck.querySelectorAll('#merchant-list [data-group]'), item => {
    const name = item.querySelector('strong').textContent;
    const description = item.querySelector('small').textContent;
    const tokens = normalize([name, description, item.dataset.search].join(' '));
    return { item, tokens };
  });

  function refresh() {
    const rawQuery = field.value.trim();
    const query = normalize(rawQuery);
    const group = buttons[groupIndex].dataset.group;
    let count = 0;
    for (const { item, tokens } of entries) {
      const visible = rawQuery ? Boolean(query && tokens.includes(query))
        : group === 'popular' ? item.hasAttribute('data-popular') : item.dataset.group === group;
      item.hidden = !visible;
      if (visible) count++;
    }
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(!rawQuery && index === groupIndex));
      button.tabIndex = index === groupIndex ? 0 : -1;
    });
    clear.hidden = !field.value;
    empty.hidden = count > 0;
    if (!count) {
      const contact = new URL('https://t.me/vladethlemon');
      contact.searchParams.set('text', 'Здравствуйте! Подойдёт ли карта для ' + rawQuery + '?');
      empty.querySelector('a').href = contact.href;
    }
    note.hidden = !count;
    note.textContent = rawQuery ? generalNote : notesByGroup.get(group);
    status.textContent = rawQuery ? 'Найдено сервисов: ' + count
      : 'Категория «' + buttons[groupIndex].textContent + '». Сервисов: ' + count;
  }

  function chooseGroup(index, focus = false) {
    groupIndex = (index + buttons.length) % buttons.length;
    field.value = '';
    refresh();
    const active = buttons[groupIndex];
    if (focus) active.focus({ preventScroll: true });
    if (groups.scrollWidth > groups.clientWidth) {
      groups.scrollLeft += active.getBoundingClientRect().left - groups.getBoundingClientRect().left
        - (groups.clientWidth - active.offsetWidth) / 2;
    }
  }

  deck.querySelector('.service-navigation').hidden = false;
  deck.querySelector('.service-finder').hidden = false;
  field.addEventListener('input', refresh);
  clear.addEventListener('click', () => {
    field.value = '';
    refresh();
    field.focus({ preventScroll: true });
  });
  field.addEventListener('keydown', event => {
    if (event.key === 'Escape' && field.value) {
      event.preventDefault();
      field.value = '';
      refresh();
    }
  });
  groups.addEventListener('click', event => {
    const button = event.target.closest('[data-group]');
    if (button) chooseGroup(buttons.indexOf(button));
  });
  groups.addEventListener('keydown', event => {
    const target = { ArrowRight: groupIndex + 1, ArrowLeft: groupIndex - 1, Home: 0, End: buttons.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    chooseGroup(target, true);
  });
  deck.querySelector('.deck-arrows').addEventListener('click', event => {
    const button = event.target.closest('[data-service-step]');
    if (button) chooseGroup(groupIndex + Number(button.dataset.serviceStep));
  });
  document.querySelector('.hero').addEventListener('click', event => {
    const link = event.target.closest('a[data-wallet], a[data-category]');
    if (!link) return;
    if (link.dataset.wallet) {
      document.querySelector(`input[name="mobile-wallet"][value="${link.dataset.wallet}"]`).checked = true;
    } else {
      const group = buttons.findIndex(button => button.dataset.group === link.dataset.category);
      if (group >= 0) chooseGroup(group);
    }
  });

  // Keep vertical scrolling native; only a horizontal swipe changes category.
  let start;
  deck.addEventListener('touchstart', event => {
    start = !field.value.trim() && event.touches.length === 1 && event.target.closest('.service-category')
      ? event.touches[0] : null;
  }, { passive: true });
  deck.addEventListener('touchcancel', () => { start = null; });
  deck.addEventListener('touchend', event => {
    if (!start) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - start.clientX;
    const dy = end.clientY - start.clientY;
    start = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (event.cancelable) event.preventDefault();
      chooseGroup(groupIndex + (dx < 0 ? 1 : -1));
    }
  }, { passive: false });
  refresh();
})();
