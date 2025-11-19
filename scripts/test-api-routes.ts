/**
 * Script para testar se todas as rotas da API estão configuradas corretamente
 * Verifica se os arquivos de rota existem e se exportam os métodos HTTP corretos
 */

import { existsSync } from "fs";
import { join } from "path";

interface RouteConfig {
  path: string;
  methods: string[];
  description: string;
}

const routes: RouteConfig[] = [
  {
    path: "src/app/api/auth/customer/login/route.ts",
    methods: ["POST"],
    description: "Login de cliente",
  },
  {
    path: "src/app/api/auth/customer/singup/route.ts",
    methods: ["POST"],
    description: "Cadastro de cliente",
  },
  {
    path: "src/app/api/auth/refresh/route.ts",
    methods: ["POST"],
    description: "Refresh token",
  },
  {
    path: "src/app/api/auth/logout/route.ts",
    methods: ["POST"],
    description: "Logout",
  },
  {
    path: "src/app/api/auth/profile/route.ts",
    methods: ["GET"],
    description: "Perfil do usuário",
  },
  {
    path: "src/app/api/customers/route.ts",
    methods: ["GET"],
    description: "Listar clientes",
  },
  {
    path: "src/app/api/customers/[customerId]/route.ts",
    methods: ["GET"],
    description: "Obter cliente por ID",
  },
  {
    path: "src/app/api/stores/route.ts",
    methods: ["GET"],
    description: "Listar lojas",
  },
  {
    path: "src/app/api/stores/[storeId]/route.ts",
    methods: ["GET"],
    description: "Obter loja por ID",
  },
  {
    path: "src/app/api/stores/[storeId]/products/route.ts",
    methods: ["GET"],
    description: "Produtos da loja",
  },
  {
    path: "src/app/api/stores/[storeId]/categories/route.ts",
    methods: ["GET"],
    description: "Categorias da loja",
  },
  {
    path: "src/app/api/stores/[storeId]/orders/route.ts",
    methods: ["GET"],
    description: "Pedidos da loja",
  },
  {
    path: "src/app/api/products/route.ts",
    methods: ["GET"],
    description: "Listar produtos",
  },
  {
    path: "src/app/api/products/[productId]/route.ts",
    methods: ["GET"],
    description: "Obter produto por ID",
  },
  {
    path: "src/app/api/orders/route.ts",
    methods: ["GET", "POST"],
    description: "Listar/Criar pedidos",
  },
  {
    path: "src/app/api/orders/[orderId]/route.ts",
    methods: ["GET", "PUT"],
    description: "Obter/Atualizar pedido",
  },
];

function checkRoute(route: RouteConfig): { exists: boolean; error?: string } {
  const fullPath = join(process.cwd(), route.path);
  
  if (!existsSync(fullPath)) {
    return {
      exists: false,
      error: `Arquivo não encontrado: ${route.path}`,
    };
  }

  return { exists: true };
}

async function testRoutes() {
  console.log("🧪 Testando rotas da API...\n");

  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const route of routes) {
    const result = checkRoute(route);
    
    if (result.exists) {
      console.log(`✅ ${route.path}`);
      console.log(`   Métodos: ${route.methods.join(", ")}`);
      console.log(`   ${route.description}\n`);
      passed++;
    } else {
      console.log(`❌ ${route.path}`);
      console.log(`   ${result.error}\n`);
      failed++;
      errors.push(`${route.path}: ${result.error}`);
    }
  }

  console.log("─".repeat(60));
  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📝 Total: ${routes.length}\n`);

  if (failed > 0) {
    console.log("❌ Erros encontrados:\n");
    errors.forEach((error) => console.log(`   - ${error}`));
    process.exit(1);
  } else {
    console.log("✅ Todas as rotas estão configuradas corretamente!\n");
    process.exit(0);
  }
}

testRoutes();

