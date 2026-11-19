/* ---------- הזמנות: שליחה, אישור ומעקב סטטוס ---------- */
const ORDER_STATUSES = ['התקבלה', 'בטיפול', 'נשלחה', 'נמסרה'];
const DELIVERY_SLOTS = ['בוקר (08:00–12:00)', 'צהריים (12:00–16:00)', 'אחר הצהריים (16:00–20:00)', 'גמיש – כל שעה'];
const ORDER_ID_RE = /^YI-(?:\d{3,8}|[A-F0-9]{8})$/i;
const LAST_ORDER_KEY = 'yi_last_order';
try {
  // ניקוי מידע ישן: בעבר נשמר גם טלפון בדפדפן. כעת נשמר לכל היותר מספר הזמנה, ורק בהסכמה.
  const savedLastOrder = readLocalJSON(LAST_ORDER_KEY, {});
  if (savedLastOrder && savedLastOrder.phone) {
    if (window.yiPreferencesAllowed && window.yiPreferencesAllowed()) localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id: savedLastOrder.id || '' }));
    else localStorage.removeItem(LAST_ORDER_KEY);
  }
} catch {}
const orderApi = () => String(window.ORDER_API_URL || '').trim();
function todayISO() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
function normPhone(v) { let n = String(v || '').replace(/\D/g, ''); if (n.startsWith('972')) n = '0' + n.slice(3); return n; }
function isValidPhone(v) { return /^0\d{8,9}$/.test(normPhone(v)); }
async function orderRequest(payload) {
  // text/plain כדי למנוע preflight – Apps Script לא תומך ב-OPTIONS
  const res = await fetch(orderApi(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  return res.json();
}

async function submitOrder(event) {
  event.preventDefault();
  const form = event.currentTarget, err = document.getElementById('orderError'), btn = document.getElementById('orderSubmit');
  const v = n => String(form.elements[n].value || '').trim();
  const fail = msg => { err.textContent = msg; };
  err.textContent = '';
  if (v('name').length < 2) return fail('נא להזין שם מלא');
  if (!isValidPhone(v('phone'))) return fail('נא להזין מספר טלפון תקין, למשל 050-0000000');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) return fail('נא להזין כתובת אימייל תקינה כדי שנוכל לשלוח אישור');
  if (v('address').length < 5) return fail('נא להזין כתובת מלאה לאספקה');
  if (!v('deliveryDate') || v('deliveryDate') < todayISO()) return fail('נא לבחור תאריך אספקה מהיום והלאה');
  if (!v('deliveryTime')) return fail('נא לבחור זמן אספקה');
  if (!form.elements.terms || !form.elements.terms.checked) return fail('כדי לשלוח הזמנה יש לאשר את תנאי השימוש, מדיניות הביטול ומדיניות הפרטיות');
  if (!cart.length) return fail('העגלה ריקה');
  const items = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.pid);
    if (!p) return null;
    const v = findVariant(p, i.vid);
    return { id: p.id, name: p.name, meta: [variantLabel(v), publicText(p.meta)].filter(Boolean).join(' · '), sku: v ? v.sku : '', color: v ? v.color : '', storage: v ? (v.storage || null) : null, ram: v ? (v.ram || null) : null, qty: i.qty, unit: unitPrice(i), total: unitPrice(i) * i.qty };
  }).filter(Boolean);
  const payload = {
    action: 'order', name: v('name'), phone: normPhone(v('phone')), email: v('email'), address: v('address'),
    deliveryDate: v('deliveryDate'), deliveryTime: v('deliveryTime'), notes: v('notes'),
    items, total: cartTotal(), website: v('website'),
    termsAccepted: true, termsAcceptedAt: new Date().toISOString()
  };
  btn.disabled = true; btn.textContent = 'שולחים…';
  try {
    const data = await orderRequest(payload);
    if (!data || !data.ok || !ORDER_ID_RE.test(data.id || '')) throw new Error((data && data.error) || 'bad response');
    try { if (window.yiPreferencesAllowed && window.yiPreferencesAllowed()) localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id: data.id })); } catch {}
    cart = []; saveCart(); renderCart();
    location.hash = '#/order-done/' + encodeURIComponent(data.id);
  } catch (error) {
    console.error('Order submit failed', error);
    fail('לא הצלחנו לשלוח את ההזמנה. נסו שוב בעוד רגע, או שלחו אותה אלינו בוואטסאפ.');
    btn.disabled = false; btn.textContent = 'שליחת הזמנה';
  }
}

