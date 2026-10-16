"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cleanSupabaseUrl } from "./supabase-url";

let client: SupabaseClient | null | undefined;

/** Public (read-only) Supabase client for watching live games. Null when not configured. */
export function supabaseBrowser() {
  if (client !== undefined) return client;
  const url = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim().replace(
    /^["']|["']$/g,
    "",
  );
  client =
    url && key
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;
  return client;
}
