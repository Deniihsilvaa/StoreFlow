import { prisma } from "@/infra/prisma/client";
import { Prisma } from "@prisma/client";

import { ApiError } from "@/core/errors/ApiError";
import type { PaginationQuery } from "@/shared/types/pagination";
import { storageService } from "@/modules/storage/service/storage.service";
import type { CreateProductInput } from "../dto/create-product.dto";
import type { UpdateProductInput } from "../dto/update-product.dto";
import type { AddCustomizationInput } from "../dto/add-customization.dto";

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
  /**
   * Valida se o preço do produto está dentro dos limites permitidos para a categoria
   * @param storeId - ID da loja
   * @param category - Categoria do produto
   * @param price - Preço a ser validado
   * @throws ApiError.validation se o preço estiver fora dos limites
   */
  private async validatePriceByCategory(storeId: string, category: string, price: number) {
    const priceLimit = await prisma.product_category_price_limits.findFirst({
      where: {
        store_id: storeId,
        category: category,
        is_active: true,
        deleted_at: null,
      },
    });

    if (!priceLimit) {
      // Se não houver limite configurado, permite qualquer preço
      return;
    }

    if (priceLimit.min_price !== null && price < Number(priceLimit.min_price)) {
      throw ApiError.validation(
        { 
          price: [
            `O preço mínimo para a categoria "${category}" é R$ ${Number(priceLimit.min_price).toFixed(2)}`
          ] 
        },
        "Preço abaixo do mínimo permitido para esta categoria"
      );
    }

    if (priceLimit.max_price !== null && price > Number(priceLimit.max_price)) {
      throw ApiError.validation(
        { 
          price: [
            `O preço máximo para a categoria "${category}" é R$ ${Number(priceLimit.max_price).toFixed(2)}`
          ] 
        },
        "Preço acima do máximo permitido para esta categoria"
      );
    }
  }

  /**
   * Cria um registro de histórico de alteração do produto
   * @param productId - ID do produto
   * @param userId - ID do usuário que fez a alteração
   * @param changeType - Tipo de alteração ('created', 'updated', 'deleted', 'activated', 'deactivated')
   * @param previousData - Dados anteriores (null para criação)
   * @param newData - Dados novos
   * @param changedFields - Array de campos que foram alterados
   * @param note - Nota opcional sobre a alteração
   */
  private async createProductHistory(
    productId: string,
    userId: string | null,
    changeType: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated',
    previousData: Record<string, unknown> | null,
    newData: Record<string, unknown>,
    changedFields: string[],
    note?: string,
  ) {
    await prisma.product_history.create({
      data: {
        product_id: productId,
        changed_by: userId,
        change_type: changeType,
        previous_data: previousData as Prisma.InputJsonValue | null,
        new_data: newData as Prisma.InputJsonValue,
        changed_fields: changedFields,
        note: note || null,
      },
    });
  }

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
    const products = (productsResult as ProductEnriched[]).map((product) => ({
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

    // Buscar imagens do storage para todos os produtos em paralelo
    const items = await Promise.all(
      products.map(async (product) => {
        const storageImageUrl = await storageService.getProductImageUrl(product.id);
        const finalImageUrl = storageImageUrl || product.image_url;
        return {
          ...product,
          image_url: finalImageUrl,
        };
      })
    );

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
    
    // Buscar imagem do storage usando o ID do produto
    const storageImageUrl = await storageService.getProductImageUrl(productId);
    const finalImageUrl = storageImageUrl || product.image_url;
    
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
      image_url: finalImageUrl,
    };
  }

  /**
   * Cria um novo produto na loja do merchant autenticado
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja onde o produto será criado
   * @param input - Dados do produto para criação
   * @returns Produto criado
   * @throws ApiError.notFound se o merchant ou loja não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão para criar produtos na loja
   */
  async createProduct(userId: string, storeId: string, input: CreateProductInput) {
    console.log("createProduct", userId, storeId, input);
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
      throw ApiError.forbidden("Você não tem permissão para criar produtos nesta loja");
    }

    // 3. Verificar se a loja existe e está ativa
    const store = await prisma.stores.findUnique({
      where: { id: storeId },
      select: { id: true, is_active: true },
    });

    if (!store) {
      throw ApiError.notFound("Loja não encontrada", "STORE_NOT_FOUND");
    }

    // 4. Validar preço por categoria
    await this.validatePriceByCategory(storeId, input.category, input.price);

    // 5. Validar listas extras se fornecidas
    if (input.extraListIds && input.extraListIds.length > 0) {
      const extraLists = await prisma.product_extra_lists.findMany({
        where: {
          id: { in: input.extraListIds },
          store_id: storeId,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (extraLists.length !== input.extraListIds.length) {
        throw ApiError.validation(
          { extraListIds: ["Uma ou mais listas extras não foram encontradas ou não pertencem a esta loja"] },
          "Listas extras inválidas"
        );
      }
    }

    // 6. Criar produto usando transação para garantir consistência
    const newProduct = await prisma.$transaction(async (tx) => {
      // 6.1. Criar produto
      const newProduct = await tx.products.create({
        data: {
          store_id: storeId,
          name: input.name,
          description: input.description || null,
          price: input.price,
          cost_price: input.costPrice ?? 0,
          family: input.family,
          image_url: input.imageUrl || null,
          category: input.category,
          custom_category: input.customCategory || null,
          is_active: input.isActive ?? true,
          preparation_time: input.preparationTime ?? 0,
          nutritional_info: input.nutritionalInfo as Prisma.InputJsonValue | undefined,
        },
      });

      // 6.1.1. Criar histórico de criação
      const productData = {
        id: newProduct.id,
        store_id: newProduct.store_id,
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        cost_price: Number(newProduct.cost_price),
        family: newProduct.family,
        image_url: newProduct.image_url,
        category: newProduct.category,
        custom_category: newProduct.custom_category,
        is_active: newProduct.is_active,
        preparation_time: newProduct.preparation_time,
        nutritional_info: newProduct.nutritional_info,
      };

      await tx.product_history.create({
        data: {
          product_id: newProduct.id,
          changed_by: userId,
          change_type: 'created',
          previous_data: null,
          new_data: productData as Prisma.InputJsonValue,
          changed_fields: Object.keys(productData),
          note: 'Produto criado',
        },
      });

      // 6.2. Criar customizações se fornecidas
      if (input.customizations && input.customizations.length > 0) {
        await tx.product_customizations.createMany({
          data: input.customizations.map((customization) => ({
            product_id: newProduct.id,
            name: customization.name,
            customization_type: customization.customizationType,
            price: customization.price,
            selection_type: customization.selectionType,
            selection_group: customization.selectionGroup || null,
          })),
        });
      }

      // 5.3. Criar aplicabilidades de listas extras se fornecidas
      if (input.extraListIds && input.extraListIds.length > 0) {
        await tx.product_extra_list_applicability.createMany({
          data: input.extraListIds.map((extraListId) => ({
            extra_list_id: extraListId,
            product_id: newProduct.id,
          })),
        });
      }

      return newProduct;
    });

    // 7. Buscar produto criado completo (usando a view enriquecida)
    const createdProduct = await this.getProductById(newProduct.id);

    if (!createdProduct) {
      throw ApiError.notFound("Erro ao buscar produto criado", "PRODUCT_NOT_FOUND");
    }

    return createdProduct;
  }

  /**
   * Atualiza um produto existente na loja do merchant autenticado
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja
   * @param productId - ID do produto a ser atualizado
   * @param input - Dados do produto para atualização
   * @returns Produto atualizado
   * @throws ApiError.notFound se o merchant, loja ou produto não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão para atualizar produtos na loja
   */
  async updateProduct(userId: string, storeId: string, productId: string, input: UpdateProductInput) {
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
      throw ApiError.forbidden("Você não tem permissão para atualizar produtos nesta loja");
    }

    // 3. Verificar se o produto existe e pertence à loja
    const existingProduct = await prisma.products.findUnique({
      where: { id: productId },
      select: { 
        id: true, 
        store_id: true, 
        name: true,
        deleted_at: true,
      },
    });

    if (!existingProduct) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.deleted_at) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.store_id !== storeId) {
      throw ApiError.forbidden("Produto não pertence a esta loja");
    }

    // 4. Validar preço por categoria se o preço ou categoria foram alterados
    const categoryToValidate = input.category ?? existingProduct.category;
    const priceToValidate = input.price ?? Number(existingProduct.price);
    await this.validatePriceByCategory(storeId, categoryToValidate, priceToValidate);

    // 5. Validar listas extras se fornecidas
    if (input.extraListIds && input.extraListIds.length > 0) {
      const extraLists = await prisma.product_extra_lists.findMany({
        where: {
          id: { in: input.extraListIds },
          store_id: storeId,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (extraLists.length !== input.extraListIds.length) {
        throw ApiError.validation(
          { extraListIds: ["Uma ou mais listas extras não foram encontradas ou não pertencem a esta loja"] },
          "Listas extras inválidas"
        );
      }
    }

    // 5. Validar customizações se fornecidas
    if (input.customizations) {
      // Validar customizações a atualizar
      if (input.customizations.update && input.customizations.update.length > 0) {
        const customizationIds = input.customizations.update.map(c => c.id);
        const existingCustomizations = await prisma.product_customizations.findMany({
          where: {
            id: { in: customizationIds },
            product_id: productId,
            deleted_at: null,
          },
          select: { id: true },
        });

        if (existingCustomizations.length !== customizationIds.length) {
          throw ApiError.validation(
            { customizations: ["Uma ou mais customizações não foram encontradas ou não pertencem a este produto"] },
            "Customizações inválidas"
          );
        }
      }

      // Validar customizações a remover
      if (input.customizations.remove && input.customizations.remove.length > 0) {
        const existingCustomizations = await prisma.product_customizations.findMany({
          where: {
            id: { in: input.customizations.remove },
            product_id: productId,
            deleted_at: null,
          },
          select: { id: true },
        });

        if (existingCustomizations.length !== input.customizations.remove.length) {
          throw ApiError.validation(
            { customizations: ["Uma ou mais customizações não foram encontradas ou não pertencem a este produto"] },
            "Customizações inválidas"
          );
        }
      }
    }

    // 6. Atualizar produto usando transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // 6.1. Preparar dados de atualização do produto
      const productUpdateData: {
        name?: string;
        description?: string | null;
        price?: number;
        cost_price?: number;
        family?: "raw_material" | "finished_product" | "addon";
        image_url?: string | null;
        category?: string;
        custom_category?: string | null;
        is_active?: boolean;
        preparation_time?: number;
        nutritional_info?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
        updated_at: Date;
      } = {
        updated_at: new Date(),
      };

      if (input.name !== undefined) {
        productUpdateData.name = input.name;
      }
      if (input.description !== undefined) {
        productUpdateData.description = input.description ?? null;
      }
      if (input.price !== undefined) {
        productUpdateData.price = input.price;
      }
      if (input.costPrice !== undefined) {
        productUpdateData.cost_price = input.costPrice;
      }
      if (input.family !== undefined) {
        productUpdateData.family = input.family;
      }
      if (input.imageUrl !== undefined) {
        productUpdateData.image_url = input.imageUrl ?? null;
      }
      if (input.category !== undefined) {
        productUpdateData.category = input.category;
      }
      if (input.customCategory !== undefined) {
        productUpdateData.custom_category = input.customCategory ?? null;
      }
      if (input.isActive !== undefined) {
        productUpdateData.is_active = input.isActive;
      }
      if (input.preparationTime !== undefined) {
        productUpdateData.preparation_time = input.preparationTime;
      }
      if (input.nutritionalInfo !== undefined) {
        productUpdateData.nutritional_info = input.nutritionalInfo 
          ? (input.nutritionalInfo as Prisma.InputJsonValue)
          : Prisma.JsonNull;
      }

      // 7.2. Atualizar produto
      const updated = await tx.products.update({
        where: { id: productId },
        data: productUpdateData,
        select: {
          id: true,
          store_id: true,
          name: true,
          description: true,
          price: true,
          cost_price: true,
          family: true,
          image_url: true,
          category: true,
          custom_category: true,
          is_active: true,
          preparation_time: true,
          nutritional_info: true,
        },
      });

      // 7.2.1. Criar histórico de atualização
      const changedFields: string[] = [];
      if (input.name !== undefined) changedFields.push('name');
      if (input.description !== undefined) changedFields.push('description');
      if (input.price !== undefined) changedFields.push('price');
      if (input.costPrice !== undefined) changedFields.push('cost_price');
      if (input.family !== undefined) changedFields.push('family');
      if (input.imageUrl !== undefined) changedFields.push('image_url');
      if (input.category !== undefined) changedFields.push('category');
      if (input.customCategory !== undefined) changedFields.push('custom_category');
      if (input.isActive !== undefined) changedFields.push('is_active');
      if (input.preparationTime !== undefined) changedFields.push('preparation_time');
      if (input.nutritionalInfo !== undefined) changedFields.push('nutritional_info');

      if (changedFields.length > 0) {
        const newData = {
          id: updated.id,
          store_id: updated.store_id,
          name: updated.name,
          description: updated.description,
          price: Number(updated.price),
          cost_price: Number(updated.cost_price),
          family: updated.family,
          image_url: updated.image_url,
          category: updated.category,
          custom_category: updated.custom_category,
          is_active: updated.is_active,
          preparation_time: updated.preparation_time,
          nutritional_info: updated.nutritional_info,
        };

        await tx.product_history.create({
          data: {
            product_id: productId,
            changed_by: userId,
            change_type: 'updated',
            previous_data: previousData as Prisma.InputJsonValue,
            new_data: newData as Prisma.InputJsonValue,
            changed_fields: changedFields,
            note: `Produto atualizado: ${changedFields.join(', ')}`,
          },
        });
      }

      return updated;

      // 6.3. Gerenciar customizações
      if (input.customizations) {
        // Adicionar novas customizações
        if (input.customizations.add && input.customizations.add.length > 0) {
          await tx.product_customizations.createMany({
            data: input.customizations.add.map((customization) => ({
              product_id: productId,
              name: customization.name,
              customization_type: customization.customizationType,
              price: customization.price,
              selection_type: customization.selectionType,
              selection_group: customization.selectionGroup || null,
            })),
          });
        }

        // Atualizar customizações existentes
        if (input.customizations.update && input.customizations.update.length > 0) {
          await Promise.all(
            input.customizations.update.map((customization) =>
              tx.product_customizations.update({
                where: { id: customization.id },
                data: {
                  name: customization.name,
                  customization_type: customization.customizationType,
                  price: customization.price,
                  selection_type: customization.selectionType,
                  selection_group: customization.selectionGroup || null,
                  updated_at: new Date(),
                },
              })
            )
          );
        }

        // Remover customizações (soft delete)
        if (input.customizations.remove && input.customizations.remove.length > 0) {
          await tx.product_customizations.updateMany({
            where: {
              id: { in: input.customizations.remove },
              product_id: productId,
            },
            data: {
              deleted_at: new Date(),
              updated_at: new Date(),
            },
          });
        }
      }

      // 6.4. Gerenciar listas extras
      if (input.extraListIds !== undefined) {
        // Remover todas as aplicabilidades existentes
        await tx.product_extra_list_applicability.deleteMany({
          where: { product_id: productId },
        });

        // Criar novas aplicabilidades
        if (input.extraListIds.length > 0) {
          await tx.product_extra_list_applicability.createMany({
            data: input.extraListIds.map((extraListId) => ({
              extra_list_id: extraListId,
              product_id: productId,
            })),
          });
        }
      }
    });

    // 7. Buscar produto atualizado completo (usando a view enriquecida)
    const updatedProduct = await this.getProductById(productId);

    if (!updatedProduct) {
      throw ApiError.notFound("Erro ao buscar produto atualizado", "PRODUCT_NOT_FOUND");
    }

    return updatedProduct;
  }

  /**
   * Desativa um produto (soft disable) - define is_active como false
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja
   * @param productId - ID do produto a ser desativado
   * @returns Produto desativado
   * @throws ApiError.notFound se o merchant, loja ou produto não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão
   */
  async deactivateProduct(userId: string, storeId: string, productId: string) {
    // 1. Buscar merchant pelo auth_user_id
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

    // 2. Validar propriedade da loja
    const isOwner = merchant.stores.some(s => s.id === storeId);
    const isMember = merchant.store_merchant_members.some(m => m.store_id === storeId);

    if (!isOwner && !isMember) {
      throw ApiError.forbidden("Você não tem permissão para desativar produtos nesta loja");
    }

    // 3. Verificar se o produto existe e pertence à loja
    const existingProduct = await prisma.products.findUnique({
      where: { id: productId },
      select: { 
        id: true, 
        store_id: true, 
        deleted_at: true,
      },
    });

    if (!existingProduct) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.deleted_at) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.store_id !== storeId) {
      throw ApiError.forbidden("Produto não pertence a esta loja");
    }

    // 4. Preparar dados para histórico
    const previousData = {
      id: existingProduct.id,
      store_id: existingProduct.store_id,
      name: existingProduct.name,
      description: existingProduct.description,
      price: Number(existingProduct.price),
      cost_price: Number(existingProduct.cost_price),
      family: existingProduct.family,
      image_url: existingProduct.image_url,
      category: existingProduct.category,
      custom_category: existingProduct.custom_category,
      is_active: existingProduct.is_active,
      preparation_time: existingProduct.preparation_time,
      nutritional_info: existingProduct.nutritional_info,
    };

    // 5. Desativar produto e criar histórico
    await prisma.$transaction(async (tx) => {
      await tx.products.update({
        where: { id: productId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      const newData = { ...previousData, is_active: false };
      await tx.product_history.create({
        data: {
          product_id: productId,
          changed_by: userId,
          change_type: 'deactivated',
          previous_data: previousData as Prisma.InputJsonValue,
          new_data: newData as Prisma.InputJsonValue,
          changed_fields: ['is_active'],
          note: 'Produto desativado',
        },
      });
    });

    // 6. Buscar produto atualizado
    const deactivatedProduct = await this.getProductById(productId);

    if (!deactivatedProduct) {
      throw ApiError.notFound("Erro ao buscar produto desativado", "PRODUCT_NOT_FOUND");
    }

    return deactivatedProduct;
  }

  /**
   * Ativa um produto - define is_active como true
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja
   * @param productId - ID do produto a ser ativado
   * @returns Produto ativado
   * @throws ApiError.notFound se o merchant, loja ou produto não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão
   */
  async activateProduct(userId: string, storeId: string, productId: string) {
    // 1. Buscar merchant pelo auth_user_id
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

    // 2. Validar propriedade da loja
    const isOwner = merchant.stores.some(s => s.id === storeId);
    const isMember = merchant.store_merchant_members.some(m => m.store_id === storeId);

    if (!isOwner && !isMember) {
      throw ApiError.forbidden("Você não tem permissão para ativar produtos nesta loja");
    }

    // 3. Verificar se o produto existe e pertence à loja
    const existingProduct = await prisma.products.findUnique({
      where: { id: productId },
      select: { 
        id: true, 
        store_id: true, 
        deleted_at: true,
      },
    });

    if (!existingProduct) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.deleted_at) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.store_id !== storeId) {
      throw ApiError.forbidden("Produto não pertence a esta loja");
    }

    // 4. Ativar produto
    await prisma.products.update({
      where: { id: productId },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
    });

    // 5. Buscar produto atualizado
    const activatedProduct = await this.getProductById(productId);

    if (!activatedProduct) {
      throw ApiError.notFound("Erro ao buscar produto ativado", "PRODUCT_NOT_FOUND");
    }

    return activatedProduct;
  }

  /**
   * Deleta um produto (soft delete) - define deleted_at
   * Valida se o produto não está em pedidos ativos antes de deletar
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja
   * @param productId - ID do produto a ser deletado
   * @returns Produto deletado
   * @throws ApiError.notFound se o merchant, loja ou produto não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão
   * @throws ApiError.validation se o produto estiver em pedidos ativos
   */
  async deleteProduct(userId: string, storeId: string, productId: string) {
    // 1. Buscar merchant pelo auth_user_id
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

    // 2. Validar propriedade da loja
    const isOwner = merchant.stores.some(s => s.id === storeId);
    const isMember = merchant.store_merchant_members.some(m => m.store_id === storeId);

    if (!isOwner && !isMember) {
      throw ApiError.forbidden("Você não tem permissão para deletar produtos nesta loja");
    }

    // 3. Verificar se o produto existe e pertence à loja
    const existingProduct = await prisma.products.findUnique({
      where: { id: productId },
      select: { 
        id: true, 
        store_id: true, 
        deleted_at: true,
      },
    });

    if (!existingProduct) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.deleted_at) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.store_id !== storeId) {
      throw ApiError.forbidden("Produto não pertence a esta loja");
    }

    // 4. Verificar se o produto está em pedidos ativos
    // Pedidos ativos: pending, confirmed, preparing, ready, out_for_delivery
    // Pedidos inativos: delivered, cancelled, refunded
    const activeOrdersCount = await (prisma as any).$queryRawUnsafe(
      `
      SELECT COUNT(*)::bigint as count
      FROM orders.orders o
      INNER JOIN orders.order_items oi ON o.id = oi.order_id
      WHERE oi.product_id = $1::uuid
        AND o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery')
        AND o.deleted_at IS NULL
        AND oi.deleted_at IS NULL
      `,
      productId
    ) as Array<{ count: bigint }>;

    const count = Number(activeOrdersCount[0]?.count ?? 0);

    if (count > 0) {
      throw ApiError.validation(
        { 
          productId: [
            `Não é possível deletar o produto. Ele está presente em ${count} pedido(s) ativo(s). Desative o produto primeiro ou aguarde a conclusão dos pedidos.`
          ] 
        },
        "Produto em uso em pedidos ativos"
      );
    }

    // 5. Deletar produto (soft delete)
    await prisma.products.update({
      where: { id: productId },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 6. Buscar produto deletado (pode retornar null pois a view filtra deleted_at)
    const deletedProduct = await this.getProductById(productId);

    // Se não encontrou na view, buscar diretamente na tabela
    if (!deletedProduct) {
      const product = await prisma.products.findUnique({
        where: { id: productId },
        select: {
          id: true,
          store_id: true,
          name: true,
          deleted_at: true,
        },
      });

      if (!product) {
        throw ApiError.notFound("Erro ao buscar produto deletado", "PRODUCT_NOT_FOUND");
      }

      // Retornar apenas informações básicas já que o produto foi deletado
      return {
        id: product.id,
        store_id: product.store_id,
        name: product.name,
        deleted_at: product.deleted_at,
        message: "Produto deletado com sucesso",
      } as any;
    }

    return deletedProduct;
  }

  /**
   * Adiciona uma customização a um produto existente
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja
   * @param productId - ID do produto
   * @param input - Dados da customização
   * @returns Produto atualizado com a nova customização
   * @throws ApiError.notFound se o merchant, loja ou produto não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão
   */
  async addCustomization(userId: string, storeId: string, productId: string, input: AddCustomizationInput) {
    // 1. Buscar merchant pelo auth_user_id
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

    // 2. Validar propriedade da loja
    const isOwner = merchant.stores.some(s => s.id === storeId);
    const isMember = merchant.store_merchant_members.some(m => m.store_id === storeId);

    if (!isOwner && !isMember) {
      throw ApiError.forbidden("Você não tem permissão para gerenciar customizações nesta loja");
    }

    // 3. Verificar se o produto existe e pertence à loja
    const existingProduct = await prisma.products.findUnique({
      where: { id: productId },
      select: { 
        id: true, 
        store_id: true, 
        deleted_at: true,
      },
    });

    if (!existingProduct) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.deleted_at) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.store_id !== storeId) {
      throw ApiError.forbidden("Produto não pertence a esta loja");
    }

    // 4. Criar customização
    const customization = await prisma.product_customizations.create({
      data: {
        product_id: productId,
        name: input.name,
        customization_type: input.customizationType,
        price: input.price,
        selection_type: input.selectionType,
        selection_group: input.selectionGroup || null,
      },
    });

    // 5. Buscar produto atualizado
    const updatedProduct = await this.getProductById(productId);

    if (!updatedProduct) {
      throw ApiError.notFound("Erro ao buscar produto atualizado", "PRODUCT_NOT_FOUND");
    }

    return {
      customization,
      product: updatedProduct,
    };
  }

  /**
   * Remove uma customização de um produto (soft delete)
   * Valida se a customização não está em uso em pedidos ativos
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja
   * @param productId - ID do produto
   * @param customizationId - ID da customização a ser removida
   * @returns Produto atualizado
   * @throws ApiError.notFound se o merchant, loja, produto ou customização não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão
   * @throws ApiError.validation se a customização estiver em uso em pedidos ativos
   */
  async removeCustomization(userId: string, storeId: string, productId: string, customizationId: string) {
    // 1. Buscar merchant pelo auth_user_id
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

    // 2. Validar propriedade da loja
    const isOwner = merchant.stores.some(s => s.id === storeId);
    const isMember = merchant.store_merchant_members.some(m => m.store_id === storeId);

    if (!isOwner && !isMember) {
      throw ApiError.forbidden("Você não tem permissão para gerenciar customizações nesta loja");
    }

    // 3. Verificar se o produto existe e pertence à loja
    const existingProduct = await prisma.products.findUnique({
      where: { id: productId },
      select: { 
        id: true, 
        store_id: true, 
        deleted_at: true,
      },
    });

    if (!existingProduct) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.deleted_at) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (existingProduct.store_id !== storeId) {
      throw ApiError.forbidden("Produto não pertence a esta loja");
    }

    // 4. Verificar se a customização existe e pertence ao produto
    const existingCustomization = await prisma.product_customizations.findUnique({
      where: { id: customizationId },
      select: { 
        id: true, 
        product_id: true, 
        deleted_at: true,
      },
    });

    if (!existingCustomization) {
      throw ApiError.notFound("Customização não encontrada", "CUSTOMIZATION_NOT_FOUND");
    }

    if (existingCustomization.deleted_at) {
      throw ApiError.notFound("Customização não encontrada", "CUSTOMIZATION_NOT_FOUND");
    }

    if (existingCustomization.product_id !== productId) {
      throw ApiError.forbidden("Customização não pertence a este produto");
    }

    // 5. Verificar se a customização está em uso em pedidos ativos
    // Pedidos ativos: pending, confirmed, preparing, ready, out_for_delivery
    const activeOrdersCount = await (prisma as any).$queryRawUnsafe(
      `
      SELECT COUNT(*)::bigint as count
      FROM orders.orders o
      INNER JOIN orders.order_items oi ON o.id = oi.order_id
      INNER JOIN orders.order_item_customizations oic ON oi.id = oic.order_item_id
      WHERE oic.customization_id = $1::uuid
        AND o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery')
        AND o.deleted_at IS NULL
        AND oi.deleted_at IS NULL
        AND oic.deleted_at IS NULL
      `,
      customizationId
    ) as Array<{ count: bigint }>;

    const count = Number(activeOrdersCount[0]?.count ?? 0);

    if (count > 0) {
      throw ApiError.validation(
        { 
          customizationId: [
            `Não é possível remover a customização. Ela está presente em ${count} pedido(s) ativo(s).`
          ] 
        },
        "Customização em uso em pedidos ativos"
      );
    }

    // 6. Remover customização (soft delete)
    await prisma.product_customizations.update({
      where: { id: customizationId },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 7. Buscar produto atualizado
    const updatedProduct = await this.getProductById(productId);

    if (!updatedProduct) {
      throw ApiError.notFound("Erro ao buscar produto atualizado", "PRODUCT_NOT_FOUND");
    }

    return updatedProduct;
  }

  /**
   * Retorna informações detalhadas do produto para o merchant (com histórico, customizações, etc)
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param storeId - ID da loja
   * @param productId - ID do produto
   * @returns Dados completos do produto incluindo histórico e informações para edição
   * @throws ApiError.notFound se o merchant, loja ou produto não forem encontrados
   * @throws ApiError.forbidden se o merchant não tiver permissão
   */
  async getProductForMerchant(userId: string, storeId: string, productId: string) {
    // 1. Buscar merchant pelo auth_user_id
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

    // 2. Validar propriedade da loja
    const isOwner = merchant.stores.some(s => s.id === storeId);
    const isMember = merchant.store_merchant_members.some(m => m.store_id === storeId);

    if (!isOwner && !isMember) {
      throw ApiError.forbidden("Você não tem permissão para visualizar produtos desta loja");
    }

    // 3. Buscar produto completo
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        product_customizations: {
          where: { deleted_at: null },
          orderBy: { created_at: 'asc' },
        },
        product_extra_list_applicability: {
          where: {
            product_extra_lists: {
              deleted_at: null,
            },
          },
          include: {
            product_extra_lists: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
          },
        },
      },
    });

    if (!product) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (product.deleted_at) {
      throw ApiError.notFound("Produto não encontrado", "PRODUCT_NOT_FOUND");
    }

    if (product.store_id !== storeId) {
      throw ApiError.forbidden("Produto não pertence a esta loja");
    }

    // 4. Buscar histórico de alterações (últimas 20)
    const history = await prisma.product_history.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
      take: 20,
      include: {
        users: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // 5. Buscar limites de preço da categoria (se houver)
    const priceLimit = await prisma.product_category_price_limits.findFirst({
      where: {
        store_id: storeId,
        category: product.category,
        is_active: true,
        deleted_at: null,
      },
    });

    // 6. Buscar estatísticas básicas (pedidos com este produto)
    const ordersCount = await (prisma as any).$queryRawUnsafe(
      `
      SELECT COUNT(*)::bigint as count
      FROM orders.orders o
      INNER JOIN orders.order_items oi ON o.id = oi.order_id
      WHERE oi.product_id = $1::uuid
        AND o.deleted_at IS NULL
        AND oi.deleted_at IS NULL
      `,
      productId
    ) as Array<{ count: bigint }>;

    const totalOrders = Number(ordersCount[0]?.count ?? 0);

    // 7. Buscar imagem do storage usando o ID do produto
    const storageImageUrl = await storageService.getProductImageUrl(productId);
    
    // Usa a imagem do storage se disponível, senão usa a URL do banco (image_url)
    const finalImageUrl = storageImageUrl || product.image_url;

    // 8. Montar resposta completa
    return {
      product: {
        id: product.id,
        store_id: product.store_id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        cost_price: Number(product.cost_price),
        family: product.family,
        image_url: finalImageUrl,
        category: product.category,
        custom_category: product.custom_category,
        is_active: product.is_active,
        preparation_time: product.preparation_time,
        nutritional_info: product.nutritional_info,
        deleted_at: product.deleted_at,
        created_at: product.created_at,
        updated_at: product.updated_at,
      },
      store: product.stores,
      customizations: product.product_customizations.map(c => ({
        id: c.id,
        name: c.name,
        customization_type: c.customization_type,
        price: Number(c.price),
        selection_type: c.selection_type,
        selection_group: c.selection_group,
        created_at: c.created_at,
        updated_at: c.updated_at,
      })),
      extraLists: product.product_extra_list_applicability.map(a => ({
        id: a.product_extra_lists.id,
        name: a.product_extra_lists.name,
        description: a.product_extra_lists.description,
        applied_at: a.created_at,
      })),
      history: history.map(h => ({
        id: h.id,
        change_type: h.change_type,
        previous_data: h.previous_data,
        new_data: h.new_data,
        changed_fields: h.changed_fields,
        note: h.note,
        changed_by: h.users ? {
          id: h.users.id,
          email: h.users.email,
        } : null,
        created_at: h.created_at,
      })),
      priceLimit: priceLimit ? {
        min_price: priceLimit.min_price ? Number(priceLimit.min_price) : null,
        max_price: priceLimit.max_price ? Number(priceLimit.max_price) : null,
        is_active: priceLimit.is_active,
      } : null,
      statistics: {
        total_orders: totalOrders,
        customizations_count: product.product_customizations.length,
        extra_lists_count: product.product_extra_list_applicability.length,
      },
    };
  }
}

export const productsService = new ProductsService();

