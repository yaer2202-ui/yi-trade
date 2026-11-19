/* ----- "אנשים קנו גם": הצעות נלוות לפי סוג המוצר, עם קישור ישיר לקטגוריה המתאימה ----- */
function alsoBoughtSuggestions(p) {
  const extras = PRODUCTS.filter(x => x.cat === 'extras' && x.id !== p.id);
  const pick = (re, n = 1, not) => extras.filter(x => re.test(x.name) && !(not && not.test(x.name))).slice(0, n);
  const link = (label, cat, grp) => ({ label, href: '#/category/' + cat + (grp ? '/' + grp : '') });
  const n = p.name;
  const iphoneGen = (n.match(/iPhone\s*(\d+)/i) || [])[1];
  let items = [], links = [];
  if (p.cat === 'apple' && /iphone/i.test(n)) {
    const usbc = iphoneGen ? Number(iphoneGen) >= 15 : !/SE/i.test(n);
    items = [...pick(/airpods/i, 2, /max/i), ...pick(/20W/i, 1, /samsung/i), ...pick(usbc ? /Type-C ל-Type-C|USB-C to USB-C/i : /Lightning/i, 1, /אוזניות|EarPods/i)];
    links = [link('אוזניות ל-Apple', 'extras', 'headphones'), link('כבלים ומטענים לאייפון', 'extras', 'accessories'), link('Apple Watch', 'extras', 'watches')];
  } else if (p.cat === 'samsung') {
    items = [...pick(/galaxy buds/i, 2, /core|fe/i), ...pick(/samsung.*(45W|25W)/i, 1), ...pick(/power bank/i, 1)];
    links = [link('אוזניות Galaxy Buds', 'extras', 'headphones'), link('מטענים וכבלים', 'extras', 'accessories'), link('שעונים חכמים', 'extras', 'watches')];
  } else if (p.cat === 'xiaomi' || p.cat === 'kosher') {
    items = [...pick(/anker|jbl.*(wave|tune)/i, 2), ...pick(/power bank/i, 1), ...pick(/samsung.*45W|20W/i, 1)];
    links = [link('אוזניות', 'extras', 'headphones'), link('מטענים וסוללות גיבוי', 'extras', 'accessories')];
  } else if (p.cat === 'tablets') {
    items = [...pick(/anker|jbl.*(wave|tune)|buds/i, 2), ...pick(/power bank/i, 1), ...pick(/jbl.*(flip|go)/i, 1)];
    links = [link('אוזניות', 'extras', 'headphones'), link('רמקולים', 'extras', 'speakers'), link('מטענים ואביזרים', 'extras', 'accessories')];
  } else if (/airpods|apple/i.test(n)) {
    items = [...pick(/Type-C ל-Type-C|USB-C to USB-C/i, 1, /אוזניות|EarPods/i), ...pick(/20W/i, 1, /samsung/i)];
    links = [link('אייפונים', 'apple'), link('כבלים ומטענים', 'extras', 'accessories')];
  } else if (/buds|galaxy|samsung/i.test(n)) {
    items = [...pick(/samsung.*(45W|25W)/i, 1)];
    links = [link('טלפוני Samsung', 'samsung'), link('כבלים ומטענים', 'extras', 'accessories')];
  } else {
    links = [link('אוזניות', 'extras', 'headphones'), link('רמקולים', 'extras', 'speakers'), link('כבלים ומטענים', 'extras', 'accessories')];
  }
  const seen = new Set();
  items = items.filter(x => !seen.has(x.id) && seen.add(x.id));
  if (items.length < 3) extras.filter(x => !seen.has(x.id)).slice(0, 4 - items.length).forEach(x => items.push(x));
  return { items: items.slice(0, 4), links };
}
function alsoBoughtHTML(p) {
  const { items, links } = alsoBoughtSuggestions(p);
  if (!items.length && !links.length) return '';
  const cards = items.map(x => {
    const v = defaultVariant(x);
    const from = x.variants.some(y => y.price !== v.price) ? 'החל מ-' : '';
    return `<a class="also-card" href="${escapeHTML(productHref(x, v))}"><div class="also-img"><img src="${escapeHTML(productImage(x, v.color))}" alt="" loading="lazy"></div><b>${escapeHTML(x.name)}</b><span>${from}${fmt(v.price)}</span></a>`;
  }).join('');
  const linkRow = links.map(l => `<a class="also-link" href="${escapeHTML(l.href)}">${escapeHTML(l.label)} ←</a>`).join('');
  return `<section class="pdp-also" aria-labelledby="alsoTitle"><h2 id="alsoTitle">אביזרים ומוצרים מתאימים</h2>${cards ? `<div class="also-grid">${cards}</div>` : ''}<div class="also-links">${linkRow}</div></section>`;
}
function viewProduct(id, vid) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return viewNotFound();
  const cat = CATEGORIES.find(c => c.id === p.cat);
  if (!cat) return viewNotFound();
  const v = findVariant(p, vid) || defaultVariant(p);
  const stockState = stockDisplay(p, v);
  const specRows = Object.entries(p.specs || {}).filter(([k,val]) => !['דגם','פרטים','מחיר','הערה'].includes(k) && publicText(val)).map(([k,val]) => `<tr><td>${escapeHTML(k)}</td><td>${escapeHTML(publicText(val))}</td></tr>`).join('');
  return `<div class="crumbs"><a href="#/">בית</a> › <a href="#/category/${encodeURIComponent(cat.id)}">${escapeHTML(cat.name)}</a> › ${escapeHTML(p.name)}</div>
  <div class="pdp" data-pid="${escapeHTML(p.id)}" data-vid="${escapeHTML(v.id)}">
    <div class="pdp-media"><div class="pdp-frame"><img id="pdpImg" src="${escapeHTML(productImage(p, v.color))}" alt="${escapeHTML(p.name)}"></div><p class="pdp-disclaimer">ט.ל.ח – התמונה להמחשה בלבד</p><div class="pdp-gallery"${productImageList(p, v.color).length > 1 ? '' : ' hidden'}>${productImageList(p, v.color).map((src,i)=>`<button type="button" class="pdp-thumb ${i===0?'sel':''}" data-image="${escapeHTML(src)}" aria-label="הצגת תמונה ${i+1}"><img src="${escapeHTML(src)}" alt="" loading="lazy"></button>`).join('')}</div></div>
    <div class="pdp-info">
      <h1>${escapeHTML(p.name)} ${productSupplyType(p) ? `<span class="product-badge">${escapeHTML(productSupplyType(p))}</span>` : ''}</h1>
      <div class="pdp-buy">
        <div class="pdp-price" id="pdpPrice" aria-live="polite">${fmt(v.price)}</div>
        <div class="pdp-actions">
          <button type="button" class="btn-order" id="buyNow">להזמנה</button>
          <button type="button" class="btn-order alt" id="addBtn">הוספה לעגלה</button>
        </div>
      </div>
      <div class="pdp-stock-row"><span id="pdpStock" class="pdp-stock ${stockState.className}">${stockState.label}</span>${p.freeShipping ? '<span class="pdp-free-shipping">🚚 משלוח חינם</span>' : ''}</div>
      <div class="pdp-opts" id="pdpOpts">${optionsHTML(p, v)}</div>
      ${publicText(p.desc) ? `<p class="desc">${escapeHTML(publicText(p.desc))}</p>` : ''}
      <p class="pdp-sku" id="pdpSkuRow"${v.sku ? '' : ' hidden'}>מק״ט: <b id="pdpSku" dir="ltr">${escapeHTML(v.sku || '')}</b></p>
    </div>
    <ul class="pdp-trust" aria-label="יתרונות הרכישה">
      <li data-stock-benefit><span>✓</span><b>${stockState.available === null ? escapeHTML(stockState.label) : (stockState.available ? 'זמין במלאי' : 'לא זמין כרגע')}</b></li>
      <li><span>🚚</span>${p.freeShipping?'משלוח חינם':'משלוחים לכל הארץ'}</li>
      <li><span>🛡️</span>${WARRANTY_LABEL}</li>
      <li><span>🛍️</span>הזמנה בלי תשלום מקדים</li>
    </ul>
    ${(specRows || (p.detailImages || []).length) ? `<section class="pdp-full" aria-labelledby="fullSpecTitle"><h2 id="fullSpecTitle">מפרט מלא</h2>${specRows ? `<table class="fullspec-table">${specRows}</table>` : ''}${(p.detailImages || []).length ? `<div class="pdp-detail-imgs">${p.detailImages.map((src, i) => `<img src="${escapeHTML(src)}" alt="${escapeHTML(p.name)} – תמונת פירוט ${i + 1}" loading="lazy">`).join('')}</div>` : ''}</section>` : ''}
    ${alsoBoughtHTML(p)}
  </div>`;
}

