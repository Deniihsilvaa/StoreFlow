import { prisma } from "@/infra/prisma/client";

import type { PaginationQuery } from "@/shared/types/pagination";

export type OrderDetailed = {
  id: string | null;
  store_id: string | null;
  customer_id: string | null;
  delivery_option_id: string | null;
  fulfillment_method: string | null;
  pickup_slot: Date | null;
  total_amount: number | null;
  delivery_fee: number | null;
  status: string | null;
  payment_method: string | null;
  payment_status: string | null;
  estimated_delivery_time: Date | null;
  observations: string | null;
  cancellation_reason: string | null;
  deleted_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  store_name: string | null;
  store_slug: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_street: string | null;
  delivery_number: string | null;
  delivery_neighborhood: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip_code: string | null;
  delivery_option_name: string | null;
  delivery_option_fee: number | null;
  items_count: number | null;
  total_items: number | null;
  status_history: unknown | null;
};

export type OrdersListParams = {
  customerId?: string;
  storeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export class OrdersService {
  async listOrders(
    params: OrdersListParams,
    pagination: PaginationQuery,
  ): Promise<{ items: OrderDetailed[]; total: number }> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Construir condições WHERE
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Sempre filtrar pedidos não deletados
    conditions.push(`(deleted_at IS NULL)`);

    // Filtro por cliente
    if (params.customerId) {
      conditions.push(`customer_id = $${paramIndex}::uuid`);
      values.push(params.customerId);
      paramIndex++;
    }

    // Filtro por loja
    if (params.storeId) {
      conditions.push(`store_id = $${paramIndex}::uuid`);
      values.push(params.storeId);
      paramIndex++;
    }

    // Filtro por status
    if (params.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }

    // Filtro por data inicial
    if (params.startDate) {
      conditions.push(`created_at >= $${paramIndex}::timestamp`);
      values.push(params.startDate);
      paramIndex++;
    }

    // Filtro por data final
    if (params.endDate) {
      conditions.push(`created_at <= $${paramIndex}::timestamp`);
      values.push(params.endDate);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM views.orders_detailed
      ${whereClause}
    `;

    // Query para buscar pedidos (ordenado por data de criação DESC)
    const ordersQuery = `
      SELECT 
        id,
        store_id,
        customer_id,
        delivery_option_id,
        fulfillment_method,
        pickup_slot,
        total_amount,
        delivery_fee,
        status,
        payment_method,
        payment_status,
        estimated_delivery_time,
        observations,
        cancellation_reason,
        deleted_at,
        created_at,
        updated_at,
        store_name,
        store_slug,
        customer_name,
        customer_phone,
        delivery_street,
        delivery_number,
        delivery_neighborhood,
        delivery_city,
        delivery_state,
        delivery_zip_code,
        delivery_option_name,
        delivery_option_fee,
        items_count,
        total_items,
        status_history
      FROM views.orders_detailed
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    // Executar queries
    const [countResult, ordersResult] = await Promise.all([
      (prisma as unknown as {
        $queryRawUnsafe: (
          query: string,
          ...values: unknown[]
        ) => Promise<Array<{ total: number }>>;
      }).$queryRawUnsafe(countQuery, ...values.slice(0, -2)),
      (prisma as unknown as {
        $queryRawUnsafe: (
          query: string,
          ...values: unknown[]
        ) => Promise<OrderDetailed[]>;
      }).$queryRawUnsafe(ordersQuery, ...values),
    ]);

    const total = countResult[0]?.total || 0;
    const orders = ordersResult || [];

    // Transformar os dados
    const transformedOrders: OrderDetailed[] = orders.map((order) => ({
      ...order,
      total_amount: order.total_amount ? Number(order.total_amount) : null,
      delivery_fee: order.delivery_fee ? Number(order.delivery_fee) : null,
      delivery_option_fee: order.delivery_option_fee
        ? Number(order.delivery_option_fee)
        : null,
      items_count: order.items_count ? Number(order.items_count) : null,
      total_items: order.total_items ? Number(order.total_items) : null,
    }));

    return { items: transformedOrders, total };
  }
}

export const ordersService = new OrdersService();

