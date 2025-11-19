import { env } from "@/config/env";

export const supabaseConfig = {
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
};

export type SupabaseConfig = typeof supabaseConfig;

