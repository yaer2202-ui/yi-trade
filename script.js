/* =========================================================
   Y.I Trade & Marketing – SPA
   הקטלוג והמחירים מבוססים על מחירון המלאי שסופק.
   לתמונה אמיתית: הוסף לכל מוצר (או לכל צבע) שדה  image: "images/xxx.jpg"
   אם אין שדה image – נוצרת איור SVG נקי אוטומטית לפי סוג המוצר והצבע.
   ========================================================= */

/* ---------- קטלוג לפי מחירון מלאי שסופק ---------- */
const DEFAULT_CATEGORIES = [
  { id: 'samsung', name: 'Samsung', title: 'סדרת מכשירי SAMSUNG', sub: 'יבואן רשמי ויבואן מקביל', kind: 'phone', color: '#1428a0' },
  { id: 'apple', name: 'Apple', title: 'סדרת מכשירי APPLE', sub: 'מכשירי iPhone חדשים ומחודשים', kind: 'phone', color: '#4b4b52' },
  { id: 'xiaomi', name: 'Xiaomi', title: 'סדרת מכשירי XIAOMI', sub: 'טלפונים וטכנולוגיה', kind: 'phone', color: '#ff6900' },
  { id: 'tablets', name: 'טאבלטים', title: 'טאבלטים', sub: 'טאבלטים', kind: 'tablet', color: '#2a6df4' },
  { id: 'kosher', name: 'כשרים', title: 'מכשירים כשרים ותומכים', sub: 'Nokia ומכשירים כשרים', kind: 'phone', color: '#2a6df4' },
  { id: 'extras', name: 'אביזרים', title: 'אוזניות, רמקולים ושעונים', sub: 'אוזניות · רמקולים · שעונים · מטענים וכבלים', kind: 'accessory', color: '#1e6bff' }
];
const CATEGORY_KEY = 'yi_categories_v1';
const THEME_KEY = 'yi_theme_v1';
/* ולידציה קשיחה לקטגוריות (גם מקומיות וגם מהענן) – מונעת הזרקת HTML/כתובות לא בטוחות */
const CAT_IMAGE_RE = /^(https:\/\/amfbfqapsakxfbcvuvdb\.supabase\.co\/storage\/v1\/object\/public\/product-images\/|images\/|data:image\/(?:jpeg|png|webp|gif);base64,)/i;
const CAT_ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/i;
function sanitizeCategories(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(c => c && typeof c === 'object' && !Array.isArray(c)).map(c => {
    const id = String(c.id || '');
    if (!CAT_ID_RE.test(id) || seen.has(id)) return null;
    const name = String(c.name || '').trim().slice(0, 50);
    const title = String(c.title || '').trim().slice(0, 80);
    if (!name || !title) return null;
    seen.add(id);
    return {
      id, name, title,
      sub: String(c.sub || '').slice(0, 180),
      kind: ['phone', 'tablet', 'accessory', 'watch'].includes(c.kind) ? c.kind : 'accessory',
      color: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : '#1e6bff',
      image: typeof c.image === 'string' && CAT_IMAGE_RE.test(c.image) ? c.image : ''
    };
  }).filter(Boolean);
}
let CATEGORIES = (() => {
  const saved = sanitizeCategories(readLocalJSON(CATEGORY_KEY, null));
  return saved.length ? saved : DEFAULT_CATEGORIES.map(c => ({...c}));
})();
const THEME_PALETTES = { כחול:{main:'#0b3d91',accent:'#1e6bff',light:'#5aa2ff'}, ירוק:{main:'#14532d',accent:'#16a34a',light:'#86efac'}, סגול:{main:'#4c1d95',accent:'#7c3aed',light:'#c4b5fd'}, אדום:{main:'#7f1d1d',accent:'#dc2626',light:'#fca5a5'}, כתום:{main:'#7c2d12',accent:'#ea580c',light:'#fdba74'}, שחור:{main:'#111827',accent:'#374151',light:'#9ca3af'}, טורקיז:{main:'#134e4a',accent:'#0d9488',light:'#5eead4'} };
function applyTheme(name) { const p=THEME_PALETTES[name]||THEME_PALETTES['כחול']; document.documentElement.style.setProperty('--blue-1',p.main);document.documentElement.style.setProperty('--blue-2',p.accent);document.documentElement.style.setProperty('--blue-3',p.light);document.body?.style.setProperty('--page-bg',p.main); }
const C = {
  black:  { name: 'שחור',   hex: '#1b1b1f' },
  silver: { name: 'כסף',    hex: '#cfd3da' },
  white:  { name: 'לבן',    hex: '#f4f4f1' },
  blue:   { name: 'כחול',   hex: '#2f5fd0' },
  violet: { name: 'סגול',   hex: '#9b7bd8' },
  titan:  { name: 'טיטניום', hex: '#8a8780' },
  orange: { name: 'כתום',   hex: '#e8793a' },
  green:  { name: 'ירוק',   hex: '#4f8a6b' },
  gray:   { name: 'אפור',   hex: '#6d7078' }
};

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
  out.image = typeof p.image === 'string' && SAFE_IMAGE_RE.test(p.image) ? p.image : '';
  out.year = Number.isFinite(Number(p.year)) && Number(p.year) > 0 ? Number(p.year) : null;
  out.colors = Array.isArray(p.colors) ? p.colors.filter(c => typeof c === 'string' && Object.prototype.hasOwnProperty.call(C, c)) : [];
  out.storage = Array.isArray(p.storage) ? p.storage.map(Number).filter(n => Number.isFinite(n) && n > 0) : [];
  out.galleryImages = Array.isArray(p.galleryImages) ? p.galleryImages.filter(x => typeof x === 'string' && SAFE_IMAGE_RE.test(x)).slice(0, 6) : [];
  out.specs = isPlainObject(p.specs) ? Object.fromEntries(Object.entries(p.specs).map(([k, v]) => [String(k), String(v ?? '')])) : {};
  if ('supply' in p) out.supply = typeof p.supply === 'string' ? p.supply.trim().slice(0, 30) : '';
  if ('variants' in p) out.variants = sanitizeVariants(p.variants);
  out.detailImages = Array.isArray(p.detailImages) ? p.detailImages.filter(x => typeof x === 'string' && SAFE_IMAGE_RE.test(x)).slice(0, 3) : [];
  if ('storagePrices' in p) {
    out.storagePrices = isPlainObject(p.storagePrices)
      ? Object.fromEntries(Object.entries(p.storagePrices).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)]))
      : undefined;
  }
  if ('images' in p) {
    out.images = isPlainObject(p.images)
      ? Object.fromEntries(Object.entries(p.images).filter(([, v]) => typeof v === 'string' && SAFE_IMAGE_RE.test(v)))
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
    const clean = sanitizeProduct(value);
    if (clean) { clean.id = key; out[key] = clean; }
  }
  return out;
}

const USER_PRODUCTS_KEY = 'yi_user_products_v1';
const PRODUCT_OVERRIDES_KEY = 'yi_product_overrides_v1';
const HIDDEN_PRODUCTS_KEY = 'yi_hidden_products_v1';
function readLocalJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function readUserProducts() {
  return sanitizeUserProducts(readLocalJSON(USER_PRODUCTS_KEY, []));
}
let userProducts = readUserProducts();
let productOverrides = sanitizeOverrides(readLocalJSON(PRODUCT_OVERRIDES_KEY, {}));
const _hiddenRaw = readLocalJSON(HIDDEN_PRODUCTS_KEY, []);
let hiddenProductIds = new Set((Array.isArray(_hiddenRaw) ? _hiddenRaw : []).filter(id => typeof id === 'string'));
/* ----- עזרי וריאנטים (משותפים לכרטיסים, דף מוצר, עגלה וניהול) ----- */
const VARIANT_DIMS = [
  { k: 'color', label: 'צבע' },
  { k: 'storage', label: 'זיכרון' },
  { k: 'ram', label: 'RAM' }
];
function guessStorage(p) {
  const t = (p.name || '') + ' ' + (p.meta || '');
  const slash = t.match(/\/\s*(\d+\s*(?:GB|TB))/i);
  if (slash) return normMem(slash[1].replace(/\s+/g, ''));
  const ram = guessRam(p);
  const all = [...t.matchAll(/(\d+\s*(?:GB|TB))/gi)].map(m => normMem(m[1].replace(/\s+/g, ''))).filter(x => x !== ram);
  return all[0] || '';
}
function guessRam(p) {
  const m = ((p.name || '') + ' ' + (p.meta || '')).match(/(\d+\s*GB)\s*RAM/i);
  return m ? normMem(m[1].replace(/\s+/g, '')) : '';
}
/* מבטיח שלכל מוצר יש וריאנטים. מוצרים ישנים (צבעים/נפחים בשדות הישנים) מומרים אוטומטית. */
function ensureVariants(p) {
  let vs = Array.isArray(p.variants) ? p.variants.filter(v => v && Number(v.price) > 0) : [];
  if (!vs.length) {
    const colors = (p.colors || []).filter(k => C[k]);
    const storages = (p.storage || []).filter(n => n > 0);
    const base = Number(p.price) || 0;
    if (colors.length || storages.length) {
      const cs = colors.length ? colors : [''];
      const ss = storages.length ? storages : [0];
      vs = [];
      cs.forEach(ck => ss.forEach(sn => vs.push({
        id: `${ck || 'x'}-${sn || 'x'}`, sku: '', color: ck ? C[ck].name : '', hex: ck ? C[ck].hex : '',
        storage: sn ? normMem(sn >= 1024 ? (sn / 1024) + 'TB' : sn + 'GB') : '', ram: guessRam(p),
        price: (sn && p.storagePrices && p.storagePrices[sn]) || base
      })));
    } else {
      vs = [{ id: 'v0', sku: '', color: '', hex: '', storage: guessStorage(p), ram: guessRam(p), price: base }];
    }
  }
  // מוצר שאין לו אף צבע מקבל צבע ברירת מחדל (שחור), כך שתמיד יש כפתור צבע. אפשר לשנות בניהול.
  if (!vs.some(v => v.color)) vs = vs.map(v => ({ ...v, color: DEFAULT_COLOR, hex: COLOR_PRESETS[DEFAULT_COLOR] }));
  return { ...p, variants: vs, price: Math.min(...vs.map(v => Number(v.price))) };
}
const findVariant = (p, vid) => (p && p.variants ? p.variants.find(v => v.id === vid) : null) || null;
function defaultVariant(p) {
  return p.variants.reduce((best, v) => (!best || v.price < best.price ? v : best), null);
}
function variantLabel(v) {
  return v ? [v.color, v.storage, v.ram ? v.ram + ' RAM' : ''].filter(Boolean).join(' · ') : '';
}
function dimValues(p, k) {
  const seen = [];
  p.variants.forEach(v => { if (v[k] && !seen.includes(v[k])) seen.push(v[k]); });
  return k === 'color' ? seen : seen.sort((a, b) => memBytes(a) - memBytes(b));
}
const productStorages = p => dimValues(p, 'storage');
const productRams = p => dimValues(p, 'ram');
/* בחירת ערך באחד המימדים: מוצאים את הוריאנט הקרוב ביותר לבחירה הנוכחית שקיים במלאי */
function pickVariant(p, cur, k, val) {
  const cands = p.variants.filter(v => v[k] === val);
  if (!cands.length) return cur;
  const others = VARIANT_DIMS.map(d => d.k).filter(x => x !== k);
  let best = null, score = -1;
  cands.forEach(v => {
    const sc = others.reduce((n, x) => n + (v[x] === cur[x] ? 1 : 0), 0);
    if (sc > score || (sc === score && v.price < best.price)) { best = v; score = sc; }
  });
  return best;
}
function hasDuplicateVariantCombos(vs) {
  const seen = new Set();
  return vs.some(v => { const key = [v.color, v.storage, v.ram].join('|'); if (seen.has(key)) return true; seen.add(key); return false; });
}
function isHiddenBuiltin(g) {
  if (hiddenProductIds.has(g.id)) return true;
  return Array.isArray(g.legacyIds) && g.legacyIds.length > 0 && g.legacyIds.every(id => hiddenProductIds.has(id));
}
function applyBuiltinOverride(g) {
  const direct = productOverrides[g.id];
  if (direct) return { ...g, ...direct };
  // תמונות/תיאור שהוזנו בעבר למוצרים הבודדים שהתקבצו לכרטיסיה אחת
  const legacy = (g.legacyIds || []).map(id => productOverrides[id]).find(Boolean);
  if (legacy) {
    const keep = {};
    ['galleryImages', 'image', 'images', 'desc', 'year'].forEach(k => { if (legacy[k] && (!Array.isArray(legacy[k]) || legacy[k].length)) keep[k] = legacy[k]; });
    return { ...g, ...keep };
  }
  return g;
}
function buildProductList() {
  return [
    ...BUILTIN_PRODUCTS.filter(g => !isHiddenBuiltin(g)).map(applyBuiltinOverride),
    ...userProducts
  ].map(ensureVariants);
}
function cartItemOk(i) {
  const p = PRODUCTS.find(x => x.id === i.pid);
  return !!p && (!i.vid || !!findVariant(p, i.vid));
}
let PRODUCTS = buildProductList();
function persistCatalog() {
  let localSaved = true;
  try {
    localStorage.setItem(USER_PRODUCTS_KEY, JSON.stringify(userProducts));
    localStorage.setItem(PRODUCT_OVERRIDES_KEY, JSON.stringify(productOverrides));
    localStorage.setItem(HIDDEN_PRODUCTS_KEY, JSON.stringify([...hiddenProductIds]));
  } catch {
    localSaved = false;
  }
  PRODUCTS = buildProductList();
  cart = cart.filter(cartItemOk);
  saveCart();
  renderCart();
  const cloudSave = shopAdminAuthenticated ? queueCloudSave({
    revision: ++catalogRevision,
    userProducts: JSON.parse(JSON.stringify(userProducts)),
    productOverrides: JSON.parse(JSON.stringify(productOverrides)),
    hiddenProductIds: [...hiddenProductIds]
  }) : Promise.resolve(true);
  if (!localSaved && !shopAdminAuthenticated) toast('הדפדפן לא מאפשר שמירה במכשיר הזה. השינוי יישמר רק במהלך הגלישה הנוכחית.');
  return cloudSave;
}

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

