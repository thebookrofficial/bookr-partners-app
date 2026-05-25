import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Config from "react-native-config";

// 1. Point to your NEW dedicated proxy for the Partner App
const supabaseUrl = Config.SUPABASE_URL || "https://v2.thebookr.in";

// 2. Strictly use the environment variable. NO hardcoded keys.
const supabaseAnonKey = Config.SUPABASE_ANON_KEY as string;

if (!supabaseAnonKey) {
  console.warn("⚠️ SUPABASE_ANON_KEY is missing from environment variables! Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || "MISSING_KEY", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // 3. Explicitly force headers to ensure they pass through Cloudflare
  // global: {
  //   headers: {
  //     apikey: supabaseAnonKey || "",
  //     Authorization: `Bearer ${supabaseAnonKey || ""}`,
  //   },
  // },
});
