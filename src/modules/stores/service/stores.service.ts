import { prisma } from "@/infra/prisma/client";

import type { ProductEnriched } from "@/modules/products/service/products.service";

export type StoreComplete = {
  id: string | null;
  merchant_id: string | null;
  name: string | null;
  slug: string | null;
  description: string | null;
  category: string | null;
  custom_category: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  rating: number | null;
  review_count: number | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  is_active: boolean | null;
  delivery_time: string | null;
  min_order_value: number | null;
  delivery_fee: number | null;
  free_delivery_above: number | null;
  accepts_payment_credit_card: boolean | null;
  accepts_payment_debit_card: boolean | null;
  accepts_payment_pix: boolean | null;
  accepts_payment_cash: boolean | null;
  fulfillment_delivery_enabled: boolean | null;
  fulfillment_pickup_enabled: boolean | null;
  fulfillment_pickup_instructions: string | null;
  deleted_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  legal_responsible_name: string | null;
  legal_responsible_document: string | null;
  terms_accepted_at: Date | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  address_complement: string | null;
  products_count: number | null;
  team_members_count: number | null;
  working_hours: unknown | null;
};

export type StoreWithProducts = StoreComplete & {
  products: ProductEnriched[];
};

export class StoresService {
  // eslint-disable-next-line class-methods-use-this
  async getStoreById(storeId: string): Promise<StoreWithProducts | null> {
    // 1. Buscar dados da loja na view stores_complete
    const storeQuery = `
      SELECT 
        id,
        merchant_id,
        name,
        slug,
        description,
        category,
        custom_category,
        avatar_url,
        banner_url,
        rating,
        review_count,
        primary_color,
        secondary_color,
        accent_color,
        text_color,
        is_active,
        delivery_time,
        min_order_value,
        delivery_fee,
        free_delivery_above,
        accepts_payment_credit_card,
        accepts_payment_debit_card,
        accepts_payment_pix,
        accepts_payment_cash,
        fulfillment_delivery_enabled,
        fulfillment_pickup_enabled,
        fulfillment_pickup_instructions,
        deleted_at,
        created_at,
        updated_at,
        legal_responsible_name,
        legal_responsible_document,
        terms_accepted_at,
        address_street,
        address_number,
        address_neighborhood,
        address_city,
        address_state,
        address_zip_code,
        address_complement,
        products_count,
        team_members_count,
        working_hours
      FROM views.stores_complete
      WHERE id = $1::uuid AND deleted_at IS NULL
      LIMIT 1
    `;

    const storeResult = (await (prisma as any).$queryRawUnsafe(
      storeQuery,
      storeId,
    )) as StoreComplete[];

    if (storeResult.length === 0) {
      return null;
    }

    const store = storeResult[0];

    // 2. Buscar produtos ativos da loja na view products_enriched
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
      WHERE store_id = $1::uuid 
        AND is_active = true 
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const productsResult = (await (prisma as any).$queryRawUnsafe(
      productsQuery,
      storeId,
    )) as ProductEnriched[];

    // 3. Transformar os dados
    const transformedStore: StoreComplete = {
      ...store,
      rating: store.rating ? Number(store.rating) : null,
      min_order_value: store.min_order_value ? Number(store.min_order_value) : null,
      delivery_fee: store.delivery_fee ? Number(store.delivery_fee) : null,
      free_delivery_above: store.free_delivery_above
        ? Number(store.free_delivery_above)
        : null,
      products_count: store.products_count ? Number(store.products_count) : null,
      team_members_count: store.team_members_count
        ? Number(store.team_members_count)
        : null,
    };

    const transformedProducts: ProductEnriched[] = productsResult.map((product) => ({
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

    return {
      ...transformedStore,
      products: transformedProducts,
    };
  }
}

export const storesService = new StoresService();