function adminPriceRange(p) {
  const prices = p.variants.map(v => v.price);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? fmt(lo) : fmt(lo) + '–' + fmt(hi);
}
function renderAdminList() {
  const list = document.getElementById('adminProductsList');
  if (!list) return;
  const query = (document.getElementById('adminSearch')?.value || '').trim().toLowerCase();
  const rows = PRODUCTS.filter(p => `${p.name} ${p.meta || ''} ${CATEGORIES.find(c => c.id === p.cat)?.name || ''} ${p.variants.map(v => [v.sku, v.color, v.storage, v.ram].join(' ')).join(' ')}`.toLowerCase().includes(query));
  list.innerHTML = rows.length ? rows.map(p => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;background:#0f172a;padding:10px;border-radius:8px;color:#fff">
    <div style="min-width:0"><b>${escapeHTML(p.name)}</b><div style="font-size:12px;color:#94a3b8">${escapeHTML(CATEGORIES.find(c => c.id === p.cat)?.name || '')} · ${escapeHTML(productSupplyType(p) || p.meta || '')} · ${p.variants.length} וריאנטים · ${adminPriceRange(p)}</div></div>
    <div style="display:flex;gap:6px;flex-shrink:0"><button type="button" data-admin-edit="${escapeHTML(p.id)}" style="padding:6px 9px;border:0;border-radius:6px;cursor:pointer">עריכה</button><button type="button" data-admin-delete="${escapeHTML(p.id)}" style="padding:6px 9px;border:0;border-radius:6px;cursor:pointer">מחיקה</button></div>
  </div>`).join('') : '<div style="padding:18px;text-align:center;color:#cbd5e1">לא נמצאו מוצרים</div>';
  list.onclick = event => {
    const edit = event.target.closest('[data-admin-edit]');
    const remove = event.target.closest('[data-admin-delete]');
    if (edit) editProductInAdmin(edit.dataset.adminEdit);
    if (remove) deleteProductFromAdmin(remove.dataset.adminDelete);
  };
}


let shopAdminAuthenticated=false;
let adminOpenTrigger=null;
let adminExistingImages=[];
let adminNewImagePreviews=[];
function dataUrlToBlob(dataUrl){
  const m=/^data:([^;,]+)(;base64)?,(.*)$/s.exec(String(dataUrl||''));
  if(!m)throw new Error('פורמט תמונה לא תקין');
  const bin=m[2]?atob(m[3]):decodeURIComponent(m[3]);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new Blob([bytes],{type:m[1]});
}
async function uploadProductImage(dataUrl,productId,index){
  if(!window.shopSupabase||!shopAdminAuthenticated)throw new Error('צריך להתחבר לניהול לפני העלאת תמונות');
  // המרה ישירה ל-Blob בלי fetch: ה-CSP (connect-src) חוסם fetch לכתובות data:
  const blob=dataUrlToBlob(dataUrl);
  const path=`${productId}/${Date.now()}-${index}-${Math.random().toString(36).slice(2,7)}.jpg`;
  const {error}=await window.shopSupabase.storage.from('product-images').upload(path,blob,{contentType:'image/jpeg',upsert:false});
  if(error)throw new Error('העלאת התמונה נכשלה: '+error.message);
  return window.shopSupabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
async function cloudifyImages(product){
  if(!product||!Array.isArray(product.galleryImages))return product;
  const galleryImages=await Promise.all(product.galleryImages.map((src,i)=>src.startsWith('data:image/')?uploadProductImage(src,product.id,i):src));
  let images=product.images;
  if(isPlainObject(images)){
    const entries=await Promise.all(Object.entries(images).map(async([k,src],i)=>[k,src.startsWith('data:image/')?await uploadProductImage(src,product.id,'c'+i):src]));
    images=Object.fromEntries(entries);
  }
  return {...product,galleryImages,images};
}
let cloudSaveChain = Promise.resolve(true);
let catalogRevision = 0;
function queueCloudSave(snapshot) {
  cloudSaveChain = cloudSaveChain.then(() => saveCloudCatalog(snapshot)).catch(error => {
    console.error('Cloud catalog save failed', error);
    toast('לא הצלחתי לשמור את הקטלוג בענן. בדקי חיבור ונסי שוב.');
    return false;
  });
  return cloudSaveChain;
}
function storagePathFromUrl(url) {
  const m = String(url || '').match(/\/storage\/v1\/object\/public\/product-images\/(.+?)(?:\?|$)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return null; }
}
async function removeCloudImages(urls) {
  if (!window.shopSupabase || !shopAdminAuthenticated) return;
  const paths = (urls || []).map(storagePathFromUrl).filter(Boolean);
  if (!paths.length) return;
  try { await window.shopSupabase.storage.from('product-images').remove(paths); }
  catch (error) { console.warn('Image cleanup failed', error && error.message); }
}
async function saveCloudCatalog(snapshot){
  if(!window.shopSupabase||!shopAdminAuthenticated)return false;
  if(!snapshot)return false;
  let savedUserProducts, savedOverrides;
  try {
    savedUserProducts = await Promise.all(snapshot.userProducts.map(cloudifyImages));
    savedOverrides = {};
    for (const [key, product] of Object.entries(snapshot.productOverrides)) savedOverrides[key] = await cloudifyImages(product);
  } catch(error) { toast(error.message||'העלאת תמונות לענן נכשלה'); return false; }
  const row={id:'main',user_products:savedUserProducts,product_overrides:savedOverrides,hidden_product_ids:snapshot.hiddenProductIds,updated_at:new Date().toISOString()};
  try {
    const {error}=await window.shopSupabase.from('shop_catalog').upsert(row);
    if(error){toast('העדכון נשמר במחשב אך לא בענן: '+error.message);return false;}
  } catch (error) {
    toast('העדכון נשמר במחשב אך לא בענן. בדקי חיבור ונסי שוב.');
    console.warn('Cloud catalog upsert failed', error);
    return false;
  }
  // Apply uploaded image URLs only when this is still the newest catalog revision.
  // A slower upload must never replace edits made while it was in flight.
  if (snapshot.revision === catalogRevision) {
    userProducts = savedUserProducts;
    productOverrides = savedOverrides;
    try {
      localStorage.setItem(USER_PRODUCTS_KEY, JSON.stringify(userProducts));
      localStorage.setItem(PRODUCT_OVERRIDES_KEY, JSON.stringify(productOverrides));
    } catch { /* Cloud save succeeded; local cache is optional. */ }
    PRODUCTS = buildProductList();
    rerenderCurrent();
  }
  return true;
}

let catalogReady = !window.shopSupabase;
function rerenderCurrent() {
  const [page, arg, arg2] = routeParts();
  const app = document.getElementById('app');
  if (page === 'category') app.innerHTML = viewCategory(arg);
  else if (page === 'product') { app.innerHTML = viewProduct(arg, arg2); bindProduct(arg); }
  else if (page === 'checkout') {
    // לא מוחקים טופס הזמנה שהלקוח באמצע למלא – מרעננים רק את סיכום העגלה
    const summary = document.getElementById('orderSummary');
    if (document.getElementById('orderForm') && summary) summary.innerHTML = orderSummaryInner();
    else { app.innerHTML = viewCheckout(); bindCheckout(); }
  }
  else if (!page) app.innerHTML = viewHome();
  updateTitle();
}
async function fetchCloudCatalog(){
  if(!window.shopSupabase)return;
  const {data,error}=await window.shopSupabase.from('shop_catalog').select('user_products,product_overrides,hidden_product_ids').eq('id','main').maybeSingle();
  if(error){console.warn('Cloud catalog load failed',error.message);return;}
  if(!data)return;
  userProducts=sanitizeUserProducts(data.user_products);
  productOverrides=sanitizeOverrides(data.product_overrides);
  const remoteCategories=sanitizeCategories(productOverrides.__categoryConfig?.categories);
  if(remoteCategories.length){CATEGORIES=remoteCategories;try{localStorage.setItem(CATEGORY_KEY,JSON.stringify(CATEGORIES))}catch{}}
  hiddenProductIds=new Set(Array.isArray(data.hidden_product_ids)?data.hidden_product_ids.filter(id=>typeof id==='string'):[]);
  try{localStorage.setItem(USER_PRODUCTS_KEY,JSON.stringify(userProducts));localStorage.setItem(PRODUCT_OVERRIDES_KEY,JSON.stringify(productOverrides));localStorage.setItem(HIDDEN_PRODUCTS_KEY,JSON.stringify([...hiddenProductIds]));}catch{}
  PRODUCTS=buildProductList();cart=cart.filter(cartItemOk);saveCart();renderCart();
}
async function loadCloudCatalog(){
  try { await fetchCloudCatalog(); }
  catch (error) { console.warn('Cloud catalog load failed', error && error.message); }
  finally { catalogReady = true; rerenderCurrent(); }
}
async function updateAdminGate(){
  const {data}=await window.shopSupabase.auth.getSession();shopAdminAuthenticated=!!data.session;
  document.getElementById('adminLoginBox').style.display=shopAdminAuthenticated?'none':'block';
  document.getElementById('adminManagementArea').style.display=shopAdminAuthenticated?'block':'none';
  if(shopAdminAuthenticated)renderAdminList();
}
async function handleAdminLogin(event){
  event.preventDefault();const box=document.getElementById('adminLoginError');box.textContent='';
  if(!window.shopSupabase){box.textContent='החיבור לענן לא זמין כרגע. נסי לרענן את הדף.';return;}
  const email=document.getElementById('adminLoginEmail').value.trim(),password=document.getElementById('adminLoginPassword').value;
  const {data,error}=await window.shopSupabase.auth.signInWithPassword({email,password});
  if(error){box.textContent='פרטי הכניסה לא אושרו. בדקי את האימייל והסיסמה.';return;}
  const localSnapshot={userProducts:JSON.parse(JSON.stringify(userProducts)),productOverrides:JSON.parse(JSON.stringify(productOverrides)),hiddenProductIds:[...hiddenProductIds]};
  shopAdminAuthenticated=true;await loadCloudCatalog();
  const {data:remote}=await window.shopSupabase.from('shop_catalog').select('user_products,product_overrides,hidden_product_ids').eq('id','main').maybeSingle();
  const cloudHasData=remote&&(remote.user_products?.length||Object.keys(remote.product_overrides||{}).length||remote.hidden_product_ids?.length);
  const localHasData=localSnapshot.userProducts.length||Object.keys(localSnapshot.productOverrides).length||localSnapshot.hiddenProductIds.length;
  if(localHasData&&!cloudHasData){userProducts=localSnapshot.userProducts;productOverrides=localSnapshot.productOverrides;hiddenProductIds=new Set(localSnapshot.hiddenProductIds);const snapshot={revision:++catalogRevision,userProducts:JSON.parse(JSON.stringify(userProducts)),productOverrides:JSON.parse(JSON.stringify(productOverrides)),hiddenProductIds:[...hiddenProductIds]};await saveCloudCatalog(snapshot);}
  await updateAdminGate();document.getElementById('adminLoginPassword').value='';toast('נכנסת לניהול');
}
async function adminLogout(){if(!window.shopSupabase)return;await window.shopSupabase.auth.signOut();shopAdminAuthenticated=false;await updateAdminGate();toast('התנתקת מהניהול');}

function toggleAdminPanel() {
  const modal = document.getElementById('adminModal');
  if (!modal) return;
  const open = modal.style.display !== 'flex';
  if (open) adminOpenTrigger = document.activeElement;
  modal.style.display = open ? 'flex' : 'none';
  if (!open) {
    if (location.hash === '#/admin' || location.hash === '#/admin-login') location.hash = '#/';
    if (adminOpenTrigger && typeof adminOpenTrigger.focus === 'function') adminOpenTrigger.focus();
    adminOpenTrigger = null;
  }
  if (open) {
    if(window.shopSupabase){updateAdminGate();}else{document.getElementById('adminLoginBox').style.display='block';document.getElementById('adminManagementArea').style.display='none';}
    const select = document.getElementById('adminPCat');
    if (select) select.innerHTML = CATEGORIES.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join('');
    renderAdminList();
    renderCategoryAdminList();
    refreshAdminBannerPanel();
    const themeSelect=document.getElementById('adminThemeSelect'); if(themeSelect) themeSelect.value=localStorage.getItem(THEME_KEY)||'כחול';
    requestAnimationFrame(() => modal.querySelector('#adminLoginEmail, #adminPName, #adminModalClose')?.focus());
  }
}

/* ---------- עורך וריאנטים בפאנל הניהול ---------- */
let adminEditingProductId = '';
let adminColorImages = {};
function renderAdminColorImages() {
  const box = document.getElementById('adminColorImages'); if (!box) return;
  const rows = readAdminVariantRows();
  const colors = [];
  rows.forEach(r => { if (r.color && !colors.some(c => c.name === r.color)) colors.push({ name: r.color, hex: r.hex }); });
  Object.keys(adminColorImages).forEach(k => { if (!colors.some(c => c.name === k)) delete adminColorImages[k]; });
  box.innerHTML = colors.length ? colors.map(c => {
    const src = adminColorImages[c.name];
    return `<div class="adm-ci" data-color="${escapeHTML(c.name)}"><span class="adm-ci-dot" style="background:${/^#[0-9a-f]{6}$/i.test(c.hex || '') ? c.hex : UNKNOWN_HEX}"></span><b>${escapeHTML(c.name)}</b>
      ${src ? `<img src="${escapeHTML(src)}" alt="תמונת הצבע ${escapeHTML(c.name)}"><button type="button" class="adm-ci-rm" aria-label="הסרת תמונת הצבע ${escapeHTML(c.name)}">הסרה</button>` : '<span class="adm-ci-none">אין תמונה (תוצג התמונה הכללית)</span>'}
      <label class="adm-ci-up">${src ? 'החלפה' : 'העלאת תמונה'}<input type="file" name="colorImage" accept="image/*" class="adm-ci-file" aria-label="תמונה לצבע ${escapeHTML(c.name)}"></label></div>`;
  }).join('') : '<span class="adm-ci-none">הוסיפי צבע בשורת וריאנט כדי להתאים לו תמונה.</span>';
}
const newVariantId = () => 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
function blankAdminVariant(from) {
  return { id: newVariantId(), sku: '', color: from ? from.color : '', hex: from ? from.hex : '', storage: from ? from.storage : '', ram: from ? from.ram : '', price: from ? from.price : '' };
}
function adminVariantRowHTML(v, index) {
  const hex = /^#[0-9a-f]{6}$/i.test(v.hex || '') ? v.hex : '#cccccc';
  const n = index + 1;
  const rid = String(v.id).replace(/[^\w-]/g, "");
  // "מותאם" = גוון שנבחר ידנית ואינו הגוון המוכן של שם הצבע. רק אז לא מחליפים אותו אוטומטית כששם הצבע משתנה
  const custom = v.hexSet !== undefined ? v.hexSet : !!(v.hex && v.hex.toLowerCase() !== String(COLOR_PRESETS[v.color] || '').toLowerCase());
  return `<div class="adm-vrow" data-vid="${escapeHTML(v.id)}" data-hex-set="${custom ? '1' : ''}">
    <div class="adm-vf adm-vf-color"><label for="vrc-${rid}">צבע</label>
      <div class="adm-vcolor"><input type="text" id="vrc-${rid}" name="variantColor-${rid}" class="vr-color" list="adminColorNames" maxlength="30" value="${escapeHTML(v.color)}" placeholder="ללא צבע" aria-label="שם הצבע בשורה ${n}"><label class="sr-only" for="vrh-${rid}">בורר צבע בשורה ${n}</label><input type="color" id="vrh-${rid}" name="variantHex-${rid}" class="vr-hex" value="${hex}" aria-label="בורר צבע בשורה ${n}" title="בחירת גוון חופשי"></div></div>
    <div class="adm-vf"><label for="vrs-${rid}">זיכרון</label><input type="text" id="vrs-${rid}" name="variantStorage-${rid}" class="vr-storage" list="adminStorageList" maxlength="12" value="${escapeHTML(v.storage)}" placeholder="256GB" aria-label="זיכרון (נפח אחסון) בשורה ${n}"></div>
    <div class="adm-vf"><label for="vrr-${rid}">RAM</label><input type="text" id="vrr-${rid}" name="variantRam-${rid}" class="vr-ram" list="adminRamList" maxlength="12" value="${escapeHTML(v.ram)}" placeholder="8GB" aria-label="זיכרון RAM בשורה ${n}"></div>
    <div class="adm-vf adm-vf-sku"><label for="vrk-${rid}">מק״ט</label><input type="text" id="vrk-${rid}" name="variantSku-${rid}" class="vr-sku" dir="ltr" maxlength="60" value="${escapeHTML(v.sku)}" placeholder="חופשי, לדוגמה APP-IP18-256-BLUE" aria-label="מק״ט בשורה ${n}"></div>
    <div class="adm-vf"><label for="vrp-${rid}">מחיר ₪</label><input type="number" id="vrp-${rid}" name="variantPrice-${rid}" class="vr-price" min="1" step="1" value="${v.price === '' ? '' : Number(v.price)}" placeholder="מחיר" aria-label="מחיר בשורה ${n}"></div>
    <div class="adm-vbtns"><button type="button" class="vr-dup" aria-label="שכפול שורה ${n}" title="שכפול (למשל להוספת צבע נוסף)">⧉</button><button type="button" class="vr-del" aria-label="מחיקת שורה ${n}" title="מחיקת הוריאנט">✕</button></div>
  </div>`;
}
function renderAdminVariants(list, productId) {
  adminEditingProductId = productId || '';
  const box = document.getElementById('adminVariantRows');
  if (!box) return;
  box.innerHTML = list.map(adminVariantRowHTML).join('');
  checkAdminSkuDupes();
  renderAdminColorImages();
}
function readAdminVariantRows() {
  return [...document.querySelectorAll('#adminVariantRows .adm-vrow')].map(row => {
    const q = c => row.querySelector(c);
    const color = q('.vr-color').value.trim();
    return {
      id: row.dataset.vid, color, hexSet: row.dataset.hexSet === '1',
      hex: color ? q('.vr-hex').value : '',
      storage: q('.vr-storage').value, ram: q('.vr-ram').value, sku: q('.vr-sku').value.trim(), price: q('.vr-price').value, row
    };
  });
}
function collectAdminVariants() {
  const rows = readAdminVariantRows();
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const empty = !r.color && !r.storage.trim() && !r.ram.trim() && !r.sku && r.price === '';
    if (empty) continue;
    const price = Number(r.price);
    if (!Number.isFinite(price) || price <= 0) return { error: `בשורה ${i + 1} של הוריאנטים חסר מחיר תקין` };
    out.push({ id: r.id, sku: r.sku, color: r.color, hex: r.hex, storage: r.storage, ram: r.ram, price });
  }
  const clean = sanitizeVariants(out);
  if (hasDuplicateVariantCombos(clean)) return { error: 'יש שני וריאנטים עם אותו צבע, זיכרון ו-RAM. שני שילובים זהים לא יכולים להתקיים באותו מוצר.' };
  return { variants: clean };
}
/* אזהרה (לא חוסמת) על מק"ט שמופיע יותר מפעם אחת, בתוך המוצר או במוצר אחר */
function checkAdminSkuDupes() {
  const warn = document.getElementById('adminVariantWarn');
  const rows = readAdminVariantRows();
  const others = new Map();
  PRODUCTS.forEach(p => { if (p.id !== adminEditingProductId) p.variants.forEach(v => { if (v.sku) others.set(v.sku.toLowerCase(), p.name); }); });
  const counts = new Map();
  rows.forEach(r => { if (r.sku) counts.set(r.sku.toLowerCase(), (counts.get(r.sku.toLowerCase()) || 0) + 1); });
  const msgs = [];
  rows.forEach(r => {
    const key = r.sku.toLowerCase();
    const dupHere = key && counts.get(key) > 1;
    const dupElse = key && others.has(key);
    r.row.querySelector('.vr-sku').classList.toggle('dup', !!(dupHere || dupElse));
    if (dupHere) msgs.push(`המק״ט ${r.sku} מופיע יותר מפעם אחת במוצר הזה`);
    else if (dupElse) msgs.push(`המק״ט ${r.sku} כבר קיים גם במוצר: ${others.get(key)}`);
  });
  if (warn) warn.textContent = msgs.length ? '⚠ ' + [...new Set(msgs)].join(' · ') : '';
}
(function bindAdminVariantEditor() {
  const box = document.getElementById('adminVariantRows');
  if (!box) return;
  box.addEventListener('input', e => {
    const row = e.target.closest('.adm-vrow'); if (!row) return;
    if (e.target.classList.contains('vr-color')) {
      const hex = COLOR_PRESETS[e.target.value.trim()];
      if (hex && row.dataset.hexSet !== '1') row.querySelector('.vr-hex').value = hex;
    }
    if (e.target.classList.contains('vr-hex')) row.dataset.hexSet = '1';
    if (e.target.classList.contains('vr-sku')) checkAdminSkuDupes();
  });
  box.addEventListener('change', e => {
    // נפח/RAM: משלימים יחידה (256 -> 256GB) כשעוזבים את השדה
    if (e.target.classList.contains('vr-storage') || e.target.classList.contains('vr-ram')) e.target.value = normMem(e.target.value);
    if (e.target.classList.contains('vr-color')) {
      const row = e.target.closest('.adm-vrow'); const hex = COLOR_PRESETS[e.target.value.trim()];
      if (hex && row.dataset.hexSet !== '1') row.querySelector('.vr-hex').value = hex;
      renderAdminColorImages();
    }
    if (e.target.classList.contains('vr-hex')) renderAdminColorImages();
  });
  box.addEventListener('click', e => {
    const row = e.target.closest('.adm-vrow'); if (!row) return;
    const rows = readAdminVariantRows();
    const idx = [...box.children].indexOf(row);
    if (e.target.closest('.vr-del')) {
      rows.splice(idx, 1);
      renderAdminVariants(rows.length ? rows : [blankAdminVariant()], adminEditingProductId);
    } else if (e.target.closest('.vr-dup')) {
      const src = rows[idx];
      const copy = blankAdminVariant({ color: src.color, hex: src.hex, storage: src.storage, ram: src.ram, price: src.price });
      rows.splice(idx + 1, 0, copy);
      renderAdminVariants(rows, adminEditingProductId);
      box.children[idx + 1]?.querySelector('.vr-color')?.focus();
    }
  });
  document.getElementById('adminAddVariantBtn')?.addEventListener('click', () => {
    const rows = readAdminVariantRows();
    const last = rows[rows.length - 1];
    rows.push(blankAdminVariant(last ? { color: '', hex: '', storage: last.storage, ram: last.ram, price: last.price } : null));
    renderAdminVariants(rows, adminEditingProductId);
    box.lastElementChild?.querySelector('.vr-color')?.focus();
  });
  document.getElementById('adminColorImages')?.addEventListener('change', async e => {
    const input = e.target.closest('.adm-ci-file'); if (!input || !input.files[0]) return;
    const color = input.closest('.adm-ci').dataset.color;
    try { adminColorImages[color] = await compressProductImage(input.files[0]); }
    catch (err) { toast(err.message || 'לא הצלחתי לקרוא את התמונה'); }
    renderAdminColorImages();
  });
  document.getElementById('adminColorImages')?.addEventListener('click', e => {
    if (!e.target.closest('.adm-ci-rm')) return;
    delete adminColorImages[e.target.closest('.adm-ci').dataset.color];
    renderAdminColorImages();
  });
  renderAdminVariants([blankAdminVariant()], '');
})();

function resetAdminForm() {
  const form = document.getElementById('adminAddProductForm');
  if (!form) return;
  form.reset();
  document.getElementById('adminPId').value = '';
  document.getElementById('adminPYear').value = '';
  document.getElementById('adminPDesc').value = '';
  document.getElementById('adminPSpecs').value = '';
  document.getElementById('adminPImages').value = '';
  adminExistingImages = [];
  adminNewImagePreviews.forEach(src => URL.revokeObjectURL(src));
  adminNewImagePreviews = [];
  renderAdminImagePreview();
  const supplySel = document.getElementById('adminPSupply'); if (supplySel) supplySel.value = '';
  adminColorImages = {};
  adminDetailExisting = [];
  adminDetailNewPreviews.forEach(src => URL.revokeObjectURL(src));
  adminDetailNewPreviews = [];
  renderAdminDetailPreview();
  renderAdminVariants([blankAdminVariant()], '');
  const button = form.querySelector('[type="submit"]');
  if (button) button.textContent = 'שמור מוצר';
  const heading = form.querySelector('h4');
  if (heading) heading.textContent = 'הוספה / עריכת מוצר';
}

function editProductInAdmin(id) {
  const p = PRODUCTS.find(item => item.id === id);
  if (!p) return;
  document.getElementById('adminPId').value = p.id;
  document.getElementById('adminPName').value = p.name;
  document.getElementById('adminPPrice').value = p.price;
  document.getElementById('adminPYear').value = p.year || '';
  document.getElementById('adminPCat').value = p.cat;
  document.getElementById('adminPMeta').value = p.meta || '';
  document.getElementById('adminPSupply').value = ['יבואן רשמי','יבואן מקביל','כשר','מחודש','מכשיר שהופעל'].includes(p.supply) ? p.supply : '';
  adminColorImages = { ...(p.images || {}) };
  renderAdminVariants(p.variants.map(v => ({ ...v })), p.id);
  document.getElementById('adminPDesc').value = p.desc || '';
  document.getElementById('adminPSpecs').value = Object.entries(p.specs || {})
    .filter(([key, value]) => !['דגם','פרטים','מחיר','הערה'].includes(key) && publicText(value))
    .map(([key, value]) => `${key}: ${publicText(value)}`).join('\n');
  document.getElementById('adminPImages').value = '';
  adminExistingImages = [...(p.galleryImages?.length ? p.galleryImages : (p.image ? [p.image] : []))];
  adminNewImagePreviews.forEach(src => URL.revokeObjectURL(src));
  adminNewImagePreviews = [];
  renderAdminImagePreview();
  adminDetailExisting = [...(p.detailImages || [])];
  adminDetailNewPreviews.forEach(src => URL.revokeObjectURL(src));
  adminDetailNewPreviews = [];
  const detailInput = document.getElementById('adminPDetailImages'); if (detailInput) detailInput.value = '';
  renderAdminDetailPreview();
  const form = document.getElementById('adminAddProductForm');
  const button = form.querySelector('[type="submit"]');
  if (button) button.textContent = 'שמור שינויים';
  const heading = form.querySelector('h4');
  if (heading) heading.textContent = `עריכת מוצר: ${p.name}`;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveProductFromAdmin(event) {
  event.preventDefault();
  saveProductFromAdminAsync();
}

async function saveProductFromAdminAsync() {
  const id = document.getElementById('adminPId').value;
  const name = document.getElementById('adminPName').value.trim();
  let price = Number(document.getElementById('adminPPrice').value);
  const year = Number(document.getElementById('adminPYear').value) || null;
  const supply = document.getElementById('adminPSupply').value;
  const cat = document.getElementById('adminPCat').value;
  const meta = document.getElementById('adminPMeta').value.trim();
  const desc = document.getElementById('adminPDesc').value.trim();
  const specText = document.getElementById('adminPSpecs').value;
  const uploadedFiles = [...document.getElementById('adminPImages').files].slice(0, Math.max(0, 6 - adminExistingImages.length));
  const collected = collectAdminVariants();
  if (collected.error) return toast(collected.error);
  const variants = collected.variants;
  if (variants.length) price = Math.min(...variants.map(v => v.price));
  if (!name || !Number.isFinite(price) || price <= 0 || !CATEGORIES.some(c => c.id === cat)) {
    return toast('נא למלא שם, קטגוריה, ומחיר (או וריאנט אחד לפחות עם מחיר)');
  }
  const old = id ? PRODUCTS.find(p => p.id === id) : null;
  if (id && !old) return toast('המוצר לא נמצא');
  let uploadedImages = [];
  const itemId = id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    const compressed = await Promise.all(uploadedFiles.map(f => compressProductImage(f)));
    uploadedImages = await Promise.all(compressed.map((src,i) => uploadProductImage(src,itemId,i)));
  } catch (error) { return toast(error.message || 'לא הצלחתי להעלות את התמונות. בדקי שהתחברת לניהול'); }
  const parsedSpecs = Object.fromEntries(specText.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const i = line.indexOf(':'); return i < 0 ? [line, ''] : [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }).filter(([key]) => key));
  const galleryImages = [...adminExistingImages, ...uploadedImages].slice(0, 6);
  let uploadedDetail = [];
  try {
    const detailFiles = [...(document.getElementById('adminPDetailImages')?.files || [])].slice(0, Math.max(0, 3 - adminDetailExisting.length));
    const compressedDetail = await Promise.all(detailFiles.map(f => compressProductImage(f)));
    uploadedDetail = await Promise.all(compressedDetail.map((src, i) => uploadProductImage(src, itemId, 'd' + i)));
  } catch (error) { return toast(error.message || 'לא הצלחתי להעלות את תמונות המפרט. בדקי שהתחברת לניהול'); }
  const detailImages = [...adminDetailExisting, ...uploadedDetail].slice(0, 3);
  const colorNames = new Set(variants.map(v => v.color).filter(Boolean));
  let colorImages = {};
  try {
    for (const [i, [color, src]] of Object.entries(adminColorImages).filter(([c]) => colorNames.has(c)).entries()) {
      colorImages[color] = src.startsWith('data:image/') ? await uploadProductImage(src, itemId, 'c' + i) : src;
    }
  } catch (error) { return toast(error.message || 'לא הצלחתי להעלות את תמונות הצבעים. בדקי שהתחברת לניהול'); }
  const item = {
    ...(old || {}),
    id: itemId,
    cat, name, price, meta, year, supply,
    desc,
    image: '',
    variants, images: Object.keys(colorImages).length ? colorImages : undefined,
    colors: [], storage: [], storagePrices: undefined,
    galleryImages, detailImages,
    specs: { ...parsedSpecs, 'פרטים': meta || '', 'מחיר': '₪' + price.toLocaleString('he-IL') }
  };
  if (!id) userProducts.unshift(item);
  else if (id.startsWith('custom-')) userProducts = userProducts.map(p => p.id === id ? item : p);
  else productOverrides[id] = item;
  const cloudSaved = await persistCatalog();
  if (cloudSaved && old) {
    const removedImages = [...(old.galleryImages || []).filter(u => !galleryImages.includes(u)), ...(old.detailImages || []).filter(u => !detailImages.includes(u)), ...Object.values(old.images || {}).filter(u => !Object.values(colorImages).includes(u))];
    if (removedImages.length) cloudSaveChain.then(ok => { if (ok) removeCloudImages(removedImages); });
  }
  resetAdminForm();
  renderAdminList();
  if (cloudSaved) toast(id ? 'המוצר עודכן' : 'המוצר נוסף לקטלוג');
}

async function deleteProductFromAdmin(id) {
  const p = PRODUCTS.find(item => item.id === id);
  if (!p || !confirm(`להסיר את ${p.name} מהקטלוג?`)) return;
  if (id.startsWith('custom-')) userProducts = userProducts.filter(item => item.id !== id);
  else {
    hiddenProductIds.add(id);
    delete productOverrides[id];
  }
  const cloudSaved = await persistCatalog();
  if (cloudSaved) {
    const deletedImages = [...(p.galleryImages || []), ...(p.detailImages || []), ...Object.values(p.images || {})];
    if (deletedImages.length) cloudSaveChain.then(ok => { if (ok) removeCloudImages(deletedImages); });
  }
  renderAdminList();
  resetAdminForm();
  if (cloudSaved) toast('המוצר הוסר מהקטלוג');
}

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // מגבלת קובץ מקור: 12MB (לפני דחיסה)
const MAX_IMAGE_PIXELS = 50 * 1000 * 1000;  // מגבלת פיקסלים כדי לא לתקוע את הדפדפן
function compressProductImage(file, maxDim) {
  maxDim = Number(maxDim) > 1 ? Number(maxDim) : 1200;
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//i.test(file.type || '')) return reject(new Error('הקובץ שנבחר אינו תמונה'));
    if (file.size > MAX_UPLOAD_BYTES) return reject(new Error('התמונה גדולה מדי (מעל 12MB). נא לבחור תמונה קטנה יותר או לצמצם אותה לפני ההעלאה.'));
    // URL זמני במקום קריאה מלאה ל-Base64: חוסך זיכרון ולא תוקע את הדפדפן בקבצים גדולים
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('לא הצלחתי לקרוא את התמונה. נסי JPG או PNG רגילים (HEIC/WEBP מסוימים לא נתמכים).')); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (!img.width || !img.height || img.width * img.height > MAX_IMAGE_PIXELS) return reject(new Error('הרזולוציה של התמונה גבוהה מדי. נא לצמצם אותה לפני ההעלאה.'));
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      // PNG שקוף היה הופך לשחור ב-JPEG – ממלאים רקע לבן קודם
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}
function renderAdminImagePreview() {
  const box = document.getElementById('adminImagePreview'); if (!box) return;
  const existing = adminExistingImages.map((src,index) => `<div style="position:relative"><img src="${escapeHTML(src)}" alt="תמונה קיימת ${index+1}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;"><button type="button" data-remove-admin-image="${index}" aria-label="הסרת תמונה ${index+1}" style="position:absolute;top:-6px;right:-6px;border:0;border-radius:50%;background:#b91c1c;color:white;width:22px;height:22px;cursor:pointer">×</button></div>`).join('');
  const staged = adminNewImagePreviews.map((src,index) => `<img src="${escapeHTML(src)}" alt="תמונה חדשה ${index+1}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;">`).join('');
  box.innerHTML = existing + staged + (adminExistingImages.length || adminNewImagePreviews.length ? '<small style="width:100%;color:#94a3b8">אפשר להסיר תמונות קיימות לפני השמירה. אפשר להוסיף עד 6 תמונות למוצר.</small>' : '');
}
document.getElementById('adminImagePreview')?.addEventListener('click', event => {
  const button = event.target.closest('[data-remove-admin-image]');
  if (!button) return;
  adminExistingImages.splice(Number(button.dataset.removeAdminImage), 1);
  renderAdminImagePreview();
});
document.getElementById('adminPImages')?.addEventListener('change', event => {
  adminNewImagePreviews.forEach(src => URL.revokeObjectURL(src));
  adminNewImagePreviews = [...event.target.files].slice(0, Math.max(0, 6 - adminExistingImages.length)).map(file => URL.createObjectURL(file));
  renderAdminImagePreview();
});

function downloadCatalogBackup() {
  const backup={format:'yi-trade-catalog-backup',version:1,createdAt:new Date().toISOString(),userProducts,productOverrides,hiddenProductIds:[...hiddenProductIds]};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='yi-catalog-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('קובץ הגיבוי הורד למחשב');
}
async function restoreCatalogBackup(file) {
  if(!file)return;
  try {
    const data=JSON.parse(await file.text());
    if(data.format!=='yi-trade-catalog-backup'||!Array.isArray(data.userProducts)||!data.productOverrides||typeof data.productOverrides!=='object'||!Array.isArray(data.hiddenProductIds)) throw new Error('קובץ הגיבוי אינו מתאים');
    if(!confirm('השחזור יחליף את השינויים המקומיים בקטלוג. להמשיך?'))return;
    userProducts=sanitizeUserProducts(data.userProducts);
    productOverrides=sanitizeOverrides(data.productOverrides);hiddenProductIds=new Set(data.hiddenProductIds.filter(id=>typeof id==='string'));
    const cloudSaved = await persistCatalog();
    renderAdminList();
    if (cloudSaved) toast('הגיבוי שוחזר בהצלחה');
  } catch(error) { alert(error.message==='קובץ הגיבוי אינו מתאים'?'זה לא קובץ גיבוי מתאים של החנות.':'לא הצלחתי לקרוא את הגיבוי.'); }
}


/* ---------- איורי SVG (placeholder נקי) ---------- */
const FALLBACKS = {}; // נתיב תמונה -> איור גיבוי אם הקובץ לא קיים
document.addEventListener('error', e => {
  const i = e.target;
  if (i && i.tagName === 'IMG') {
    const fb = FALLBACKS[i.getAttribute('src')];
    if (fb) { i.src = fb; }
  }
}, true);
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, v + amt));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join('');
}
function art(kind, hex) {
  const dark = shade(hex, -40), light = shade(hex, 35);
  let body = '';
  if (kind === 'phone') {
    body = `<rect x="130" y="30" width="140" height="290" rx="26" fill="${dark}"/>
      <rect x="136" y="36" width="128" height="278" rx="22" fill="url(#g)"/>
      <rect x="146" y="46" width="108" height="258" rx="14" fill="#0e1424"/>
      <rect x="146" y="46" width="108" height="258" rx="14" fill="url(#s)" opacity=".9"/>
      <circle cx="200" cy="62" r="4" fill="#000"/>
      <rect x="226" y="52" width="44" height="52" rx="12" fill="${dark}" opacity=".0"/>`;
  } else if (kind === 'tablet') {
    body = `<rect x="45" y="70" width="310" height="220" rx="22" fill="${dark}"/>
      <rect x="51" y="76" width="298" height="208" rx="18" fill="url(#g)"/>
      <rect x="62" y="87" width="276" height="186" rx="10" fill="#0e1424"/>
      <rect x="62" y="87" width="276" height="186" rx="10" fill="url(#s)" opacity=".9"/>
      <circle cx="200" cy="81" r="2.5" fill="#000"/>`;
  } else if (kind === 'watch') {
    body = `<rect x="162" y="22" width="76" height="105" rx="34" fill="${dark}"/>
      <rect x="162" y="235" width="76" height="110" rx="34" fill="${dark}"/>
      <rect x="112" y="92" width="176" height="176" rx="48" fill="${dark}"/>
      <rect x="122" y="102" width="156" height="156" rx="40" fill="url(#g)"/>
      <circle cx="200" cy="180" r="48" fill="#0e1424" stroke="${light}" stroke-width="4"/>
      <path d="M200 145 V180 L224 198" fill="none" stroke="${light}" stroke-width="5" stroke-linecap="round"/>`;
  } else if (kind === 'accessory') {
    body = `<rect x="128" y="95" width="144" height="175" rx="30" fill="url(#g)" stroke="${dark}" stroke-width="5"/>
      <rect x="164" y="50" width="18" height="48" rx="5" fill="${dark}"/>
      <rect x="218" y="50" width="18" height="48" rx="5" fill="${dark}"/>
      <circle cx="200" cy="210" r="9" fill="#0e1424"/>
      <path d="M200 270 C200 310 270 300 270 340" fill="none" stroke="${dark}" stroke-width="12" stroke-linecap="round"/>`;
  } else {
    body = `<rect x="110" y="150" width="180" height="150" rx="40" fill="url(#g)" stroke="${dark}" stroke-width="3"/>
      <path d="M110 205 H290" stroke="${dark}" stroke-width="3"/>
      <ellipse cx="150" cy="110" rx="20" ry="34" fill="url(#g)" stroke="${dark}" stroke-width="3" transform="rotate(-12 150 110)"/>
      <ellipse cx="250" cy="110" rx="20" ry="34" fill="url(#g)" stroke="${dark}" stroke-width="3" transform="rotate(12 250 110)"/>
      <circle cx="200" cy="262" r="7" fill="${dark}" opacity=".6"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -25 600 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${hex}"/></linearGradient>
      <linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5aa2ff"/><stop offset=".55" stop-color="#7c3aed"/><stop offset="1" stop-color="#0b3d91"/></linearGradient>
      <linearGradient id="bgc" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#05070d"/><stop offset="1" stop-color="#1b4fc4"/></linearGradient>
    </defs><rect x="-100" y="-25" width="600" height="400" fill="url(#bgc)"/>${body}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
function productPlaceholder() {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3f7ff"/><stop offset="1" stop-color="#e5ecf8"/></linearGradient></defs><rect width="600" height="400" rx="28" fill="url(#bg)"/><rect x="235" y="88" width="130" height="160" rx="22" fill="none" stroke="#98a9c4" stroke-width="10"/><path d="M260 278h80" stroke="#98a9c4" stroke-width="10" stroke-linecap="round"/><text x="300" y="335" text-anchor="middle" fill="#53657e" font-family="Arial,sans-serif" font-size="28" font-weight="700">תמונה בקרוב</text></svg>`;
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
function productImage(p, colorKey) {
  const fb = productPlaceholder();
  // סדר עדיפויות: תמונה לפי צבע -> תמונה כללית -> images/<id>.jpg
  const src = (p.images && colorKey && p.images[colorKey]) || (p.galleryImages && p.galleryImages[0]) || p.image;
  if (src) { FALLBACKS[src] = fb; return src; }
  return fb;
}
/* תמונות בלוקי דף הבית – הדבק כאן קישורי תמונה (URL או נתיב מקומי) */
const CATEGORY_IMAGES = {
  kosher: 'images/kosher-phone.jpg',
  samsung: 'images/samsung.jpg',
  apple: 'images/apple-category.jpg',
  xiaomi: 'images/xiaomi.jpg',
  tablets: 'images/tablets.jpg',
  extras: 'images/extras-category.svg'
};
const HOME_BRANDS = {
  samsung: 'SAMSUNG', apple: 'APPLE', xiaomi: 'XIAOMI',
  tablets: 'טאבלטים', kosher: 'כשרים', extras: 'אוזניות, רמקולים ושעונים'
};
function categoryImage(cat) {
  if (cat.image && CAT_IMAGE_RE.test(cat.image)) return cat.image;
  const first = PRODUCTS.find(p => p.cat === cat.id);
  const fb = art(cat.kind, C[(first && first.colors && first.colors[0]) || 'black'].hex);
  const src = CATEGORY_IMAGES[cat.id] || `images/${cat.id}.jpg`;
  FALLBACKS[src] = fb;
  return src;
}

function renderCategoryAdminList() {
  const box=document.getElementById('adminCategoriesList'); if(!box)return;
  box.innerHTML=CATEGORIES.map(c=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#1e293b;padding:8px;border-radius:7px"><span>${escapeHTML(c.name)}</span><div style="display:flex;gap:6px"><button type="button" data-category-edit="${escapeHTML(c.id)}" style="padding:5px 8px;border-radius:6px">עריכה</button>${DEFAULT_CATEGORIES.some(d=>d.id===c.id)?'':'<button type="button" data-category-delete="'+escapeHTML(c.id)+'" style="padding:5px 8px;border-radius:6px">הסרה</button>'}</div></div>`).join('');
}
function saveCategories() {
  try { localStorage.setItem(CATEGORY_KEY, JSON.stringify(CATEGORIES)); } catch { toast('לא ניתן לשמור קטגוריות בדפדפן'); }
  productOverrides.__categoryConfig = { categories: CATEGORIES };
  persistCatalog();
  const select=document.getElementById('adminPCat');
  if(select) select.innerHTML=CATEGORIES.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join('');
  renderCategoryAdminList(); refreshAdminBannerPanel(); renderAdminList(); rerenderCurrent();
}
document.getElementById('adminCategoryForm')?.addEventListener('submit', async event=>{
  event.preventDefault(); const name=document.getElementById('adminCategoryName').value.trim(), title=document.getElementById('adminCategoryTitle').value.trim();
  const editId=document.getElementById('adminCategoryId').value; const old=editId?CATEGORIES.find(c=>c.id===editId):null;
  const id=old?old.id:'custom-'+Date.now().toString(36); let image=old?.image||''; const file=document.getElementById('adminCategoryImage').files[0];
  if(file){try{image=await compressProductImage(file)}catch{return toast('לא הצלחתי לקרוא את תמונת הקטגוריה')}}
  const category={...(old||{}),id,name,title,sub:document.getElementById('adminCategoryDesc').value.trim(),kind:old?.kind||'accessory',color:document.getElementById('adminCategoryColor').value,image};
  if(old) CATEGORIES=CATEGORIES.map(c=>c.id===id?category:c); else CATEGORIES.push(category);
  saveCategories(); resetCategoryForm(); toast(old?'הקטגוריה עודכנה':'הקטגוריה נוספה');
});
document.getElementById('adminCategoriesList')?.addEventListener('click',event=>{
  const editId=event.target.closest('[data-category-edit]')?.dataset.categoryEdit;
  if(editId){const c=CATEGORIES.find(x=>x.id===editId);if(!c)return;document.getElementById('adminCategoryId').value=c.id;document.getElementById('adminCategoryName').value=c.name;document.getElementById('adminCategoryTitle').value=c.title;document.getElementById('adminCategoryDesc').value=c.sub||'';document.getElementById('adminCategoryColor').value=/^#[0-9a-f]{6}$/i.test(c.color||'')?c.color:'#1e6bff';const heading=document.querySelector('#adminCategoryPanel h4');if(heading)heading.textContent='עריכת קטגוריה';const submit=document.querySelector('#adminCategoryForm button[type="submit"]');if(submit)submit.textContent='שמור שינויים';document.getElementById('adminCategoryPanel').scrollIntoView({behavior:'smooth',block:'start'});return;}
  const id=event.target.closest('[data-category-delete]')?.dataset.categoryDelete; if(!id)return;
  const affected=PRODUCTS.filter(p=>p.cat===id);
  if(affected.length){
    // במקום לחסום: מציעים להעביר את המוצרים לקטגוריה אחרת (ברירת מחדל: אביזרים)
    const target=CATEGORIES.find(c=>c.id==='extras'&&c.id!==id)||CATEGORIES.find(c=>c.id!==id);
    if(!target)return toast('לא ניתן למחוק את הקטגוריה היחידה');
    if(!confirm(`בקטגוריה יש ${affected.length} מוצרים. להעביר אותם לקטגוריה "${target.name}" ולמחוק את הקטגוריה?`))return;
    userProducts=userProducts.map(p=>p.cat===id?{...p,cat:target.id}:p);
    affected.filter(p=>!p.id.startsWith('custom-')).forEach(p=>{productOverrides[p.id]={...(productOverrides[p.id]||p),cat:target.id};});
  }
  CATEGORIES=CATEGORIES.filter(c=>c.id!==id); saveCategories(); toast(affected.length?'הקטגוריה נמחקה והמוצרים הועברו':'הקטגוריה הוסרה');
});
function resetCategoryForm(){const form=document.getElementById('adminCategoryForm');if(!form)return;form.reset();document.getElementById('adminCategoryId').value='';const heading=document.querySelector('#adminCategoryPanel h4');if(heading)heading.textContent='הוספת קטגוריה';const submit=form.querySelector('button[type="submit"]');if(submit)submit.textContent='הוסף קטגוריה';}
document.getElementById('adminThemeSelect')?.addEventListener('change',event=>{localStorage.setItem(THEME_KEY,event.target.value);applyTheme(event.target.value)});

/* ---------- עגלה ---------- */
const $ = s => document.querySelector(s);
const fmt = n => '₪' + n.toLocaleString('he-IL');
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem('tm_cart') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(i => i && typeof i.key === 'string' && Number(i.qty) > 0).map(i => {
      const p = PRODUCTS.find(x => x.id === i.pid);
      if (!p) return null;
      // עגלות ישנות (לפני וריאנטים): מקשרים לוריאנט המתאים או לברירת המחדל
      if (!i.vid || !findVariant(p, i.vid)) {
        if (i.vid) return null;
        const v = defaultVariant(p);
        return { key: p.id + '|' + v.id, pid: p.id, vid: v.id, qty: Number(i.qty) };
      }
      return { key: p.id + '|' + i.vid, pid: p.id, vid: i.vid, qty: Number(i.qty) };
    }).filter(Boolean);
  } catch { return []; }
}
let cart = loadCart();
const saveCart = () => { try { localStorage.setItem('tm_cart', JSON.stringify(cart)); } catch {} };

function addToCart(pid, vid) {
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p) return;
  const v = findVariant(p, vid) || defaultVariant(p);
  const key = pid + '|' + v.id;
  const row = cart.find(i => i.key === key);
  if (row) row.qty++; else cart.push({ key, pid, vid: v.id, qty: 1 });
  saveCart(); renderCart(); toast('נוסף לעגלה ✓');
}
function unitPrice(item) {
  const p = PRODUCTS.find(x => x.id === item.pid);
  if (!p) return 0;
  const v = findVariant(p, item.vid);
  return v ? v.price : p.price;
}
function cartTotal() { return cart.reduce((s, i) => s + unitPrice(i) * i.qty, 0); }

function renderCart() {
  $('#cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartTotal').textContent = fmt(cartTotal());
  const box = $('#cartItems');
  if (!cart.length) { box.innerHTML = '<div class="empty">העגלה ריקה</div>'; return; }
  box.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.pid);
    const v = findVariant(p, i.vid);
    const label = escapeHTML(variantLabel(v));
    const meta = escapeHTML(publicText(p.meta));
    return `<div class="line">
      <img src="${escapeHTML(productImage(p, v && v.color))}" alt="${escapeHTML(p.name)}" loading="lazy">
      <div class="line-info"><b>${escapeHTML(p.name)}</b>
        ${label ? `<span>${label}</span>` : ''}
        ${meta ? `<span class="line-sub">${meta}</span>` : ''}
        ${v && v.sku ? `<span class="line-sku">מק״ט: <bdi dir="ltr">${escapeHTML(v.sku)}</bdi></span>` : ''}
        <div class="qty"><button type="button" aria-label="הפחתת כמות ${escapeHTML(p.name)}" data-act="dec" data-key="${escapeHTML(i.key)}">−</button><span aria-live="polite">${i.qty}</span><button type="button" aria-label="הגדלת כמות ${escapeHTML(p.name)}" data-act="inc" data-key="${escapeHTML(i.key)}">+</button></div>
      </div>
      <div style="text-align:left"><b>${fmt(unitPrice(i) * i.qty)}</b><br><button type="button" class="rm" aria-label="הסרת ${escapeHTML(p.name)} מהעגלה" data-act="rm" data-key="${escapeHTML(i.key)}">הסר</button></div>
    </div>`;
  }).join('');
}
function storageLabel(n) { return n >= 1024 ? (n / 1024) + 'TB' : n + 'GB'; }

