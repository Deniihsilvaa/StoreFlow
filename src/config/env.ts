import { z } from "zod";

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  SUPABASE_URL: z.string().url("SUPABASE_URL deve ser uma URL válida"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY é obrigatório"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY é obrigatório"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET deve possuir pelo menos 32 caracteres"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]),
});

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  const formatted = parsedEnv.error.errors
    .map(({ path, message }) => `${path.join(".") || "env"}: ${message}`)
    .join("\n - ");

  throw new Error(
    `Falha ao validar variáveis de ambiente:\n - ${formatted}`,
  );
}

export const env = parsedEnv.data;
export type Env = typeof env;

