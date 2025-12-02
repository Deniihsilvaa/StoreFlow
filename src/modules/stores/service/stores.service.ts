import { prisma } from "@/infra/prisma/client";

import { ApiError } from "@/core/errors/ApiError";
import type { ProductEnriched } from "@/modules/products/service/products.service";
import type { UpdateStoreInput } from "@/modules/stores/dto/update-store.dto";

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
  // eslint-disable-next-line class-methods-use-this metodo de buscar por slug da loja
  async getStoreBySlug(storeSlug: string): Promise<StoreWithProducts | null> {
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
      WHERE slug = $1 AND deleted_at IS NULL
      LIMIT 1
    `;
    const storeResult = (await (prisma as any).$queryRawUnsafe(
      storeQuery,
      storeSlug,
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
      WHERE store_slug = $1 
        AND is_active = true 
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const productsResult = (await (prisma as any).$queryRawUnsafe(
      productsQuery,
      storeSlug,
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

  /**
   * Atualiza as informações da loja do merchant autenticado
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja a ser atualizada
   * @param input - Dados para atualização
   * @returns Loja atualizada
   * @throws ApiError.notFound se o merchant ou loja não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão para atualizar a loja
   */
  async updateStore(userId: string, storeId: string, input: UpdateStoreInput) {
    // 1. Buscar merchant pelo auth_user_id (CRÍTICO: sempre usar userId do token)
    const merchant = await prisma.merchants.findFirst({
      where: {
        auth_user_id: userId,
        deleted_at: null,
      },
      include: {
        stores: {
          where: {
            id: storeId,
            deleted_at: null,
          },
          select: { id: true },
        },
        store_merchant_members: {
          where: {
            store_id: storeId,
            deleted_at: null,
          },
          select: { store_id: true },
        },
      },
    });

    if (!merchant) {
      throw ApiError.notFound("Merchant não encontrado", "MERCHANT_NOT_FOUND");
    }

    // 2. Validar propriedade da loja (CRÍTICO: verificar se é dono ou membro)
    const isOwner = merchant.stores.some(s => s.id === storeId);
    const isMember = merchant.store_merchant_members.some(m => m.store_id === storeId);

    if (!isOwner && !isMember) {
      throw ApiError.forbidden("Você não tem permissão para atualizar esta loja");
    }

    // 3. Verificar se a loja existe
    const existingStore = await prisma.stores.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, merchant_id: true },
    });

    if (!existingStore) {
      throw ApiError.notFound("Loja não encontrada", "STORE_NOT_FOUND");
    }

    // 4. Validar nome único (se estiver sendo alterado)
    if (input.name && input.name !== existingStore.name) {
      const nameExists = await prisma.stores.findFirst({
        where: {
          name: input.name,
          merchant_id: merchant.id,
          id: { not: storeId },
          deleted_at: null,
        },
      });

      if (nameExists) {
        throw ApiError.validation(
          { name: ["Este nome já está em uso para outra loja"] },
          "Nome já cadastrado"
        );
      }
    }

    // 5. Atualizar usando transação para garantir consistência
    // Otimização: buscar todos os horários de uma vez para evitar múltiplas queries
    await prisma.$transaction(async (tx) => {
      // 5.1. Preparar dados de atualização da loja
      const storeUpdateData: {
        name?: string;
        description?: string | null;
        category?: "hamburgueria" | "pizzaria" | "pastelaria" | "sorveteria" | "cafeteria" | "padaria" | "comida_brasileira" | "comida_japonesa" | "doces" | "mercado" | "outros";
        custom_category?: string | null;
        is_active?: boolean;
        delivery_time?: string | null;
        min_order_value?: number;
        delivery_fee?: number;
        free_delivery_above?: number | null;
        accepts_payment_credit_card?: boolean;
        accepts_payment_debit_card?: boolean;
        accepts_payment_pix?: boolean;
        accepts_payment_cash?: boolean;
        primary_color?: string;
        secondary_color?: string;
        accent_color?: string;
        text_color?: string | null;
        updated_at: Date;
      } = {
        updated_at: new Date(),
      };

      if (input.name !== undefined) {
        storeUpdateData.name = input.name;
      }
      if (input.description !== undefined) {
        storeUpdateData.description = input.description || null;
      }
      if (input.category !== undefined) {
        storeUpdateData.category = input.category;
      }
      if (input.customCategory !== undefined) {
        storeUpdateData.custom_category = input.customCategory || null;
      }

      // Configurações
      if (input.settings) {
        if (input.settings.isActive !== undefined) {
          storeUpdateData.is_active = input.settings.isActive;
        }
        if (input.settings.deliveryTime !== undefined) {
          storeUpdateData.delivery_time = input.settings.deliveryTime || null;
        }
        if (input.settings.minOrderValue !== undefined) {
          // Valores são armazenados em reais (Decimal 10,2)
          storeUpdateData.min_order_value = input.settings.minOrderValue;
        }
        if (input.settings.deliveryFee !== undefined) {
          // Valores são armazenados em reais (Decimal 10,2)
          storeUpdateData.delivery_fee = input.settings.deliveryFee;
        }
        if (input.settings.freeDeliveryAbove !== undefined) {
          // Valores são armazenados em reais (Decimal 10,2)
          storeUpdateData.free_delivery_above = input.settings.freeDeliveryAbove || null;
        }
        if (input.settings.acceptsPayment) {
          if (input.settings.acceptsPayment.creditCard !== undefined) {
            storeUpdateData.accepts_payment_credit_card = input.settings.acceptsPayment.creditCard;
          }
          if (input.settings.acceptsPayment.debitCard !== undefined) {
            storeUpdateData.accepts_payment_debit_card = input.settings.acceptsPayment.debitCard;
          }
          if (input.settings.acceptsPayment.pix !== undefined) {
            storeUpdateData.accepts_payment_pix = input.settings.acceptsPayment.pix;
          }
          if (input.settings.acceptsPayment.cash !== undefined) {
            storeUpdateData.accepts_payment_cash = input.settings.acceptsPayment.cash;
          }
        }
      }

      // Tema
      if (input.theme) {
        if (input.theme.primaryColor !== undefined) {
          storeUpdateData.primary_color = input.theme.primaryColor;
        }
        if (input.theme.secondaryColor !== undefined) {
          storeUpdateData.secondary_color = input.theme.secondaryColor;
        }
        if (input.theme.accentColor !== undefined) {
          storeUpdateData.accent_color = input.theme.accentColor;
        }
        if (input.theme.textColor !== undefined) {
          storeUpdateData.text_color = input.theme.textColor || null;
        }
      }

      // 5.2. Atualizar loja
      const store = await tx.stores.update({
        where: { id: storeId },
        data: storeUpdateData,
      });

      // 5.3. Atualizar endereço (se fornecido)
      if (input.address) {
        // Buscar endereço principal existente
        const existingAddress = await tx.store_addresses.findFirst({
          where: {
            store_id: storeId,
            address_type: "main",
            deleted_at: null,
          },
        });

        if (existingAddress) {
          // Atualizar endereço existente
          await tx.store_addresses.update({
            where: { id: existingAddress.id },
            data: {
              street: input.address.street,
              number: input.address.number,
              neighborhood: input.address.neighborhood,
              city: input.address.city,
              state: input.address.state,
              zip_code: input.address.zipCode,
              complement: input.address.complement || null,
              reference: input.address.reference || null,
              updated_at: new Date(),
            },
          });
        } else {
          // Criar novo endereço
          await tx.store_addresses.create({
            data: {
              store_id: storeId,
              address_type: "main",
              street: input.address.street,
              number: input.address.number,
              neighborhood: input.address.neighborhood,
              city: input.address.city,
              state: input.address.state,
              zip_code: input.address.zipCode,
              complement: input.address.complement || null,
              reference: input.address.reference || null,
            },
          });
        }
      }

      // 5.4. Atualizar horários de funcionamento (se fornecidos)
      if (input.workingHours) {
        const dayMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };

        // Buscar todos os horários existentes de uma vez (otimização)
        const existingHoursList = await tx.store_working_hours.findMany({
          where: {
            store_id: storeId,
            deleted_at: null,
          },
        });

        // Criar mapa de horários existentes por week_day
        const existingHoursMap = new Map(
          existingHoursList.map(h => [h.week_day, h])
        );

        // Processar cada dia fornecido
        for (const [dayName, dayData] of Object.entries(input.workingHours)) {
          const weekDay = dayMap[dayName];
          if (weekDay === undefined || !dayData) continue;

          const existingHours = existingHoursMap.get(weekDay);

          const hoursData: {
            store_id: string;
            week_day: number;
            opens_at?: Date | null;
            closes_at?: Date | null;
            is_closed: boolean;
            updated_at: Date;
          } = {
            store_id: storeId,
            week_day: weekDay,
            is_closed: dayData.closed === true,
            updated_at: new Date(),
          };

          if (!hoursData.is_closed && dayData.open && dayData.close) {
            // Converter string HH:mm para Time
            const [openHour, openMin] = dayData.open.split(":").map(Number);
            const [closeHour, closeMin] = dayData.close.split(":").map(Number);
            hoursData.opens_at = new Date(1970, 0, 1, openHour, openMin);
            hoursData.closes_at = new Date(1970, 0, 1, closeHour, closeMin);
          } else {
            hoursData.opens_at = null;
            hoursData.closes_at = null;
          }

          if (existingHours) {
            // Atualizar horário existente
            await tx.store_working_hours.update({
              where: { id: existingHours.id },
              data: hoursData,
            });
          } else {
            // Criar novo horário
            await tx.store_working_hours.create({
              data: hoursData,
            });
          }
        }
      }

      return store;
    });

    // 6. Buscar loja atualizada completa
    const completeStore = await this.getStoreById(storeId);

    if (!completeStore) {
      throw ApiError.notFound("Erro ao buscar loja atualizada", "STORE_NOT_FOUND");
    }

    return completeStore;
  }
}

export const storesService = new StoresService();

