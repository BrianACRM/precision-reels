(function () {
  const config = window.PRECISION_SUPABASE || {};
  const isConfigured = Boolean(config.url && config.anonKey && window.supabase);
  window.PRECISION_CONFIG = config;
  window.PRECISION_SUPABASE_READY = isConfigured;
  window.precisionSupabase = isConfigured ? window.supabase.createClient(config.url, config.anonKey) : null;
})();
