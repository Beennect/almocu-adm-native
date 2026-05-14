import { menuApi } from './api-service';

export interface Product {
  id: string;
  _id: string;
  name: string;
  description?: string;
  price: number;
  brand?: string;
  stockProductId?: string;
  restaurantId?: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
  description?: string;
  brand?: string;
  stockProductId?: string;
}

export const productService = {
  async getProducts(): Promise<Product[]> {
    const response = await menuApi.get('/products');
    return response.data.data || response.data;
  },

  async createProduct(data: CreateProductInput): Promise<Product> {
    const response = await menuApi.post('/products', data);
    return response.data;
  },

  mapProductFromBackend(product: any): Product {
    return {
      id: product._id || product.id,
      _id: product._id || product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      brand: product.brand,
      stockProductId: product.stockProductId,
      restaurantId: product.restaurantId,
    };
  },
};