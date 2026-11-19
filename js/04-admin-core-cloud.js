
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
    const entries=await Promise.all(Object.entries(images).map(async([k,value],i)=>{
      const sources=Array.isArray(value)?value:[value];
      const uploaded=await Promise.all(sources.map((src,j)=>src.startsWith('data:image/')?uploadProductImage(src,product.id,'c'+i+'_'+j):src));
      return [k,Array.isArray(value)?uploaded:uploaded[0]];
    }));
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

let catalogReady = !window.shopSupabase && !window.shopSupabaseLoading;
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
  if (productOverrides.__siteInfo) window.SHOP_INFO = { ...(window.SHOP_INFO || {}), ...productOverrides.__siteInfo };
  const remoteCategories=sanitizeCategories(productOverrides.__categoryConfig?.categories);
  if(remoteCategories.length){CATEGORIES=remoteCategories;try{localStorage.setItem(CATEGORY_KEY,JSON.stringify(CATEGORIES))}catch{}}
  hiddenProductIds=new Set(Array.isArray(data.hidden_product_ids)?data.hidden_product_ids.filter(id=>typeof id==='string'):[]);
  try{localStorage.setItem(USER_PRODUCTS_KEY,JSON.stringify(userProducts));localStorage.setItem(PRODUCT_OVERRIDES_KEY,JSON.stringify(productOverrides));localStorage.setItem(HIDDEN_PRODUCTS_KEY,JSON.stringify([...hiddenProductIds]));}catch{}
  PRODUCTS=buildProductList();cart=cart.filter(cartItemOk);saveCart();renderCart();
}
async function loadCloudCatalog(){
  // ספריית Supabase עדיין נטענת ברקע: מחכים לאירוע shop-supabase-ready (או לטיימר הגיבוי שבסוף הקובץ)
  if (window.shopSupabaseLoading) return;
  try { await fetchCloudCatalog(); }
  catch (error) { console.warn('Cloud catalog load failed', error && error.message); }
  finally { catalogReady = true; rerenderCurrent(); }
}
async function updateAdminGate(){
  const {data}=await window.shopSupabase.auth.getSession();shopAdminAuthenticated=!!data.session;
  document.getElementById('adminLoginBox').style.display=shopAdminAuthenticated?'none':'block';
  document.getElementById('adminManagementArea').style.display=shopAdminAuthenticated?'block':'none';
  if(shopAdminAuthenticated) { renderAdminList(); fillShopInfoForm(); }
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
    refreshAdminSubsPanel();
    const themeSelect=document.getElementById('adminThemeSelect'); if(themeSelect) themeSelect.value=localStorage.getItem(THEME_KEY)||'כחול';
    requestAnimationFrame(() => modal.querySelector('#adminLoginEmail, #adminPName, #adminModalClose')?.focus());
  }
}