function viewOrderDone(id) {
  if (!ORDER_ID_RE.test(id || '')) return viewNotFound();
  const safe = escapeHTML(id.toUpperCase());
  return `<section class="panel order-done">
    <div class="order-done-icon" aria-hidden="true">✓</div>
    <h1>ההזמנה התקבלה, תודה!</h1>
    <p>שלחנו אישור הזמנה למייל שהזנתם. אם לא רואים אותו, כדאי לבדוק גם בתיקיית הספאם.</p>
    <div class="order-number"><span>מספר הזמנה</span><b dir="ltr">${safe}</b></div>
    <p>עם מספר ההזמנה והטלפון אפשר לבדוק בכל רגע מה הסטטוס שלה.</p>
    <div class="checkout-actions" style="justify-content:center"><a class="btn-purple" href="#/order-status/${encodeURIComponent(id)}">מעקב הזמנה</a><a class="btn-ghost" href="#/">חזרה לחנות</a></div>
  </section>`;
}

function viewOrderStatus(id) {
  let last = {};
  try { last = readLocalJSON(LAST_ORDER_KEY, {}) || {}; } catch {}
  const preId = ORDER_ID_RE.test(id || '') ? id.toUpperCase() : (last.id || '');
  const prePhone = '';
  return `<div class="page-head"><div><div class="crumbs"><a href="#/">בית</a> › מעקב הזמנה</div><h1>מעקב הזמנה</h1></div></div>
  <section class="panel status-panel">
    <p class="form-note" style="margin-top:0">הזינו את מספר ההזמנה ואת הטלפון שהשארתם בהזמנה.</p>
    <form id="statusForm" class="status-form" novalidate>
      <div class="form-row">
        <div class="field"><label for="stId">מספר הזמנה</label><input id="stId" name="orderId" dir="ltr" maxlength="12" placeholder="YI-1001" autocomplete="off" value="${escapeHTML(preId)}"></div>
        <div class="field"><label for="stPhone">טלפון</label><input id="stPhone" name="phone" type="tel" inputmode="tel" maxlength="20" placeholder="050-0000000" value="${escapeHTML(prePhone)}"></div>
      </div>
      <button type="submit" class="btn-purple" id="stBtn">בדיקת סטטוס</button>
      <div id="statusError" class="form-error" role="alert"></div>
    </form>
    <div id="statusResult" aria-live="polite"></div>
  </section>`;
}

function renderOrderResult(o) {
  const cancelled = o.status === 'בוטלה';
  let idx = ORDER_STATUSES.indexOf(o.status); if (idx < 0) idx = 0;
  const timeline = cancelled
    ? '<div class="status-cancelled">ההזמנה בוטלה. לשאלות אפשר ליצור איתנו קשר.</div>'
    : `<ol class="timeline">${ORDER_STATUSES.map((s, i) => `<li class="${i < idx ? 'done' : i === idx ? 'current' : ''}"><span class="dot">${i < idx ? '✓' : i + 1}</span><span class="lbl">${escapeHTML(s)}</span></li>`).join('')}</ol>`;
  const items = (Array.isArray(o.items) ? o.items : []).map(x => `<li>${escapeHTML(x)}</li>`).join('');
  return `<div class="order-card">
    <div class="order-card-head"><div><small>הזמנה</small><b dir="ltr">${escapeHTML(o.id)}</b></div><span class="status-badge ${cancelled ? 'bad' : ''}">${escapeHTML(o.status || 'התקבלה')}</span></div>
    ${timeline}
    <dl class="order-meta">
      <div><dt>שם</dt><dd>${escapeHTML(o.name)}</dd></div>
      <div><dt>תאריך הזמנה</dt><dd>${escapeHTML(o.orderDate)}</dd></div>
      <div><dt>אספקה מבוקשת</dt><dd>${escapeHTML(o.deliveryDate)} · ${escapeHTML(o.deliveryTime)}</dd></div>
      <div><dt>סה״כ</dt><dd>${escapeHTML(o.total)}</dd></div>
    </dl>
    ${items ? `<h3>מה הוזמן</h3><ul class="order-items">${items}</ul>` : ''}
    ${o.notes ? `<div class="order-note"><b>הערות להזמנה:</b> ${escapeHTML(o.notes)}</div>` : ''}
  </div>`;
}

