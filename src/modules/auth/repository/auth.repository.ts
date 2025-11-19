export class AuthRepository {
  // eslint-disable-next-line class-methods-use-this
  async findCustomerByPhone(_phone: string) {
    throw new Error("findCustomerByPhone ainda não foi implementado");
  }

  // eslint-disable-next-line class-methods-use-this
  async findMerchantByEmail(_email: string) {
    throw new Error("findMerchantByEmail ainda não foi implementado");
  }
}

export const authRepository = new AuthRepository();

