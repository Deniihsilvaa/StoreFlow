import styles from "./page.module.css";

export default function Home() {
  const apiEndpoints = [
    {
      method: "POST",
      path: "/api/auth/customer/login",
      description: "Login de cliente",
    },
    {
      method: "POST",
      path: "/api/auth/merchant/login",
      description: "Login de comerciante",
    },
    {
      method: "POST",
      path: "/api/auth/logout",
      description: "Logout",
    },
    {
      method: "GET",
      path: "/api/auth/profile",
      description: "Perfil do usuário autenticado",
    },
    {
      method: "POST",
      path: "/api/auth/refresh",
      description: "Renovar token de acesso",
    },
    {
      method: "GET",
      path: "/api/customers",
      description: "Listar clientes",
    },
    {
      method: "GET",
      path: "/api/customers/[customerId]",
      description: "Obter cliente por ID",
    },
    {
      method: "GET",
      path: "/api/stores",
      description: "Listar lojas",
    },
    {
      method: "GET",
      path: "/api/stores/[storeId]",
      description: "Obter loja por ID",
    },
    {
      method: "GET",
      path: "/api/stores/[storeId]/products",
      description: "Listar produtos de uma loja",
    },
    {
      method: "GET",
      path: "/api/stores/[storeId]/orders",
      description: "Listar pedidos de uma loja",
    },
    {
      method: "GET",
      path: "/api/products",
      description: "Listar produtos",
    },
    {
      method: "GET",
      path: "/api/products/[productId]",
      description: "Obter produto por ID",
    },
    {
      method: "GET",
      path: "/api/orders",
      description: "Listar pedidos",
    },
    {
      method: "GET",
      path: "/api/orders/[orderId]",
      description: "Obter pedido por ID",
    },
  ];

  const getMethodClass = (method: string) => {
    const methodLower = method.toLowerCase();
    const methodClassMap: Record<string, string> = {
      get: styles.methodget || "",
      post: styles.methodpost || "",
      put: styles.methodput || "",
      delete: styles.methoddelete || "",
    };
    const methodClass = methodClassMap[methodLower] || "";
    return `${styles.method} ${methodClass}`;
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <div className={styles.status}>
            <span className={styles.statusDot}></span>
            <h1>API StoreFlow está rodando! 🚀</h1>
          </div>
          <p>
            Backend API desenvolvido com Next.js, Prisma e Supabase.
            Sistema de gerenciamento de vendas para lojas e clientes.
          </p>
        </div>

        <div className={styles.endpoints}>
          <h2 className={styles.endpointsTitle}>Endpoints Disponíveis</h2>
          <div className={styles.endpointsList}>
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className={styles.endpointItem}>
                <span className={getMethodClass(endpoint.method)}>
                  {endpoint.method}
                </span>
                <code className={styles.path}>{endpoint.path}</code>
                <span className={styles.description}>{endpoint.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Base URL: <code>http://localhost:3000</code>
          </p>
          <p className={styles.footerText}>
            <a href="/docs" style={{ color: "#3b82f6", textDecoration: "underline" }}>
              📚 Ver Documentação Completa
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
