import { prisma } from "@/infra/prisma/client";
import { supabaseAuthClient, supabaseClient } from "@/infra/supabase/client";

import { ApiError } from "@/core/errors/ApiError";
import type { CustomerLoginInput } from "@/modules/auth/dto/customer-login.dto";
import type { CustomerSignUpInput } from "@/modules/auth/dto/customer-signup.dto";
import type { MerchantLoginInput } from "@/modules/auth/dto/merchant-login.dto";
import type { MerchantSignUpInput } from "@/modules/auth/dto/merchant-signup.dto";
import type { RefreshTokenInput } from "@/modules/auth/dto/refresh-token.dto";
import type { UpdateProfileInput } from "@/modules/auth/dto/update-profile.dto";

export type AuthTokens = {
  token: string;
  refreshToken: string;
};

export type CustomerLoginResult = {
  user: {
    id: string;
    phone: string;
    name: string | null;
    storeId: string | null;
  };
} & AuthTokens;

export type MerchantLoginResult = {
  user: {
    id: string;
    email: string;
    role: string;
  };
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    merchant_role: string | null; // Role do merchant na loja (owner ou member role)
    is_owner: boolean; // Se é dono da loja
  }>;
} & AuthTokens;
export type CustomerSignUpResult = {
  success: boolean;
};
export type MerchantSignUpResult = {
  success: boolean;
  merchant: {
    id: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
};
export type RefreshTokenResult = AuthTokens;

export class AuthService {
  // eslint-disable-next-line class-methods-use-this
  async loginCustomer(input: CustomerLoginInput): Promise<any | null> {
    console.log("loginCustomer", input);
    // 1. Autenticar com Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAuthClient.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

    if (authError) {
      throw new Error(authError.message || "Erro ao autenticar");
    }

    if (!authData.user) {
      throw new Error("Cliente não encontrado");
    }

    const customer = await prisma.customers.findFirst({
      where: {
        auth_user_id: authData.user.id,
      },
    });

    if (!customer) {
      throw new Error("Cliente não encontrado");
    }

    // Verificar se o storeId é um UUID válido ou se é um slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(input.storeId || '');

    // Buscar loja por ID (se for UUID) ou por slug (se não for UUID)
    const store = await prisma.stores.findFirst({
      where: isUUID
        ? { id: input.storeId, deleted_at: null }
        : { slug: input.storeId, deleted_at: null },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!store) {
      throw new Error("Loja não encontrada");
    }

    // Validar se o cliente tem acesso à loja especificada
    // Buscar relação do cliente com a loja específica (store_costumer está no schema permissions)
    // IMPORTANTE: usar store.id (UUID) para buscar em store_costumer, não o input original
    const storeCostumer = await prisma.store_costumer.findFirst({
      where: {
        costumer_id: customer.id,
        store: store.id, // Usar o ID da loja encontrada (sempre UUID)
        // active pode ser true ou null (default é true), mas não false
        active: {
          not: false, // Aceita true ou null, rejeita false
        },
      },
      include: {
        stores: true,
      },
    });

    if (!storeCostumer) {
      throw new Error("Cliente não tem acesso a esta loja ou a relação está inativa");
    }

    // 3. Retornar tokens do Supabase (já gerados automaticamente)
    // O Supabase já gerencia expiração, refresh, invalidação, etc.
    // O withAuth valida esses tokens usando supabaseAuthClient.auth.getUser()
    return {
      identities: {
        id: authData.user.id,
        email: authData.user.email,
        name: customer.name,
        phone: customer.phone,
        deleted_at: customer.deleted_at,
      },
      store_active: storeCostumer,
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async loginMerchant(input: MerchantLoginInput): Promise<MerchantLoginResult> {
    // 1. Autenticar com Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAuthClient.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

    if (authError) {
      throw ApiError.unauthorized(authError.message || "Email ou senha inválidos");
    }

    if (!authData.user) {
      throw ApiError.unauthorized("Usuário não encontrado");
    }

    if (!authData.session) {
      throw ApiError.unauthorized("Sessão não criada");
    }

    // 2. Buscar merchant pelo auth_user_id
    const merchant = await prisma.merchants.findFirst({
      where: {
        auth_user_id: authData.user.id,
        deleted_at: null,
      },
    });

    if (!merchant) {
      throw ApiError.unauthorized("Merchant não encontrado");
    }

    // 3. Buscar todas as lojas do merchant
    // 3.1. Lojas onde o merchant é dono (merchant_id)
    const ownedStores = await prisma.stores.findMany({
      where: {
        merchant_id: merchant.id,
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        is_active: true,
      },
    });

    // 3.2. Lojas onde o merchant é membro (store_merchant_members)
    const memberStores = await prisma.store_merchant_members.findMany({
      where: {
        merchant_id: merchant.id,
        deleted_at: null,
      },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            is_active: true,
          },
        },
      },
    });

    // 4. Combinar e formatar lojas
    const storesMap = new Map<string, {
      id: string;
      name: string;
      slug: string;
      is_active: boolean;
      merchant_role: string | null;
      is_owner: boolean;
    }>();

    // Adicionar lojas onde é dono
    ownedStores.forEach((store) => {
      storesMap.set(store.id, {
        id: store.id,
        name: store.name,
        slug: store.slug,
        is_active: store.is_active,
        merchant_role: "owner",
        is_owner: true,
      });
    });

    // Adicionar lojas onde é membro (sem sobrescrever se já for dono)
    memberStores.forEach((member) => {
      if (!storesMap.has(member.stores.id)) {
        storesMap.set(member.stores.id, {
          id: member.stores.id,
          name: member.stores.name,
          slug: member.stores.slug,
          is_active: member.stores.is_active,
          merchant_role: String(member.role), // Converter enum para string
          is_owner: false,
        });
      }
    });

    const stores = Array.from(storesMap.values());

    // 5. Atualizar metadados do usuário no Supabase para incluir type: 'merchant'
    await supabaseAuthClient.auth.updateUser({
      data: {
        type: 'merchant',
        role: String(merchant.role),
      },
    });

    // 6. Retornar dados do merchant e lojas confirmadas
    return {
      user: {
        id: merchant.id,
        email: merchant.email,
        role: String(merchant.role), // Garantir que seja string
      },
      stores, // Já convertido para string no forEach acima
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
    };
  }

  // Função auxiliar para gerar slug único
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    const slug = baseSlug
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, ""); // Remove hífens no início e fim

    let finalSlug = slug;
    let counter = 1;

    // Verificar se o slug já existe e gerar um único
    while (true) {
      const existingStore = await prisma.stores.findFirst({
        where: {
          slug: finalSlug,
          deleted_at: null,
        },
      });

      if (!existingStore) {
        break;
      }

      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  // eslint-disable-next-line class-methods-use-this
  async merchantSignUp(input: MerchantSignUpInput): Promise<MerchantSignUpResult> {
    // 1. Verificar se o email já existe no Supabase Auth (tabela auth.users)
    const existingAuthUser = await (prisma as any).$queryRawUnsafe(
      `SELECT id, email FROM auth.users WHERE email = $1 LIMIT 1`,
      input.email.toLowerCase()
    ) as Array<{ id: string; email: string }> | undefined;

    let authUserId: string;
    let merchant: { id: string; email: string; role: string };

    // 2. Se o usuário já existe no Supabase
    if (existingAuthUser && existingAuthUser.length > 0) {
      authUserId = existingAuthUser[0].id;

      // 2.1. Verificar se já existe merchant para este usuário
      const existingMerchant = await prisma.merchants.findFirst({
        where: {
          auth_user_id: authUserId,
          deleted_at: null,
        },
      });

      if (existingMerchant) {
        throw ApiError.conflict("Este email já possui uma conta de merchant cadastrada");
      }

      // 2.2. Atualizar metadados do usuário existente no Supabase (usando admin client)
      await supabaseClient.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          type: 'merchant',
          role: 'admin',
        },
      });

      // 2.3. Criar merchant para o usuário existente
      merchant = await prisma.merchants.create({
        data: {
          auth_user_id: authUserId,
          email: input.email.toLowerCase(),
          role: "admin",
        },
      });
    } else {
      // 3. Se o usuário NÃO existe no Supabase, criar tudo do zero
      const { data: authData, error: authError } = await supabaseAuthClient.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            type: 'merchant',
            role: 'admin',
          },
        },
      });

      if (authError) {
        throw ApiError.badRequest(authError.message || "Erro ao criar usuário");
      }

      if (!authData.user) {
        throw ApiError.badRequest("Erro ao criar usuário no Supabase");
      }

      authUserId = authData.user.id;

      // 3.1. Atualizar metadados do usuário recém-criado (usando admin client)
      // Nota: O signUp já adiciona os metadados via options.data, mas garantimos aqui também
      await supabaseClient.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          type: 'merchant',
          role: 'admin',
        },
      });

      // 3.2. Criar merchant
      merchant = await prisma.merchants.create({
        data: {
          auth_user_id: authUserId,
          email: input.email.toLowerCase(),
          role: "admin",
        },
      });
    }

    // 4. Gerar slug único para a loja
    const uniqueSlug = await this.generateUniqueSlug(input.storeName);

    // 5. Criar loja com valores padrão
    const store = await prisma.stores.create({
      data: {
        merchant_id: merchant.id,
        name: input.storeName,
        slug: uniqueSlug,
        description: input.storeDescription || null,
        category: input.storeCategory,
        custom_category: input.customCategory || null,
        // Valores padrão conforme schema
        rating: 0,
        review_count: 0,
        primary_color: "#FF5733",
        secondary_color: "#33FF57",
        accent_color: "#3357FF",
        text_color: null,
        is_active: true,
        delivery_time: null,
        min_order_value: 0,
        delivery_fee: 0,
        free_delivery_above: null,
        accepts_payment_credit_card: true,
        accepts_payment_debit_card: true,
        accepts_payment_pix: true,
        accepts_payment_cash: true,
        fulfillment_delivery_enabled: true,
        fulfillment_pickup_enabled: true,
        fulfillment_pickup_instructions: null,
        legal_responsible_name: null,
        legal_responsible_document: null,
        terms_accepted_at: null,
      },
    });

    return {
      success: true,
      merchant: {
        id: merchant.id,
        email: merchant.email,
      },
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async refreshTokens(_input: RefreshTokenInput): Promise<RefreshTokenResult> {
    const { data: session, error: authError } = await supabaseAuthClient.auth.refreshSession({
      refresh_token: _input.refreshToken,
    });
    if (authError) {
      throw new Error(authError.message || "Erro ao atualizar token");
    }
    if (!session.session) {
      throw new Error("Erro ao atualizar token");
    }
    return {
      token: session.session?.access_token || "",
      refreshToken: session.session?.refresh_token || "",
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async logout(_userId: string): Promise<{ success: boolean }> {
    const { error: authError } = await supabaseAuthClient.auth.signOut();
    if (authError) {
      throw new Error(authError.message || "Erro ao deslogar");
    }
    return { success: true };
  }

  /**
   * Busca o perfil completo do usuário incluindo dados básicos e endereços
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @returns Perfil do cliente com endereços
   * @throws ApiError.notFound se o cliente não for encontrado
   */
  async getProfile(userId: string) {
    // Buscar cliente pelo auth_user_id
    const customer = await prisma.customers.findFirst({
      where: {
        auth_user_id: userId,
        deleted_at: null,
      },
      include: {
        customer_addresses: {
          where: {
            deleted_at: null,
          },
          orderBy: [
            { is_default: 'desc' },
            { created_at: 'desc' },
          ],
        },
      },
    });

    if (!customer) {
      throw ApiError.notFound("Cliente não encontrado", "CUSTOMER_NOT_FOUND");
    }

    // Buscar email do usuário no Supabase Auth usando service role
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || null;
    
    // Se houver erro ao buscar email, continuar sem email (não é crítico)
    if (authError) {
      console.warn(`[getProfile] Erro ao buscar email do usuário ${userId}:`, authError.message);
    }

    return {
      id: customer.id,
      auth_user_id: customer.auth_user_id,
      name: customer.name,
      phone: customer.phone,
      email,
      addresses: customer.customer_addresses.map((address) => ({
        id: address.id,
        label: address.label,
        addressType: address.address_type,
        street: address.street,
        number: address.number,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zip_code,
        complement: address.complement,
        reference: address.reference,
        isDefault: address.is_default,
        createdAt: address.created_at,
        updatedAt: address.updated_at,
      })),
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    };
  }

  /**
   * Atualiza o perfil do usuário incluindo dados básicos e endereços
   * 
   * @param userId - ID do usuário autenticado (auth_user_id)
   * @param input - Dados para atualização (name, phone, addresses)
   * @returns Perfil atualizado do cliente
   * @throws ApiError.notFound se o cliente não for encontrado
   * @throws ApiError.validation se o telefone já estiver em uso
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Verificar se o cliente existe
    const existingCustomer = await prisma.customers.findFirst({
      where: {
        auth_user_id: userId,
        deleted_at: null,
      },
    });

    if (!existingCustomer) {
      throw ApiError.notFound("Cliente não encontrado", "CUSTOMER_NOT_FOUND");
    }

    // Validar telefone único se estiver sendo atualizado
    if (input.phone && input.phone !== existingCustomer.phone) {
      const phoneExists = await prisma.customers.findFirst({
        where: {
          phone: input.phone,
          id: { not: existingCustomer.id },
          deleted_at: null,
        },
      });

      if (phoneExists) {
        throw ApiError.validation(
          { phone: ["Este telefone já está em uso"] },
          "Telefone já cadastrado",
        );
      }
    }

    // Atualizar usando transação para garantir consistência
    const updatedCustomer = await prisma.$transaction(async (tx) => {
      // Atualizar dados básicos do cliente
      const updateData: {
        name?: string;
        phone?: string;
        updated_at: Date;
      } = {
        updated_at: new Date(),
      };

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.phone !== undefined) {
        updateData.phone = input.phone;
      }

      const customer = await tx.customers.update({
        where: { id: existingCustomer.id },
        data: updateData,
      });

      // Gerenciar endereços se fornecidos
      // Suporta dois formatos:
      // 1. Formato antigo (compatibilidade): { _legacyArray: [...] } - substituição total
      // 2. Formato novo (operações parciais): { add: [...], update: [...], remove: [...] }
      if (input.addresses !== undefined) {
        // Verificar se é formato antigo (substituição total)
        if ('_legacyArray' in input.addresses) {
          // Formato antigo: substituição total (comportamento original)
          await tx.customer_addresses.deleteMany({
            where: {
              customer_id: customer.id,
            },
          });

          if (input.addresses._legacyArray.length > 0) {
            let firstDefaultFound = false;
            for (const address of input.addresses._legacyArray) {
              const isDefault = address.isDefault === true && !firstDefaultFound;
              if (isDefault) {
                firstDefaultFound = true;
              }

              await tx.customer_addresses.create({
                data: {
                  customer_id: customer.id,
                  label: address.label || null,
                  address_type: (address.addressType || 'other') as 'home' | 'work' | 'other',
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  zip_code: address.zipCode,
                  complement: address.complement || null,
                  reference: address.reference || null,
                  is_default: isDefault,
                },
              });
            }
          }
        } else {
          // Formato novo: operações parciais
          type AddressInput = {
            label?: string;
            addressType?: "home" | "work" | "other";
            street: string;
            number: string;
            neighborhood: string;
            city: string;
            state: string;
            zipCode: string;
            complement?: string;
            reference?: string;
            isDefault?: boolean;
          };
          
          const operations = input.addresses as {
            add?: Array<AddressInput>;
            update?: Array<AddressInput & { id: string }>;
            remove?: string[];
          };

          // 1. Remover endereços
          if (operations.remove && operations.remove.length > 0) {
            await tx.customer_addresses.deleteMany({
              where: {
                id: { in: operations.remove },
                customer_id: customer.id,
              },
            });
          }

          // 2. Atualizar endereços existentes
          if (operations.update && operations.update.length > 0) {
            // Buscar endereços existentes para validar propriedade
            const existingAddressIds = await tx.customer_addresses.findMany({
              where: {
                id: { in: operations.update.map(a => a.id) },
                customer_id: customer.id,
                deleted_at: null,
              },
              select: { id: true },
            });

            const validIds = new Set(existingAddressIds.map(a => a.id));

            // Verificar se algum endereço será marcado como default
            const addressesToSetDefault = operations.update.filter(a => a.isDefault === true);
            const willSetDefault = addressesToSetDefault.length > 0;
            
            // Se algum endereço será marcado como default, remover default dos outros
            if (willSetDefault) {
              await tx.customer_addresses.updateMany({
                where: {
                  customer_id: customer.id,
                  is_default: true,
                  deleted_at: null,
                },
                data: {
                  is_default: false,
                },
              });
            }

            let firstDefaultFound = false;
            for (const address of operations.update) {
              if (!validIds.has(address.id)) {
                throw ApiError.notFound(`Endereço com ID ${address.id} não encontrado ou não pertence ao cliente`);
              }

              // Garantir que apenas o primeiro endereço com isDefault: true seja realmente default
              const isDefault = address.isDefault === true && !firstDefaultFound;
              if (isDefault) {
                firstDefaultFound = true;
              }

              await tx.customer_addresses.update({
                where: { id: address.id },
                data: {
                  label: address.label ?? undefined,
                  address_type: (address.addressType || 'other') as 'home' | 'work' | 'other',
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  zip_code: address.zipCode,
                  complement: address.complement ?? undefined,
                  reference: address.reference ?? undefined,
                  is_default: isDefault,
                  updated_at: new Date(),
                },
              });
            }
          }

          // 3. Adicionar novos endereços
          if (operations.add && operations.add.length > 0) {
            // Verificar se algum endereço novo será marcado como default
            const addressesToSetDefault = operations.add.filter(a => a.isDefault === true);
            const willSetDefault = addressesToSetDefault.length > 0;
            
            // Se algum endereço novo será marcado como default, remover default dos existentes
            if (willSetDefault) {
              await tx.customer_addresses.updateMany({
                where: {
                  customer_id: customer.id,
                  is_default: true,
                  deleted_at: null,
                },
                data: {
                  is_default: false,
                },
              });
            }

            let firstDefaultFound = false;
            for (const address of operations.add) {
              const isDefault = address.isDefault === true && !firstDefaultFound;
              if (isDefault) {
                firstDefaultFound = true;
              }

              await tx.customer_addresses.create({
                data: {
                  customer_id: customer.id,
                  label: address.label || null,
                  address_type: (address.addressType || 'other') as 'home' | 'work' | 'other',
                  street: address.street,
                  number: address.number,
                  neighborhood: address.neighborhood,
                  city: address.city,
                  state: address.state,
                  zip_code: address.zipCode,
                  complement: address.complement || null,
                  reference: address.reference || null,
                  is_default: isDefault,
                },
              });
            }
          }
        }
      }

      // Buscar endereços atualizados
      const addresses = await tx.customer_addresses.findMany({
        where: {
          customer_id: customer.id,
          deleted_at: null,
        },
        orderBy: [
          { is_default: 'desc' },
          { created_at: 'desc' },
        ],
      });

      return { customer, addresses };
    });

    // Buscar email do usuário no Supabase Auth usando service role
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || null;
    
    // Se houver erro ao buscar email, continuar sem email (não é crítico)
    if (authError) {
      console.warn(`[updateProfile] Erro ao buscar email do usuário ${userId}:`, authError.message);
    }

    return {
      id: updatedCustomer.customer.id,
      auth_user_id: updatedCustomer.customer.auth_user_id,
      name: updatedCustomer.customer.name,
      phone: updatedCustomer.customer.phone,
      email,
      addresses: updatedCustomer.addresses.map((address) => ({
        id: address.id,
        label: address.label,
        addressType: address.address_type,
        street: address.street,
        number: address.number,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zip_code,
        complement: address.complement,
        reference: address.reference,
        isDefault: address.is_default,
        createdAt: address.created_at,
        updatedAt: address.updated_at,
      })),
      createdAt: updatedCustomer.customer.created_at,
      updatedAt: updatedCustomer.customer.updated_at,
    };
  }
  // eslint-disable-next-line class-methods-use-this
  async customerSignUp(input: CustomerSignUpInput): Promise<CustomerSignUpResult> {
    // 1. Verificar se o email já existe no Supabase Auth (tabela auth.users)
    const existingAuthUser = await (prisma as any).$queryRawUnsafe(
      `SELECT id, email FROM auth.users WHERE email = $1 LIMIT 1`,
      input.email.toLowerCase()
    ) as Array<{ id: string; email: string }> | undefined;

    // 2. Se o usuário já existe no Supabase
    if (existingAuthUser && existingAuthUser.length > 0) {
      const authUserId = existingAuthUser[0].id;  

      // 2.1. Verificar se existe registro em customers PRIMEIRO (para obter customer.id)
      let existingCustomer = await prisma.customers.findFirst({
        where: {
          auth_user_id: authUserId,
        },
      });

      // Se não existe customer, criar
      if (!existingCustomer) {
        try {
          existingCustomer = await prisma.customers.create({
            data: {
              auth_user_id: authUserId,
              name: input.name,
              phone: input.phone,
            },
          });
        } catch (error: any) {
          
          // Se o erro for de telefone duplicado, tentar buscar o customer pelo telefone
          if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
            const customerByPhone = await prisma.customers.findFirst({
              where: {
                phone: input.phone,
              },
            });
            
            if (customerByPhone && customerByPhone.auth_user_id === authUserId) {
              existingCustomer = customerByPhone;
            } else {
              throw new Error("Este telefone já está cadastrado para outro usuário");
            }
          } else {
            throw error;
          }
        }
      } else {
        
        // Verificar se os dados precisam ser atualizados
        if (existingCustomer.name !== input.name || existingCustomer.phone !== input.phone) {
          try {
            existingCustomer = await prisma.customers.update({
              where: {
                id: existingCustomer.id,
              },
              data: {
                name: input.name,
                phone: input.phone,
              },
            });
          } catch (error: any) {
            // Não falhar se houver erro na atualização, apenas logar
          }
        }
      }

      // Garantir que temos um customer válido
      if (!existingCustomer || !existingCustomer.id) {
        throw new Error("Erro ao criar ou encontrar registro do cliente");
      }

      // 2.1. Verificar se já está associado à loja (AGORA usando customer.id)
      const existingStoreCostumer = await prisma.store_costumer.findFirst({
        where: {
          costumer_id: existingCustomer.id,
          store: input.storeId,
          active: {
            not: false, // Aceita true ou null, rejeita false
          },
        },
      });

      if (existingStoreCostumer) {
        throw new Error("Este email já possui cadastro nesta loja");
      }

      // 2.3. Criar apenas a associação na loja (store_costumer)
      const storeCostumer = await prisma.store_costumer.create({
        data: {
          costumer_id: existingCustomer.id,
          store: input.storeId,
          active: true,
          date_create: new Date().toISOString(),
        },
      });
      


      if (!storeCostumer || !storeCostumer.id) {
        throw new Error("Erro ao criar associação na loja");
      }

      return { success: true };
    }

    // 3. Se o usuário NÃO existe no Supabase, criar tudo do zero
    const { data: authData, error: authError } = await supabaseAuthClient.auth.signUp({
      email: input.email,
      password: input.password,
    });



    if (authError) {
      throw new Error(authError.message || "Erro ao criar cliente");
    }

    if (!authData.user) {
      throw new Error("Erro ao criar usuário no Supabase");
    }

    // 3.1. Criar registro em customers
    const customer = await prisma.customers.create({
      data: {
        auth_user_id: authData.user.id,
        name: input.name,
        phone: input.phone,
      },
    });
    
    if (!customer || !customer.id) {
      throw new Error("Erro ao criar cliente");
    }

    // 3.2. Criar associação na loja (store_costumer)
    const storeCostumer = await prisma.store_costumer.create({
      data: {
        costumer_id: customer.id,
        store: input.storeId,
        active: true,
        date_create: new Date().toISOString(),
      },
    });
    
    if (!storeCostumer || !storeCostumer.id) {
      throw new Error("Erro ao criar associação na loja");
    }

    return { success: true };
  }
}

export const authService = new AuthService();

