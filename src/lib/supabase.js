import { createClient } from "@supabase/supabase-js";

// Safe Supabase client.
// If env vars are missing, we keep the app running (demo/local mode)
// instead of throwing "supabaseUrl is required".

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

// Create a "real" client only when configured.
// Otherwise expose a tiny stub so imports don't crash.
export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: new Error("Supabase not configured") }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from: () => {
        throw new Error("Supabase not configured");
      },
    };
