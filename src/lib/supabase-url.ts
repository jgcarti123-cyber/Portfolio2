/**
 * Cleans up a Supabase project URL pasted into an environment variable. If the value contains a
 * *.supabase.co address, that address is used whatever surrounds it (a missing "h" in https, quotes,
 * a "NAME=" prefix, spaces, trailing slashes). Otherwise the value is tidied and given https://.
 */
export function cleanSupabaseUrl(raw: string | undefined): string {
  const v = (raw ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!v) return "";
  const host = v.match(/[a-z0-9-]+\.supabase\.co/i)?.[0];
  if (host) return `https://${host.toLowerCase()}`;
  const withScheme = /^https?:\/\//i.test(v)
    ? v
    : `https://${v.replace(/^\/+/, "")}`;
  return withScheme.replace(/\/+$/, "");
}
