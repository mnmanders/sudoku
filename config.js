// Supabase connection for account sync.
// Find both values in Supabase: Project Settings → API (or "Connect" → App frameworks).
// The key is the *public* one ("anon" or "publishable"): it is meant to be in browser code,
// and Row Level Security (see supabase/schema.sql) is what keeps each person's games private.
// NEVER put the "service_role" / secret key here.
// While these still say YOUR_..., the game runs in browser-only mode.
window.SUDOKU_CONFIG = {
  supabaseUrl: "https://wspzfokjsfnheujuonss.supabase.co",
  supabaseKey: "sb_publishable_MlPVnZoLypVWjPAwLyreQA_f7tUJLyD",
};
