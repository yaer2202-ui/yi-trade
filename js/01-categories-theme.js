/* (הוזז לכאן מ-02-products-validation.js: נדרש בזמן טעינה) */
function readLocalJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
/* =========================================================
   החנות שלך – SPA
   הקטלוג והמחירים מבוססים על מחירון המלאי שסופק.
   לתמונה אמיתית: הוסף לכל מוצר (או לכל צבע) שדה  image: "images/xxx.jpg"
   אם אין שדה image – נוצרת איור SVG נקי אוטומטית לפי סוג המוצר והצבע.
   ========================================================= */

/* ---------- קטלוג לפי מחירון מלאי שסופק ---------- */
const DEFAULT_CATEGORIES = [
  { id: 'samsung', name: 'Samsung', title: 'סדרת מכשירי SAMSUNG', sub: 'יבואן רשמי ויבואן מקביל', kind: 'phone', color: '#1428a0' },
  { id: 'apple', name: 'Apple', title: 'סדרת מכשירי APPLE', sub: 'מכשירי iPhone חדשים ומחודשים', kind: 'phone', color: '#4b4b52' },
  { id: 'xiaomi', name: 'Xiaomi', title: 'סדרת מכשירי XIAOMI', sub: 'טלפונים וטכנולוגיה', kind: 'phone', color: '#ff6900' }
];
/* תתי-קטגוריות (סדרות) ברירת מחדל לכל קטגוריה. match = ביטוי שמשייך מוצר לסדרה לפי שם הדגם.
   סדר הרשימה = סדר ההצגה, והשיוך הראשון שמתאים מנצח. מוצר שלא מתאים לאף סדרה מוצג ב"דגמים נוספים".
   premium = סדרה פרימיום (מקבלת סימון ועיצוב כותרת מיוחד). הכול ניתן לשינוי בניהול. */