$('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const it = cart.find(i => i.key === b.dataset.key); if (!it) return;
  if (b.dataset.act === 'inc') it.qty++;
  if (b.dataset.act === 'dec') it.qty--;
  if (b.dataset.act === 'rm') it.qty = 0;
  cart = cart.filter(i => i.qty > 0);
  saveCart(); renderCart();
});
let cartOpenTrigger = null;
const openCart = () => { const d = $('#cartDrawer'); cartOpenTrigger = document.activeElement; d.inert = false; d.classList.add('open'); $('#overlay').classList.add('open'); d.setAttribute('aria-hidden', 'false'); $('#cartBtn').setAttribute('aria-expanded', 'true'); $('#closeCart').focus(); };
const closeCart = () => { const d = $('#cartDrawer'); d.classList.remove('open'); $('#overlay').classList.remove('open'); d.setAttribute('aria-hidden', 'true'); d.inert = true; $('#cartBtn').setAttribute('aria-expanded', 'false'); if (cartOpenTrigger && typeof cartOpenTrigger.focus === 'function') cartOpenTrigger.focus(); cartOpenTrigger = null; };
$('#cartDrawer').inert = true;
$('#cartBtn').onclick = openCart;
$('#closeCart').onclick = closeCart;
$('#overlay').onclick = closeCart;
document.addEventListener('keydown', e => {
  const modal = document.getElementById('adminModal');
  const cart = document.getElementById('cartDrawer');
  if (e.key === 'Escape') { closeCart(); if(modal?.style.display==='flex') toggleAdminPanel(); return; }
  if (e.key !== 'Tab') return;
  const activeModal = modal?.style.display === 'flex' ? modal : (cart?.classList.contains('open') ? cart : null);
  if (!activeModal) return;
  const focusable = [...activeModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]')]
    .filter(el => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
$('#checkoutBtn').onclick = () => {
  if (!cart.length) return toast('העגלה ריקה');
  closeCart(); location.hash = '#/checkout';
};

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- Views ---------- */
function viewHome() {
  return `<h1 class="sr-only">Y.I Trade &amp; Marketing</h1>${bannerHTML('home')}${featuresHTML()}<section class="blocks" aria-label="קטגוריות">${CATEGORIES.map(c => {
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
  const q = String(query || '').trim();
  if (!q) { box.classList.remove('open'); box.innerHTML = ''; return; }
  const tokens = normalizeSearchText(q).split(/\s+/).filter(Boolean);
  const rows = PRODUCTS.filter(p => {
    const hay = normalizeSearchText(p.name + ' ' + (p.meta || '') + ' ' + p.variants.map(v => [v.sku, v.color, v.storage, v.ram].join(' ')).join(' '));
    return tokens.every(tok => hay.includes(tok));
  }).slice(0, 8);
  box.innerHTML = rows.map(p => `<a class="search-result" href="#/product/${encodeURIComponent(p.id)}">${escapeHTML(p.name)}<small>${p.variants.length > 1 && p.variants.some(v => v.price !== p.price) ? 'החל מ-' : ''}${fmt(p.price)}</small></a>`).join('') || '<div class="search-result">לא נמצאו מוצרים</div>';
  box.classList.add('open');
}
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))document.getElementById('searchResults')?.classList.remove('open')});
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
  const imgSrc = productImage(p, v.color);
  host.querySelector('#pdpImg').src = imgSrc;
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

const WARRANTY_LABEL = 'שנה אחריות';
const SUPPLY_ORDER = ['יבואן רשמי', 'יבואן מקביל', 'כשר', 'מחודש', 'מכשיר שהופעל', ''];
function categoryProductGroups(items,id){
  if(id!=='extras'){
    // פס מפריד בין יבואן רשמי ליבואן מקביל (ולשאר סוגי המוצרים) – מוצג כשיש לפחות שתי קבוצות
    const buckets = new Map(SUPPLY_ORDER.map(k => [k, []]));
    items.forEach(p => { const k = productSupplyType(p); (buckets.get(k) || buckets.get('')).push(p); });
    const filled = [...buckets].filter(([, rows]) => rows.length);
    const multi = filled.length > 1;
    return filled.map(([k, rows]) => '<section class="product-group supply-group">' + (multi ? '<h2>' + (k || 'מוצרים נוספים') + '</h2>' : '') + '<div class="grid">' + rows.map(card).join('') + '</div></section>').join('');
  }
  const text=p=>p.name+' '+(p.meta||'');
  const groups=[
    ['אוזניות',p=>/headphone|earbuds|airpods|buds|אוזני|אוזניות/i.test(text(p)) && !/רמקול/i.test(text(p))],
    ['רמקולים',p=>/רמקול|speaker|jbl\s*(flip|charge|xtreme|wind|go)/i.test(text(p))],
    ['שעונים',p=>/watch|שעון/i.test(text(p))],
    ['מוצרים נלווים',p=>true]
  ];
  const used=new Set();
  return groups.map(([title,test])=>{const rows=items.filter(p=>!used.has(p.id)&&test(p));rows.forEach(p=>used.add(p.id));return rows.length?'<section class="product-group" id="grp-'+({'אוזניות':'headphones','רמקולים':'speakers','שעונים':'watches','מוצרים נלווים':'accessories'}[title])+'"><h2>'+title+'</h2><div class="grid">'+rows.map(card).join('')+'</div></section>':''}).join('');
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

function productSupplyType(p){if(p.supply)return p.supply;const meta=p.meta||'';if(/מחודש/i.test(meta))return 'מחודש';if(/מאוקטב לזמן קצר/i.test(meta))return 'מכשיר שהופעל';if(/יבואן?\s*מקביל/i.test(meta))return 'יבואן מקביל';if(/יבואן?\s*רשמי/i.test(meta))return 'יבואן רשמי';if(/(?:^|[·\s])יבוא(?:[·\s]|$)/i.test(meta))return 'יבואן מקביל';return '';}

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


/* ----- "אנשים קנו גם": הצעות נלוות לפי סוג המוצר, עם קישור ישיר לקטגוריה המתאימה ----- */
function alsoBoughtSuggestions(p) {
  const extras = PRODUCTS.filter(x => x.cat === 'extras' && x.id !== p.id);
  const pick = (re, n = 1, not) => extras.filter(x => re.test(x.name) && !(not && not.test(x.name))).slice(0, n);
  const link = (label, cat, grp) => ({ label, href: '#/category/' + cat + (grp ? '/' + grp : '') });
  const n = p.name;
  const iphoneGen = (n.match(/iPhone\s*(\d+)/i) || [])[1];
  let items = [], links = [];
  if (p.cat === 'apple' && /iphone/i.test(n)) {
    const usbc = iphoneGen ? Number(iphoneGen) >= 15 : !/SE/i.test(n);
    items = [...pick(/airpods/i, 2, /max/i), ...pick(/20W/i, 1, /samsung/i), ...pick(usbc ? /Type-C ל-Type-C|USB-C to USB-C/i : /Lightning/i, 1, /אוזניות|EarPods/i)];
    links = [link('אוזניות ל-Apple', 'extras', 'headphones'), link('כבלים ומטענים לאייפון', 'extras', 'accessories'), link('Apple Watch', 'extras', 'watches')];
  } else if (p.cat === 'samsung') {
    items = [...pick(/galaxy buds/i, 2, /core|fe/i), ...pick(/samsung.*(45W|25W)/i, 1), ...pick(/power bank/i, 1)];
    links = [link('אוזניות Galaxy Buds', 'extras', 'headphones'), link('מטענים וכבלים', 'extras', 'accessories'), link('שעונים חכמים', 'extras', 'watches')];
  } else if (p.cat === 'xiaomi' || p.cat === 'kosher') {
    items = [...pick(/anker|jbl.*(wave|tune)/i, 2), ...pick(/power bank/i, 1), ...pick(/samsung.*45W|20W/i, 1)];
    links = [link('אוזניות', 'extras', 'headphones'), link('מטענים וסוללות גיבוי', 'extras', 'accessories')];
  } else if (p.cat === 'tablets') {
    items = [...pick(/anker|jbl.*(wave|tune)|buds/i, 2), ...pick(/power bank/i, 1), ...pick(/jbl.*(flip|go)/i, 1)];
    links = [link('אוזניות', 'extras', 'headphones'), link('רמקולים', 'extras', 'speakers'), link('מטענים ואביזרים', 'extras', 'accessories')];
  } else if (/airpods|apple/i.test(n)) {
    items = [...pick(/Type-C ל-Type-C|USB-C to USB-C/i, 1, /אוזניות|EarPods/i), ...pick(/20W/i, 1, /samsung/i)];
    links = [link('אייפונים', 'apple'), link('כבלים ומטענים', 'extras', 'accessories')];
  } else if (/buds|galaxy|samsung/i.test(n)) {
    items = [...pick(/samsung.*(45W|25W)/i, 1)];
    links = [link('טלפוני Samsung', 'samsung'), link('כבלים ומטענים', 'extras', 'accessories')];
  } else {
    links = [link('אוזניות', 'extras', 'headphones'), link('רמקולים', 'extras', 'speakers'), link('כבלים ומטענים', 'extras', 'accessories')];
  }
  const seen = new Set();
  items = items.filter(x => !seen.has(x.id) && seen.add(x.id));
  if (items.length < 3) extras.filter(x => !seen.has(x.id)).slice(0, 4 - items.length).forEach(x => items.push(x));
  return { items: items.slice(0, 4), links };
}
function alsoBoughtHTML(p) {
  const { items, links } = alsoBoughtSuggestions(p);
  if (!items.length && !links.length) return '';
  const cards = items.map(x => {
    const v = defaultVariant(x);
    const from = x.variants.some(y => y.price !== v.price) ? 'החל מ-' : '';
    return `<a class="also-card" href="${escapeHTML(productHref(x, v))}"><div class="also-img"><img src="${escapeHTML(productImage(x, v.color))}" alt="" loading="lazy"></div><b>${escapeHTML(x.name)}</b><span>${from}${fmt(v.price)}</span></a>`;
  }).join('');
  const linkRow = links.map(l => `<a class="also-link" href="${escapeHTML(l.href)}">${escapeHTML(l.label)} ←</a>`).join('');
  return `<section class="pdp-also" aria-labelledby="alsoTitle"><h2 id="alsoTitle">אנשים קנו גם</h2>${cards ? `<div class="also-grid">${cards}</div>` : ''}<div class="also-links">${linkRow}</div></section>`;
}
function viewProduct(id, vid) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return viewNotFound();
  const cat = CATEGORIES.find(c => c.id === p.cat);
  if (!cat) return viewNotFound();
  const v = findVariant(p, vid) || defaultVariant(p);
  const specRows = Object.entries(p.specs || {}).filter(([k,val]) => !['דגם','פרטים','מחיר','הערה'].includes(k) && publicText(val)).map(([k,val]) => `<tr><td>${escapeHTML(k)}</td><td>${escapeHTML(publicText(val))}</td></tr>`).join('');
  return `<div class="crumbs"><a href="#/">בית</a> › <a href="#/category/${encodeURIComponent(cat.id)}">${escapeHTML(cat.name)}</a> › ${escapeHTML(p.name)}</div>
  <div class="pdp" data-pid="${escapeHTML(p.id)}" data-vid="${escapeHTML(v.id)}">
    <div class="pdp-media"><div class="pdp-frame"><img id="pdpImg" src="${escapeHTML(productImage(p, v.color))}" alt="${escapeHTML(p.name)}"></div><p class="pdp-disclaimer">ט.ל.ח – התמונה להמחשה בלבד</p>${p.galleryImages?.length > 1 ? `<div class="pdp-gallery">${p.galleryImages.map((src,i)=>`<button type="button" class="pdp-thumb ${i===0?'sel':''}" data-image="${escapeHTML(src)}" aria-label="הצגת תמונה ${i+1}"><img src="${escapeHTML(src)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}</div>
    <div class="pdp-info">
      <h1>${escapeHTML(p.name)} ${productSupplyType(p) ? `<span class="product-badge">${escapeHTML(productSupplyType(p))}</span>` : ''}</h1>
      <p class="pdp-warranty">✓ ${WARRANTY_LABEL} מלאה</p>
      <div class="pdp-buy">
        <div class="pdp-price" id="pdpPrice" aria-live="polite">${fmt(v.price)}</div>
        <div class="pdp-actions">
          <button type="button" class="btn-order" id="buyNow">להזמנה</button>
          <button type="button" class="btn-order alt" id="addBtn">הוספה לעגלה</button>
        </div>
      </div>
      ${publicText(p.desc) ? `<p class="desc">${escapeHTML(publicText(p.desc))}</p>` : ''}
      <div class="pdp-opts" id="pdpOpts">${optionsHTML(p, v)}</div>
      <p class="pdp-sku" id="pdpSkuRow"${v.sku ? '' : ' hidden'}>מק״ט: <b id="pdpSku" dir="ltr">${escapeHTML(v.sku || '')}</b></p>
      <ul class="pdp-trust" aria-label="יתרונות הרכישה">
        <li>🛡️ אחריות יבואן ל-12 חודשים</li>
        <li>🚚 משלוח לכל הארץ</li>
        <li>🔒 תשלום מאובטח/במזומן בעת קבלה</li>
        <li>📞 שירות לקוחות זמין</li>
      </ul>
    </div>
    ${alsoBoughtHTML(p)}
    ${(specRows || (p.detailImages || []).length) ? `<section class="pdp-full" aria-labelledby="fullSpecTitle"><h2 id="fullSpecTitle">מפרט מלא</h2>${specRows ? `<table class="fullspec-table">${specRows}</table>` : ''}${(p.detailImages || []).length ? `<div class="pdp-detail-imgs">${p.detailImages.map((src, i) => `<img src="${escapeHTML(src)}" alt="${escapeHTML(p.name)} – תמונת פירוט ${i + 1}" loading="lazy">`).join('')}</div>` : ''}</section>` : ''}
  </div>`;
}

function bindProduct(id) {
  const p = PRODUCTS.find(x => x.id === id); if (!p) return;
  const host = document.querySelector('.pdp');
  const current = () => findVariant(p, host && host.dataset.vid) || defaultVariant(p);
  const thumbs = document.querySelectorAll('.pdp-thumb');
  thumbs.forEach(button => button.onclick = () => { $('#pdpImg').src = button.dataset.image; thumbs.forEach(t => t.classList.toggle('sel', t === button)); });
  $('#addBtn').onclick = () => { addToCart(p.id, current().id); openCart(); };
  $('#buyNow').onclick = () => { addToCart(p.id, current().id); location.hash = '#/checkout'; };
}

function orderSummaryInner() {
  const rows = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.pid);
    if (!p) return '';
    const v = findVariant(p, i.vid);
    const meta = [variantLabel(v), publicText(p.meta), v && v.sku ? 'מק״ט ' + v.sku : ''].filter(Boolean).join(' · ');
    return `<div class="sum-line"><span>${escapeHTML(p.name)} × ${i.qty}${meta ? `<br><small style="color:#667085">${escapeHTML(meta)}</small>` : ''}</span><b>${fmt(unitPrice(i) * i.qty)}</b></div>`;
  }).join('');
  return `<h2>פריטים בעגלה</h2>${rows}
      <div class="sum-line sum-total"><span>סכום המוצרים</span><span>${fmt(cartTotal())}</span></div>${vatNote()}`;
}
/* הערת מע"מ: מוצגת רק אם הוגדר ב-shop-info.js (pricesIncludeVat: true / false) */
function vatNote() {
  const v = (window.SHOP_INFO || {}).pricesIncludeVat;
  if (v !== true && v !== false) return '';
  return `<p class="form-note">${v ? 'המחירים כוללים מע״מ.' : 'המחירים אינם כוללים מע״מ.'} עלות משלוח, אם קיימת, תוצג ותאושר לפני התחייבות.</p>`;
}
function viewCheckout() {
  if (!cart.length) return `<div class="empty"><h2>העגלה ריקה</h2><br><a class="btn-purple" href="#/">חזרה לחנות</a></div>`;
  const form = orderApi() ? `
      <form id="orderForm" class="order-form" novalidate>
        <div class="form-row">
          <div class="field"><label for="ofName">שם מלא *</label><input id="ofName" name="name" autocomplete="name" maxlength="80" required></div>
          <div class="field"><label for="ofPhone">טלפון *</label><input id="ofPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="050-0000000" required></div>
        </div>
        <div class="field"><label for="ofEmail">אימייל לאישור הזמנה *</label><input id="ofEmail" name="email" type="email" autocomplete="email" maxlength="120" dir="ltr" placeholder="name@example.com" required></div>
        <div class="field"><label for="ofAddress">כתובת לאספקה *</label><input id="ofAddress" name="address" autocomplete="street-address" maxlength="200" placeholder="עיר, רחוב ומספר בית" required></div>
        <div class="form-row">
          <div class="field"><label for="ofDate">תאריך אספקה מבוקש *</label><input id="ofDate" name="deliveryDate" type="date" min="${todayISO()}" required></div>
          <div class="field"><label for="ofTime">זמן אספקה *</label><select id="ofTime" name="deliveryTime" required><option value="">בחרו שעות</option>${DELIVERY_SLOTS.map(s => `<option>${escapeHTML(s)}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="ofNotes">הערות (לא חובה)</label><textarea id="ofNotes" name="notes" rows="3" maxlength="500" placeholder="צבע מועדף, קומה, הוראות הגעה…"></textarea></div>
        <label class="hp-field" for="ofWebsite" aria-hidden="true">אל תמלאו שדה זה<input type="text" id="ofWebsite" name="website" tabindex="-1" autocomplete="off"></label>
        <div class="field-check"><input type="checkbox" id="ofTerms" name="terms" required><label for="ofTerms">קראתי ואני מסכים/ה ל<a class="inline-link" href="#/terms" target="_blank" rel="noopener">תנאי השימוש וההזמנה</a>, ל<a class="inline-link" href="#/returns" target="_blank" rel="noopener">מדיניות הביטול וההחזרות</a> ול<a class="inline-link" href="#/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</a> *</label></div>
        <button type="submit" class="btn-purple wide" id="orderSubmit">שליחת הזמנה</button>
        <div id="orderError" class="form-error" role="alert"></div>
      </form>
      <p id="checkoutNote" class="form-note">התשלום אינו מתבצע באתר. אחרי שליחת ההזמנה נשלח אישור למייל ונחזור אליכם לתיאום האספקה.</p>
      <p class="form-note">יש כבר הזמנה? <a href="#/order-status" class="inline-link">מעקב סטטוס הזמנה</a></p>` :
    `<p id="checkoutNote">התשלום אינו מתבצע באתר. אפשר לשלוח לנו את סיכום העגלה ונמשיך משם.</p><br>`;
  return `<div class="page-head"><h1>סיכום והזמנה</h1></div>
  <div class="checkout">
    <section class="panel"><h2>${orderApi() ? 'פרטי ההזמנה' : 'שליחת הזמנה'}</h2>${form}<div class="checkout-actions" id="checkoutActions"></div></section>
    <aside class="panel" id="orderSummary">${orderSummaryInner()}</aside>
  </div>`;
}const viewNotFound = () => `<div class="empty"><h2>העמוד לא נמצא</h2><br><a class="btn-purple" href="#/">לדף הבית</a></div>`;

/* ---------- פרטי החנות, כותרת עמוד, הזמנה בוואטסאפ ---------- */
const BASE_TITLE = 'Y.I Trade & Marketing – סלולר וטכנולוגיה';
function routeParts() {
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
const DEFAULT_DESC = 'טלפונים, טאבלטים, שעונים ואביזרי טכנולוגיה בחנות Y.I Trade & Marketing.';
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
  if (legalTitles[page]) { document.title = legalTitles[page] + ' | Y.I Trade & Marketing'; updateMeta(document.title, DEFAULT_DESC, ''); return; }
  if (page === 'category') {
    const c = CATEGORIES.find(x => x.id === arg);
    if (c) { t = c.title + ' | Y.I Trade & Marketing'; desc = c.sub || desc; image = c.image || ''; }
  } else if (page === 'product') {
    const p = PRODUCTS.find(x => x.id === arg);
    if (p) {
      t = p.name + ' | Y.I Trade & Marketing';
      const v = defaultVariant(p);
      desc = p.name + (productSupplyType(p) ? ' · ' + productSupplyType(p) : '') + ' · ' + (p.variants.some(x => x.price !== v.price) ? 'החל מ-' : '') + fmt(v.price) + ' · ' + WARRANTY_LABEL;
      const pd = publicText(p.desc); if (pd) desc = desc + ' · ' + pd.slice(0, 120);
      image = (p.galleryImages && p.galleryImages[0]) || p.image || '';
    }
  }
  else if (page === 'checkout') t = 'סיכום הזמנה | Y.I Trade & Marketing';
  else if (page === 'order-done') t = 'ההזמנה התקבלה | Y.I Trade & Marketing';
  else if (page === 'order-status') t = 'מעקב הזמנה | Y.I Trade & Marketing';
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
  if (info.address) parts.push(`<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}" target="_blank" rel="noopener">📍 ${escapeHTML(info.address)}</a>`);
  if (info.hours) parts.push(`<span>🕒 ${escapeHTML(info.hours)}</span>`);
  const box = document.getElementById('footerContact');
  if (box) box.innerHTML = parts.join('');
  if (wa && !document.getElementById('waFloat')) {
    const a = document.createElement('a');
    a.id = 'waFloat'; a.className = 'wa-float'; a.target = '_blank'; a.rel = 'noopener';
    a.href = 'https://wa.me/' + wa; a.setAttribute('aria-label', 'שליחת הודעה בוואטסאפ'); a.textContent = '💬 וואטסאפ';
    document.body.appendChild(a);
  }
}
/* ---------- הזמנות: שליחה, אישור ומעקב סטטוס ---------- */
const ORDER_STATUSES = ['התקבלה', 'בטיפול', 'נשלחה', 'נמסרה'];
const DELIVERY_SLOTS = ['בוקר (08:00–12:00)', 'צהריים (12:00–16:00)', 'אחר הצהריים (16:00–20:00)', 'גמיש – כל שעה'];
const ORDER_ID_RE = /^YI-(?:\d{3,8}|[A-F0-9]{8})$/i;
const LAST_ORDER_KEY = 'yi_last_order';
try {
  // ניקוי מידע ישן: בעבר נשמר גם טלפון בדפדפן. כעת נשמר לכל היותר מספר הזמנה, ורק בהסכמה.
  const savedLastOrder = readLocalJSON(LAST_ORDER_KEY, {});
  if (savedLastOrder && savedLastOrder.phone) {
    if (window.yiPreferencesAllowed && window.yiPreferencesAllowed()) localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id: savedLastOrder.id || '' }));
    else localStorage.removeItem(LAST_ORDER_KEY);
  }
} catch {}
const orderApi = () => String(window.ORDER_API_URL || '').trim();
function todayISO() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
function normPhone(v) { let n = String(v || '').replace(/\D/g, ''); if (n.startsWith('972')) n = '0' + n.slice(3); return n; }
function isValidPhone(v) { return /^0\d{8,9}$/.test(normPhone(v)); }
async function orderRequest(payload) {
  // text/plain כדי למנוע preflight – Apps Script לא תומך ב-OPTIONS
  const res = await fetch(orderApi(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  return res.json();
}

async function submitOrder(event) {
  event.preventDefault();
  const form = event.currentTarget, err = document.getElementById('orderError'), btn = document.getElementById('orderSubmit');
  const v = n => String(form.elements[n].value || '').trim();
  const fail = msg => { err.textContent = msg; };
  err.textContent = '';
  if (v('name').length < 2) return fail('נא להזין שם מלא');
  if (!isValidPhone(v('phone'))) return fail('נא להזין מספר טלפון תקין, למשל 050-0000000');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) return fail('נא להזין כתובת אימייל תקינה כדי שנוכל לשלוח אישור');
  if (v('address').length < 5) return fail('נא להזין כתובת מלאה לאספקה');
  if (!v('deliveryDate') || v('deliveryDate') < todayISO()) return fail('נא לבחור תאריך אספקה מהיום והלאה');
  if (!v('deliveryTime')) return fail('נא לבחור זמן אספקה');
  if (!form.elements.terms || !form.elements.terms.checked) return fail('כדי לשלוח הזמנה יש לאשר את תנאי השימוש, מדיניות הביטול ומדיניות הפרטיות');
  if (!cart.length) return fail('העגלה ריקה');
  const items = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.pid);
    if (!p) return null;
    const v = findVariant(p, i.vid);
    return { id: p.id, name: p.name, meta: [variantLabel(v), publicText(p.meta)].filter(Boolean).join(' · '), sku: v ? v.sku : '', color: v ? v.color : '', storage: v ? (v.storage || null) : null, ram: v ? (v.ram || null) : null, qty: i.qty, unit: unitPrice(i), total: unitPrice(i) * i.qty };
  }).filter(Boolean);
  const payload = {
    action: 'order', name: v('name'), phone: normPhone(v('phone')), email: v('email'), address: v('address'),
    deliveryDate: v('deliveryDate'), deliveryTime: v('deliveryTime'), notes: v('notes'),
    items, total: cartTotal(), website: v('website'),
    termsAccepted: true, termsAcceptedAt: new Date().toISOString()
  };
  btn.disabled = true; btn.textContent = 'שולחים…';
  try {
    const data = await orderRequest(payload);
    if (!data || !data.ok || !ORDER_ID_RE.test(data.id || '')) throw new Error((data && data.error) || 'bad response');
    try { if (window.yiPreferencesAllowed && window.yiPreferencesAllowed()) localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id: data.id })); } catch {}
    cart = []; saveCart(); renderCart();
    location.hash = '#/order-done/' + encodeURIComponent(data.id);
  } catch (error) {
    console.error('Order submit failed', error);
    fail('לא הצלחנו לשלוח את ההזמנה. נסו שוב בעוד רגע, או שלחו אותה אלינו בוואטסאפ.');
    btn.disabled = false; btn.textContent = 'שליחת הזמנה';
  }
}

