import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { HAS_SUPABASE_ENV, SUPABASE_ANON_KEY, SUPABASE_URL } from "../config/env";

export const supabase: SupabaseClient | null = HAS_SUPABASE_ENV
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: AsyncStorage,
        detectSessionInUrl: false,
      },
    })
  : null;
