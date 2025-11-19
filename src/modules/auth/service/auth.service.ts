import { prisma } from "@/infra/prisma/client";
import { supabaseAuthClient } from "@/infra/supabase/client";

import type { CustomerLoginInput } from "@/modules/auth/dto/customer-login.dto";
import type { CustomerSignUpInput } from "@/modules/auth/dto/customer-signup.dto";
import type { MerchantLoginInput } from "@/modules/auth/dto/merchant-login.dto";
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
    storeId: string | null;
    role: string | null;
  };
} & AuthTokens;
export type CustomerSignUpResult = {
  success: boolean;
};
export type RefreshTokenResult = AuthTokens;

export class AuthService {
  // eslint-disable-next-line class-methods-use-this
  async loginCustomer(input: CustomerLoginInput): Promise<any | null> {
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
    
    // 2. Validar se o cliente tem acesso à loja especificada
    // Buscar relação do cliente com a loja específica (store_costumer está no schema permissions)
    const storeCostumer = await prisma.store_costumer.findFirst({
      where: {
        costumer_id: customer.id,
        store: input.storeId, // Validar que o cliente pertence à loja informada
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
  async loginMerchant(_input: MerchantLoginInput): Promise<MerchantLoginResult> {
    throw new Error("loginMerchant ainda não foi implementado");
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

  // eslint-disable-next-line class-methods-use-this
  async getProfile(_userId: string) {
    throw new Error("getProfile ainda não foi implementado");
  }

  // eslint-disable-next-line class-methods-use-this
  async updateProfile(_userId: string, _input: UpdateProfileInput) {
    throw new Error("updateProfile ainda não foi implementado");
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

