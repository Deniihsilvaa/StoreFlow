import pino from "pino";

import { env } from "@/config/env";

const isDev = env.NODE_ENV !== "production";

// Configuração simplificada do logger para evitar problemas com pino-pretty
export const logger = pino({
  level: env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: {
    service: "storeflow-backend",
    environment: env.NODE_ENV,
  },
  ...(isDev && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
});

export type Logger = typeof logger;

