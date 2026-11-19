/* (הוזז לכאן מ-11-stock-category-page.js: נדרש בזמן טעינה) */
function productSupplyType(p){if(p.supply)return p.supply;const meta=p.meta||'';if(/מחודש/i.test(meta))return 'מחודש';if(/מאוקטב לזמן קצר/i.test(meta))return 'מכשיר שהופעל';if(/יבואן?\s*מקביל/i.test(meta))return 'יבואן מקביל';if(/יבואן?\s*רשמי/i.test(meta))return 'יבואן רשמי';if(/(?:^|[·\s])יבוא(?:[·\s]|$)/i.test(meta))return 'יבואן מקביל';return '';}
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
  ].map(ensureVariants).filter(p => productSupplyType(p) !== 'מחודש'); // מוצרים מחודשים לא מוצגים באתר
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
