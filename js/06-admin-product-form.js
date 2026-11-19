function resetAdminForm() {
  const form = document.getElementById('adminAddProductForm');
  if (!form) return;
  form.reset();
  document.getElementById('adminPId').value = '';
  document.getElementById('adminPYear').value = '';
  document.getElementById('adminPDesc').value = '';
  document.getElementById('adminPSpecs').value = '';
  document.getElementById('adminPInStock').checked = true;
  document.getElementById('adminPFreeShipping').checked = false;
  document.getElementById('adminPImages').value = '';
  adminExistingImages = [];
  adminNewImagePreviews.forEach(src => URL.revokeObjectURL(src));
  adminNewImagePreviews = [];
  renderAdminImagePreview();
  const supplySel = document.getElementById('adminPSupply'); if (supplySel) supplySel.value = '';
  fillAdminSubSelect(document.getElementById('adminPCat')?.value, '');
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
  fillAdminSubSelect(p.cat, p.sub || '');
  document.getElementById('adminPMeta').value = p.meta || '';
  document.getElementById('adminPInStock').checked = p.inStock !== false;
  document.getElementById('adminPFreeShipping').checked = p.freeShipping === true;
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
  const button = document.querySelector('#adminAddProductForm [type="submit"]');
  if (button?.disabled) return;
  const previousLabel = button?.textContent || 'שמור מוצר';
  if (button) { button.disabled = true; button.textContent = 'שומר…'; }
  saveProductFromAdminAsync()
    .catch(error => {
      console.error('Product save failed', error);
      toast('שמירת המוצר נכשלה: ' + (error?.message || 'בדקי חיבור ונסי שוב'));
    })
    .finally(() => {
      if (button) {
        button.disabled = false;
        if (button.textContent === 'שומר…') button.textContent = previousLabel;
      }
    });
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
    for (const [i, [color, values]] of Object.entries(adminColorImages).filter(([c]) => colorNames.has(c)).entries()) {
      const sources = (Array.isArray(values) ? values : [values]).slice(0, 3);
      colorImages[color] = await Promise.all(sources.map((src, j) => src.startsWith('data:image/') ? uploadProductImage(src, itemId, 'c' + i + '_' + j) : src));
    }
  } catch (error) { return toast(error.message || 'לא הצלחתי להעלות את תמונות הצבעים. בדקי שהתחברת לניהול'); }
  const item = {
    ...(old || {}),
    id: itemId,
    cat, name, price, meta, year, supply,
    sub: document.getElementById('adminPSub')?.value || '',
    desc,
    inStock: document.getElementById('adminPInStock').checked,
    freeShipping: document.getElementById('adminPFreeShipping').checked,
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
  if (!cloudSaved) {
    return toast('הנתונים נשארו בטופס, אבל לא נשמרו בענן. בדקי חיבור והרשאות ניהול ונסי לשמור שוב.');
  }
  if (cloudSaved && old) {
    const oldColorImages = Object.values(old.images || {}).flatMap(value => Array.isArray(value) ? value : [value]);
    const newColorImages = Object.values(colorImages).flatMap(value => Array.isArray(value) ? value : [value]);
    const removedImages = [...(old.galleryImages || []).filter(u => !galleryImages.includes(u)), ...(old.detailImages || []).filter(u => !detailImages.includes(u)), ...oldColorImages.filter(u => !newColorImages.includes(u))];
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
    const deletedImages = [...(p.galleryImages || []), ...(p.detailImages || []), ...Object.values(p.images || {}).flatMap(value => Array.isArray(value) ? value : [value])];
    if (deletedImages.length) cloudSaveChain.then(ok => { if (ok) removeCloudImages(deletedImages); });
  }
  renderAdminList();
  resetAdminForm();
  if (cloudSaved) toast('המוצר הוסר מהקטלוג');
}

