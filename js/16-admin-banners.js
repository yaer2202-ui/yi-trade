/* ---------- ניהול: עורך הבאנרים ושדה 3 תמונות המפרט (נבנים דינמית בתוך פאנל הניהול) ---------- */
let adminBannerImages = [];
let adminBannerColorSet = false;
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
  adminBannerColorSet = !!cfg.color;
  const colorEl = document.getElementById('adminBannerColor'); if (colorEl) colorEl.value = cfg.color || '#ffffff';
  const allEl = document.getElementById('adminBannerColorAll'); if (allEl) allEl.checked = false;
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
  let color = adminBannerColorSet ? document.getElementById('adminBannerColor').value : '';
  const applyAll = !reset && !!document.getElementById('adminBannerColorAll')?.checked;
  if (reset) { title = bannerDefaults(key).title; desc = bannerDefaults(key).desc; images = []; color = ''; }
  btn.disabled = true; msg.textContent = 'שומרת…';
  try {
    images = await Promise.all(images.map((src, i) => src.startsWith('data:image/') ? uploadProductImage(src, 'banners', i) : src));
  } catch (error) { btn.disabled = false; msg.textContent = ''; return toast(error.message || 'לא הצלחתי להעלות את התמונות. בדקי שהתחברת לניהול'); }
  const cfg = sanitizeBanners(productOverrides.__bannerConfig && productOverrides.__bannerConfig.banners);
  const def = bannerDefaults(key);
  cfg[key] = { title, desc, images, color };
  // "החלה על כל באנרי הקטגוריות": אותו צבע כיתוב לכל קטגוריה (שאר התוכן של כל באנר נשאר כמו שהוא)
  if (applyAll) CATEGORIES.forEach(c => { if (c.id !== key) cfg[c.id] = { ...(cfg[c.id] || { ...bannerDefaults(c.id), images: [] }), color }; });
  Object.keys(cfg).forEach(k => { const d = bannerDefaults(k), c = cfg[k]; if (!c.images.length && !c.color && c.title === d.title && c.desc === d.desc) delete cfg[k]; });
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
      <div class="adm-lbl">צבע הכיתוב בבאנר</div>
      <div class="adm-bn-color"><label class="sr-only" for="adminBannerColor">צבע הכיתוב</label><input type="color" id="adminBannerColor" name="adminBannerColor" value="#ffffff"><button type="button" id="adminBannerColorReset" class="adm-bn-reset">ברירת מחדל</button><label class="adm-sub-prem" for="adminBannerColorAll"><input type="checkbox" id="adminBannerColorAll" name="adminBannerColorAll"> להחיל על כל באנרי הקטגוריות</label></div>
      <div class="adm-lbl">תמונות <span id="adminBannerCount"></span></div>
      <div id="adminBannerImages" class="adm-thumbs"></div>
      <label for="adminBannerFiles" class="adm-lbl">הוספת תמונות</label><input type="file" id="adminBannerFiles" name="adminBannerFiles" accept="image/*" multiple>
      <div class="adm-bn-actions"><button type="button" id="adminBannerSave" class="adm-addv">שמירת הבאנר</button><button type="button" id="adminBannerReset" class="adm-bn-reset">איפוס לברירת מחדל</button></div>
      <div id="adminBannerMsg" class="adm-vwarn" role="status" aria-live="polite"></div>`;
    const catPanel = document.getElementById('adminCategoryPanel');
    if (catPanel && catPanel.parentNode === area) area.insertBefore(panel, catPanel); else area.appendChild(panel);
    document.getElementById('adminBannerKey').addEventListener('change', e => loadAdminBanner(e.target.value));
    document.getElementById('adminBannerColor').addEventListener('input', () => { adminBannerColorSet = true; });
    document.getElementById('adminBannerColorReset').addEventListener('click', () => { adminBannerColorSet = false; document.getElementById('adminBannerColor').value = '#ffffff'; });
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
  installAdminSubs();
}

