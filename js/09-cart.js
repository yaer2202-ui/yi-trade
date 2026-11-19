/* ---------- עגלה ---------- */
const $ = s => document.querySelector(s);
const fmt = n => '₪' + n.toLocaleString('he-IL');
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem('tm_cart') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(i => i && typeof i.key === 'string' && Number(i.qty) > 0).map(i => {
      const p = PRODUCTS.find(x => x.id === i.pid);
      if (!p) return null;
      // עגלות ישנות (לפני וריאנטים): מקשרים לוריאנט המתאים או לברירת המחדל
      if (!i.vid || !findVariant(p, i.vid)) {
        if (i.vid) return null;
        const v = defaultVariant(p);
        return { key: p.id + '|' + v.id, pid: p.id, vid: v.id, qty: Number(i.qty) };
      }
      return { key: p.id + '|' + i.vid, pid: p.id, vid: i.vid, qty: Number(i.qty) };
    }).filter(Boolean);
  } catch { return []; }
}
let cart = loadCart();
const saveCart = () => { try { localStorage.setItem('tm_cart', JSON.stringify(cart)); } catch {} };

function addToCart(pid, vid) {
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p) return;
  const v = findVariant(p, vid) || defaultVariant(p);
  const key = pid + '|' + v.id;
  const row = cart.find(i => i.key === key);
  if (row) row.qty++; else cart.push({ key, pid, vid: v.id, qty: 1 });
  saveCart(); renderCart(); toast('נוסף לעגלה ✓');
}
function unitPrice(item) {
  const p = PRODUCTS.find(x => x.id === item.pid);
  if (!p) return 0;
  const v = findVariant(p, item.vid);
  return v ? v.price : p.price;
}
function cartTotal() { return cart.reduce((s, i) => s + unitPrice(i) * i.qty, 0); }

function renderCart() {
  $('#cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartTotal').textContent = fmt(cartTotal());
  const box = $('#cartItems');
  if (!cart.length) { box.innerHTML = '<div class="empty">העגלה ריקה</div>'; return; }
  box.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.pid);
    const v = findVariant(p, i.vid);
    const label = escapeHTML(variantLabel(v));
    const meta = escapeHTML(publicText(p.meta));
    return `<div class="line">
      <img src="${escapeHTML(productImage(p, v && v.color))}" alt="${escapeHTML(p.name)}" loading="lazy">
      <div class="line-info"><b>${escapeHTML(p.name)}</b>
        ${label ? `<span>${label}</span>` : ''}
        ${meta ? `<span class="line-sub">${meta}</span>` : ''}
        ${v && v.sku ? `<span class="line-sku">מק״ט: <bdi dir="ltr">${escapeHTML(v.sku)}</bdi></span>` : ''}
        <div class="qty"><button type="button" aria-label="הפחתת כמות ${escapeHTML(p.name)}" data-act="dec" data-key="${escapeHTML(i.key)}">−</button><span aria-live="polite">${i.qty}</span><button type="button" aria-label="הגדלת כמות ${escapeHTML(p.name)}" data-act="inc" data-key="${escapeHTML(i.key)}">+</button></div>
      </div>
      <div style="text-align:left"><b>${fmt(unitPrice(i) * i.qty)}</b><br><button type="button" class="rm" aria-label="הסרת ${escapeHTML(p.name)} מהעגלה" data-act="rm" data-key="${escapeHTML(i.key)}">הסר</button></div>
    </div>`;
  }).join('');
}
function storageLabel(n) { return n >= 1024 ? (n / 1024) + 'TB' : n + 'GB'; }

$('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const it = cart.find(i => i.key === b.dataset.key); if (!it) return;
  if (b.dataset.act === 'inc') it.qty++;
  if (b.dataset.act === 'dec') it.qty--;
  if (b.dataset.act === 'rm') it.qty = 0;
  cart = cart.filter(i => i.qty > 0);
  saveCart(); renderCart();
});
let cartOpenTrigger = null;
const openCart = () => { const d = $('#cartDrawer'); cartOpenTrigger = document.activeElement; d.inert = false; d.classList.add('open'); $('#overlay').classList.add('open'); d.setAttribute('aria-hidden', 'false'); $('#cartBtn').setAttribute('aria-expanded', 'true'); $('#closeCart').focus(); };
const closeCart = () => { const d = $('#cartDrawer'); d.classList.remove('open'); $('#overlay').classList.remove('open'); d.setAttribute('aria-hidden', 'true'); d.inert = true; $('#cartBtn').setAttribute('aria-expanded', 'false'); if (cartOpenTrigger && typeof cartOpenTrigger.focus === 'function') cartOpenTrigger.focus(); cartOpenTrigger = null; };
$('#cartDrawer').inert = true;
$('#cartBtn').onclick = openCart;
$('#closeCart').onclick = closeCart;
$('#overlay').onclick = closeCart;
document.addEventListener('keydown', e => {
  const modal = document.getElementById('adminModal');
  const cart = document.getElementById('cartDrawer');
  if (e.key === 'Escape') { closeCart(); if(modal?.style.display==='flex') toggleAdminPanel(); return; }
  if (e.key !== 'Tab') return;
  const activeModal = modal?.style.display === 'flex' ? modal : (cart?.classList.contains('open') ? cart : null);
  if (!activeModal) return;
  const focusable = [...activeModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]')]
    .filter(el => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
$('#checkoutBtn').onclick = () => {
  if (!cart.length) return toast('העגלה ריקה');
  closeCart(); location.hash = '#/checkout';
};

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