function viewOrderDone(id) {
  if (!ORDER_ID_RE.test(id || '')) return viewNotFound();
  const safe = escapeHTML(id.toUpperCase());
  return `<section class="panel order-done">
    <div class="order-done-icon" aria-hidden="true">✓</div>
    <h1>ההזמנה התקבלה, תודה!</h1>
    <p>שלחנו אישור הזמנה למייל שהזנתם. אם לא רואים אותו, כדאי לבדוק גם בתיקיית הספאם.</p>
    <div class="order-number"><span>מספר הזמנה</span><b dir="ltr">${safe}</b></div>
    <p>עם מספר ההזמנה והטלפון אפשר לבדוק בכל רגע מה הסטטוס שלה.</p>
    <div class="checkout-actions" style="justify-content:center"><a class="btn-purple" href="#/order-status/${encodeURIComponent(id)}">מעקב הזמנה</a><a class="btn-ghost" href="#/">חזרה לחנות</a></div>
  </section>`;
}

function viewOrderStatus(id) {
  let last = {};
  try { last = readLocalJSON(LAST_ORDER_KEY, {}) || {}; } catch {}
  const preId = ORDER_ID_RE.test(id || '') ? id.toUpperCase() : (last.id || '');
  const prePhone = '';
  return `<div class="page-head"><div><div class="crumbs"><a href="#/">בית</a> › מעקב הזמנה</div><h1>מעקב הזמנה</h1></div></div>
  <section class="panel status-panel">
    <p class="form-note" style="margin-top:0">הזינו את מספר ההזמנה ואת הטלפון שהשארתם בהזמנה.</p>
    <form id="statusForm" class="status-form" novalidate>
      <div class="form-row">
        <div class="field"><label for="stId">מספר הזמנה</label><input id="stId" name="orderId" dir="ltr" maxlength="12" placeholder="YI-1001" autocomplete="off" value="${escapeHTML(preId)}"></div>
        <div class="field"><label for="stPhone">טלפון</label><input id="stPhone" name="phone" type="tel" inputmode="tel" maxlength="20" placeholder="050-0000000" value="${escapeHTML(prePhone)}"></div>
      </div>
      <button type="submit" class="btn-purple" id="stBtn">בדיקת סטטוס</button>
      <div id="statusError" class="form-error" role="alert"></div>
    </form>
    <div id="statusResult" aria-live="polite"></div>
  </section>`;
}

