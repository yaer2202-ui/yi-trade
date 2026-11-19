/* ---------- ניהול: תתי-קטגוריות (סדרות) בכל קטגוריה + בחירת סדרה בטופס המוצר ---------- */
function fillAdminSubSelect(catId, selected) {
  const sel = document.getElementById('adminPSub'); if (!sel) return;
  const cat = CATEGORIES.find(c => c.id === catId);
  const subs = (cat && cat.subs) || [];
  sel.innerHTML = '<option value="">אוטומטי (לפי שם הדגם)</option>' + subs.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)}</option>`).join('');
  sel.value = subs.some(s => s.id === selected) ? selected : '';
}
function renderAdminSubs() {
  const box = document.getElementById('adminSubList'); if (!box) return;
  const cat = CATEGORIES.find(c => c.id === document.getElementById('adminSubCat')?.value);
  const subs = (cat && cat.subs) || [];
  box.innerHTML = subs.length ? subs.map((s, i) => `<div class="adm-subrow" data-sub="${escapeHTML(s.id)}">
    <label class="sr-only" for="adminSubName-${i}">שם תת-קטגוריה ${i + 1}</label><input type="text" id="adminSubName-${i}" name="adminSubName-${i}" class="adm-fld adm-sub-name" maxlength="50" value="${escapeHTML(s.name)}">
    <label class="adm-sub-prem" for="adminSubPrem-${i}"><input type="checkbox" id="adminSubPrem-${i}" name="adminSubPrem-${i}" class="adm-sub-premium"${s.premium ? ' checked' : ''}> פרימיום</label>
    <button type="button" class="adm-sub-up" aria-label="הזזה למעלה: ${escapeHTML(s.name)}"${i === 0 ? ' disabled' : ''}>↑</button>
    <button type="button" class="adm-sub-down" aria-label="הזזה למטה: ${escapeHTML(s.name)}"${i === subs.length - 1 ? ' disabled' : ''}>↓</button>
    <button type="button" class="adm-sub-del" aria-label="הסרת ${escapeHTML(s.name)}">הסרה</button></div>`).join('')
    : '<span class="adm-ci-none">אין תתי-קטגוריות. המוצרים בקטגוריה מוצגים לפי יבואן בלבד.</span>';
}
function refreshAdminSubsPanel() {
  const sel = document.getElementById('adminSubCat'); if (!sel) return;
  const keep = sel.value;
  sel.innerHTML = CATEGORIES.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join('');
  if (CATEGORIES.some(c => c.id === keep)) sel.value = keep;
  renderAdminSubs();
  fillAdminSubSelect(document.getElementById('adminPCat')?.value, document.getElementById('adminPSub')?.value);
}
function installAdminSubs() {
  const form = document.getElementById('adminAddProductForm');
  if (form && !document.getElementById('adminPSub')) {
    const flags = form.querySelector('.adm-product-flags');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-direction:column;gap:6px';
    row.innerHTML = '<label for="adminPSub" style="color:#cbd5e1;font-size:14px">סדרה (תת-קטגוריה)</label><select id="adminPSub" name="adminPSub" style="padding:10px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#fff"></select>';
    if (flags && flags.parentNode === form) form.insertBefore(row, flags); else form.appendChild(row);
    document.getElementById('adminPCat')?.addEventListener('change', e => fillAdminSubSelect(e.target.value, ''));
    fillAdminSubSelect(document.getElementById('adminPCat')?.value, '');
  }
  const area = document.getElementById('adminManagementArea');
  if (!area || document.getElementById('adminSubPanel')) return;
  const panel = document.createElement('fieldset');
  panel.id = 'adminSubPanel'; panel.className = 'adm-variants adm-subs';
  panel.innerHTML = `<legend>תתי-קטגוריות (סדרות)</legend>
    <p class="adm-hint">בכל קטגוריה אפשר להוסיף תת-קטגוריה (למשל "סדרת Z"), לשנות לה שם, לסמן אותה כפרימיום ולסדר את הסדר שלהן. מוצרים של הסדרות המובנות משויכים אוטומטית לפי שם הדגם. כדי לשייך מוצר ידנית, בוחרים סדרה בטופס עריכת המוצר. בתוך כל סדרה, יבואן רשמי ומקביל מוצגים בנפרד.</p>
    <label for="adminSubCat" class="adm-lbl">קטגוריה</label><select id="adminSubCat" name="adminSubCat" class="adm-fld"></select>
    <div id="adminSubList" style="margin-top:10px"></div>
    <div class="adm-sub-add"><label class="sr-only" for="adminSubNewName">שם תת-קטגוריה חדשה</label><input type="text" id="adminSubNewName" name="adminSubNewName" class="adm-fld" maxlength="50" placeholder="שם תת-קטגוריה חדשה"><label class="adm-sub-prem" for="adminSubNewPremium"><input type="checkbox" id="adminSubNewPremium" name="adminSubNewPremium"> פרימיום</label><button type="button" id="adminSubAdd" class="adm-addv">+ הוספה</button></div>
    <div id="adminSubMsg" class="adm-vwarn" role="status" aria-live="polite"></div>`;
  const catPanel = document.getElementById('adminCategoryPanel');
  if (catPanel && catPanel.parentNode === area) catPanel.after(panel); else area.appendChild(panel);
  const curCat = () => CATEGORIES.find(c => c.id === document.getElementById('adminSubCat').value);
  document.getElementById('adminSubCat').addEventListener('change', renderAdminSubs);
  document.getElementById('adminSubAdd').addEventListener('click', () => {
    const cat = curCat(), input = document.getElementById('adminSubNewName'), name = input.value.trim();
    if (!cat) return;
    if (!name) return toast('נא להזין שם לתת-קטגוריה');
    cat.subs = cat.subs || [];
    if (cat.subs.length >= 30) return toast('אפשר עד 30 תתי-קטגוריות בקטגוריה');
    cat.subs.push({ id: 'sub-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name.slice(0, 50), premium: document.getElementById('adminSubNewPremium').checked, match: '' });
    input.value = ''; document.getElementById('adminSubNewPremium').checked = false;
    saveCategories(); toast('תת-הקטגוריה נוספה');
  });
  const list = document.getElementById('adminSubList');
  list.addEventListener('change', e => {
    const row = e.target.closest('.adm-subrow'), cat = curCat(); if (!row || !cat) return;
    const sub = cat.subs.find(s => s.id === row.dataset.sub); if (!sub) return;
    if (e.target.classList.contains('adm-sub-name')) {
      const name = e.target.value.trim().slice(0, 50);
      if (!name) { e.target.value = sub.name; return toast('שם התת-קטגוריה לא יכול להיות ריק'); }
      sub.name = name; saveCategories(); toast('השם עודכן');
    } else if (e.target.classList.contains('adm-sub-premium')) { sub.premium = e.target.checked; saveCategories(); }
  });
  list.addEventListener('click', e => {
    const row = e.target.closest('.adm-subrow'), cat = curCat(); if (!row || !cat) return;
    const i = cat.subs.findIndex(s => s.id === row.dataset.sub); if (i < 0) return;
    if (e.target.closest('.adm-sub-up') && i > 0) { [cat.subs[i - 1], cat.subs[i]] = [cat.subs[i], cat.subs[i - 1]]; saveCategories(); }
    else if (e.target.closest('.adm-sub-down') && i < cat.subs.length - 1) { [cat.subs[i + 1], cat.subs[i]] = [cat.subs[i], cat.subs[i + 1]]; saveCategories(); }
    else if (e.target.closest('.adm-sub-del')) {
      if (!confirm(`להסיר את "${cat.subs[i].name}"? המוצרים שלה לא יימחקו, והם יוצגו תחת "דגמים נוספים" או לפי סדרה אחרת שמתאימה להם.`)) return;
      cat.subs.splice(i, 1); saveCategories(); toast('תת-הקטגוריה הוסרה');
    }
  });
  refreshAdminSubsPanel();
}
installAdminExtras();