const DEFAULT_SUBS = {
  samsung: [
    { id: 's-series', name: 'סדרת S', premium: true, match: 'Galaxy\\s*S\\d' },
    { id: 'fold-series', name: 'סדרת Fold', premium: true, match: 'Fold|Flip' },
    { id: 'a-series', name: 'סדרת A', premium: false, match: 'Galaxy\\s*A\\d' }
  ],
  apple: [
    { id: 'iphone-18', name: 'סדרת iPhone 18', premium: true, match: 'iPhone\\s*18(?!\\d)' },
    { id: 'iphone-17', name: 'סדרת iPhone 17', premium: true, match: 'iPhone\\s*17(?!\\d)' },
    { id: 'iphone-16', name: 'סדרת iPhone 16', premium: false, match: 'iPhone\\s*16(?!\\d)' },
    { id: 'iphone-15', name: 'סדרת iPhone 15', premium: false, match: 'iPhone\\s*15(?!\\d)' },
    { id: 'iphone-14', name: 'סדרת iPhone 14', premium: false, match: 'iPhone\\s*14(?!\\d)' },
    { id: 'iphone-13', name: 'סדרת iPhone 13', premium: false, match: 'iPhone\\s*13(?!\\d)' },
    { id: 'iphone-older', name: 'דגמי iPhone ישנים יותר', premium: false, match: 'iPhone\\s*(?:12|11)(?!\\d)|iPhone\\s*SE' }
  ],
  xiaomi: [
    { id: 'xiaomi-15t', name: 'סדרת Xiaomi 15T', premium: true, match: 'Xiaomi\\s*15T' },
    { id: 'redmi-note', name: 'סדרת Redmi Note', premium: false, match: 'Redmi\\s*Note' },
    { id: 'poco', name: 'סדרת POCO', premium: false, match: 'POCO' },
    { id: 'redmi', name: 'סדרת Redmi', premium: false, match: 'Redmi' },
    { id: 'xiaomi-a', name: 'סדרת Xiaomi A', premium: false, match: 'Xiaomi\\s*A\\d' }
  ],
  tablets: [
    { id: 'xiaomi-pad', name: 'סדרת Xiaomi Pad', premium: false, match: 'Xiaomi Pad' },
    { id: 'kids-tablets', name: 'טאבלטים לילדים', premium: false, match: 'Kids' },
    { id: 'keyboard-tablets', name: 'טאבלטים עם מקלדת', premium: false, match: 'מקלדת' }
  ],
  kosher: [
    { id: 'nokia', name: 'סדרת Nokia', premium: false, match: 'Nokia' },
    { id: 'qin', name: 'סדרת Qin', premium: false, match: 'Qin' }
  ],
  extras: [
    { id: 'headphones', name: 'אוזניות', premium: false, match: '^(?!.*רמקול)(?=.*(?:headphone|earbuds|airpods|buds|אוזני))' },
    { id: 'speakers', name: 'רמקולים', premium: false, match: 'רמקול|speaker|jbl\\s*(?:flip|charge|xtreme|wind|go)' },
    { id: 'watches', name: 'שעונים', premium: false, match: 'watch|שעון' },
    { id: 'accessories', name: 'מוצרים נלווים', premium: false, match: '.' }
  ]
};
const SUB_ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/i;
const defaultSubsFor = id => (DEFAULT_SUBS[id] || []).map(s => ({ ...s }));
function sanitizeSubs(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(s => s && typeof s === 'object' && !Array.isArray(s)).map(s => {
    const id = String(s.id || '');
    const name = String(s.name || '').trim().slice(0, 50);
    if (!SUB_ID_RE.test(id) || seen.has(id) || !name) return null;
    let match = typeof s.match === 'string' ? s.match.slice(0, 200) : '';
    if (match) { try { new RegExp(match, 'i'); } catch { match = ''; } }
    seen.add(id);
    return { id, name, premium: s.premium === true, match };
  }).filter(Boolean).slice(0, 30);
}
const CATEGORY_KEY = 'yi_categories_v1';
const THEME_KEY = 'yi_theme_v1';
/* ולידציה קשיחה לקטגוריות (גם מקומיות וגם מהענן) – מונעת הזרקת HTML/כתובות לא בטוחות */
const CAT_IMAGE_RE = /^(https:\/\/amfbfqapsakxfbcvuvdb\.supabase\.co\/storage\/v1\/object\/public\/product-images\/|images\/|data:image\/(?:jpeg|png|webp|gif);base64,)/i;
const CAT_ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/i;
const REMOVED_CATEGORY_IDS = new Set(['tablets', 'kosher', 'extras']);
function sanitizeCategories(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(c => c && typeof c === 'object' && !Array.isArray(c)).map(c => {
    const id = String(c.id || '');
    if (!CAT_ID_RE.test(id) || seen.has(id) || REMOVED_CATEGORY_IDS.has(id)) return null;
    const name = String(c.name || '').trim().slice(0, 50);
    const title = String(c.title || '').trim().slice(0, 80);
    if (!name || !title) return null;
    seen.add(id);
    return {
      id, name, title,
      sub: String(c.sub || '').slice(0, 180),
      kind: ['phone', 'tablet', 'accessory', 'watch'].includes(c.kind) ? c.kind : 'accessory',
      color: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : '#1e6bff',
      image: typeof c.image === 'string' && CAT_IMAGE_RE.test(c.image) ? c.image : '',
      // קטגוריה שנשמרה לפני שהיו תתי-קטגוריות מקבלת את סדרות ברירת המחדל שלה
      subs: Array.isArray(c.subs) ? sanitizeSubs(c.subs) : defaultSubsFor(id)
    };
  }).filter(Boolean);
}
let CATEGORIES = (() => {
  const saved = sanitizeCategories(readLocalJSON(CATEGORY_KEY, null));
  return saved.length ? saved : DEFAULT_CATEGORIES.map(c => ({ ...c, subs: defaultSubsFor(c.id) }));
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