function renderOrderResult(o) {
  const cancelled = o.status === 'בוטלה';
  let idx = ORDER_STATUSES.indexOf(o.status); if (idx < 0) idx = 0;
  const timeline = cancelled
    ? '<div class="status-cancelled">ההזמנה בוטלה. לשאלות אפשר ליצור איתנו קשר.</div>'
    : `<ol class="timeline">${ORDER_STATUSES.map((s, i) => `<li class="${i < idx ? 'done' : i === idx ? 'current' : ''}"><span class="dot">${i < idx ? '✓' : i + 1}</span><span class="lbl">${escapeHTML(s)}</span></li>`).join('')}</ol>`;
  const items = (Array.isArray(o.items) ? o.items : []).map(x => `<li>${escapeHTML(x)}</li>`).join('');
  return `<div class="order-card">
    <div class="order-card-head"><div><small>הזמנה</small><b dir="ltr">${escapeHTML(o.id)}</b></div><span class="status-badge ${cancelled ? 'bad' : ''}">${escapeHTML(o.status || 'התקבלה')}</span></div>
    ${timeline}
    <dl class="order-meta">
      <div><dt>שם</dt><dd>${escapeHTML(o.name)}</dd></div>
      <div><dt>תאריך הזמנה</dt><dd>${escapeHTML(o.orderDate)}</dd></div>
      <div><dt>אספקה מבוקשת</dt><dd>${escapeHTML(o.deliveryDate)} · ${escapeHTML(o.deliveryTime)}</dd></div>
      <div><dt>סה״כ</dt><dd>${escapeHTML(o.total)}</dd></div>
    </dl>
    ${items ? `<h3>מה הוזמן</h3><ul class="order-items">${items}</ul>` : ''}
    ${o.notes ? `<div class="order-note"><b>הערות להזמנה:</b> ${escapeHTML(o.notes)}</div>` : ''}
  </div>`;
}

