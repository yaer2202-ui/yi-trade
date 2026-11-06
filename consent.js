/* =========================================================
   באנר הסכמה לעוגיות ולאחסון מקומי.
   האתר אינו משתמש באנליטיקה או בפרסום. אחסון "הכרחי" (עגלה, מטמון קטלוג, בחירת הסכמה)
   פועל תמיד. אחסון "העדפות" (מספר הזמנה אחרונה) נשמר רק לאחר "אישור הכל".
   ========================================================= */
(function () {
  'use strict';
  const KEY = 'yi_consent_v1';
  const VERSION = 1;

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.version === VERSION && (v.choice === 'all' || v.choice === 'necessary') ? v : null;
    } catch { return null; }
  }
  function write(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ version: VERSION, choice, at: new Date().toISOString() })); } catch { /* הבחירה תישמר לגלישה הנוכחית בלבד */ }
    window.__yiConsentChoice = choice;
  }
  const saved = read();
  window.__yiConsentChoice = saved ? saved.choice : null;

  // מותר לשמור "העדפות" רק אם המשתמש אישר הכל
  window.yiPreferencesAllowed = () => window.__yiConsentChoice === 'all';

  function removeOptional() {
    try { localStorage.removeItem('yi_last_order'); } catch { /* ignore */ }
  }

  let lastFocus = null;
  function close() {
    const el = document.getElementById('consentBanner');
    if (el) el.remove();
    if (lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  function choose(choice) {
    write(choice);
    if (choice === 'necessary') removeOptional();
    close();
    const t = document.getElementById('toast');
    if (t) {
      t.textContent = choice === 'all' ? 'ההעדפות נשמרו: אישור הכל' : 'ההעדפות נשמרו: אחסון הכרחי בלבד';
      t.classList.add('show');
      clearTimeout(t._c);
      t._c = setTimeout(() => t.classList.remove('show'), 2200);
    }
  }

  function open(fromUser) {
    if (document.getElementById('consentBanner')) return;
    lastFocus = fromUser ? document.activeElement : null;
    const box = document.createElement('section');
    box.id = 'consentBanner';
    box.className = 'consent-banner';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-labelledby', 'consentTitle');
    box.innerHTML = `
      <h2 id="consentTitle">הגדרות עוגיות ואחסון מקומי</h2>
      <p>האתר משתמש באחסון מקומי בדפדפן כדי להפעיל את העגלה ולטעון מהר. אחסון הכרחי פועל תמיד. בנוסף, ניתן לאשר שמירת העדפות (כמו מספר ההזמנה האחרונה). אין באתר פרסום או מעקב שיווקי.
      <a href="#/cookies">מדיניות עוגיות</a> · <a href="#/privacy">מדיניות פרטיות</a></p>
      <div class="consent-actions">
        <button type="button" class="btn-purple" id="consentAccept">אישור הכל</button>
        <button type="button" class="btn-ghost" id="consentReject">דחיית הכל</button>
      </div>`;
    document.body.appendChild(box);
    document.getElementById('consentAccept').addEventListener('click', () => choose('all'));
    document.getElementById('consentReject').addEventListener('click', () => choose('necessary'));
    if (fromUser) document.getElementById('consentAccept').focus();
  }

  function init() {
    if (!window.__yiConsentChoice) open(false);
    else if (window.__yiConsentChoice === 'necessary') removeOptional();
    const btn = document.getElementById('cookieSettingsBtn');
    if (btn) btn.addEventListener('click', () => open(true));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
