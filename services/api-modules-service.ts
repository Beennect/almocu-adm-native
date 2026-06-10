import api from './api-service';

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  acquired: boolean;
  acquiredAt?: string;
}

export const apiModulesService = {
  async getModules(): Promise<ModuleInfo[]> {
    const response = await api.get('/modules');
    return response.data;
  },

  async acquireModule(moduleId: string, active: boolean = true): Promise<ModuleInfo> {
    const response = await api.post(`/modules/${moduleId}/acquire`, { active });
    return response.data;
  },
};
