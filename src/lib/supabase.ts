/**
 * @file supabase.ts
 * @description Supabase client initialisation for the Bookr Partner App.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                       ⚠️  DO NOT TOUCH THIS FILE ⚠️                      ║
 * ║                                                                          ║
 * ║  This file is intentionally kept SIMPLE and MINIMAL.                    ║
 * ║  Do NOT add a custom `fetch`, `AbortController`, timeout wrappers,      ║
 * ║  failover logic, or any other interception layer here.                  ║
 * ║                                                                          ║
 * ║  History (why this must stay simple):                                   ║
 * ║  ─────────────────────────────────────────────────────────────────────  ║
 * ║  • Versions 1.1.1 → 1.1.3 used this exact simple client and were       ║
 * ║    stable, fast (< 1 s startup), and never had session issues.          ║
 * ║  • A custom failoverFetch + AbortController was added post-1.1.3.       ║
 * ║    It caused ALL of the following production regressions:               ║
 * ║      – signInWithPassword aborted mid-flight → "Aborted" error         ║
 * ║      – Session tokens never saved to AsyncStorage → auto-logout         ║
 * ║        every 2-3 app opens                                              ║
 * ║      – OTP screen freezing after a failed login attempt                 ║
 * ║      – Slow startup due to extra async layers blocking init             ║
 * ║  • The file was reverted on 2026-07-16 and must remain as-is.           ║
 * ║                                                                          ║
 * ║  If you believe you need to change this file, speak to Prasad first.     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
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
});

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated.
AppState.addEventListener("change", state => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
