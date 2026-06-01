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
    return response.data;
  },

  async createProduct(data: MenuItemInput) {
    const payload: any = {
      name: data.name,
      brand: data.category || 'Almocu', 
      price: data.price,
      description: data.description || '',
      ingredients: (data.ingredients || [])
        .filter((ing: any) => /^[a-fA-F0-9]{24}$/.test(ing.id || ing.stockProductId))
        .map((ing: any) => ({
          stockProductId: ing.id || ing.stockProductId,
          quantity: parseInt(ing.quantity) || 1,
        })),
    };
    
    const response = await api.post('/api/menu', payload);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<MenuItemInput>) {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.category !== undefined) payload.brand = data.category;
    if (data.price !== undefined) payload.price = data.price;
    if (data.description !== undefined) payload.description = data.description;
    
    if (data.ingredients !== undefined) {
      payload.ingredients = data.ingredients
        .filter((ing: any) => /^[a-fA-F0-9]{24}$/.test(ing.id || ing.stockProductId))
        .map((ing: any) => ({
          stockProductId: ing.id || ing.stockProductId,
          quantity: parseInt(ing.quantity) || 1,
        }));
    }

    const response = await api.patch(`/api/menu/${id}`, payload);
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await api.delete(`/api/menu/${id}`);
    return response.data;
  },
};
