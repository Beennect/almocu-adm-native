import api from './api-service';

export interface NfeParseItem {
  name: string;
  ncm?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface NfeDuplicateInfo {
  importedAt: string;
  userName: string;
  itemCount: number;
}

export interface NfeParseResult {
  items: NfeParseItem[];
  supplierName?: string;
  supplierCnpj?: string;
  accessKey?: string;
  duplicate?: NfeDuplicateInfo;
}

export const apiNfeService = {
  async parseXml(xmlContent: string): Promise<NfeParseResult> {
    const response = await api.post('/api/stock/nfe/parse', { xml: xmlContent });
    return response.data;
  },

  async recordImport(data: {
    accessKey: string;
    supplierName?: string;
    supplierCnpj?: string;
    itemCount: number;
  }): Promise<void> {
    await api.post('/api/stock/nfe/record', data);
  },
};
