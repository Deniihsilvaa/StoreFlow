import crypto from "crypto";

/**
 * Script para gerar secrets JWT seguros
 * Execute: npx tsx scripts/generate-env-secrets.ts
 */

function generateSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString("hex");
}

console.log("🔐 Gerando secrets para JWT...\n");

const jwtSecret = generateSecret(32);
const refreshTokenSecret = generateSecret(32);

console.log("Adicione estas variáveis ao seu arquivo .env:\n");
console.log("=".repeat(60));
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`REFRESH_TOKEN_SECRET=${refreshTokenSecret}`);
console.log("=".repeat(60));
console.log("\n💡 Nota: Para SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY,");
console.log("   acesse o dashboard do Supabase em: https://app.supabase.com");
console.log("   Vá em: Settings → API");
console.log("\n📝 Exemplo completo do .env:");
console.log(`
NODE_ENV=development
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-anon-key-aqui"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key-aqui"
JWT_SECRET=${jwtSecret}
REFRESH_TOKEN_SECRET=${refreshTokenSecret}
LOG_LEVEL=info
`);

