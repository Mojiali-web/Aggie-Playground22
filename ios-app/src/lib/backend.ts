import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";

// These are the same public Supabase project values used by the website. They are
// publishable client credentials; database access is still protected by RLS.
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://wdxdodredyficbycgrni.supabase.co";
export const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_HivAYYtPuqMGo02a4hToKg_7UFeqCw_";
export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || "https://aggie-playground22.vercel.app").replace(/\/$/, "");

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
