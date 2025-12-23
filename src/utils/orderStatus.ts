/**
 * Status possíveis de um pedido
 */
export const OrderStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

/**
 * Labels em português para os status
 */
export const OrderStatusLabels: Record<OrderStatusType, string> = {
  [OrderStatus.PENDING]: "Pendente",
  [OrderStatus.CONFIRMED]: "Confirmado",
  [OrderStatus.PREPARING]: "Preparando",
  [OrderStatus.READY]: "Pronto",
  [OrderStatus.OUT_FOR_DELIVERY]: "Saiu para entrega",
  [OrderStatus.DELIVERED]: "Entregue",
  [OrderStatus.CANCELLED]: "Cancelado",
  [OrderStatus.REJECTED]: "Rejeitado",
};

/**
 * Cores para os status (para UI)
 */
export const OrderStatusColors: Record<OrderStatusType, string> = {
  [OrderStatus.PENDING]: "#FFA500", // Laranja
  [OrderStatus.CONFIRMED]: "#2196F3", // Azul
  [OrderStatus.PREPARING]: "#9C27B0", // Roxo
  [OrderStatus.READY]: "#4CAF50", // Verde
  [OrderStatus.OUT_FOR_DELIVERY]: "#00BCD4", // Ciano
  [OrderStatus.DELIVERED]: "#4CAF50", // Verde
  [OrderStatus.CANCELLED]: "#F44336", // Vermelho
  [OrderStatus.REJECTED]: "#F44336", // Vermelho
};

/**
 * Verifica se um status é válido
 */
export function isValidOrderStatus(status: string): status is OrderStatusType {
  return Object.values(OrderStatus).includes(status as OrderStatusType);
}

/**
 * Obtém o label de um status
 */
export function getOrderStatusLabel(status: string): string {
  if (isValidOrderStatus(status)) {
    return OrderStatusLabels[status];
  }
  return status;
}

/**
 * Obtém a cor de um status
 */
export function getOrderStatusColor(status: string): string {
  if (isValidOrderStatus(status)) {
    return OrderStatusColors[status];
  }
  return "#757575"; // Cinza padrão
}

/**
 * Verifica se um pedido pode ser cancelado
 */
export function canCancelOrder(status: OrderStatusType): boolean {
  return (
    status === OrderStatus.PENDING ||
    status === OrderStatus.CONFIRMED ||
    status === OrderStatus.PREPARING ||
    status === OrderStatus.READY
  );
}

/**
 * Verifica se um pedido está finalizado
 */
export function isOrderFinalized(status: OrderStatusType): boolean {
  return (
    status === OrderStatus.DELIVERED ||
    status === OrderStatus.CANCELLED ||
    status === OrderStatus.REJECTED
  );
}

/**
 * Obtém a próxima etapa possível de um pedido
 */
export function getNextOrderStatus(currentStatus: OrderStatusType): OrderStatusType | null {
  const statusFlow: Record<OrderStatusType, OrderStatusType | null> = {
    [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
    [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
    [OrderStatus.PREPARING]: OrderStatus.READY,
    [OrderStatus.READY]: OrderStatus.OUT_FOR_DELIVERY,
    [OrderStatus.OUT_FOR_DELIVERY]: OrderStatus.DELIVERED,
    [OrderStatus.DELIVERED]: null,
    [OrderStatus.CANCELLED]: null,
    [OrderStatus.REJECTED]: null,
  };

  return statusFlow[currentStatus] ?? null;
}

