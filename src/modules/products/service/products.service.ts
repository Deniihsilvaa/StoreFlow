import { prisma } from "@/infra/prisma/client";
import { Prisma } from "@prisma/client";

import { ApiError } from "@/core/errors/ApiError";
import type { PaginationQuery } from "@/shared/types/pagination";
import type { CreateProductInput } from "../dto/create-product.dto";
import type { UpdateProductInput } from "../dto/update-product.dto";

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

    // 4. Validar listas extras se fornecidas
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

    // 5. Criar produto usando transação para garantir consistência
    const product = await prisma.$transaction(async (tx) => {
      // 5.1. Criar produto
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

      // 5.2. Criar customizações se fornecidas
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

    // 6. Buscar produto criado completo (usando a view enriquecida)
    const createdProduct = await this.getProductById(product.id);

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

    // 4. Validar listas extras se fornecidas
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

      // 6.2. Atualizar produto
      await tx.products.update({
        where: { id: productId },
        data: productUpdateData,
      });

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

    // 4. Desativar produto
    await prisma.products.update({
      where: { id: productId },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    // 5. Buscar produto atualizado
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
    const activeOrdersCount = await (prisma as any).$queryRawUnsafe<Array<{ count: bigint }>>(
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
    );

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
}

export const productsService = new ProductsService();

