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
  /** Data URI da imagem (data:image/...;base64,XXXX) para enviar junto com o JSON */
  imageBase64?: string | null;
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

    // Inclui a imagem em base64 se existir
    if (data.imageBase64) {
      payload.imageBase64 = data.imageBase64;
    }

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

    // Inclui a imagem em base64 se existir
    if (data.imageBase64) {
      payload.imageBase64 = data.imageBase64;
    }

    const response = await api.patch(`/api/menu/${id}`, payload);
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await api.delete(`/api/menu/${id}`);
    return response.data;
  },

  async reactivateProduct(id: string) {
    const response = await api.patch(`/api/menu/${id}/reactivate`);
    return response.data;
  },

  async getInactiveMenu(page = 1, limit = 100) {
    const response = await api.get(`/api/menu?active=false&page=${page}&limit=${limit}`);
    return response.data;
  },

  async getProductsByIngredient(stockProductId: string) {
    const response = await api.get(`/api/menu/by-ingredient/${stockProductId}`);
    return response.data;
  },
};
