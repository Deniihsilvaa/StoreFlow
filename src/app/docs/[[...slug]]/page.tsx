import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import { DocViewer } from "@/components/docs/DocViewer";
import { DocNavigation } from "@/components/docs/DocNavigation";
import styles from "./docs.module.css";

interface DocItem {
  title: string;
  path: string;
  category: string;
}

const DOCS_DIR = join(process.cwd(), "docs");

// Lista de documentos disponíveis
const DOCS: DocItem[] = [
  {
    title: "Visão Geral",
    path: "",
    category: "guides",
  },
  {
    title: "Início Rápido",
    path: "guides/getting-started",
    category: "guides",
  },
  {
    title: "Middlewares",
    path: "guides/middlewares",
    category: "guides",
  },
  {
    title: "Autenticação",
    path: "api/authentication",
    category: "api",
  },
  {
    title: "Perfil",
    path: "api/profile",
    category: "api",
  },
  {
    title: "Lojas",
    path: "api/stores",
    category: "api",
  },
  {
    title: "Produtos",
    path: "api/products",
    category: "api",
  },
  {
    title: "Clientes",
    path: "api/customers",
    category: "api",
  },
  {
    title: "Pedidos",
    path: "api/orders",
    category: "api",
  },
];

async function getDocContent(slug: string[]): Promise<string | null> {
  try {
    let path: string;
    if (slug.length === 0) {
      path = "README.md";
    } else if (slug[slug.length - 1] === "README") {
      // Se o último segmento for "README", remover e usar README.md
      path = slug.slice(0, -1).length > 0 
        ? `${slug.slice(0, -1).join("/")}/README.md`
        : "README.md";
    } else {
      path = `${slug.join("/")}.md`;
    }
    const filePath = join(DOCS_DIR, path);
    
    // Debug: log do caminho (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") {
      console.log("[Docs] Tentando ler arquivo:", filePath);
    }
    
    const content = await readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    // Log do erro em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.error("[Docs] Erro ao ler arquivo:", error);
    }
    return null;
  }
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }> | { slug?: string[] };
}) {
  // Resolver params se for Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  
  // Quando acessar /docs sem slug, resolvedParams.slug será undefined
  // Quando acessar /docs/api/authentication, resolvedParams.slug será ['api', 'authentication']
  const slug = resolvedParams.slug || [];
  const docPath = slug.length === 0 ? "" : slug.join("/");
  
  // Debug em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("[Docs] Slug recebido:", slug);
    console.log("[Docs] Doc path:", docPath);
  }
  
  const content = await getDocContent(slug);

  if (!content) {
    console.error("[Docs] Conteúdo não encontrado para slug:", slug);
    notFound();
  }

  // Calcular o path atual no servidor para evitar mismatch de hidratação
  const currentPath = docPath;

  return (
    <div className={styles.docsContainer}>
      <nav className={styles.docsNav}>
        <DocNavigation items={DOCS} initialPath={currentPath} />
      </nav>
      <main className={styles.docsMain}>
        <DocViewer content={content} />
      </main>
    </div>
  );
}

