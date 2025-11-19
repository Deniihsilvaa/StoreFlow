export const MerchantRoles = ["admin", "manager"] as const;
export type MerchantRole = (typeof MerchantRoles)[number];

export const ProductFamilies = ["raw_material", "finished_product", "addon"] as const;
export type ProductFamily = (typeof ProductFamilies)[number];

export const OrderStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof OrderStatuses)[number];

export const PaymentStatuses = ["pending", "paid", "failed"] as const;
export type PaymentStatus = (typeof PaymentStatuses)[number];

export const PaymentMethods = ["credit_card", "debit_card", "pix", "cash"] as const;
export type PaymentMethod = (typeof PaymentMethods)[number];

export const FulfillmentMethods = ["delivery", "pickup"] as const;
export type FulfillmentMethod = (typeof FulfillmentMethods)[number];