function bindOrderStatus() {
  const form = document.getElementById('statusForm'); if (!form) return;
  const idEl = document.getElementById('stId'), phoneEl = document.getElementById('stPhone');
  const err = document.getElementById('statusError'), out = document.getElementById('statusResult'), btn = document.getElementById('stBtn');
  const lookup = async () => {
    err.textContent = ''; out.innerHTML = '';
    const id = idEl.value.trim().toUpperCase(), phone = normPhone(phoneEl.value);
    if (!ORDER_ID_RE.test(id)) { err.textContent = 'מספר הזמנה נראה כך: YI-1001 או YI-AB12CD34'; return; }
    if (!isValidPhone(phone)) { err.textContent = 'נא להזין את מספר הטלפון שבו בוצעה ההזמנה'; return; }
    if (!orderApi()) { err.textContent = 'מעקב הזמנות עדיין לא הופעל באתר.'; return; }
    btn.disabled = true; btn.textContent = 'בודקים…';
    try {
      const data = await orderRequest({ action: 'status', id, phone });
      if (data && data.ok && data.order) out.innerHTML = renderOrderResult(data.order);
      else err.textContent = (data && data.error) || 'לא מצאנו הזמנה שמתאימה לפרטים. בדקו את מספר ההזמנה והטלפון.';
    } catch (error) {
      console.error('Status lookup failed', error);
      err.textContent = 'לא הצלחנו לבדוק את הסטטוס כרגע. נסו שוב בעוד רגע.';
    } finally { btn.disabled = false; btn.textContent = 'בדיקת סטטוס'; }
  };
  form.addEventListener('submit', e => { e.preventDefault(); lookup(); });
  if (idEl.value && phoneEl.value) lookup();
}

