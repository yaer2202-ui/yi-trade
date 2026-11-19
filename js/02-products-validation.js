/* ---------- וריאנטים: צבע / זיכרון (נפח אחסון) / RAM / מחיר / מק"ט ---------- */
/* צבעים מוכנים לבחירה מהירה בניהול. אפשר גם לבחור כל צבע אחר בבורר הצבעים. */
const COLOR_PRESETS = {
  'לבן': '#f4f4f1', 'שחור': '#1b1b1f', 'אפור': '#6d7078', 'כסוף': '#cfd3da', 'כסף': '#cfd3da', 'טיטניום': '#8a8780',
  'זהב': '#d9b878', 'צהוב': '#f7d23e', 'כתום': '#e8793a', 'אדום': '#d6283a', 'ורוד': '#f4a6c0', 'סגול': '#9b7bd8',
  'כחול': '#2b5bd7', 'תכלת': '#9fd0f5', 'ירוק': '#4f8a6b', 'חום': '#7a5a3c'
};
const UNKNOWN_HEX = '#9aa4b2';
const DEFAULT_COLOR = 'שחור';
function normMem(value) {
  const s = String(value ?? '').trim();
  if (!s || s === '-') return '';
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(GB|TB|MB)?$/i);
  return m ? m[1] + (m[2] || 'GB').toUpperCase() : s.slice(0, 12);
}
function memBytes(value) {
  const m = String(value || '').match(/^(\d+(?:\.\d+)?)(GB|TB|MB)/i);
  if (!m) return 0;
  const unit = m[2].toUpperCase();
  return Number(m[1]) * (unit === 'TB' ? 1024 : unit === 'MB' ? 1 / 1024 : 1);
}
/* קטלוג ברירת המחדל נטען מ-catalog-data.js (נוצר מהמחירון). הקובץ הוא רק נקודת פתיחה:
   כל עריכה, הוספה ומחיקה נעשית בפאנל הניהול ונשמרת בנפרד. */
const BUILTIN_PRODUCTS = (Array.isArray(window.CATALOG_DATA) ? window.CATALOG_DATA : []).map(p => ({ ...p }));

