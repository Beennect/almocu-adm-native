import api from './api-service';

export interface MenuItemInput {
  name: string;
  description?: string;
  price: number;
  category?: string;
  ingredients?: any[];
  image?: string | null;
  isActive?: boolean;
  stockProductId?: string;
}

const toBackendQuantity = (raw: any) => {
  const value = parseFloat(String(raw ?? '').replace(',', '.'));
  if (isNaN(value) || value <= 0) return 0;
  return value;
};

const sanitizeIngredients = (ingredients: any[] | undefined) =>
  (ingredients || [])
    .filter((ing: any) => /^[a-fA-F0-9]{24}$/.test(ing.id || ing.stockProductId))
    .map((ing: any) => ({
      stockProductId: ing.id || ing.stockProductId,
      quantity: toBackendQuantity(ing.quantity),
    }))
    .filter((ing: any) => ing.quantity > 0);

export const apiMenuService = {
  async getMenu(page = 1, limit = 100) {
    const response = await api.get(`/api/menu?page=${page}&limit=${limit}`);
    return response.data;
  },

  async createProduct(data: MenuItemInput) {
    const payload: any = {
      name: data.name,
      category: data.category,
      price: data.price,
      description: data.description || '',
      ingredients: sanitizeIngredients(data.ingredients),
    };

    const response = await api.post('/api/menu', payload);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<MenuItemInput>) {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.category !== undefined) payload.category = data.category;
    if (data.price !== undefined) payload.price = data.price;
    if (data.description !== undefined) payload.description = data.description;

    if (data.ingredients !== undefined) {
      payload.ingredients = sanitizeIngredients(data.ingredients);
    }

    const response = await api.patch(`/api/menu/${id}`, payload);
    return response.data;
  },

  async uploadProductImage(productId: string, fileUri: string) {
    const form = new FormData();
    form.append('image', {
      uri: fileUri,
      name: `product-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any);

    const response = await api.post(`/api/menu/${productId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data: any) => data,
    });
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await api.delete(`/api/menu/${id}`);
    return response.data;
  },
};
