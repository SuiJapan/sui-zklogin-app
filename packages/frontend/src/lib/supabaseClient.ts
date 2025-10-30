import { createClient } from "@supabase/supabase-js";

const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
});

// Supabase用のクライアントインスタンスを作成
export const supabase = createClient(
  requiredEnvVars.VITE_SUPABASE_URL,
  requiredEnvVars.VITE_SUPABASE_ANON_KEY,
);