function bindOrderStatus() {
  const form = document.getElementById('statusForm'); if (!form) return;
  const idEl = document.getElementById('stId'), phoneEl = document.getElementById('stPhone');
  const err = document.getElementById('statusError'), out = document.getElementById('statusResult'), btn = document.getElementById('stBtn');
  const lookup = async () => {
    err.textContent = ''; out.innerHTML = '';
    const id = idEl.value.trim().toUpperCase(), phone = normPhone(phoneEl.value);
    if (!ORDER_ID_RE.test(id)) { err.textContent = 'מספר הזמנה נראה כך: YI-1001 או YI-AB12CD34'; return; }
    if (!isValidPhone(phone)) { err.textContent = 'נא להזין את מספר הטלפון שבו בוצעה ההזמנה'; return; }
    if (!orderApi()) { err.textContent = 'מעקב הזמנות עדיין לא הופעל באתר.'; return; }
    btn.disabled = true; btn.textContent = 'בודקים…';
    try {
      const data = await orderRequest({ action: 'status', id, phone });
      if (data && data.ok && data.order) out.innerHTML = renderOrderResult(data.order);
      else err.textContent = (data && data.error) || 'לא מצאנו הזמנה שמתאימה לפרטים. בדקו את מספר ההזמנה והטלפון.';
    } catch (error) {
      console.error('Status lookup failed', error);
      err.textContent = 'לא הצלחנו לבדוק את הסטטוס כרגע. נסו שוב בעוד רגע.';
    } finally { btn.disabled = false; btn.textContent = 'בדיקת סטטוס'; }
  };
  form.addEventListener('submit', e => { e.preventDefault(); lookup(); });
  if (idEl.value && phoneEl.value) lookup();
}

function bindCheckout() {
  const orderForm = document.getElementById('orderForm');
  if (orderForm) orderForm.addEventListener('submit', submitOrder);
  const box = document.getElementById('checkoutActions');
  if (!box || !cart.length) return;
  const wa = shopWhatsappNumber(), tel = shopPhoneNumber();
  const parts = [];
  if (wa) {
    const lines = cart.map(i => {
      const p = PRODUCTS.find(x => x.id === i.pid);
      const v = p ? findVariant(p, i.vid) : null;
      return '• ' + (p ? p.name : '') + (v && variantLabel(v) ? ' (' + variantLabel(v) + (v.sku ? ' · ' + v.sku : '') + ')' : '') + ' × ' + i.qty + ' – ' + fmt(unitPrice(i) * i.qty);
    }).join('\n');
    const text = 'שלום, אשמח להזמין:\n' + lines + '\nסה״כ: ' + fmt(cartTotal());
    parts.push(`<a class="${orderApi() ? 'btn-ghost' : 'btn-purple'}" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(text)}">${orderApi() ? 'או שליחה בוואטסאפ' : 'שליחת הזמנה בוואטסאפ'}</a>`);
  }
  if (tel) parts.push(`<a class="btn-ghost" href="tel:${escapeHTML(tel)}">התקשרו אלינו</a>`);
  parts.push('<a class="btn-ghost" href="#/">חזרה לחנות</a>');
  box.innerHTML = parts.join(' ');
  if (!wa && !tel && !orderApi()) { const note = document.getElementById('checkoutNote'); if (note) note.textContent = 'פרטי יצירת הקשר יתעדכנו בקרוב. אפשר להמשיך לעיין במוצרים.'; }
}

