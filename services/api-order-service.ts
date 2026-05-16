import api from './api-service';

export type OrderStatus = 'PENDENTE' | 'PREPARANDO' | 'SAIU_PARA_ENTREGA' | 'CONCLUIDO' | 'CANCELADO';

export function mapStatusToFrontend(status: string): OrderStatus {
  switch (status) {
    case 'pendente': return 'PENDENTE';
    case 'em_preparo': return 'PREPARANDO';
    case 'pronto': return 'SAIU_PARA_ENTREGA';
    case 'entregue': return 'CONCLUIDO';
    case 'cancelado': return 'CANCELADO';
    default: return 'PENDENTE';
  }
}

export function mapStatusToBackend(status: OrderStatus): string {
  switch (status) {
    case 'PENDENTE': return 'pendente';
    case 'PREPARANDO': return 'em_preparo';
    case 'SAIU_PARA_ENTREGA': return 'pronto';
    case 'CONCLUIDO': return 'entregue';
    case 'CANCELADO': return 'cancelado';
    default: return 'pendente';
  }
}

export interface OrderInput {
  items: {
    productId: string;
    quantity: number;
  }[];
  origin?: string;
  observations?: string;
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
    const response = await api.post('/api/order', data);
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
