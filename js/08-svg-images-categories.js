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
  const colorImages = p.images && colorKey ? p.images[colorKey] : null;
  const src = (Array.isArray(colorImages) ? colorImages[0] : colorImages) || (p.galleryImages && p.galleryImages[0]) || p.image;
  if (src) { FALLBACKS[src] = fb; return src; }
  return fb;
}
function productImageList(p, colorKey) {
  const colorImages = p.images && colorKey ? p.images[colorKey] : null;
  const list = Array.isArray(colorImages) ? colorImages : (colorImages ? [colorImages] : []);
  return list.length ? list : (p.galleryImages?.length ? p.galleryImages : (p.image ? [p.image] : []));
}
function renderProductGallery(host, p, variant) {
  const box = host.querySelector('.pdp-gallery');
  const images = productImageList(p, variant.color);
  if (!box) return;
  box.innerHTML = images.length > 1 ? images.map((src, i) => `<button type="button" class="pdp-thumb ${i===0?'sel':''}" data-image="${escapeHTML(src)}" aria-label="הצגת תמונה ${i + 1}"><img src="${escapeHTML(src)}" alt="" loading="lazy"></button>`).join('') : '';
  box.hidden = images.length < 2;
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
  if(select){ const keep=select.value; select.innerHTML=CATEGORIES.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join(''); if(CATEGORIES.some(c=>c.id===keep)) select.value=keep; }
  renderCategoryAdminList(); refreshAdminBannerPanel(); refreshAdminSubsPanel(); renderAdminList(); rerenderCurrent();
}
document.getElementById('adminCategoryForm')?.addEventListener('submit', async event=>{
  event.preventDefault(); const name=document.getElementById('adminCategoryName').value.trim(), title=document.getElementById('adminCategoryTitle').value.trim();
  const editId=document.getElementById('adminCategoryId').value; const old=editId?CATEGORIES.find(c=>c.id===editId):null;
  const id=old?old.id:'custom-'+Date.now().toString(36); let image=old?.image||''; const file=document.getElementById('adminCategoryImage').files[0];
  if(file){try{image=await compressProductImage(file)}catch{return toast('לא הצלחתי לקרוא את תמונת הקטגוריה')}}
  const category={...(old||{}),id,name,title,sub:document.getElementById('adminCategoryDesc').value.trim(),kind:old?.kind||'accessory',color:document.getElementById('adminCategoryColor').value,image,subs:old?.subs||[]};
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