function bindCheckout() {
  const orderForm = document.getElementById('orderForm');
  if (orderForm) orderForm.addEventListener('submit', submitOrder);
  const box = document.getElementById('checkoutActions');
  if (!box || !cart.length) return;
  const wa = shopWhatsappNumber(), tel = shopPhoneNumber();
  const parts = [];
  if (wa) {
    const lines = cart.map(i => {
      const p = PRODUCTS.find(x => x.id === i.pid);
      const v = p ? findVariant(p, i.vid) : null;
      return '• ' + (p ? p.name : '') + (v && variantLabel(v) ? ' (' + variantLabel(v) + (v.sku ? ' · ' + v.sku : '') + ')' : '') + ' × ' + i.qty + ' – ' + fmt(unitPrice(i) * i.qty);
    }).join('\n');
    const text = 'שלום, אשמח להזמין:\n' + lines + '\nסה״כ: ' + fmt(cartTotal());
    parts.push(`<a class="${orderApi() ? 'btn-ghost' : 'btn-purple'}" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(text)}">${orderApi() ? 'או שליחה בוואטסאפ' : 'שליחת הזמנה בוואטסאפ'}</a>`);
  }
  if (tel) parts.push(`<a class="btn-ghost" href="tel:${escapeHTML(tel)}">התקשרו אלינו</a>`);
  parts.push('<a class="btn-ghost" href="#/">חזרה לחנות</a>');
  box.innerHTML = parts.join(' ');
  if (!wa && !tel && !orderApi()) { const note = document.getElementById('checkoutNote'); if (note) note.textContent = 'פרטי יצירת הקשר יתעדכנו בקרוב. אפשר להמשיך לעיין במוצרים.'; }
}

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
  const text = (cfg.title || cfg.desc)
    ? `<div class="banner-content">${cfg.title ? `<h2 class="banner-title">${escapeHTML(cfg.title)}</h2>` : ''}${cfg.desc ? `<p class="banner-desc">${escapeHTML(cfg.desc)}</p>` : ''}</div>` : '';
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
  const list = [['lock', 'אתר מהיר ומאובטח'], ['truck', 'משלוחים מהירים'], ['shield', 'אחריות מלאה'], ['clock', 'זמינות 24 שעות']];
  return `<ul class="features" aria-label="למה אצלנו">${list.map(([ic, t]) => `<li><span class="feature-ic">${FEATURE_ICONS[ic]}</span><span>${t}</span></li>`).join('')}</ul>`;
}

