import api from './api-service';

export type UserRole = 'OWNER' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER' | 'DELIVERY' | 'COMMON';

export type FrontRole = 'GERENTE' | 'GARCOM' | 'COZINHA' | 'CAIXA' | 'ENTREGADOR' | 'COMUM' | 'INDEFINIDO';

// Mapeamento de roles do frontend para o backend e vice-versa
// O frontend usa: 'GERENTE' | 'GARCOM' | 'COZINHA' | 'CAIXA' | 'ENTREGADOR' | 'COMUM' | 'INDEFINIDO'
// O backend usa: 'OWNER' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER' | 'DELIVERY' | 'COMMON'
export function mapRoleToFrontend(role: string): FrontRole {
  switch (role) {
    case 'OWNER':
    case 'MANAGER':
      return 'GERENTE';
    case 'WAITER':
      return 'GARCOM';
    case 'KITCHEN':
      return 'COZINHA';
    case 'CASHIER':
      return 'CAIXA';
    case 'DELIVERY':
      return 'ENTREGADOR';
    case 'COMMON':
      return 'COMUM';
    default:
      return 'INDEFINIDO';
  }
}

export function mapRoleToBackend(role: FrontRole): UserRole {
  switch (role) {
    case 'GERENTE':
      return 'MANAGER';
    case 'GARCOM':
      return 'WAITER';
    case 'COZINHA':
      return 'KITCHEN';
    case 'CAIXA':
      return 'CASHIER';
    case 'ENTREGADOR':
      return 'DELIVERY';
    case 'COMUM':
      return 'COMMON';
    default:
      return 'WAITER';
  }
}

export const apiStaffService = {
  async getStaff(restaurantId: string, page: number = 1, limit: number = 10) {
    const response = await api.get(`/restaurants/${restaurantId}/staff`, {
      params: { page, limit },
    });
    return response.data;
  },

  async updateStaffRole(restaurantId: string, userId: string, role: FrontRole) {
    const backendRole = mapRoleToBackend(role);
    const response = await api.patch(`/restaurants/${restaurantId}/staff/${userId}`, { role: backendRole });
    return response.data;
  },

  async removeStaff(restaurantId: string, userId: string) {
    const response = await api.delete(`/restaurants/${restaurantId}/staff/${userId}`);
    return response.data;
  },

  async getInviteCode(restaurantId: string): Promise<{ code: string; expiresInSeconds: number }> {
    const response = await api.get(`/restaurants/${restaurantId}/invite-code`);
    return response.data;
  },
};
