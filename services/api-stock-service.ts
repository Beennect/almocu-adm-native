import api from './api-service';

export interface StockItemInput {
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  minQuantity?: number;
  supplierId?: string;
  category: string;
  unitPrice?: number;
}

export const apiStockService = {
  async getStock(page = 1, limit = 100) {
    const response = await api.get(`/api/stock?page=${page}&limit=${limit}`);
    // Retorna { items: Stock[], total: number, pages: number, currentPage: number }
    return response.data;
  },

  async createStock(data: StockItemInput) {
    const response = await api.post('/api/stock', data);
    return response.data;
  },

  async updateStock(id: string, data: Partial<StockItemInput>) {
    const response = await api.patch(`/api/stock/${id}`, data);
    return response.data;
  },

  async adjustStock(id: string, delta: number) {
    const response = await api.patch(`/api/stock/${id}/adjust`, { delta });
    return response.data;
  },

  async deleteStock(id: string) {
    const response = await api.delete(`/api/stock/${id}`);
    return response.data;
  },

  async reactivateStock(id: string) {
    const response = await api.patch(`/api/stock/${id}/reactivate`);
    return response.data;
  },

  async getInactiveStock(page = 1, limit = 100) {
    const response = await api.get(`/api/stock?active=false&page=${page}&limit=${limit}`);
    return response.data;
  },
};
