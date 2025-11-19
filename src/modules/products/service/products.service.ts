import { prisma } from "@/infra/prisma/client";

import type { PaginationQuery } from "@/shared/types/pagination";

export type ProductEnriched = {
  id: string;
  store_id: string | null;
  name: string | null;
  description: string | null;
  price: number | null;
  cost_price: number | null;
  family: string | null;
  image_url: string | null;
  category: string | null;
  custom_category: string | null;
  is_active: boolean | null;
  preparation_time: number | null;
  nutritional_info: unknown | null;
  deleted_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  store_name: string | null;
  store_slug: string | null;
  store_category: string | null;
  customizations_count: number | null;
  extra_lists_count: number | null;
  available_customizations: unknown | null;
};

export type ProductsListParams = {
  storeId?: string;
  category?: string;
  isActive?: boolean;
  search?: string;
};

class ProductsService {
  async listProducts(
    params: ProductsListParams,
    pagination: PaginationQuery,
  ): Promise<{ items: ProductEnriched[]; total: number }> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Construir condições WHERE
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params.storeId) {
      conditions.push(`store_id = $${paramIndex}::uuid`);
      values.push(params.storeId);
      paramIndex++;
    }

    if (params.category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(params.category);
      paramIndex++;
    }

    if (params.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      values.push(params.isActive);
      paramIndex++;
    }

    if (params.search) {
      conditions.push(
        `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`,
      );
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    // Sempre filtrar produtos não deletados
    conditions.push(`(deleted_at IS NULL)`);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM views.products_enriched
      ${whereClause}
    `;

    // Query para buscar produtos
    const productsQuery = `
      SELECT 
        id,
        store_id,
        name,
        description,
        price,
        cost_price,
        family,
        image_url,
        category,
        custom_category,
        is_active,
        preparation_time,
        nutritional_info,
        deleted_at,
        created_at,
        updated_at,
        store_name,
        store_slug,
        store_category,
        customizations_count,
        extra_lists_count,
        available_customizations
      FROM views.products_enriched
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    // Executar queries
    const [countResult, productsResult] = await Promise.all([
      (prisma as any).$queryRawUnsafe(countQuery, ...values.slice(0, -2)),
      (prisma as any).$queryRawUnsafe(productsQuery, ...values),
    ]);

    const total = Number((countResult as Array<{ total: number }>)[0]?.total ?? 0);
    const items = (productsResult as ProductEnriched[]).map((product) => ({
      ...product,
      price: product.price ? Number(product.price) : null,
      cost_price: product.cost_price ? Number(product.cost_price) : null,
      customizations_count: product.customizations_count
        ? Number(product.customizations_count)
        : null,
      extra_lists_count: product.extra_lists_count
        ? Number(product.extra_lists_count)
        : null,
    }));

    return { items, total };
  }

  async getProductById(productId: string): Promise<ProductEnriched | null> {
    const query = `
      SELECT 
        id,
        store_id,
        name,
        description,
        price,
        cost_price,
        family,
        image_url,
        category,
        custom_category,
        is_active,
        preparation_time,
        nutritional_info,
        deleted_at,
        created_at,
        updated_at,
        store_name,
        store_slug,
        store_category,
        customizations_count,
        extra_lists_count,
        available_customizations
      FROM views.products_enriched
      WHERE id = $1::uuid AND deleted_at IS NULL
      LIMIT 1
    `;

    const result = (await (prisma as any).$queryRawUnsafe(
      query,
      productId,
    )) as ProductEnriched[];

    if (result.length === 0) {
      return null;
    }

    const product = result[0];
    return {
      ...product,
      price: product.price ? Number(product.price) : null,
      cost_price: product.cost_price ? Number(product.cost_price) : null,
      customizations_count: product.customizations_count
        ? Number(product.customizations_count)
        : null,
      extra_lists_count: product.extra_lists_count
        ? Number(product.extra_lists_count)
        : null,
    };
  }
}

export const productsService = new ProductsService();

