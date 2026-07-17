export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once real Supabase credentials are present in .env.local. */
export function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("YOUR-PROJECT") &&
    SUPABASE_ANON_KEY.length > 20
  );
}
