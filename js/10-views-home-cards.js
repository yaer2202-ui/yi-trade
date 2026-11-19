/* ---------- Views ---------- */
function viewHome() {
  return `<h1 class="sr-only">החנות שלך</h1>${bannerHTML('home')}${featuresHTML()}<section class="blocks" aria-label="קטגוריות">${CATEGORIES.map(c => {
    const brand = escapeHTML(HOME_BRANDS[c.id] || c.name);
    return `
      <article class="block block-${escapeHTML(c.id)}">
        <div class="frame-wrap"><div class="frame"><img src="${escapeHTML(categoryImage(c))}" alt="${escapeHTML(c.name)}" loading="lazy" decoding="async"></div></div>
        <div class="block-text">
          ${/[א-ת]/.test((HOME_BRANDS[c.id] || c.name))
            ? `<h2 class="brand he">${brand}</h2>`
            : `<p class="block-kicker">סדרת מכשירי</p><h2 class="brand">${brand}</h2>`}
          <a class="btn-purple" href="#/category/${encodeURIComponent(c.id)}" aria-label="לרכישה – ${escapeHTML(c.name)}">לרכישה</a>
        </div>
      </article>`;
  }).join('')}</section>${renderHighlights()}`;
}

const SEARCH_ALIASES = [
  ['אייפונים','iphone'],['אייפון','iphone'],['איפון','iphone'],['אפל','apple'],
  ['סאמסונג','samsung'],['סמסונג','samsung'],['גלקסי','galaxy'],['גלאקסי','galaxy'],
  ['שיאומי','xiaomi'],['שיומי','xiaomi'],['שאומי','xiaomi'],['רדמי','redmi'],['פוקו','poco'],
  ['איירפודס','airpods'],['אירפודס','airpods'],['איירפוד','airpods'],
  ['גיי בי אל','jbl'],['גי בי אל','jbl'],['גיביאל','jbl'],['נוקיה','nokia'],
  ['אנקר','anker'],['בייסוס','baseus'],['שעונים','watch'],['שעון','watch'],
  ['טאבלטים','tablet'],['טאבלט','tablet'],['אולטרה','ultra'],['פרו','pro'],
  ['מקס','max'],['פלוס','plus'],['מיני','mini'],['אייר','air']
];
function normalizeSearchText(text) {
  let t = String(text || '').toLowerCase().replace(/[׳'’]/g, '').replace(/[-–—]+/g, ' ');
  SEARCH_ALIASES.forEach(([he, en]) => { t = t.split(he).join(en); });
  return t;
}
function searchProducts(query) {
  const box = document.getElementById('searchResults'); if (!box) return;
  const input = document.getElementById('productSearch');
  const q = String(query || '').trim();
  if (!q) { box.classList.remove('open'); box.innerHTML = ''; input?.setAttribute('aria-expanded', 'false'); input?.removeAttribute('aria-activedescendant'); return; }
  const tokens = normalizeSearchText(q).split(/\s+/).filter(Boolean);
  const rows = PRODUCTS.filter(p => {
    const hay = normalizeSearchText(p.name + ' ' + (p.meta || '') + ' ' + p.variants.map(v => [v.sku, v.color, v.storage, v.ram].join(' ')).join(' '));
    return tokens.every(tok => hay.includes(tok));
  }).slice(0, 8);
  box.innerHTML = rows.map((p, i) => `<a id="search-option-${i}" role="option" aria-selected="false" class="search-result" href="#/product/${encodeURIComponent(p.id)}">${escapeHTML(p.name)}<small>${p.variants.length > 1 && p.variants.some(v => v.price !== p.price) ? 'החל מ-' : ''}${fmt(p.price)}</small></a>`).join('') || '<div class="search-result" role="option" aria-selected="false">לא נמצאו מוצרים</div>';
  box.classList.add('open');
  input?.setAttribute('aria-expanded', 'true'); input?.removeAttribute('aria-activedescendant');
}
document.getElementById('productSearch')?.addEventListener('keydown', event => {
  const input = event.currentTarget, box = document.getElementById('searchResults');
  const options = [...(box?.querySelectorAll('[role="option"][href]') || [])];
  if (!options.length) return;
  const current = options.findIndex(option => option.getAttribute('aria-selected') === 'true');
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); const next = event.key === 'ArrowDown' ? (current + 1) % options.length : (current <= 0 ? options.length - 1 : current - 1);
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === next)));
    input.setAttribute('aria-activedescendant', options[next].id);
  } else if (event.key === 'Enter' && current >= 0) { event.preventDefault(); options[current].click(); }
  else if (event.key === 'Escape') { box.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
});
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap')){const box=document.getElementById('searchResults'),input=document.getElementById('productSearch');box?.classList.remove('open');input?.setAttribute('aria-expanded','false');input?.removeAttribute('aria-activedescendant')}});
function publicText(value) {
  return String(value ?? '').replace(/מוצר מתוך מחירון המלאי שסופק\.?|מוצר נוסף לקטלוג\.?|מוצר בקטלוג|מאוקטב לזמן קצר|שם הדגם הושלם לפי המחירון|המחיר במחירון:\s*[\d,.]+\s*₪?|המחיר כולל מע״מ[^|·]*|לפי המחירון(?:\s+שסופק)?/gi, '').replace(/\s*[·|]\s*/g, ' · ').replace(/(?:·\s*){2,}/g, ' · ').replace(/^[\s·]+|[\s·]+$/g, '').trim();
}
/* ----- בחירת וריאנט: צבע / זיכרון / RAM (כרטיסיה ודף מוצר) ----- */
const encId = v => encodeURIComponent(v);
const productHref = (p, v) => '#/product/' + encId(p.id) + (v ? '/' + encId(v.id) : '');
function optionsHTML(p, v) {
  return VARIANT_DIMS.map(({ k, label }) => {
    const vals = dimValues(p, k);
    if (!vals.length) return '';
    const cur = v[k];
    let list;
    if (k === 'color') {
      const hexOf = name => (p.variants.find(x => x.color === name && x.hex) || {}).hex || UNKNOWN_HEX;
      list = vals.map(c => `<button type="button" class="vopt-swatch${c === cur ? ' sel' : ''}" data-opt="color" data-val="${escapeHTML(c)}" style="background:${hexOf(c)}" title="${escapeHTML(c)}" aria-label="צבע ${escapeHTML(c)}" aria-pressed="${c === cur}"></button>`).join('');
    } else {
      list = vals.length > 1
        ? vals.map(x => `<button type="button" class="vopt-chip${x === cur ? ' sel' : ''}" data-opt="${k}" data-val="${escapeHTML(x)}" aria-pressed="${x === cur}">${escapeHTML(x)}</button>`).join('')
        : `<span class="vopt-chip static sel">${escapeHTML(vals[0])}</span>`;
    }
    const shown = k === 'color' ? (cur || 'כללי') : '';
    return `<div class="vopt-row"><span class="vopt-label">${label}${shown ? `: <b class="vopt-cur">${escapeHTML(shown)}</b>` : ''}</span><div class="vopt-list">${list}</div></div>`;
  }).join('');
}
function card(p) {
  const name = escapeHTML(p.name);
  const v = defaultVariant(p);
  const image = escapeHTML(productImage(p, v.color));
  const supply = productSupplyType(p);
  const href = escapeHTML(productHref(p, v));
  return `<article class="pcard">
    <a class="pcard-imglink" href="${href}" aria-label="${name}" tabindex="-1"><div class="pcard-frame"><img src="${image}" alt="${name}" loading="lazy" decoding="async">${supply ? `<span class="product-badge pcard-badge">${escapeHTML(supply)}</span>` : ''}</div></a>
    <div class="pcard-strip">
      <h3><a class="pcard-title" href="${href}">${name}</a></h3>
      <span class="pcard-warranty">✓ ${WARRANTY_LABEL}</span>
      <div class="pcard-row"><span class="price">${p.variants.some(x => x.price !== v.price) ? '<small class="price-from">החל מ-</small>' : ''}${fmt(v.price)}</span><a class="pcard-btn" href="${href}" aria-label="להזמנה: ${name}, ${fmt(v.price)}">להזמנה</a></div>
    </div></article>`;
}
function updateCard(host, p, v) {
  host.dataset.vid = v.id;
  const href = productHref(p, v);
  host.querySelector('.pcard-opts').innerHTML = optionsHTML(p, v);
  host.querySelector('.pcard-row .price').textContent = fmt(v.price);
  host.querySelectorAll('a').forEach(a => { a.setAttribute('href', href); });
  const btn = host.querySelector('.pcard-btn');
  btn.setAttribute('aria-label', `להזמנה: ${p.name}${variantLabel(v) ? ', ' + variantLabel(v) : ''}, ${fmt(v.price)}`);
  const img = host.querySelector('.pcard-frame img');
  const src = productImage(p, v.color);
  if (img && img.getAttribute('src') !== src) img.setAttribute('src', src);
}
function updatePdp(host, p, v) {
  host.dataset.vid = v.id;
  host.querySelector('#pdpOpts').innerHTML = optionsHTML(p, v);
  host.querySelector('#pdpPrice').textContent = fmt(v.price);
  const skuRow = host.querySelector('#pdpSkuRow');
  skuRow.hidden = !v.sku;
  host.querySelector('#pdpSku').textContent = v.sku || '';
  const images = productImageList(p, v.color);
  const imgSrc = images[0] || productImage(p, v.color);
  host.querySelector('#pdpImg').src = imgSrc;
  renderProductGallery(host, p, v);
  const stockState = stockDisplay(p, v);
  const stock = host.querySelector('#pdpStock');
  if (stock) { stock.textContent = stockState.label; stock.classList.toggle('is-in', stockState.className === 'is-in'); stock.classList.toggle('is-out', stockState.className === 'is-out'); stock.classList.toggle('is-unknown', stockState.className === 'is-unknown'); }
  const stockBenefit = host.querySelector('[data-stock-benefit] b');
  if (stockBenefit) stockBenefit.textContent = stockState.available === null ? stockState.label : (stockState.available ? 'זמין במלאי' : 'לא זמין כרגע');
  host.querySelectorAll('.pdp-thumb').forEach(t => t.classList.toggle('sel', t.dataset.image === imgSrc));
  try { history.replaceState(null, '', productHref(p, v)); } catch { /* ignore */ }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-opt]');
  if (!b) return;
  const host = b.closest('[data-pid]');
  if (!host) return;
  const p = PRODUCTS.find(x => x.id === host.dataset.pid);
  if (!p) return;
  const cur = findVariant(p, host.dataset.vid) || defaultVariant(p);
  const next = pickVariant(p, cur, b.dataset.opt, b.dataset.val);
  if (host.classList.contains('pcard')) updateCard(host, p, next); else updatePdp(host, p, next);
  // שומרים פוקוס מקלדת אחרי שהאפשרויות צוירו מחדש
  const again = [...host.querySelectorAll('[data-opt]')].find(x => x.dataset.opt === b.dataset.opt && x.dataset.val === b.dataset.val);
  if (again) again.focus({ preventScroll: true });
});

