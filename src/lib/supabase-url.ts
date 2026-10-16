/**
 * Cleans up a Supabase project URL pasted into an environment variable: trims spaces and quotes,
 * drops an accidental "NAME=" prefix, adds https:// when missing and removes trailing slashes.
 */
export function cleanSupabaseUrl(raw: string | undefined): string {
  let v = (raw ?? "").trim().replace(/^["']|["']$/g, "").trim();
  v = v.replace(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*/i, "");
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v.replace(/\/+$/, "");
}
