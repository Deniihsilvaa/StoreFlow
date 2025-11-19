"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DocItem {
  title: string;
  path: string;
  category: string;
}

interface DocNavigationProps {
  items: DocItem[];
  initialPath?: string;
}

export function DocNavigation({ items, initialPath = "" }: DocNavigationProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["api", "guides"])
  );

  // Calcular currentPath diretamente do pathname (valor derivado, não precisa de estado)
  const currentPath = useMemo(() => {
    if (pathname) {
      return pathname.replace("/docs/", "") || "";
    }
    return initialPath;
  }, [pathname, initialPath]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, DocItem[]>);

  const categoryLabels: Record<string, string> = {
    api: "API",
    guides: "Guias",
    components: "Componentes",
    hooks: "Hooks",
  };

  return (
    <>
      <div className="doc-nav-header">
        <h2>Documentação</h2>
      </div>
      <div className="doc-nav-content">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="doc-nav-category">
            <button
              className="doc-nav-category-toggle"
              onClick={() => toggleCategory(category)}
            >
              <span className="doc-nav-category-icon">
                {expandedCategories.has(category) ? "▼" : "▶"}
              </span>
              <span className="doc-nav-category-label">
                {categoryLabels[category] || category}
              </span>
            </button>
            {expandedCategories.has(category) && (
              <ul className="doc-nav-list">
                {categoryItems.map((item) => {
                  const href = item.path === "" ? "/docs" : `/docs/${item.path}`;
                  const isActive = 
                    (item.path === "" && (currentPath === "" || currentPath === "README")) ||
                    (item.path !== "" && currentPath === item.path);
                  
                  return (
                    <li key={item.path}>
                      <Link
                        href={href}
                        className={`doc-nav-item ${isActive ? "active" : ""}`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

