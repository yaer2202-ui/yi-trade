/* טעינה לא חוסמת: הגופן וספריית Supabase נטענים ברקע, כך שהאתר מוצג גם אם אחד מהם איטי או חסום
   (מסנני אינטרנט, רשת סלולרית חלשה). אם הספרייה נטענת באיחור, הקטלוג מהענן מתעדכן אחר כך. */
window.shopSupabase = null;
window.shopSupabaseLoading = true;

(function () {
  // גופן Heebo: נוסף ב-JS (ולא כתג בראש הדף) כדי שלא יחסום את הצגת הדף. אם הוא לא נטען, האתר משתמש ב-Arial.
  try {
    var font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;900&display=swap';
    document.head.appendChild(font);
  } catch (e) { /* ignore */ }

  function done() {
    window.shopSupabaseLoading = false;
    try { window.dispatchEvent(new Event('shop-supabase-ready')); } catch (e) { /* ignore */ }
  }
  function init() {
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('Supabase library did not load');
      }
      window.shopSupabase = window.supabase.createClient(
        'https://amfbfqapsakxfbcvuvdb.supabase.co',
        'sb_publishable_Gakcs4YWbIVQ0lfxFC2zxw_wL0J3k8v'
      );
    } catch (error) {
      console.error('Supabase is unavailable; the storefront will use its local catalog.', error);
    }
    done();
  }

  try {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.async = true;
    s.onload = init;
    s.onerror = function () {
      console.error('Supabase is unavailable; the storefront will use its local catalog.');
      done();
    };
    document.head.appendChild(s);
  } catch (e) { done(); }
})();