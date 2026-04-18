// src/lib/supabase.ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Note: Replace this with however you currently load .env variables in your RN CLI app
// (e.g., using 'react-native-config' or 'react-native-dotenv')
import Config from "react-native-config";

const supabaseUrl = Config.SUPABASE_URL as string;
const supabaseAnonKey = Config.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not needed for native apps
  },
});
