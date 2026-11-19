/* ---------- באנרים: דף הבית וכל קטגוריה (עד 5 תמונות, כותרת ותיאור, נערכים בניהול) ---------- */
const BANNER_MAX = 5;
const BANNER_INTERVAL = 5500;
function sanitizeBanners(obj) {
  const out = {};
  if (!isPlainObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    if (!isPlainObject(v) || !/^[\w-]{1,60}$/.test(k)) continue;
    out[k] = {
      title: String(v.title ?? '').slice(0, 120),
      desc: String(v.desc ?? '').slice(0, 300),
      color: /^#[0-9a-f]{6}$/i.test(String(v.color || '')) ? String(v.color).toLowerCase() : '',
      images: Array.isArray(v.images) ? v.images.filter(x => typeof x === 'string' && SAFE_IMAGE_RE.test(x)).slice(0, BANNER_MAX) : []
    };
  }
  return out;
}
function bannerDefaults(key) {
  if (key === 'home') return { title: 'הדור הבא של הטכנולוגיה מחכה לך ממש כאן', desc: 'כל מה שחיפשת בעולם הטכנולוגיה והסלולר במקום אחד' };
  const c = CATEGORIES.find(x => x.id === key);
  return c ? { title: HOME_BRANDS[c.id] || c.name, desc: c.sub || '' } : { title: '', desc: '' };
}
function getBanner(key) {
  const cfg = sanitizeBanners(productOverrides.__bannerConfig && productOverrides.__bannerConfig.banners)[key];
  return cfg || { ...bannerDefaults(key), images: [] };
}
const BANNER_ICONS = {
  prev: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  pause: '<svg class="ico-pause" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg><svg class="ico-play" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>'
};
function bannerHTML(key, variant) {
  const cfg = getBanner(key);
  const imgs = cfg.images, n = imgs.length;
  const slides = (n ? imgs : [null]).map((src, i) =>
    `<div class="banner-slide${i === 0 ? ' active' : ''}${src ? '' : ' noimg'}"${i ? ' aria-hidden="true"' : ''}>${src ? `<img src="${escapeHTML(src)}" alt=""${i ? ' loading="lazy"' : ''} decoding="async">` : ''}</div>`).join('');
  const ink = /^#[0-9a-f]{6}$/i.test(cfg.color || '') ? ` style="color:${cfg.color}"` : '';
  const text = (cfg.title || cfg.desc)
    ? `<div class="banner-content">${cfg.title ? `<h2 class="banner-title"${ink}>${escapeHTML(cfg.title)}</h2>` : ''}${cfg.desc ? `<p class="banner-desc"${ink}>${escapeHTML(cfg.desc)}</p>` : ''}</div>` : '';
  const controls = n > 1 ? `
    <button type="button" class="banner-arrow banner-prev" data-banner-step="-1" aria-label="התמונה הקודמת">${BANNER_ICONS.prev}</button>
    <button type="button" class="banner-arrow banner-next" data-banner-step="1" aria-label="התמונה הבאה">${BANNER_ICONS.next}</button>
    <div class="banner-nav"><div class="banner-dots">${imgs.map((_, i) => `<button type="button" class="banner-dot${i === 0 ? ' sel' : ''}" data-banner-go="${i}" aria-label="מעבר לתמונה ${i + 1} מתוך ${n}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div>
    <button type="button" class="banner-pause" aria-pressed="false" aria-label="עצירת ההחלפה האוטומטית">${BANNER_ICONS.pause}</button></div>` : '';
  return `<section class="banner${variant === 'cat' ? ' banner--cat' : ''}" data-banner="${escapeHTML(key)}" data-idx="0" aria-label="${escapeHTML(cfg.title || 'באנר')}"${n > 1 ? ' aria-roledescription="carousel"' : ''}>
    <div class="banner-slides">${slides}</div><div class="banner-shade" aria-hidden="true"></div>${text}${controls}</section>`;
}
function bannerShow(b, i) {
  const slides = [...b.querySelectorAll('.banner-slide')], n = slides.length;
  if (n < 2) return;
  i = ((i % n) + n) % n;
  slides.forEach((s, k) => { s.classList.toggle('active', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
  b.querySelectorAll('.banner-dot').forEach((d, k) => { d.classList.toggle('sel', k === i); if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  b.dataset.idx = String(i);
}
document.addEventListener('click', e => {
  const b = e.target.closest('.banner'); if (!b) return;
  const dot = e.target.closest('[data-banner-go]');
  if (dot) { bannerShow(b, Number(dot.dataset.bannerGo)); return; }
  const step = e.target.closest('[data-banner-step]');
  if (step) { bannerShow(b, Number(b.dataset.idx || 0) + Number(step.dataset.bannerStep)); return; }
  const pb = e.target.closest('.banner-pause');
  if (pb) {
    const paused = b.dataset.paused !== '1';
    b.dataset.paused = paused ? '1' : '';
    pb.setAttribute('aria-pressed', String(paused));
    pb.setAttribute('aria-label', paused ? 'הפעלת ההחלפה האוטומטית' : 'עצירת ההחלפה האוטומטית');
  }
});
let bannerTouchX = null;
document.addEventListener('touchstart', e => { const b = e.target.closest && e.target.closest('.banner'); bannerTouchX = b && e.touches[0] ? e.touches[0].clientX : null; }, { passive: true });
document.addEventListener('touchend', e => {
  const b = e.target.closest && e.target.closest('.banner');
  if (!b || bannerTouchX === null || !e.changedTouches[0]) return;
  const dx = e.changedTouches[0].clientX - bannerTouchX; bannerTouchX = null;
  if (Math.abs(dx) > 50) bannerShow(b, Number(b.dataset.idx || 0) + (dx < 0 ? 1 : -1));
}, { passive: true });
setInterval(() => {
  if (document.hidden || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches)) return;
  const canHover = window.matchMedia && matchMedia('(hover:hover)').matches;
  document.querySelectorAll('.banner[data-idx]').forEach(b => {
    if (b.dataset.paused === '1' || b.querySelectorAll('.banner-slide').length < 2) return;
    if (b.matches(':focus-within') || (canHover && b.matches(':hover'))) return;
    bannerShow(b, Number(b.dataset.idx || 0) + 1);
  });
}, BANNER_INTERVAL);

/* ארבעת מלבני היתרונות מתחת לבאנר בדף הבית */
const FEATURE_ICONS = {
  lock: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  truck: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>',
  shield: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
};
function featuresHTML() {
  const list = [['lock', 'הזמנה נוחה אונליין'], ['truck', 'משלוח בתיאום'], ['shield', 'פרטי אחריות לכל מוצר'], ['clock', 'מענה בשעות הפעילות']];
  return `<ul class="features" aria-label="למה אצלנו">${list.map(([ic, t]) => `<li><span class="feature-ic">${FEATURE_ICONS[ic]}</span><span>${t}</span></li>`).join('')}</ul>`;
}

