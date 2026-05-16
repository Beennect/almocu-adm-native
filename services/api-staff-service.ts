import api from './api-service';

export type UserRole = 'OWNER' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER';

// Mapeamento de roles do frontend para o backend e vice-versa
// O frontend usa: 'GERENTE' | 'GARCOM' | 'COZINHA' | 'INDEFINIDO'
// O backend usa: 'OWNER' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER'
export function mapRoleToFrontend(role: string): 'GERENTE' | 'GARCOM' | 'COZINHA' | 'INDEFINIDO' {
  switch (role) {
    case 'OWNER':
    case 'MANAGER':
      return 'GERENTE';
    case 'WAITER':
      return 'GARCOM';
    case 'KITCHEN':
      return 'COZINHA';
    default:
      return 'INDEFINIDO';
  }
}

export function mapRoleToBackend(role: 'GERENTE' | 'GARCOM' | 'COZINHA' | 'INDEFINIDO'): UserRole {
  switch (role) {
    case 'GERENTE':
      return 'MANAGER';
    case 'GARCOM':
      return 'WAITER';
    case 'COZINHA':
      return 'KITCHEN';
    default:
      return 'WAITER';
  }
}

export const apiStaffService = {
  async getStaff(restaurantId: string) {
    const response = await api.get(`/restaurants/${restaurantId}/staff`);
    return response.data;
  },

  async updateStaffRole(restaurantId: string, userId: string, role: 'GERENTE' | 'GARCOM' | 'COZINHA' | 'INDEFINIDO') {
    const backendRole = mapRoleToBackend(role);
    const response = await api.patch(`/restaurants/${restaurantId}/staff/${userId}`, { role: backendRole });
    return response.data;
  },

  async removeStaff(restaurantId: string, userId: string) {
    const response = await api.delete(`/restaurants/${restaurantId}/staff/${userId}`);
    return response.data;
  },
};
