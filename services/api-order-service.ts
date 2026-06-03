import api from './api-service';

export type OrderStatus = 'PENDENTE' | 'PREPARANDO' | 'PRONTO' | 'SAIU_PARA_ENTREGA' | 'CONCLUIDO' | 'CANCELADO';

export function mapStatusToFrontend(status: string): OrderStatus {
  switch (status) {
    case 'pendente': return 'PENDENTE';
    case 'em_preparo': return 'PREPARANDO';
    case 'pronto': return 'PRONTO';
    case 'saiu_para_entrega': return 'SAIU_PARA_ENTREGA';
    case 'entregue': return 'CONCLUIDO';
    case 'cancelado': return 'CANCELADO';
    default: return 'PENDENTE';
  }
}

export function mapStatusToBackend(status: OrderStatus): string {
  switch (status) {
    case 'PENDENTE': return 'pendente';
    case 'PREPARANDO': return 'em_preparo';
    case 'PRONTO': return 'pronto';
    case 'SAIU_PARA_ENTREGA': return 'saiu_para_entrega';
    case 'CONCLUIDO': return 'entregue';
    case 'CANCELADO': return 'cancelado';
    default: return 'pendente';
  }
}

export interface DeliveryAddressInput {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  complement?: string;
}

export interface OrderInput {
  items: {
    productId: string;
    quantity: number;
  }[];
  clientName?: string;
  origin?: string;
  observations?: string;
  deliveryAddress?: DeliveryAddressInput;
  totalValue?: number;
}

export const apiOrderService = {
  async getOrders() {
    const response = await api.get('/api/order');
    return response.data;
  },

  async getUserOrders() {
    const response = await api.get('/api/order/user');
    return response.data;
  },

  async createOrder(data: OrderInput) {
    const payload: any = {
      items: data.items,
      clientName: data.clientName,
      origin: data.origin,
      observations: data.observations,
      deliveryAddress: data.deliveryAddress,
    };
    if (data.totalValue !== undefined) {
      payload.totalValue = data.totalValue;
    }
    const response = await api.post('/api/order', payload);
    return response.data;
  },

  async updateOrderStatus(id: string, status: OrderStatus) {
    const backendStatus = mapStatusToBackend(status);
    const response = await api.patch(`/api/order/${id}/status`, { status: backendStatus });
    return response.data;
  },

  async deleteOrder(id: string) {
    const response = await api.delete(`/api/order/${id}`);
    return response.data;
  },
};
