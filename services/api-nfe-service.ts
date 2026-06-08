import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system';
import api, { API_URL } from './api-service';

export interface NfeInvoiceItem {
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface NfeInvoice {
  _id: string;
  accessKey: string;
  nProt?: string;
  issueDate?: string;
  supplierName?: string;
  supplierCnpj?: string;
  supplierId?: string;
  totalValue: number;
  items: NfeInvoiceItem[];
  restaurantId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NfeInvoicePage {
  items: NfeInvoice[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface NfeUploadResult {
  supplier: { name: string; cnpj: string } | null;
  invoiceId: string;
  summary: {
    total: number;
    created: number;
    updated: number;
    errors: string[];
  };
}

export const apiNfeService = {
  async uploadXmlFile(uri: string, fileName: string): Promise<NfeUploadResult> {
    if (Platform.OS === 'web') {
      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      const formData = new FormData();
      formData.append('file', blob, fileName);
      const axiosResponse = await api.post('/api/stock/nfe/upload', formData);
      return axiosResponse.data;
    }

    const token = await AsyncStorage.getItem('auth_token');
    const restaurantId = await AsyncStorage.getItem('selected_restaurant_id');

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (restaurantId) headers['x-restaurant-id'] = restaurantId;

    const uploadResult = await uploadAsync(
      `${API_URL}/api/stock/nfe/upload`,
      uri,
      {
        fieldName: 'file',
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.MULTIPART,
        mimeType: 'text/xml',
        headers,
      },
    );

    if (uploadResult.status >= 400) {
      let errMsg = 'Erro ao importar NF-e.';
      try {
        const errBody = JSON.parse(uploadResult.body);
        errMsg = errBody.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    return JSON.parse(uploadResult.body);
  },

  async getInvoices(page = 1, limit = 20): Promise<NfeInvoicePage> {
    const response = await api.get(
      `/api/stock/nfe/invoices?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  async getInvoice(id: string): Promise<NfeInvoice> {
    const response = await api.get(`/api/stock/nfe/invoices/${id}`);
    return response.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/api/stock/nfe/invoices/${id}`);
  },
};
