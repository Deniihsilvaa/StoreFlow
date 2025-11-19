import { PrismaClient } from "@prisma/client";

async function testConnection() {
  const prisma = new PrismaClient({
    log: ["error"],
  });

  try {
    console.log("🔌 Testando conexão com o banco de dados...\n");

    // Verifica se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL não encontrada no arquivo .env");
      process.exit(1);
    }

    console.log("📝 DATABASE_URL configurada:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@"));

    // Testa a conexão fazendo uma query simples
    await prisma.$connect();
    console.log("✅ Prisma conectado com sucesso!");

    // Tenta fazer uma query simples para verificar se o banco está acessível
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Query de teste executada com sucesso:", result);

    // Verifica se a tabela customers existe (se o schema foi aplicado)
    try {
      const customerCount = await prisma.customers.count();
      console.log(`✅ Tabela 'customers' encontrada! Total de registros: ${customerCount}`);
    } catch (error) {
      console.log("⚠️  Tabela 'customers' não encontrada. Execute 'npm run prisma:db-push' para criar as tabelas.");
    }

    // Mostra informações do banco
    try {
      const dbInfo = await prisma.$queryRaw<Array<{ version: string }>>`
        SELECT version() as version
      `;
      console.log("\n📊 Informações do banco de dados:");
      console.log("   Versão:", dbInfo[0]?.version?.split("\n")[0] || "Não disponível");
    } catch (error) {
      console.log("\n⚠️  Não foi possível obter informações do banco de dados");
    }

    await prisma.$disconnect();
    console.log("\n✅ Conexão fechada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao conectar com o banco de dados:");
    
    if (error instanceof Error) {
      console.error("   Mensagem:", error.message);
      
      if (error.message.includes("P1001")) {
        console.error("\n💡 Dica: Verifique se o banco de dados está rodando e se a DATABASE_URL está correta no arquivo .env");
      } else if (error.message.includes("P1000")) {
        console.error("\n💡 Dica: Verifique as credenciais do banco de dados no arquivo .env");
      } else if (error.message.includes("P1003")) {
        console.error("\n💡 Dica: O banco de dados não existe. Crie o banco primeiro.");
      } else if (error.message.includes("P1017")) {
        console.error("\n💡 Dica: O servidor fechou a conexão. Verifique se o banco está acessível.");
      }
    } else {
      console.error(error);
    }

    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();

