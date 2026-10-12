/** Public Supabase configuration shared by the browser and server API routes. */
export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wdxdodredyficbycgrni.supabase.co";

export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_HivAYYtPuqMGo02a4hToKg_7UFeqCw_";

// These built-in public values are valid fallbacks, so missing Vercel build vars must not
// disable auth and data loading when the app can still connect to its configured project.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
