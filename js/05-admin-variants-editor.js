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
    const sources = Array.isArray(adminColorImages[c.name]) ? adminColorImages[c.name] : (adminColorImages[c.name] ? [adminColorImages[c.name]] : []);
    const thumbs = sources.map((src, i) => `<span class="adm-ci-thumb"><img src="${escapeHTML(src)}" alt="תמונה ${i + 1} לצבע ${escapeHTML(c.name)}"><button type="button" class="adm-ci-remove" data-color-image-index="${i}" aria-label="הסרת תמונה ${i + 1} לצבע ${escapeHTML(c.name)}">×</button></span>`).join('');
    return `<div class="adm-ci" data-color="${escapeHTML(c.name)}"><span class="adm-ci-dot" style="background:${/^#[0-9a-f]{6}$/i.test(c.hex || '') ? c.hex : UNKNOWN_HEX}"></span><b>${escapeHTML(c.name)}</b>
      ${thumbs || '<span class="adm-ci-none">אין תמונה (תוצג התמונה הכללית)</span>'}
      <label class="adm-ci-up"${sources.length >= 3 ? ' aria-disabled="true"' : ''}>${sources.length ? 'הוספת תמונות' : 'העלאת תמונות'}<input type="file" name="colorImage" accept="image/*" multiple class="adm-ci-file" aria-label="עד 3 תמונות לצבע ${escapeHTML(c.name)}"${sources.length >= 3 ? ' disabled' : ''}></label><small class="adm-ci-count">${sources.length} / 3</small></div>`;
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
    const input = e.target.closest('.adm-ci-file'); if (!input || !input.files.length) return;
    const color = input.closest('.adm-ci').dataset.color;
    try {
      const existing = Array.isArray(adminColorImages[color]) ? adminColorImages[color] : (adminColorImages[color] ? [adminColorImages[color]] : []);
      const room = Math.max(0, 3 - existing.length);
      const added = await Promise.all([...input.files].slice(0, room).map(file => compressProductImage(file)));
      adminColorImages[color] = [...existing, ...added].slice(0, 3);
    }
    catch (err) { toast(err.message || 'לא הצלחתי לקרוא את התמונה'); }
    renderAdminColorImages();
  });
  document.getElementById('adminColorImages')?.addEventListener('click', e => {
    const remove = e.target.closest('.adm-ci-remove'); if (!remove) return;
    const row = remove.closest('.adm-ci'), color = row.dataset.color;
    const sources = Array.isArray(adminColorImages[color]) ? [...adminColorImages[color]] : (adminColorImages[color] ? [adminColorImages[color]] : []);
    sources.splice(Number(remove.dataset.colorImageIndex), 1);
    if (sources.length) adminColorImages[color] = sources; else delete adminColorImages[color];
    renderAdminColorImages();
  });
  renderAdminVariants([blankAdminVariant()], '');
})();

