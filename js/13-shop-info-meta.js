/* ---------- פרטי החנות, כותרת עמוד, הזמנה בוואטסאפ ---------- */
const BASE_TITLE = 'החנות שלך';
function routeParts() {
  if (!location.hash || location.hash === '#/') {
    const parts = location.pathname.split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch { return x; } });
    if (!parts.length) return [undefined, undefined, undefined];
    const [first, second, third] = parts;
    if (['privacy','terms','returns','cookies','accessibility','about','order-status'].includes(first)) return [first, second, third];
    if (first === 'category') return ['category', second, third];
    if (first === 'product') return ['product', second, third];
  }
  const [, page, rawArg, rawArg2] = (location.hash || '#/').split('/');
  const dec = x => { try { return x === undefined ? x : decodeURIComponent(x); } catch { return x; } };
  return [page, dec(rawArg), dec(rawArg2)];
}
function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el && value) el.setAttribute(attr, value);
}
function absoluteUrl(src) {
  try { return new URL(src, location.href).href; } catch { return ''; }
}
const DEFAULT_DESC = 'החנות שלך: טלפונים, טאבלטים, שעונים ואביזרים.';
function updateMeta(title, desc, image) {
  setMeta('meta[name="description"]', 'content', desc);
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', desc);
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', desc);
  if (image && !/^data:/i.test(image)) {
    const abs = absoluteUrl(image);
    if (abs) { setMeta('meta[property="og:image"]', 'content', abs); setMeta('meta[name="twitter:image"]', 'content', abs); }
  }
  setMeta('meta[property="og:url"]', 'content', location.href);
}
function updateTitle() {
  const [page, arg] = routeParts();
  let t = BASE_TITLE, desc = DEFAULT_DESC, image = '';
  const legalTitles = { privacy: 'מדיניות פרטיות', terms: 'תנאי שימוש', returns: 'מדיניות ביטול והחזרות', cookies: 'מדיניות עוגיות', accessibility: 'הצהרת נגישות' };
  if (legalTitles[page]) { document.title = legalTitles[page] + ' | החנות שלך'; updateMeta(document.title, DEFAULT_DESC, ''); return; }
  if (page === 'about') { document.title = 'אודות | החנות שלך'; updateMeta(document.title, DEFAULT_DESC, ''); return; }
  if (page === 'category') {
    const c = CATEGORIES.find(x => x.id === arg);
    if (c) { t = c.title + ' | החנות שלך'; desc = c.sub || desc; image = c.image || ''; }
  } else if (page === 'product') {
    const p = PRODUCTS.find(x => x.id === arg);
    if (p) {
      t = p.name + ' | החנות שלך';
      const v = defaultVariant(p);
      desc = p.name + (productSupplyType(p) ? ' · ' + productSupplyType(p) : '') + ' · ' + (p.variants.some(x => x.price !== v.price) ? 'החל מ-' : '') + fmt(v.price) + ' · ' + WARRANTY_LABEL;
      const pd = publicText(p.desc); if (pd) desc = desc + ' · ' + pd.slice(0, 120);
      image = (p.galleryImages && p.galleryImages[0]) || p.image || '';
    }
  }
  else if (page === 'checkout') t = 'סיכום הזמנה | החנות שלך';
  else if (page === 'order-done') t = 'ההזמנה התקבלה | החנות שלך';
  else if (page === 'order-status') t = 'מעקב הזמנה | החנות שלך';
  document.title = t;
  updateMeta(t, desc, image);
}
function shopWhatsappNumber() {
  let n = String((window.SHOP_INFO || {}).whatsapp || '').replace(/\D/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0')) n = '972' + n.slice(1);
  return n;
}
function shopPhoneNumber() { return String((window.SHOP_INFO || {}).phone || '').replace(/[^\d+]/g, ''); }
function renderHighlights() {
  const list = ((window.SHOP_INFO || {}).highlights || []).filter(x => typeof x === 'string' && x.trim());
  return list.length ? `<ul class="highlights">${list.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ul>` : '';
}
function renderShopInfo() {
  const info = window.SHOP_INFO || {};
  const wa = shopWhatsappNumber(), tel = shopPhoneNumber();
  const parts = [];
  if (tel) parts.push(`<a href="tel:${escapeHTML(tel)}">📞 ${escapeHTML(info.phone)}</a>`);
  if (info.email) parts.push(`<a href="mailto:${escapeHTML(info.email)}">✉️ ${escapeHTML(info.email)}</a>`);
  if (info.address) parts.push(`<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}" target="_blank" rel="noopener">📍 כתובת: ${escapeHTML(info.address)}</a>`);
  if (info.hours) parts.push(`<span>🕒 ${escapeHTML(info.hours)}</span>`);
  if (info.businessId) parts.push(`<span>מס׳ עוסק מורשה / ח.פ.: ${escapeHTML(info.businessId)}</span>`);
  const box = document.getElementById('footerContact');
  if (box) box.innerHTML = parts.join('');
  if (wa && !document.getElementById('waFloat')) {
    const a = document.createElement('a');
    a.id = 'waFloat'; a.className = 'wa-float'; a.target = '_blank'; a.rel = 'noopener';
    a.href = 'https://wa.me/' + wa; a.setAttribute('aria-label', 'שליחת הודעה בוואטסאפ'); a.textContent = '💬 וואטסאפ';
    document.body.appendChild(a);
  }
}
function fillShopInfoForm() {
  const info = window.SHOP_INFO || {};
  for (const [key,id] of Object.entries({legalName:'shopInfoLegalName',businessId:'shopInfoBusinessId',address:'shopInfoAddress',phone:'shopInfoPhone',whatsapp:'shopInfoWhatsapp',email:'shopInfoEmail',hours:'shopInfoHours',about:'shopInfoAbout'})) {
    const field=document.getElementById(id); if(field) field.value=info[key]||'';
  }
  for (const [key,id] of Object.entries({name:'shopInfoAccessName',phone:'shopInfoAccessPhone',email:'shopInfoAccessEmail'})) {
    const field=document.getElementById(id); if(field) field.value=info.accessibilityCoordinator?.[key]||'';
  }
}
function renderAboutPage() {
  const info=window.SHOP_INFO||{}, about=String(info.about||'').trim();
  return `<section class="about-page"><p class="crumbs"><a href="#/">דף הבית</a> / אודותינו</p><h1>אודות החנות שלך</h1><p class="about-copy">${escapeHTML(about||'מידע על העסק יתווסף בקרוב.')}</p></section>`;
}