/* ---------- ולידציה של נתוני מוצרים ---------- */
const SAFE_IMAGE_RE = /^(https:\/\/amfbfqapsakxfbcvuvdb\.supabase\.co\/storage\/v1\/object\/public\/product-images\/|images\/|data:image\/(?:jpeg|png|webp|gif);base64,)/i;
function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
/* וריאנט = שילוב אחד של צבע / זיכרון / RAM עם מחיר ומק"ט משלו */
function sanitizeVariants(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  list.slice(0, 300).forEach((v, i) => {
    if (!isPlainObject(v)) return;
    const price = Number(v.price);
    if (!Number.isFinite(price) || price <= 0) return;
    let id = String(v.id || '').replace(/[^\w-]/g, '').slice(0, 40) || ('v' + i);
    while (seen.has(id)) id += 'x';
    seen.add(id);
    const color = String(v.color || '').trim().slice(0, 30);
    const hex = /^#[0-9a-f]{6}$/i.test(String(v.hex || '')) ? String(v.hex).toLowerCase() : (color ? (COLOR_PRESETS[color] || UNKNOWN_HEX) : '');
    out.push({ id, sku: String(v.sku || '').trim().slice(0, 60), color, hex, storage: normMem(v.storage), ram: normMem(v.ram), price });
  });
  return out;
}
function sanitizeProduct(p) {
  if (!isPlainObject(p)) return null;
  const out = { ...p };
  if ('name' in p) { if (typeof p.name !== 'string' || !p.name.trim()) return null; out.name = p.name.trim(); }
  if ('price' in p) { const n = Number(p.price); if (!Number.isFinite(n) || n <= 0) return null; out.price = n; }
  if ('cat' in p && !CATEGORIES.some(c => c.id === p.cat)) return null;
  out.meta = typeof p.meta === 'string' ? p.meta : '';
  out.desc = typeof p.desc === 'string' ? p.desc : '';
  out.inStock = p.inStock !== false;
  out.freeShipping = p.freeShipping === true;
  out.image = typeof p.image === 'string' && SAFE_IMAGE_RE.test(p.image) ? p.image : '';
  out.year = Number.isFinite(Number(p.year)) && Number(p.year) > 0 ? Number(p.year) : null;
  out.colors = Array.isArray(p.colors) ? p.colors.filter(c => typeof c === 'string' && Object.prototype.hasOwnProperty.call(C, c)) : [];
  out.storage = Array.isArray(p.storage) ? p.storage.map(Number).filter(n => Number.isFinite(n) && n > 0) : [];
  out.galleryImages = Array.isArray(p.galleryImages) ? p.galleryImages.filter(x => typeof x === 'string' && SAFE_IMAGE_RE.test(x)).slice(0, 6) : [];
  out.specs = isPlainObject(p.specs) ? Object.fromEntries(Object.entries(p.specs).map(([k, v]) => [String(k), String(v ?? '')])) : {};
  if ('supply' in p) {
    const ALLOWED_SUPPLY = ['יבואן רשמי', 'יבואן מקביל', 'כשר', 'מחודש', 'מכשיר שהופעל'];
    out.supply = typeof p.supply === 'string' && ALLOWED_SUPPLY.includes(p.supply.trim()) ? p.supply.trim() : '';
  }
  if ('variants' in p) out.variants = sanitizeVariants(p.variants);
  if ('sub' in p) out.sub = typeof p.sub === 'string' && SUB_ID_RE.test(p.sub) ? p.sub : '';
  out.detailImages = Array.isArray(p.detailImages) ? p.detailImages.filter(x => typeof x === 'string' && SAFE_IMAGE_RE.test(x)).slice(0, 3) : [];
  if ('storagePrices' in p) {
    out.storagePrices = isPlainObject(p.storagePrices)
      ? Object.fromEntries(Object.entries(p.storagePrices).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)]))
      : undefined;
  }
  if ('images' in p) {
    out.images = isPlainObject(p.images)
      ? Object.fromEntries(Object.entries(p.images).map(([key, value]) => {
        const images = Array.isArray(value)
          ? value.filter(src => typeof src === 'string' && SAFE_IMAGE_RE.test(src)).slice(0, 3)
          : (typeof value === 'string' && SAFE_IMAGE_RE.test(value) ? [value] : []);
        return [key, images];
      }).filter(([, images]) => images.length))
      : undefined;
  }
  return out;
}
function sanitizeUserProducts(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(sanitizeProduct).filter(p => p && typeof p.id === 'string' && p.id.startsWith('custom-') &&
    typeof p.name === 'string' && p.name && Number.isFinite(p.price) && p.price > 0 && CATEGORIES.some(c => c.id === p.cat));
}
function sanitizeOverrides(obj) {
  if (!isPlainObject(obj)) return {};
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (key === '__siteInfo' && isPlainObject(value)) {
      out[key] = Object.fromEntries(['legalName','businessId','email','phone','whatsapp','address','hours','about'].map(k => [k, typeof value[k] === 'string' ? value[k].slice(0, k === 'about' ? 3000 : 200) : '']));
      out[key].accessibilityCoordinator = isPlainObject(value.accessibilityCoordinator)
        ? Object.fromEntries(['name','phone','email'].map(k => [k, typeof value.accessibilityCoordinator[k] === 'string' ? value.accessibilityCoordinator[k].slice(0, 160) : '']))
        : { name: '', phone: '', email: '' };
      continue;
    }
    const clean = sanitizeProduct(value);
    if (clean) { clean.id = key; out[key] = clean; }
  }
  return out;
}

const USER_PRODUCTS_KEY = 'yi_user_products_v1';
const PRODUCT_OVERRIDES_KEY = 'yi_product_overrides_v1';
const HIDDEN_PRODUCTS_KEY = 'yi_hidden_products_v1';
function readUserProducts() {
  return sanitizeUserProducts(readLocalJSON(USER_PRODUCTS_KEY, []));
}
let userProducts = readUserProducts();
let productOverrides = sanitizeOverrides(readLocalJSON(PRODUCT_OVERRIDES_KEY, {}));
const _hiddenRaw = readLocalJSON(HIDDEN_PRODUCTS_KEY, []);
let hiddenProductIds = new Set((Array.isArray(_hiddenRaw) ? _hiddenRaw : []).filter(id => typeof id === 'string'));
