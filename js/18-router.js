/* ---------- Router ---------- */
function renderNav(active) {
  const cur = on => on ? ' aria-current="page"' : '';
  const label = (full, compact) => `<span class="nav-label-full">${escapeHTML(full)}</span><span class="nav-label-compact">${escapeHTML(compact)}</span>`;
  const shortNames = { samsung: 'סמסונג', apple: 'Apple', xiaomi: 'Xiaomi', tablets: 'טאבלט', kosher: 'כשרים', extras: 'אביזרים' };
  $('#navLinks').innerHTML = `<a href="#/" aria-label="בית" class="${!active ? 'active' : ''}"${cur(!active)}>${label('בית', 'בית')}</a>` +
    CATEGORIES.map(c => `<a href="#/category/${encodeURIComponent(c.id)}" aria-label="${escapeHTML(c.name)}" class="${active === c.id ? 'active' : ''}"${cur(active === c.id)}>${label(c.name, shortNames[c.id] || c.name)}</a>`).join('') +
    `<a href="#/order-status" aria-label="מעקב הזמנה" class="${active === 'order-status' ? 'active' : ''}"${cur(active === 'order-status')}>${label('מעקב הזמנה', 'מעקב')}</a>`;
  const footerCategories = document.getElementById('footerCategories');
  if (footerCategories) footerCategories.innerHTML = CATEGORIES.map(c => `<a href="#/category/${encodeURIComponent(c.id)}">${escapeHTML(c.name)}</a>`).join('');
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
  else if (page === 'about') { app.innerHTML = renderAboutPage(); }
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
document.getElementById('adminShopInfoForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const val = id => String(document.getElementById(id)?.value || '').trim();
  const updated = { legalName:val('shopInfoLegalName').slice(0,120), businessId:val('shopInfoBusinessId').slice(0,40), address:val('shopInfoAddress').slice(0,200), phone:val('shopInfoPhone').slice(0,40), whatsapp:val('shopInfoWhatsapp').slice(0,40), email:val('shopInfoEmail').slice(0,160), hours:val('shopInfoHours').slice(0,200), about:val('shopInfoAbout').slice(0,3000), accessibilityCoordinator:{ name:val('shopInfoAccessName').slice(0,120), phone:val('shopInfoAccessPhone').slice(0,40), email:val('shopInfoAccessEmail').slice(0,160) } };
  window.SHOP_INFO = { ...(window.SHOP_INFO || {}), ...updated };
  productOverrides.__siteInfo = updated;
  const saved = await persistCatalog();
  renderShopInfo();
  toast(saved ? 'פרטי העסק נשמרו בענן' : 'שמירה מקומית בוצעה; השמירה בענן נכשלה');
});
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
