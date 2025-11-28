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

export type OrderItemComplete = {
  id: string | null;
  order_id: string | null;
  product_id: string | null;
  product_name: string | null;
  product_family: string | null;
  quantity: number | null;
  unit_price: number | null;
  unit_cost_price: number | null;
  total_price: number | null;
  observations: string | null;
  deleted_at: Date | null;
  created_at: Date | null;
  store_id: string | null;
  order_status: string | null;
  product_family_original: string | null;
  product_image_url: string | null;
  customizations: unknown | null;
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
    // IMPORTANTE: status é um ENUM e precisa de cast explícito na comparação
    if (params.status) {
      conditions.push(`status = $${paramIndex}::"orders"."order_status_enum"`);
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

  async getOrderById(
    orderId: string,
    userId: string,
  ): Promise<{
    order: OrderDetailed;
    items: OrderItemComplete[];
  }> {
    // Buscar pedido da view orders_detailed
    const orderQuery = `
      SELECT 
        id, store_id, customer_id, delivery_option_id, fulfillment_method,
        pickup_slot, total_amount, delivery_fee, status, payment_method,
        payment_status, estimated_delivery_time, observations, cancellation_reason,
        deleted_at, created_at, updated_at, store_name, store_slug,
        customer_name, customer_phone, delivery_street, delivery_number,
        delivery_neighborhood, delivery_city, delivery_state, delivery_zip_code,
        delivery_option_name, delivery_option_fee, items_count, total_items, status_history
      FROM views.orders_detailed
      WHERE id = $1::uuid AND deleted_at IS NULL
    `;

    const orderResult = await (prisma as unknown as {
      $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<OrderDetailed[]>;
    }).$queryRawUnsafe(orderQuery, orderId);

    if (!orderResult || orderResult.length === 0) {
      throw new Error("PEDIDO_NAO_ENCONTRADO");
    }

    const order = orderResult[0];

    // Verificar se o usuário tem permissão (é o cliente do pedido)
    // Buscar customer pelo auth_user_id
    const customerQuery = `
      SELECT id FROM public.customers WHERE auth_user_id = $1::uuid AND deleted_at IS NULL
    `;
    const customerResult = await (prisma as unknown as {
      $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<Array<{ id: string }>>;
    }).$queryRawUnsafe(customerQuery, userId);

    if (customerResult.length > 0) {
      const customerId = customerResult[0].id;
      if (order.customer_id !== customerId) {
        throw new Error("SEM_PERMISSAO");
      }
    }

    // Buscar itens do pedido da view order_items_complete
    const itemsQuery = `
      SELECT 
        id, order_id, product_id, product_name, product_family,
        quantity, unit_price, unit_cost_price, total_price, observations,
        deleted_at, created_at, store_id, order_status, 
        product_family_original, product_image_url, customizations
      FROM views.order_items_complete
      WHERE order_id = $1::uuid AND deleted_at IS NULL
    `;

    const itemsResult = await (prisma as unknown as {
      $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<OrderItemComplete[]>;
    }).$queryRawUnsafe(itemsQuery, orderId);

    // Transformar os dados
    const transformedOrder: OrderDetailed = {
      ...order,
      total_amount: order.total_amount ? Number(order.total_amount) : null,
      delivery_fee: order.delivery_fee ? Number(order.delivery_fee) : null,
      delivery_option_fee: order.delivery_option_fee ? Number(order.delivery_option_fee) : null,
      items_count: order.items_count ? Number(order.items_count) : null,
      total_items: order.total_items ? Number(order.total_items) : null,
    };

    const transformedItems: OrderItemComplete[] = (itemsResult || []).map((item) => ({
      ...item,
      unit_price: item.unit_price ? Number(item.unit_price) : null,
      unit_cost_price: item.unit_cost_price ? Number(item.unit_cost_price) : null,
      total_price: item.total_price ? Number(item.total_price) : null,
    }));

    return { order: transformedOrder, items: transformedItems };
  }

  async createOrder(
    input: {
      storeId: string;
      customerId: string;
      deliveryOptionId?: string;
      fulfillmentMethod: "delivery" | "pickup";
      paymentMethod: "credit_card" | "debit_card" | "pix" | "cash";
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        observations?: string;
        customizations?: Array<{
          customizationId: string;
          value: string | number | boolean;
        }>;
      }>;
      deliveryAddress?: {
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
        complement?: string;
      };
      pickupSlot?: string;
      observations?: string;
    },
  ): Promise<OrderDetailed> {
    // Validar se a loja existe e está ativa
    const storeQuery = `
      SELECT id, is_active, min_order_value, delivery_fee, free_delivery_above,
             accepts_payment_credit_card, accepts_payment_debit_card,
             accepts_payment_pix, accepts_payment_cash,
             fulfillment_delivery_enabled, fulfillment_pickup_enabled
      FROM public.stores
      WHERE id = $1::uuid AND deleted_at IS NULL
    `;

    const storeResult = (await (prisma as unknown as {
      $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<Array<{
        id: string;
        is_active: boolean;
        min_order_value: number;
        delivery_fee: number;
        free_delivery_above: number | null;
        accepts_payment_credit_card: boolean;
        accepts_payment_debit_card: boolean;
        accepts_payment_pix: boolean;
        accepts_payment_cash: boolean;
        fulfillment_delivery_enabled: boolean;
        fulfillment_pickup_enabled: boolean;
      }>>;
    }).$queryRawUnsafe(
      storeQuery,
      input.storeId,
    )) as Array<{
      id: string;
      is_active: boolean;
      min_order_value: number;
      delivery_fee: number;
      free_delivery_above: number | null;
      accepts_payment_credit_card: boolean;
      accepts_payment_debit_card: boolean;
      accepts_payment_pix: boolean;
      accepts_payment_cash: boolean;
      fulfillment_delivery_enabled: boolean;
      fulfillment_pickup_enabled: boolean;
    }>;

    if (storeResult.length === 0) {
      throw new Error("Loja não encontrada");
    }

    const store = storeResult[0];

    if (!store.is_active) {
      throw new Error("Loja não está ativa");
    }

    // Validar método de atendimento
    if (input.fulfillmentMethod === "delivery" && !store.fulfillment_delivery_enabled) {
      throw new Error("Loja não aceita entregas");
    }

    if (input.fulfillmentMethod === "pickup" && !store.fulfillment_pickup_enabled) {
      throw new Error("Loja não aceita retiradas");
    }

    // Validar método de pagamento
    const paymentMethodMap: Record<string, keyof typeof store> = {
      credit_card: "accepts_payment_credit_card",
      debit_card: "accepts_payment_debit_card",
      pix: "accepts_payment_pix",
      cash: "accepts_payment_cash",
    };

    const paymentField = paymentMethodMap[input.paymentMethod];
    if (!store[paymentField]) {
      throw new Error(`Loja não aceita pagamento via ${input.paymentMethod}`);
    }

    // Validar produtos e calcular totais
    let subtotal = 0;
    const productIds = input.items.map((item) => item.productId);

    // Construir query com múltiplos parâmetros para cada produto
    const productPlaceholders = productIds.map((_, index) => `$${index + 1}::uuid`).join(',');
    const productsQuery = `
      SELECT id, price, is_active, store_id
      FROM public.products
      WHERE id IN (${productPlaceholders}) AND deleted_at IS NULL
    `;

    const productsResult = (await (prisma as unknown as {
      $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<Array<{
        id: string;
        price: number;
        is_active: boolean;
        store_id: string;
      }>>;
    }).$queryRawUnsafe(
      productsQuery,
      ...productIds,
    )) as Array<{
      id: string;
      price: number;
      is_active: boolean;
      store_id: string;
    }>;

    if (productsResult.length !== productIds.length) {
      throw new Error("Um ou mais produtos não foram encontrados");
    }

    // Validar se todos os produtos pertencem à loja e estão ativos
    for (const product of productsResult) {
      if (product.store_id !== input.storeId) {
        throw new Error("Produto não pertence à loja especificada");
      }
      if (!product.is_active) {
        throw new Error("Um ou mais produtos não estão ativos");
      }
    }

    // Calcular subtotal
    for (const item of input.items) {
      const product = productsResult.find((p) => p.id === item.productId);
      if (!product) continue;

      // Usar o preço do banco de dados, não o enviado pelo cliente
      subtotal += Number(product.price) * item.quantity;
    }

    // Validar valor mínimo do pedido
    if (subtotal < Number(store.min_order_value)) {
      throw new Error(
        `Valor mínimo do pedido é R$ ${Number(store.min_order_value).toFixed(2)}`,
      );
    }

    // Calcular taxa de entrega
    let deliveryFee = 0;
    if (input.fulfillmentMethod === "delivery") {
      if (input.deliveryOptionId) {
        // Buscar taxa da opção de entrega
        const deliveryOptionQuery = `
          SELECT fee
          FROM public.store_delivery_options
          WHERE id = $1::uuid AND store_id = $2::uuid AND deleted_at IS NULL
        `;

        const deliveryOptionResult = (await (prisma as unknown as {
          $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<Array<{ fee: number }>>;
        }).$queryRawUnsafe(
          deliveryOptionQuery,
          input.deliveryOptionId,
          input.storeId,
        )) as Array<{ fee: number }>;

        if (deliveryOptionResult.length > 0) {
          deliveryFee = Number(deliveryOptionResult[0].fee);
        }
      } else {
        // Usar taxa padrão da loja
        deliveryFee = Number(store.delivery_fee);
      }

      // Verificar se há entrega grátis
      if (
        store.free_delivery_above &&
        subtotal >= Number(store.free_delivery_above)
      ) {
        deliveryFee = 0;
      }
    }

    const totalAmount = subtotal + deliveryFee;

    // Buscar informações de produtos e customizações ANTES da transação (batch)
    const productInfoQuery = `
      SELECT id, name, family
      FROM public.products
      WHERE id IN (${productIds.map((_, i) => `$${i + 1}::uuid`).join(',')})
    `;
    const productInfoResult = (await (prisma as unknown as {
      $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<Array<{
        id: string; name: string; family: string;
      }>>;
    }).$queryRawUnsafe(productInfoQuery, ...productIds)) as Array<{
      id: string; name: string; family: string;
    }>;

    // Coletar IDs de customizações para buscar em batch
    const customizationIds: string[] = [];
    for (const item of input.items) {
      if (item.customizations) {
        for (const c of item.customizations) {
          if (!customizationIds.includes(c.customizationId)) {
            customizationIds.push(c.customizationId);
          }
        }
      }
    }

    let customizationsInfo: Array<{
      id: string; name: string; customization_type: string; selection_type: string; price: number;
    }> = [];

    if (customizationIds.length > 0) {
      const custQuery = `
        SELECT id, name, customization_type, selection_type, price
        FROM public.product_customizations
        WHERE id IN (${customizationIds.map((_, i) => `$${i + 1}::uuid`).join(',')})
      `;
      customizationsInfo = (await (prisma as unknown as {
        $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<typeof customizationsInfo>;
      }).$queryRawUnsafe(custQuery, ...customizationIds)) as typeof customizationsInfo;
    }

    // Criar pedido usando transação com timeout maior
    const orderId = await (prisma as unknown as {
      $transaction: <T>(callback: (tx: {
        $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown[]>;
      }) => Promise<T>, options?: { timeout: number }) => Promise<T>;
    }).$transaction(async (tx) => {
      // Inserir pedido
      const insertOrderQuery = `
        INSERT INTO orders.orders (
          store_id, customer_id, delivery_option_id, fulfillment_method,
          pickup_slot, total_amount, delivery_fee, status, payment_method,
          payment_status, observations, created_at, updated_at
        )
        VALUES (
          $1::uuid, $2::uuid, $3::uuid, $4::"orders"."fulfillment_method_enum",
          $5::timestamptz, $6::decimal, $7::decimal, 'pending'::"orders"."order_status_enum", $8::"orders"."payment_method_enum",
          'pending'::"orders"."payment_status_enum", $9::text, NOW(), NOW()
        )
        RETURNING id
      `;

      const orderResult = (await tx.$queryRawUnsafe(
        insertOrderQuery,
        input.storeId,
        input.customerId,
        input.deliveryOptionId || null,
        input.fulfillmentMethod,
        input.pickupSlot || null,
        totalAmount.toFixed(2),
        deliveryFee.toFixed(2),
        input.paymentMethod,
        input.observations || null,
      )) as Array<{ id: string }>;

      const newOrderId = orderResult[0].id;

      // Inserir itens do pedido
      for (const item of input.items) {
        const product = productsResult.find((p) => p.id === item.productId);
        const productInfo = productInfoResult.find((p) => p.id === item.productId);
        if (!product || !productInfo) continue;

        const unitPrice = Number(product.price);
        const totalPrice = unitPrice * item.quantity;

        const insertItemQuery = `
          INSERT INTO orders.order_items (
            order_id, product_id, product_name, product_family, quantity, 
            unit_price, total_price, observations, created_at
          )
          VALUES (
            $1::uuid, $2::uuid, $3::text, $4::"orders"."product_family_enum", $5::int, 
            $6::decimal, $7::decimal, $8::text, NOW()
          )
          RETURNING id
        `;

        const itemResult = (await tx.$queryRawUnsafe(
          insertItemQuery,
          newOrderId,
          item.productId,
          productInfo.name,
          productInfo.family,
          item.quantity,
          unitPrice.toFixed(2),
          totalPrice.toFixed(2),
          item.observations || null,
        )) as Array<{ id: string }>;

        const itemId = itemResult[0].id;

        // Inserir customizações
        if (item.customizations && item.customizations.length > 0) {
          for (const customization of item.customizations) {
            const custInfo = customizationsInfo.find((c) => c.id === customization.customizationId);
            if (!custInfo) continue;

            const custUnitPrice = Number(custInfo.price);
            const custQuantity = typeof customization.value === 'number' 
              ? customization.value 
              : (customization.value === true || customization.value === 'true' ? 1 : 0);
            const custTotalPrice = custUnitPrice * custQuantity;

            const insertCustomizationQuery = `
              INSERT INTO orders.order_item_customizations (
                order_item_id, customization_id, customization_name, customization_type, 
                selection_type, quantity, unit_price, total_price, created_at
              )
              VALUES (
                $1::uuid, $2::uuid, $3::text, $4::"orders"."product_customization_type_enum", 
                $5::"orders"."selection_type_enum", $6::int, $7::decimal, $8::decimal, NOW()
              )
            `;

            await tx.$queryRawUnsafe(
              insertCustomizationQuery,
              itemId,
              customization.customizationId,
              custInfo.name,
              custInfo.customization_type,
              custInfo.selection_type,
              custQuantity,
              custUnitPrice.toFixed(2),
              custTotalPrice.toFixed(2),
            );
          }
        }
      }

      // Inserir endereço de entrega se necessário
      if (input.fulfillmentMethod === "delivery" && input.deliveryAddress) {
        const insertAddressQuery = `
          INSERT INTO orders.order_delivery_addresses (
            order_id, street, number, neighborhood, city, state, zip_code, complement, created_at
          )
          VALUES (
            $1::uuid, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text, NOW()
          )
        `;

        await tx.$queryRawUnsafe(
          insertAddressQuery,
          newOrderId,
          input.deliveryAddress.street,
          input.deliveryAddress.number,
          input.deliveryAddress.neighborhood,
          input.deliveryAddress.city,
          input.deliveryAddress.state,
          input.deliveryAddress.zipCode,
          input.deliveryAddress.complement || null,
        );
      }

      return newOrderId;
    }, { timeout: 15000 });

    // Buscar pedido criado da view orders_detailed
    const orderQuery = `
      SELECT
        id, store_id, customer_id, delivery_option_id, fulfillment_method,
        pickup_slot, total_amount, delivery_fee, status, payment_method,
        payment_status, estimated_delivery_time, observations, cancellation_reason,
        deleted_at, created_at, updated_at, store_name, store_slug, customer_name,
        customer_phone, delivery_street, delivery_number, delivery_neighborhood,
        delivery_city, delivery_state, delivery_zip_code, delivery_option_name,
        delivery_option_fee, items_count, total_items, status_history
      FROM views.orders_detailed
      WHERE id = $1::uuid
      LIMIT 1
    `;

    const orderResult = (await (prisma as unknown as {
      $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<OrderDetailed[]>;
    }).$queryRawUnsafe(
      orderQuery,
      orderId,
    )) as OrderDetailed[];

    if (orderResult.length === 0) {
      throw new Error("Erro ao buscar pedido criado");
    }

    const order = orderResult[0];

    return {
      ...order,
      total_amount: order.total_amount ? Number(order.total_amount) : null,
      delivery_fee: order.delivery_fee ? Number(order.delivery_fee) : null,
      delivery_option_fee: order.delivery_option_fee
        ? Number(order.delivery_option_fee)
        : null,
      items_count: order.items_count ? Number(order.items_count) : null,
      total_items: order.total_items ? Number(order.total_items) : null,
    };
  }
}

export const ordersService = new OrdersService();

