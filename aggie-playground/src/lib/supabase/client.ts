"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** Browser client. Uses only the public anon key; row-level security does the protecting. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wdxdodredyficbycgrni.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_HivAYYtPuqMGo02a4hToKg_7UFeqCw_",
    ) as unknown as SupabaseClient;
  }
  return client;
}