function bindProduct(id) {
  const p = PRODUCTS.find(x => x.id === id); if (!p) return;
  const host = document.querySelector('.pdp');
  const current = () => findVariant(p, host && host.dataset.vid) || defaultVariant(p);
  host.addEventListener('click', event => {
    const button = event.target.closest('.pdp-thumb'); if (!button) return;
    $('#pdpImg').src = button.dataset.image;
    host.querySelectorAll('.pdp-thumb').forEach(t => t.classList.toggle('sel', t === button));
  });
  $('#addBtn').onclick = () => { addToCart(p.id, current().id); openCart(); };
  $('#buyNow').onclick = () => { addToCart(p.id, current().id); location.hash = '#/checkout'; };
}

function orderSummaryInner() {
  const rows = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.pid);
    if (!p) return '';
    const v = findVariant(p, i.vid);
    const meta = [variantLabel(v), publicText(p.meta), v && v.sku ? 'מק״ט ' + v.sku : ''].filter(Boolean).join(' · ');
    return `<div class="sum-line"><span>${escapeHTML(p.name)} × ${i.qty}${meta ? `<br><small style="color:#667085">${escapeHTML(meta)}</small>` : ''}</span><b>${fmt(unitPrice(i) * i.qty)}</b></div>`;
  }).join('');
  return `<h2>פריטים בעגלה</h2>${rows}
      <div class="sum-line sum-total"><span>סכום המוצרים</span><span>${fmt(cartTotal())}</span></div>${vatNote()}`;
}
/* הערת מע"מ: מוצגת רק אם הוגדר ב-shop-info.js (pricesIncludeVat: true / false) */
function vatNote() {
  const v = (window.SHOP_INFO || {}).pricesIncludeVat;
  if (v !== true && v !== false) return '';
  return `<p class="form-note">${v ? 'המחירים כוללים מע״מ.' : 'המחירים אינם כוללים מע״מ.'} עלות משלוח, אם קיימת, תוצג ותאושר לפני התחייבות.</p>`;
}
function viewCheckout() {
  if (!cart.length) return `<div class="empty"><h2>העגלה ריקה</h2><br><a class="btn-purple" href="#/">חזרה לחנות</a></div>`;
  const form = orderApi() ? `
      <form id="orderForm" class="order-form" novalidate>
        <div class="form-row">
          <div class="field"><label for="ofName">שם מלא *</label><input id="ofName" name="name" autocomplete="name" maxlength="80" required></div>
          <div class="field"><label for="ofPhone">טלפון *</label><input id="ofPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="050-0000000" required></div>
        </div>
        <div class="field"><label for="ofEmail">אימייל לאישור הזמנה *</label><input id="ofEmail" name="email" type="email" autocomplete="email" maxlength="120" dir="ltr" placeholder="name@example.com" required></div>
        <div class="field"><label for="ofAddress">כתובת לאספקה *</label><input id="ofAddress" name="address" autocomplete="street-address" maxlength="200" placeholder="עיר, רחוב ומספר בית" required></div>
        <div class="form-row">
          <div class="field"><label for="ofDate">תאריך אספקה מבוקש *</label><input id="ofDate" name="deliveryDate" type="date" min="${todayISO()}" required></div>
          <div class="field"><label for="ofTime">זמן אספקה *</label><select id="ofTime" name="deliveryTime" required><option value="">בחרו שעות</option>${DELIVERY_SLOTS.map(s => `<option>${escapeHTML(s)}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="ofNotes">הערות (לא חובה)</label><textarea id="ofNotes" name="notes" rows="3" maxlength="500" placeholder="צבע מועדף, קומה, הוראות הגעה…"></textarea></div>
        <label class="hp-field" for="ofWebsite" aria-hidden="true">אל תמלאו שדה זה<input type="text" id="ofWebsite" name="website" tabindex="-1" autocomplete="off"></label>
        <div class="field-check"><input type="checkbox" id="ofTerms" name="terms" required><label for="ofTerms">קראתי ואני מסכים/ה ל<a class="inline-link" href="#/terms" target="_blank" rel="noopener">תנאי השימוש וההזמנה</a>, ל<a class="inline-link" href="#/returns" target="_blank" rel="noopener">מדיניות הביטול וההחזרות</a> ול<a class="inline-link" href="#/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</a> *</label></div>
        <button type="submit" class="btn-purple wide" id="orderSubmit">שליחת הזמנה</button>
        <div id="orderError" class="form-error" role="alert"></div>
      </form>
      <p id="checkoutNote" class="form-note">התשלום אינו מתבצע באתר. אחרי שליחת ההזמנה נשלח אישור למייל ונחזור אליכם לתיאום האספקה.</p>
      <p class="form-note">יש כבר הזמנה? <a href="#/order-status" class="inline-link">מעקב סטטוס הזמנה</a></p>` :
    `<p id="checkoutNote">התשלום אינו מתבצע באתר. אפשר לשלוח לנו את סיכום העגלה ונמשיך משם.</p><br>`;
  return `<div class="page-head"><h1>סיכום והזמנה</h1></div>
  <div class="checkout">
    <section class="panel"><h2>${orderApi() ? 'פרטי ההזמנה' : 'שליחת הזמנה'}</h2>${form}<div class="checkout-actions" id="checkoutActions"></div></section>
    <aside class="panel" id="orderSummary">${orderSummaryInner()}</aside>
  </div>`;
}const viewNotFound = () => `<div class="empty"><h2>העמוד לא נמצא</h2><br><a class="btn-purple" href="#/">לדף הבית</a></div>`;

