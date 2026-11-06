window.shopSupabase = null;
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