/* ---------- ניהול: עורך הבאנרים ושדה 3 תמונות המפרט (נבנים דינמית בתוך פאנל הניהול) ---------- */
let adminBannerImages = [];
let adminDetailExisting = [];
let adminDetailNewPreviews = [];
function renderAdminDetailPreview() {
  const box = document.getElementById('adminDetailPreview'); if (!box) return;
  const existing = adminDetailExisting.map((src, i) => `<div class="adm-th"><img src="${escapeHTML(src)}" alt="תמונת מפרט קיימת ${i + 1}"><button type="button" data-remove-detail="${i}" aria-label="הסרת תמונת מפרט ${i + 1}">×</button></div>`).join('');
  const staged = adminDetailNewPreviews.map((src, i) => `<div class="adm-th"><img src="${escapeHTML(src)}" alt="תמונת מפרט חדשה ${i + 1}"></div>`).join('');
  box.innerHTML = existing + staged;
}
function adminBannerKeys() {
  return [{ key: 'home', label: 'דף הבית' }, ...CATEGORIES.map(c => ({ key: c.id, label: 'קטגוריה: ' + c.name }))];
}
function renderAdminBannerImages() {
  const box = document.getElementById('adminBannerImages'); if (!box) return;
  box.innerHTML = adminBannerImages.length ? adminBannerImages.map((src, i) =>
    `<div class="adm-th"><img src="${escapeHTML(src)}" alt="תמונה ${i + 1} בבאנר"><button type="button" data-bn-rm="${i}" aria-label="הסרת תמונה ${i + 1}">×</button>${i > 0 ? `<button type="button" class="adm-th-mv" data-bn-up="${i}" aria-label="הקדמת תמונה ${i + 1}">הקדם</button>` : ''}</div>`).join('')
    : '<span class="adm-ci-none">אין תמונות. יוצג רקע כחול עם הכיתוב.</span>';
  const count = document.getElementById('adminBannerCount'); if (count) count.textContent = adminBannerImages.length + ' / ' + BANNER_MAX;
  const file = document.getElementById('adminBannerFiles'); if (file) file.disabled = adminBannerImages.length >= BANNER_MAX;
}
function loadAdminBanner(key) {
  const cfg = getBanner(key);
  document.getElementById('adminBannerTitle').value = cfg.title;
  document.getElementById('adminBannerDesc').value = cfg.desc;
  adminBannerImages = [...cfg.images];
  const msg = document.getElementById('adminBannerMsg'); if (msg) msg.textContent = '';
  renderAdminBannerImages();
}
function refreshAdminBannerPanel() {
  const sel = document.getElementById('adminBannerKey'); if (!sel) return;
  const keep = sel.value || 'home';
  sel.innerHTML = adminBannerKeys().map(o => `<option value="${escapeHTML(o.key)}">${escapeHTML(o.label)}</option>`).join('');
  sel.value = adminBannerKeys().some(o => o.key === keep) ? keep : 'home';
  loadAdminBanner(sel.value);
}
async function saveAdminBanner(reset) {
  const sel = document.getElementById('adminBannerKey'), btn = document.getElementById('adminBannerSave'), msg = document.getElementById('adminBannerMsg');
  const key = sel.value;
  const prev = getBanner(key).images;
  let title = document.getElementById('adminBannerTitle').value.trim(), desc = document.getElementById('adminBannerDesc').value.trim();
  let images = [...adminBannerImages];
  if (reset) { title = bannerDefaults(key).title; desc = bannerDefaults(key).desc; images = []; }
  btn.disabled = true; msg.textContent = 'שומרת…';
  try {
    images = await Promise.all(images.map((src, i) => src.startsWith('data:image/') ? uploadProductImage(src, 'banners', i) : src));
  } catch (error) { btn.disabled = false; msg.textContent = ''; return toast(error.message || 'לא הצלחתי להעלות את התמונות. בדקי שהתחברת לניהול'); }
  const cfg = sanitizeBanners(productOverrides.__bannerConfig && productOverrides.__bannerConfig.banners);
  const def = bannerDefaults(key);
  if (!images.length && title === def.title && desc === def.desc) delete cfg[key]; else cfg[key] = { title, desc, images };
  productOverrides.__bannerConfig = { banners: cfg };
  const ok = await persistCatalog();
  btn.disabled = false; msg.textContent = '';
  if (ok) {
    const removed = prev.filter(u => !images.includes(u));
    if (removed.length) cloudSaveChain.then(done => { if (done) removeCloudImages(removed); });
    toast(reset ? 'הבאנר אופס לברירת המחדל' : 'הבאנר נשמר');
  }
  loadAdminBanner(key);
  rerenderCurrent();
}
function installAdminExtras() {
  const form = document.getElementById('adminAddProductForm');
  if (form && !document.getElementById('adminPDetailImages')) {
    const btn = form.querySelector('[type="submit"]');
    let anchor = btn ? (btn.parentElement === form ? btn : btn.parentElement) : null;
    if (anchor && anchor.parentNode !== form) anchor = null;
    const box = document.createElement('fieldset');
    box.className = 'adm-variants adm-detail';
    box.innerHTML = `<legend>תמונות מפרט (עד 3)</legend>
      <p class="adm-hint">התמונות מוצגות בדף המוצר בסעיף "מפרט מלא", מתחת ל"אנשים קנו גם". את טקסט המפרט עורכים בשדה "מפרט מלא" שמעל.</p>
      <label for="adminPDetailImages" class="adm-lbl">בחירת תמונות</label>
      <input id="adminPDetailImages" name="adminPDetailImages" type="file" accept="image/*" multiple>
      <div id="adminDetailPreview" class="adm-thumbs"></div>`;
    form.insertBefore(box, anchor);
    document.getElementById('adminPDetailImages').addEventListener('change', event => {
      adminDetailNewPreviews.forEach(src => URL.revokeObjectURL(src));
      const room = Math.max(0, 3 - adminDetailExisting.length);
      if (event.target.files.length > room) toast('אפשר עד 3 תמונות. רק ' + room + ' הראשונות יישמרו');
      adminDetailNewPreviews = [...event.target.files].slice(0, room).map(f => URL.createObjectURL(f));
      renderAdminDetailPreview();
    });
    document.getElementById('adminDetailPreview').addEventListener('click', event => {
      const b = event.target.closest('[data-remove-detail]'); if (!b) return;
      adminDetailExisting.splice(Number(b.dataset.removeDetail), 1);
      renderAdminDetailPreview();
    });
  }
  const area = document.getElementById('adminManagementArea');
  if (area && !document.getElementById('adminBannerPanel')) {
    const panel = document.createElement('fieldset');
    panel.id = 'adminBannerPanel'; panel.className = 'adm-variants adm-banner';
    panel.innerHTML = `<legend>באנרים (דף הבית וקטגוריות)</legend>
      <p class="adm-hint">לכל באנר אפשר להגדיר כותרת, תיאור ועד ${BANNER_MAX} תמונות מתחלפות. בלי תמונות מוצג רקע כחול עם הכיתוב. מומלץ תמונות רחבות (יחס 16:9 לערך).</p>
      <label for="adminBannerKey" class="adm-lbl">איזה באנר לערוך</label><select id="adminBannerKey" name="adminBannerKey" class="adm-fld"></select>
      <label for="adminBannerTitle" class="adm-lbl">כותרת</label><input type="text" id="adminBannerTitle" name="adminBannerTitle" class="adm-fld" maxlength="120">
      <label for="adminBannerDesc" class="adm-lbl">תיאור (מתחת לכותרת)</label><textarea id="adminBannerDesc" name="adminBannerDesc" class="adm-fld" rows="2" maxlength="300"></textarea>
      <div class="adm-lbl">תמונות <span id="adminBannerCount"></span></div>
      <div id="adminBannerImages" class="adm-thumbs"></div>
      <label for="adminBannerFiles" class="adm-lbl">הוספת תמונות</label><input type="file" id="adminBannerFiles" name="adminBannerFiles" accept="image/*" multiple>
      <div class="adm-bn-actions"><button type="button" id="adminBannerSave" class="adm-addv">שמירת הבאנר</button><button type="button" id="adminBannerReset" class="adm-bn-reset">איפוס לברירת מחדל</button></div>
      <div id="adminBannerMsg" class="adm-vwarn" role="status" aria-live="polite"></div>`;
    const catPanel = document.getElementById('adminCategoryPanel');
    if (catPanel && catPanel.parentNode === area) area.insertBefore(panel, catPanel); else area.appendChild(panel);
    document.getElementById('adminBannerKey').addEventListener('change', e => loadAdminBanner(e.target.value));
    document.getElementById('adminBannerSave').addEventListener('click', () => saveAdminBanner(false));
    document.getElementById('adminBannerReset').addEventListener('click', () => { if (confirm('לאפס את הבאנר לברירת המחדל? התמונות שלו יימחקו.')) saveAdminBanner(true); });
    document.getElementById('adminBannerFiles').addEventListener('change', async event => {
      const input = event.target, room = Math.max(0, BANNER_MAX - adminBannerImages.length);
      const files = [...input.files].slice(0, room);
      if (input.files.length > room) toast('אפשר עד ' + BANNER_MAX + ' תמונות בכל באנר');
      for (const f of files) {
        try { adminBannerImages.push(await compressProductImage(f, 1800)); }
        catch (err) { toast(err.message || 'לא הצלחתי לקרוא את התמונה'); }
      }
      input.value = '';
      renderAdminBannerImages();
    });
    document.getElementById('adminBannerImages').addEventListener('click', event => {
      const rm = event.target.closest('[data-bn-rm]'), up = event.target.closest('[data-bn-up]');
      if (rm) adminBannerImages.splice(Number(rm.dataset.bnRm), 1);
      else if (up) { const i = Number(up.dataset.bnUp); [adminBannerImages[i - 1], adminBannerImages[i]] = [adminBannerImages[i], adminBannerImages[i - 1]]; }
      else return;
      renderAdminBannerImages();
    });
    refreshAdminBannerPanel();
  }
}
installAdminExtras();

/* ---------- Router ---------- */
function renderNav(active) {
  const cur = on => on ? ' aria-current="page"' : '';
  $('#navLinks').innerHTML = `<a href="#/" class="${!active ? 'active' : ''}"${cur(!active)}>בית</a>` +
    CATEGORIES.map(c => `<a href="#/category/${encodeURIComponent(c.id)}" class="${active === c.id ? 'active' : ''}"${cur(active === c.id)}>${escapeHTML(c.name)}</a>`).join('') +
    `<a href="#/order-status" class="${active === 'order-status' ? 'active' : ''}"${cur(active === 'order-status')}>מעקב הזמנה</a>`;
}
const LEGAL_PAGES = ['privacy', 'terms', 'returns', 'cookies', 'accessibility'];
let lastRouteKey = '';
function route() {
  const [page, arg, arg2] = routeParts();
  const app = $('#app');
  let active = null;
  if (!catalogReady && (page === 'category' || page === 'product' || page === 'checkout')) {
    app.innerHTML = '<div class="empty">טוען את הקטלוג…</div>';
    renderNav(page === 'category' ? arg : null); updateTitle();
    return;
  }
  if (page === 'category') { app.innerHTML = viewCategory(arg); active = arg; }
  else if (page === 'product') {
    app.innerHTML = viewProduct(arg, arg2); bindProduct(arg);
    const p = PRODUCTS.find(x => x.id === arg); active = p && p.cat;
  }
  else if (page === 'checkout') { app.innerHTML = viewCheckout(); bindCheckout(); }
  else if (page === 'order-done') { app.innerHTML = viewOrderDone(arg); }
  else if (page === 'order-status') { app.innerHTML = viewOrderStatus(arg); bindOrderStatus(); active = 'order-status'; }
  else if (LEGAL_PAGES.includes(page) && window.LEGAL_VIEWS && window.LEGAL_VIEWS[page]) { app.innerHTML = window.LEGAL_VIEWS[page](); }
  else if (page === 'admin' || page === 'admin-login') { app.innerHTML = viewHome(); active = null; }
  else if (!page) app.innerHTML = viewHome();
  else app.innerHTML = viewNotFound();
  renderNav(active);
  updateTitle();
  document.getElementById('searchResults')?.classList.remove('open');
  if (page === 'admin' || page === 'admin-login') toggleAdminPanel();
  requestAnimationFrame(() => {
    try { window.scrollTo(0, 0); } catch { /* ignore */ }
    if (page === 'category' && arg2) document.getElementById('grp-' + arg2)?.scrollIntoView({ behavior: 'auto', block: 'start' });
    // מעבר בין עמודים: מעבירים פוקוס לתוכן (נגישות קוראי מסך ומקלדת)
    const key = (page || '') + '/' + (arg || '');
    if (key !== lastRouteKey && page !== 'admin' && page !== 'admin-login') { app.focus({ preventScroll: true }); }
    lastRouteKey = key;
  });
}
document.getElementById('skipLink')?.addEventListener('click', event => {
  event.preventDefault();
  const app = document.getElementById('app');
  app.focus();
  app.scrollIntoView({ behavior: 'auto', block: 'start' });
});
document.addEventListener('click', e => {
  const t = e.target.closest('[data-go]');
  if (t && !e.target.closest('a')) location.hash = t.dataset.go;
});
document.getElementById('productSearch')?.addEventListener('input', event => searchProducts(event.currentTarget.value));
document.getElementById('adminModalClose')?.addEventListener('click', toggleAdminPanel);
document.getElementById('adminLoginForm')?.addEventListener('submit', handleAdminLogin);
document.getElementById('adminLogoutBtn')?.addEventListener('click', adminLogout);
document.getElementById('adminAddProductForm')?.addEventListener('submit', saveProductFromAdmin);
document.getElementById('adminResetBtn')?.addEventListener('click', resetAdminForm);
document.getElementById('adminBackupDownloadBtn')?.addEventListener('click', downloadCatalogBackup);
document.getElementById('adminBackupRestoreBtn')?.addEventListener('click', () => document.getElementById('catalogBackupFile')?.click());
document.getElementById('catalogBackupFile')?.addEventListener('change', event => {
  const input = event.currentTarget;
  restoreCatalogBackup(input.files?.[0]);
  input.value = '';
});
document.getElementById('adminSearch')?.addEventListener('input', renderAdminList);
document.addEventListener('change', event => {
  if (event.target.matches('#filterYear,#filterStorage,#filterRam,#filterSupply,#filterPrice')) applyCategoryFilters();
});
/* ---------- מגירת סינון (נייד וטאבלט): כפתור בצד שפותח את אפשרויות הסינון ---------- */
function setFilterDrawer(open) {
  const panel = document.getElementById('catalogFilters'), overlay = document.getElementById('filterOverlay'), fab = document.getElementById('filterToggle');
  if (!panel || !fab) return;
  panel.classList.toggle('open', open);
  if (overlay) overlay.classList.toggle('open', open);
  fab.setAttribute('aria-expanded', String(open));
  if (open) document.getElementById('filterClose')?.focus(); else fab.focus({ preventScroll: true });
}
document.addEventListener('click', e => {
  if (e.target.closest('#filterToggle')) setFilterDrawer(!document.getElementById('catalogFilters')?.classList.contains('open'));
  else if (e.target.closest('#filterClose, #filterApply, #filterOverlay')) setFilterDrawer(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('catalogFilters')?.classList.contains('open')) setFilterDrawer(false);
});
window.addEventListener('hashchange', route);
renderCart();
applyTheme(localStorage.getItem(THEME_KEY)||'כחול');
renderShopInfo();
route();
loadCloudCatalog();
setTimeout(() => { if (!catalogReady) { catalogReady = true; rerenderCurrent(); } }, 3500);