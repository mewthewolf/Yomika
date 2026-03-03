const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_URL = rawSupabaseUrl?.trim() ?? "";
export const SUPABASE_ANON_KEY = rawSupabaseAnonKey?.trim() ?? "";

export const HAS_SUPABASE_ENV =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
