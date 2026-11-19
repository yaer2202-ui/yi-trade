const WARRANTY_LABEL = 'אחריות לפי פרטי המוצר';
function getSheetStock(p, v) {
  const stock = window.SHOP_STOCK_BY_SKU || {};
  const keys = [v && v.sku, p && v ? `${p.id}__${v.id}` : '', p && p.id].filter(Boolean);
  for (const key of keys) if (Object.prototype.hasOwnProperty.call(stock, key)) return stock[key];
  return undefined;
}
function stockDisplay(p, v) {
  const configured = !!window.SHOP_STOCK_CONFIG?.csvUrl;
  const value = getSheetStock(p, v);
  if (typeof value === 'boolean') return { available: value, label: value ? '✓ זמין במלאי' : 'אזל מהמלאי', className: value ? 'is-in' : 'is-out' };
  if (!configured) return { available: p.inStock !== false, label: p.inStock !== false ? '✓ זמין במלאי' : 'אזל מהמלאי', className: p.inStock !== false ? 'is-in' : 'is-out' };
  if (window.SHOP_STOCK_ERROR) return { available: null, label: 'לא ניתן לטעון מלאי', className: 'is-unknown' };
  if (!window.SHOP_STOCK_BY_SKU) return { available: null, label: 'בודק זמינות…', className: 'is-unknown' };
  return { available: null, label: 'אין נתון מלאי למק״ט הזה', className: 'is-unknown' };
}
function parseStockCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
async function loadShopStock() {
  const cfg = window.SHOP_STOCK_CONFIG || {};
  if (!cfg.csvUrl) return;
  window.SHOP_STOCK_ERROR = '';
  try {
    const response = await fetch(cfg.csvUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error('Stock sheet request failed');
    const rows = parseStockCSV(await response.text());
    const headers = (rows.shift() || []).map(x => x.trim().replace(/^\uFEFF/, ''));
    const skuIndex = headers.indexOf(cfg.skuColumn || 'SKU');
    const qtyIndex = headers.indexOf(cfg.quantityColumn || 'כמות');
    if (skuIndex < 0 || qtyIndex < 0) throw new Error('Stock sheet columns do not match configuration');
    const stock = {};
    rows.forEach(row => {
      const sku = String(row[skuIndex] || '').trim();
      const raw = String(row[qtyIndex] || '').trim().toLowerCase();
      const normalized = raw.replace(/\s+/g, ' ');
      const unavailable = ['false', 'no', '0', 'לא', 'לא זמין', 'אזל', 'אזל מהמלאי', 'אין'].includes(normalized);
      const available = ['true', 'yes', '1', 'כן', 'זמין', 'במלאי', 'יש'].includes(normalized);
      const qty = Number(normalized.replace(/[^\d.-]/g, ''));
      if (sku) stock[sku] = available || (!unavailable && Number.isFinite(qty) && qty > 0);
    });
    window.SHOP_STOCK_BY_SKU = stock;
    if (routeParts()[0] === 'product') route();
  } catch (error) {
    window.SHOP_STOCK_ERROR = error?.message || 'Stock feed unavailable';
    console.warn('Google Sheets stock could not be loaded.', error);
    if (routeParts()[0] === 'product') route();
  }
}
const SUPPLY_ORDER = ['יבואן רשמי', 'יבואן מקביל', 'כשר', 'מחודש', 'מכשיר שהופעל', ''];
/* שיוך מוצר לסדרה (תת-קטגוריה): קודם בחירה ידנית מהניהול, אחרת לפי ביטוי ההתאמה של הסדרה */
const _subRegexCache = new Map();
function subRegex(src) {
  if (!_subRegexCache.has(src)) { let r = null; try { r = new RegExp(src, 'i'); } catch { /* ignore */ } _subRegexCache.set(src, r); }
  return _subRegexCache.get(src);
}
function productSub(p, cat) {
  cat = cat || CATEGORIES.find(c => c.id === p.cat);
  const subs = (cat && cat.subs) || [];
  if (p.sub && subs.some(s => s.id === p.sub)) return p.sub;
  const text = p.name + ' ' + (p.meta || '');
  for (const s of subs) {
    if (!s.match) continue;
    const r = subRegex(s.match);
    if (r && r.test(text)) return s.id;
  }
  return '';
}
/* בתוך סדרה: פס מפריד בין יבואן רשמי / מקביל / מחודש וכו' (מוצג כשיש לפחות שתי קבוצות) */
function supplyBlocks(rows, level, split) {
  const buckets = new Map(SUPPLY_ORDER.map(k => [k, []]));
  rows.forEach(p => { const k = productSupplyType(p); (buckets.get(k) || buckets.get('')).push(p); });
  const filled = split ? [...buckets].filter(([, r]) => r.length) : [['', rows]];
  const multi = split && filled.length > 1;
  return filled.map(([k, r]) => '<section class="product-group supply-group">' + (multi ? `<h${level}>` + escapeHTML(k || 'מוצרים נוספים') + `</h${level}>` : '') + '<div class="grid">' + r.map(card).join('') + '</div></section>').join('');
}
function seriesSection(s, rows, split) {
  const sid = escapeHTML(s.id);
  return `<section class="series-group${s.premium ? ' is-premium' : ''}" id="grp-${sid}" aria-labelledby="series-${sid}">
    <header class="series-head"><h2 id="series-${sid}">${escapeHTML(s.name)}</h2>${s.premium ? '<span class="series-tag">★ פרימיום</span>' : ''}</header>
    ${supplyBlocks(rows, 3, split)}</section>`;
}
function categoryProductGroups(items, id) {
  const cat = CATEGORIES.find(c => c.id === id);
  const subs = (cat && cat.subs) || [];
  const split = id !== 'extras'; // באביזרים אין משמעות ליבואן רשמי/מקביל
  if (!subs.length) return supplyBlocks(items, 2, split);
  const byId = new Map(subs.map(s => [s.id, []]));
  const rest = [];
  items.forEach(p => { const sid = productSub(p, cat); if (sid && byId.has(sid)) byId.get(sid).push(p); else rest.push(p); });
  const parts = subs.filter(s => byId.get(s.id).length).map(s => seriesSection(s, byId.get(s.id), split));
  if (rest.length) parts.push(seriesSection({ id: 'other', name: 'דגמים נוספים', premium: false }, rest, split));
  return parts.join('');
}

function viewCategory(id) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return viewNotFound();
  const items = PRODUCTS.filter(p => p.cat === id);
  const years = [...new Set(items.flatMap(p => p.year ? [String(p.year)] : ((p.name+' '+(p.meta||'')).match(/20[0-3][0-9]/g)||[])))].sort((a,b)=>Number(b)-Number(a));
  const storage = [...new Set(items.flatMap(productStorages))].sort((a,b)=>memBytes(a)-memBytes(b)); const ram=[...new Set(items.flatMap(productRams))].sort((a,b)=>memBytes(a)-memBytes(b));
  const supplyTypes=[...new Set(items.map(productSupplyType).filter(Boolean))];
  const opts=(arr)=>arr.map(v=>`<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join('');
  return `<div class="page-head"><div><div class="crumbs"><a href="#/">בית</a> › ${escapeHTML(cat.name)}</div><h1>${escapeHTML(cat.title)}</h1></div><a class="btn-ghost" href="#/">← חזרה לקטגוריות</a></div>
  ${bannerHTML(id, 'cat')}
  <div class="catalog-layout"><button type="button" class="filter-fab" id="filterToggle" aria-controls="catalogFilters" aria-expanded="false"><span aria-hidden="true">☰</span> סינון</button><div class="filter-overlay" id="filterOverlay"></div><aside class="catalog-filters" id="catalogFilters" aria-label="סינון ומיון"><div class="filter-head"><h2>סינון ומיון</h2><button type="button" class="filter-close" id="filterClose" aria-label="סגירת הסינון">✕</button></div>
  ${years.length ? `<label>שנה<select id="filterYear" name="filterYear"><option value="">כל השנים</option>${opts(years)}</select></label>` : ''}
  ${storage.length ? `<label>נפח אחסון<select id="filterStorage" name="filterStorage"><option value="">הכל</option>${opts(storage)}</select></label>` : ''}
  ${ram.length ? `<label>זיכרון RAM<select id="filterRam" name="filterRam"><option value="">הכל</option>${opts(ram)}</select></label>` : ''}
  ${supplyTypes.length ? `<label>יבואן / מצב מוצר<select id="filterSupply" name="filterSupply"><option value="">הכל</option>${opts(supplyTypes)}</select></label>` : ''}
  <label>מיון לפי מחיר<select id="filterPrice" name="filterPrice"><option value="">ללא מיון</option><option value="asc">מהנמוך לגבוה</option><option value="desc">מהגבוה לנמוך</option></select></label><button type="button" class="btn-purple wide filter-apply" id="filterApply">הצגת המוצרים</button></aside>
  <div id="categoryResults" class="category-results grouped" data-category="${escapeHTML(id)}">${categoryProductGroups(items,id)}</div></div>`;
}


function applyCategoryFilters() {
  const box=document.getElementById('categoryResults'); if(!box)return;
  const all=PRODUCTS.filter(p=>p.cat===box.dataset.category);
  const year=document.getElementById('filterYear')?.value || '';
  const storage=document.getElementById('filterStorage')?.value || '';
  const ram=document.getElementById('filterRam')?.value || '';
  const supply=document.getElementById('filterSupply')?.value || '';
  const sort=document.getElementById('filterPrice').value;
  let rows=all.filter(p=>{const t=p.name+' '+(p.meta||'');return (!year||String(p.year||'')===year||(!p.year&&t.includes(year)))&&(!storage||productStorages(p).includes(storage))&&(!ram||productRams(p).includes(ram))&&(!supply||productSupplyType(p)===supply);});
  if(sort)rows.sort((a,b)=>sort==='asc'?a.price-b.price:b.price-a.price);
  box.innerHTML=rows.length?categoryProductGroups(rows,box.dataset.category):'<div class="empty">לא נמצאו מוצרים לפי הסינון</div>';
}


