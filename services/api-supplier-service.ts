import api from './api-service';

export interface SupplierAddress {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  complement?: string;
}

export interface SupplierInput {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  cnpj: string;
  address?: SupplierAddress;
  notes?: string;
  isActive?: boolean;
}

export interface CnpjLookupResult {
  razao_social: string;
  nome_fantasia?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  uf?: string;
  municipio?: string;
  ddd_telefone_1?: string;
  telefone_1?: string;
  email?: string;
}

export interface SupplierPage {
  items: SupplierItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SupplierItem {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  address?: SupplierAddress;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
}

export const apiSupplierService = {
  async getSuppliers(page = 1, limit = 100): Promise<SupplierPage> {
    const response = await api.get(`/api/stock/suppliers?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getSupplier(id: string) {
    const response = await api.get(`/api/stock/suppliers/${id}`);
    return response.data;
  },

  async createSupplier(data: SupplierInput) {
    const response = await api.post('/api/stock/suppliers', data);
    return response.data;
  },

  async updateSupplier(id: string, data: Partial<SupplierInput>) {
    const response = await api.patch(`/api/stock/suppliers/${id}`, data);
    return response.data;
  },

  async deleteSupplier(id: string) {
    const response = await api.delete(`/api/stock/suppliers/${id}`);
    return response.data;
  },

  async lookupCnpj(cnpj: string): Promise<CnpjLookupResult | null> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return null;
    try {
      const response = await api.get(`/api/stock/suppliers/cnpj/${cleanCnpj}`);
      return response.data;
    } catch {
      return null;
    }
  },
};
