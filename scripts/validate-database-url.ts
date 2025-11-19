/**
 * Script para validar e corrigir a DATABASE_URL
 * 
 * Caracteres especiais que precisam ser URL-encoded:
 * @ -> %40
 * # -> %23
 * $ -> %24
 * % -> %25
 * & -> %26
 * + -> %2B
 * / -> %2F
 * : -> %3A
 * = -> %3D
 * ? -> %3F
 */

function encodePassword(password: string): string {
  // Codifica apenas a senha, mantendo outros caracteres
  return encodeURIComponent(password);
}

function fixDatabaseUrl(url: string): string {
  try {
    // Tenta fazer parse da URL
    const urlObj = new URL(url);
    
    // Se a senha contém caracteres especiais, precisa ser codificada
    const password = urlObj.password;
    if (password && password !== decodeURIComponent(password)) {
      // Já está codificada
      return url;
    }
    
    // Codifica a senha se necessário
    if (password) {
      const encodedPassword = encodePassword(password);
      urlObj.password = encodedPassword;
      return urlObj.toString();
    }
    
    return url;
  } catch (error) {
    console.error("Erro ao processar URL:", error);
    return url;
  }
}

// Exemplo de uso
const exampleUrl = "postgresql://postgres.mnryjgztratsotaczjev:Dsmoke@29_97@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&search_path=public";

console.log("URL Original:");
console.log(exampleUrl);
console.log("\nURL Corrigida (senha codificada):");
console.log(fixDatabaseUrl(exampleUrl));

// Mostra apenas a parte da senha para referência
const password = "Dsmoke@29_97";
console.log("\nSenha original:", password);
console.log("Senha codificada:", encodePassword(password));

