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
loadShopStock();
if (Number(window.SHOP_STOCK_CONFIG?.refreshMs) > 0) setInterval(loadShopStock, Number(window.SHOP_STOCK_CONFIG.refreshMs));
renderCart();
let savedTheme = null;
try { savedTheme = localStorage.getItem(THEME_KEY); } catch { /* אחסון חסום בדפדפן הזה */ }
applyTheme(savedTheme || 'כחול');
renderShopInfo();
try { route(); }
catch (error) {
  console.error('Route failed', error);
  const appEl = document.getElementById('app');
  if (appEl) appEl.innerHTML = '<div class="empty">אירעה שגיאה בטעינת העמוד. <a class="inline-link" href="./">לרענון</a></div>';
}
window.addEventListener('shop-supabase-ready', () => { loadCloudCatalog(); });
loadCloudCatalog();
// טיימר גיבוי: אם הקטלוג מהענן לא הגיע תוך 2.5 שניות, מציגים את הקטלוג המקומי (והענן יעדכן כשיגיע)
setTimeout(() => { if (!catalogReady) { catalogReady = true; rerenderCurrent(); } }, 2500);
