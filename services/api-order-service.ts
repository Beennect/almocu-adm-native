import { orderApi } from './api-service';

export interface OrderItem {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customer?: string;
  items: OrderItem[];
  totalValue: number;
  total?: number;
  status: OrderStatus;
  origin?: string;
  observations?: string;
  createdAt?: string;
  elapsedTime?: string;
}

export type OrderStatus = 'pendente' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';

export type OrderStatusFrontend = 'Pendente' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado';

const STATUS_MAP: Record<OrderStatus, OrderStatusFrontend> = {
  pendente: 'Pendente',
  em_preparo: 'Preparando',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const response = await orderApi.get('/orders');
    return response.data;
  },

  async createOrder(data: {
    items: { productId: string; quantity: number }[];
    origin?: string;
    observations?: string;
    customer?: string;
  }): Promise<Order> {
    const response = await orderApi.post('/orders', data);
    return response.data;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const response = await orderApi.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  mapStatusToFrontend(status: OrderStatus): OrderStatusFrontend {
    return STATUS_MAP[status] || 'Pendente';
  },

  mapOrderFromBackend(order: any): Order {
    const elapsedTime = order.createdAt 
      ? calculateElapsedTime(order.createdAt)
      : '00:00:00';

    const items = order.items?.map((item: any, index: number) => ({
      productId: item.productId || item._id || '',
      quantity: item.quantity,
      name: item.name || item.productName || `Item ${index + 1}`,
      price: item.price || item.productPrice || 0,
    })) || [];

    return {
      id: order._id || order.id,
      orderNumber: order.orderNumber || order._id?.slice(-6) || '0000',
      customerName: order.customerName || order.customer || 'Cliente',
      items,
      totalValue: order.totalValue || order.total || 0,
      total: order.totalValue || order.total || 0,
      status: order.status,
      origin: order.origin,
      observations: order.observations,
      createdAt: order.createdAt,
      elapsedTime,
    };
  },
};

function calculateElapsedTime(createdAt: string): string {
  try {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch {
    return '00:00:00';
  }
}