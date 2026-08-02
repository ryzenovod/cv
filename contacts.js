(() => {
  'use strict';

  const contacts = [
    {
      key: 'telegram',
      labelRu: 'Telegram',
      labelEn: 'Telegram',
      value: '@ryzenovod',
      href: 'https://t.me/ryzenovod',
      external: true,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 3.3 2.8 10.2c-1.2.5-1.2 1.2-.2 1.5l4.6 1.4 1.8 5.5c.2.6.1.9.8.9.5 0 .8-.2 1.1-.5l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.8l3-14.3c.3-1.3-.5-1.9-1.6-1.5Zm-11 9.5 8.9-5.6c.4-.3.8-.1.5.2l-7.3 6.6-.3 3.6-1.8-4.8Z" fill="currentColor"/></svg>'
    },
    {
      key: 'vk',
      labelRu: 'ВКонтакте',
      labelEn: 'VK',
      value: 'vk.com/ryzenovod',
      href: 'https://vk.com/ryzenovod',
      external: true,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 17.2c-5.5 0-8.6-3.8-8.7-10.2h2.7c.1 4.7 2.2 6.7 3.9 7.1V7h2.6v4.1c1.7-.2 3.5-2 4.1-4.1h2.6c-.5 2.6-2.5 4.4-3.9 5.2 1.4.7 3.7 2.3 4.6 5h-2.9c-.7-2-2.4-3.5-4.5-3.7v3.7h-.5Z" fill="currentColor"/></svg>'
    },
    {
      key: 'email',
      labelRu: 'Почта',
      labelEn: 'Email',
      value: 'belousov-carp@mail.ru',
      href: 'mailto:belousov-carp@mail.ru',
      external: false,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5h17v13h-17v-13Zm1.7 1.6L12 12.2l6.8-5.1H5.2Zm13.6 9.8V9.2L12 14.3 5.2 9.2v7.7h13.6Z" fill="currentColor"/></svg>'
    },
    {
      key: 'phone',
      labelRu: 'Телефон',
      labelEn: 'Phone',
      value: '+7 950 296-11-92',
      href: 'tel:+79502961192',
      external: false,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.3 2.8 4.6 4.3c-.9.5-1.3 1.5-1 2.5 1.5 5.6 5.9 10 11.5 11.5 1 .3 2-.1 2.5-1l1.5-2.7-4.2-2-1.3 2c-2.6-1-4.7-3.1-5.7-5.7l2-1.3-2-4.2-.6-.6Z" fill="currentColor"/></svg>'
    },
    {
      key: 'github',
      labelRu: 'GitHub',
      labelEn: 'GitHub',
      value: 'github.com/ryzenovod',
      href: 'https://github.com/ryzenovod',
      external: true,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.7 9.7 0 0 0-3.1 18.9c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.3-2.3-.3-4.7-1.1-4.7-4.9 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.4 4.6-4.7 4.9.4.3.7 1 .7 1.9v2.2c0 .3.2.6.7.5A9.7 9.7 0 0 0 12 2.5Z" fill="currentColor"/></svg>'
    }
  ];

  const style = `
    .contactlinks.contact-grid{
      width:min(100%,980px);
      margin:34px auto 0;
      display:grid;
      grid-template-columns:repeat(5,minmax(0,1fr));
      gap:10px;
    }
    .contact-card{
      min-width:0;
      padding:16px 14px;
      display:flex;
      align-items:center;
      gap:11px;
      text-align:left;
      border:1px solid rgba(255,255,255,.11);
      border-radius:14px;
      background:rgba(255,255,255,.025);
      transition:transform .25s var(--ease),border-color .25s,background .25s,box-shadow .25s;
      overflow:hidden;
    }
    .contact-card:hover{
      transform:translateY(-3px);
      border-color:rgba(255,79,199,.45);
      background:rgba(255,79,199,.055);
      box-shadow:0 15px 38px rgba(0,0,0,.28),0 0 28px rgba(255,79,199,.07);
    }
    .contact-card.telegram{
      background:linear-gradient(135deg,rgba(255,79,199,.18),rgba(157,100,255,.08));
      border-color:rgba(255,79,199,.28);
    }
    .contact-icon{
      flex:0 0 34px;
      width:34px;
      height:34px;
      display:grid;
      place-items:center;
      border-radius:10px;
      background:rgba(255,255,255,.055);
      color:var(--pink2);
    }
    .contact-icon svg{width:19px;height:19px}
    .contact-copy{min-width:0;display:block}
    .contact-copy strong{
      display:block;
      color:var(--text);
      font:650 12px var(--sans);
      margin-bottom:2px;
    }
    .contact-copy span{
      display:block;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      color:var(--faint);
      font:9px var(--mono);
    }
    .contact-card:hover .contact-copy span{color:var(--muted)}
    @media(max-width:1000px){.contactlinks.contact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.contact-card:last-child{grid-column:1/-1}}
    @media(max-width:600px){.contactlinks.contact-grid{grid-template-columns:1fr}.contact-card:last-child{grid-column:auto}.contact-card{padding:15px 16px}.contact-copy span{font-size:10px}}
  `;

  function translate() {
    const lang = localStorage.getItem('portfolio-lang') || document.documentElement.lang || 'ru';
    document.querySelectorAll('.contact-label').forEach((node) => {
      node.textContent = node.dataset[lang] || node.dataset.ru;
    });
  }

  function initContacts() {
    const container = document.querySelector('#contact .contactlinks');
    if (!container || container.dataset.contactsReady === '1') return;

    const styleNode = document.createElement('style');
    styleNode.dataset.contactStyles = 'true';
    styleNode.textContent = style;
    document.head.append(styleNode);

    container.dataset.contactsReady = '1';
    container.classList.add('contact-grid');
    container.innerHTML = contacts.map((contact) => {
      const target = contact.external ? ' target="_blank" rel="noreferrer"' : '';
      return `<a class="contact-card ${contact.key}" href="${contact.href}"${target} aria-label="${contact.labelRu}: ${contact.value}">
        <span class="contact-icon">${contact.icon}</span>
        <span class="contact-copy"><strong class="contact-label" data-ru="${contact.labelRu}" data-en="${contact.labelEn}">${contact.labelRu}</strong><span>${contact.value}</span></span>
      </a>`;
    }).join('');

    translate();

    const observer = new MutationObserver(translate);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContacts, { once: true });
  } else {
    initContacts();
  }
})();
