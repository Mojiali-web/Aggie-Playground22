"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseConfigured, supabaseUrl } from "./config";

let client: SupabaseClient | null = null;

export { supabaseConfigured };

/** Browser client. Uses only the public anon key; row-level security does the protecting. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
    ) as unknown as SupabaseClient;
  }
  return client;
}
