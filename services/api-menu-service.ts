import api from './api-service';

export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  category?: string;
  ingredients?: any[];
  hasRemovals?: boolean;
  hasAdditionals?: boolean;
  serves?: string | number;
  image?: string | null;
  isActive?: boolean;
  stockProductId?: string;
}

export const apiMenuService = {
  async getMenu(page = 1, limit = 100) {
    const response = await api.get(`/api/menu?page=${page}&limit=${limit}`);
    // O backend retorna { items: Product[], total: number, pages: number, currentPage: number }
    return response.data;
  },

  async createProduct(data: MenuItemInput) {
    // Mapeamento para o CreateProductDto do backend
    const stockProductId = data.stockProductId || (data.ingredients && data.ingredients[0]?.id) || 'placeholder_stock_id';
    const payload = {
      name: data.name,
      brand: data.category || 'Almocu', // Usamos brand para salvar a categoria
      price: data.price,
      description: data.description || '',
      stockProductId,
    };
    const response = await api.post('/api/menu', payload);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<MenuItemInput>) {
    // Mapeamento para o UpdateProductDto do backend
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.category !== undefined) payload.brand = data.category;
    if (data.price !== undefined) payload.price = data.price;
    if (data.description !== undefined) payload.description = data.description;
    if (data.stockProductId !== undefined) {
      payload.stockProductId = data.stockProductId;
    } else if (data.ingredients && data.ingredients[0]) {
      payload.stockProductId = data.ingredients[0].id;
    }

    const response = await api.patch(`/api/menu/${id}`, payload);
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await api.delete(`/api/menu/${id}`);
    return response.data;
  },
};
