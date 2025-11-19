/**
 * Script para validar se todas as variáveis de ambiente necessárias estão configuradas
 * 
 * Nota: Este script assume que as variáveis já estão carregadas (via .env ou sistema)
 */

import { existsSync } from "fs";
import { join } from "path";

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean | string;
}

const envVars: EnvVar[] = [
  {
    name: "DATABASE_URL",
    required: true,
    description: "URL de conexão com o banco de dados PostgreSQL",
    validate: (value) => {
      if (!value.startsWith("postgresql://")) {
        return "DATABASE_URL deve começar com 'postgresql://'";
      }
      return true;
    },
  },
  {
    name: "DIRECT_URL",
    required: true,
    description: "URL direta de conexão com o banco (sem pooler)",
    validate: (value) => {
      if (!value.startsWith("postgresql://")) {
        return "DIRECT_URL deve começar com 'postgresql://'";
      }
      return true;
    },
  },
  {
    name: "SUPABASE_URL",
    required: true,
    description: "URL do projeto Supabase",
    validate: (value) => {
      if (!value.includes("supabase.co")) {
        return "SUPABASE_URL deve ser uma URL do Supabase";
      }
      return true;
    },
  },
  {
    name: "SUPABASE_ANON_KEY",
    required: true,
    description: "Chave anônima do Supabase",
    validate: (value) => {
      if (value.length < 50) {
        return "SUPABASE_ANON_KEY parece estar incompleta";
      }
      return true;
    },
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Chave de service role do Supabase",
    validate: (value) => {
      if (value.length < 50) {
        return "SUPABASE_SERVICE_ROLE_KEY parece estar incompleta";
      }
      return true;
    },
  },
  {
    name: "JWT_SECRET",
    required: true,
    description: "Secret para assinatura de JWT",
    validate: (value) => {
      if (value.length < 32) {
        return "JWT_SECRET deve ter pelo menos 32 caracteres";
      }
      return true;
    },
  },
  {
    name: "NODE_ENV",
    required: false,
    description: "Ambiente de execução (development/production)",
    validate: (value) => {
      const valid = ["development", "production", "test"];
      if (!valid.includes(value)) {
        return `NODE_ENV deve ser um de: ${valid.join(", ")}`;
      }
      return true;
    },
  },
  {
    name: "LOG_LEVEL",
    required: false,
    description: "Nível de log (debug/info/warn/error)",
  },
];

function validateEnvVar(envVar: EnvVar): {
  valid: boolean;
  error?: string;
  value?: string;
} {
  const value = process.env[envVar.name];

  if (envVar.required && !value) {
    return {
      valid: false,
      error: `Variável obrigatória não encontrada`,
    };
  }

  if (!value) {
    return { valid: true, value: undefined };
  }

  if (envVar.validate) {
    const validation = envVar.validate(value);
    if (validation !== true) {
      return {
        valid: false,
        error: validation as string,
        value: value.substring(0, 20) + "...",
      };
    }
  }

  return {
    valid: true,
    value: envVar.name.includes("KEY") || envVar.name.includes("SECRET")
      ? value.substring(0, 10) + "..."
      : value,
  };
}

async function testEnvVars() {
  console.log("🔍 Validando variáveis de ambiente...\n");

  // Verificar se arquivo .env existe
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.error("❌ Arquivo .env não encontrado!");
    console.error("   Crie um arquivo .env na raiz do projeto com as variáveis necessárias.\n");
    process.exit(1);
  }

  console.log("✅ Arquivo .env encontrado\n");

  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const envVar of envVars) {
    const result = validateEnvVar(envVar);
    const required = envVar.required ? "🔴" : "🟡";

    if (result.valid) {
      if (result.value !== undefined) {
        console.log(`✅ ${required} ${envVar.name}`);
        console.log(`   Valor: ${result.value}`);
      } else {
        console.log(`⚠️  ${required} ${envVar.name} (opcional, não definida)`);
      }
      console.log(`   ${envVar.description}\n`);
      passed++;
    } else {
      console.log(`❌ ${required} ${envVar.name}`);
      console.log(`   ${result.error}`);
      console.log(`   ${envVar.description}\n`);
      failed++;
      errors.push(`${envVar.name}: ${result.error}`);
    }
  }

  console.log("─".repeat(60));
  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Válidas: ${passed}`);
  console.log(`   ❌ Inválidas: ${failed}`);
  console.log(`   📝 Total: ${envVars.length}\n`);

  if (failed > 0) {
    console.log("❌ Erros encontrados:\n");
    errors.forEach((error) => console.log(`   - ${error}`));
    console.log("\n💡 Corrija os erros acima e execute o script novamente.\n");
    process.exit(1);
  } else {
    console.log("✅ Todas as variáveis de ambiente estão configuradas corretamente!\n");
    process.exit(0);
  }
}

testEnvVars();

