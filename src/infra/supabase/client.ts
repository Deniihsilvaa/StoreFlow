import { createClient } from "@supabase/supabase-js";

import { supabaseConfig } from "@/config/supabase";

// Cliente para operações administrativas (service role)
export const supabaseClient = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      storage: {
        getItem: () => {
          return Promise.resolve('FETCHED_COOKIE')
        },
        setItem: () => {},
        removeItem: () => {},
      },
    },
  },
);

// Cliente para autenticação (anon key)
export const supabaseAuthClient = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      persistSession: false,
    },
  },
);
