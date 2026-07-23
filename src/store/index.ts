// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { create } from "zustand";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Profile interface matches V2 Blueprint Table 4.1: profiles
 * Stores personal identity data synced from the database.
 */
interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: "user" | "client" | "super_admin";
  account_status: "active" | "suspended" | "pending_verification" | "banned";
  city_id: string | null;
  version: number; // Required for Optimistic Locking
}

/**
 * ClientProfile interface matches V2 Blueprint Table 4.2: client_profiles
 * Stores business-specific metadata and financial info.
 */
interface ClientProfile {
  id: string;
  user_id: string;
  business_name: string;
  client_role: "owner" | "staff";
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  account_status: "active" | "suspended" | "pending_verification" | "banned";
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_account_name?: string | null; // UI helper for bank holder name
  permissions?: string[];
  assigned_venue_ids?: string[];
  version: number; // Required for Optimistic Locking
}

interface AuthState {
  session: Session | null;
  user: SupabaseUser | null; // Internal Supabase Auth object
  profile: Profile | null; // Database-driven personal info
  clientProfile: ClientProfile | null; // Database-driven business info
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setClientProfile: (profile: ClientProfile | null) => void;
  setInitialized: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  session: null,
  user: null,
  profile: null,
  clientProfile: null,
  isInitialized: false,
  setSession: session => set({ session, user: session?.user ?? null }),
  setProfile: profile => set({ profile }),
  setClientProfile: clientProfile => set({ clientProfile }),
  setInitialized: status => set({ isInitialized: status }),
}));

export * from "./serviceStore";
