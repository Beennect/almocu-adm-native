import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable } from "mobx";
import { Platform } from "react-native";
import api from "../services/api-service";
import { dataStore } from "./DataStore";

function mapBackendRoleToFrontend(role: string): 'GERENTE' | 'GARCOM' | 'COZINHA' | 'CAIXA' | 'COMUM' | 'INDEFINIDO' {
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
    case 'COMMON':
      return 'COMUM';
    default:
      return 'INDEFINIDO';
  }
}

class AuthStore {
  isAuthenticated: boolean = false;
  user: any = null; // { email, name, accountType, restaurantId, restaurantRoles }
  isInitialized: boolean = false;
  users: any[] = [];

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  async init() {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          this.user = JSON.parse(storedUser);
          this.isAuthenticated = true;
        }
      }
      const storedUsers = await AsyncStorage.getItem('users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else if (Platform.OS === 'web') {
        const localUsers = localStorage.getItem('users');
        if (localUsers) {
          this.users = JSON.parse(localUsers);
        }
      }
    } catch (e) {
      console.error("Failed to load auth state", e);
    } finally {
      this.isInitialized = true;
      if (this.isAuthenticated) {
        dataStore.init();
      }
    }
  }

  get activeRole(): 'GERENTE' | 'GARCOM' | 'COZINHA' | 'CAIXA' | 'COMUM' | 'INDEFINIDO' {
    if (!this.user || !this.user.restaurantId) return 'INDEFINIDO';
    return this.user.restaurantRoles?.[this.user.restaurantId] || 'INDEFINIDO';
  }

  async register(email: string, pass: string, name: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Chamada real de registro para o backend
    const response = await api.post('/auth/register', {
      username: normalizedEmail,
      email: normalizedEmail,
      password: pass,
      name,
    });

    // Track locally in users array for forgot-password / edit profile simulation matching
    const newUser = { email: normalizedEmail, password: pass, name };
    this.users.push(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(this.users));
    if (Platform.OS === 'web') {
      localStorage.setItem('users', JSON.stringify(this.users));
    }

    return response.data;
  }

  async login(email: string, pass: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Chamada real de login no microserviço do backend
    const response = await api.post('/auth/login', {
      username: normalizedEmail,
      password: pass,
    });

    const { access_token, user: backendUser } = response.data;

    // Ensure user is tracked in local users list for profile password validation
    if (!this.users.some(u => u.email === normalizedEmail)) {
      this.users.push({ email: normalizedEmail, password: pass, name: backendUser.name });
      await AsyncStorage.setItem('users', JSON.stringify(this.users));
      if (Platform.OS === 'web') {
        localStorage.setItem('users', JSON.stringify(this.users));
      }
    }

    await this._applyLoginResponse(access_token, backendUser);
  }

  async loginWithToken(token: string) {
    // Salva o token primeiro para que o interceptor do axios envie o Authorization
    await AsyncStorage.setItem('auth_token', token);

    try {
      // Decodifica o JWT (payload base64) para extrair dados básicos do usuário.
      // Atenção: decode sem verificar assinatura. A validação real é feita pelo backend
      // em qualquer requisição autenticada.
      let jwtPayload: { sub?: string; username?: string; globalRoles?: string[] } = {};
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
          jwtPayload = JSON.parse(atob(padded));
        }
      } catch (decodeErr) {
        console.warn('Falha ao decodificar JWT no loginWithToken', decodeErr);
      }

      // Busca o perfil canônico (apenas dados do token ativo, sem email/name/restaurants[])
      const meResponse = await api.get('/auth/me');
      const meData = meResponse.data || {};

      // O backend /auth/me ainda não retorna restaurants[]; quando há restaurantId ativo,
      // inferimos um único item para popular restaurantRoles com a role atual.
      const restaurants = meData.restaurantId
        ? [{ id: meData.restaurantId, role: meData.activeRole }]
        : [];

      const backendUser = {
        id: meData.id ?? jwtPayload.sub,
        email: jwtPayload.username || '',
        name: jwtPayload.username || '',
        globalRoles: meData.globalRoles ?? jwtPayload.globalRoles ?? ['user'],
        activeRestaurantId: meData.restaurantId || '',
        restaurants,
      };

      await this._applyLoginResponse(token, backendUser);
    } catch (err) {
      // Token inválido ou /auth/me falhou: limpa storage e propaga o erro
      await AsyncStorage.removeItem('auth_token');
      throw err;
    }
  }

  private async _applyLoginResponse(
    accessToken: string,
    backendUser: any,
  ) {
    // Converter as roles do backend para o formato reativo do frontend
    const restaurantRoles: Record<string, string> = {};
    if (backendUser.restaurants) {
      backendUser.restaurants.forEach((r: any) => {
        restaurantRoles[r.id] = mapBackendRoleToFrontend(r.role);
      });
    }

    this.isAuthenticated = true;
    this.user = {
      id: backendUser.id,
      email: backendUser.email,
      name: backendUser.name,
      accountType: 'business',
      restaurantRoles,
      restaurantId: backendUser.activeRestaurantId || '',
    };

    // Salvar token e estado da sessão
    await AsyncStorage.setItem('auth_token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(this.user));

    if (this.user.restaurantId) {
      await AsyncStorage.setItem('selected_restaurant_id', this.user.restaurantId);
    } else {
      await AsyncStorage.removeItem('selected_restaurant_id');
    }

    await dataStore.init();
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn("Backend logout request failed, clearing local session anyway.", e);
    }

    this.isAuthenticated = false;
    this.user = null;

    // Limpar o AsyncStorage completamente
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('selected_restaurant_id');

    dataStore.clear();
  }

  async createRestaurantWorkspace(name: string, cnpj: string, maxBranches: number) {
    if (!this.user) return;

    // Criar o restaurante master no backend
    const response = await api.post('/restaurants', {
      name,
      cnpj,
      maxBranches,
    });

    const newRestaurant = response.data; // { _id, name, cnpj, plan, maxBranches, status, ... }
    const newRestaurantId = newRestaurant._id;

    // Atualizar dados locais do usuário
    this.user.restaurantId = newRestaurantId;
    if (!this.user.restaurantRoles) this.user.restaurantRoles = {};
    this.user.restaurantRoles[newRestaurantId] = 'GERENTE';

    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    await AsyncStorage.setItem('selected_restaurant_id', newRestaurantId);

    // Sincronizar dados retornados pelo backend na store local
    await dataStore.createRestaurantDetails({
      id: newRestaurantId,
      name: newRestaurant.name,
      cnpj: newRestaurant.cnpj,
      maxBranches: typeof newRestaurant.maxBranches === 'number' ? newRestaurant.maxBranches : maxBranches,
      plan: newRestaurant.plan || 'BASIC',
      status: newRestaurant.status || 'active',
      inviteCode: newRestaurant.inviteCode,
    });
  }

  async joinRestaurantWorkspace(inviteCode: string) {
    if (!this.user) return;

    // Participar do restaurante via código de convite no backend
    const response = await api.post('/restaurants/join', {
      inviteCode: inviteCode.trim().toUpperCase(),
    });

    const joinResult = response.data; // { userId, restaurantId, role, status }
    const targetRestId = joinResult.restaurantId;

    // Recarregar os restaurantes do usuário
    const myRestResponse = await api.get('/restaurants/my');
    const myRestaurants = myRestResponse.data;

    // Atualizar as roles e o ID ativo
    const restaurantRoles: Record<string, string> = {};
    myRestaurants.forEach((r: any) => {
      if (r.restaurantId) {
        restaurantRoles[r.restaurantId._id] = mapBackendRoleToFrontend(r.role);
      }
    });

    this.user.restaurantId = targetRestId;
    this.user.restaurantRoles = restaurantRoles;

    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    await AsyncStorage.setItem('selected_restaurant_id', targetRestId);

    await dataStore.init();
  }

  async selectRestaurantWorkspace(restaurantId: string) {
    if (!this.user) return;
    this.user.restaurantId = restaurantId;

    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    await AsyncStorage.setItem('selected_restaurant_id', restaurantId);

    // init() é fino e paralelo agora; é a forma mais segura de trocar contexto
    // e cada tela dispara seu próprio refresh* granular ao montar
    await dataStore.init();
  }

  async removeRestaurantWorkspace(restaurantId: string) {
    if (!this.user) return;

    // Limpar workspace no backend removendo o vínculo do usuário com o restaurante
    await api.delete(`/restaurants/${restaurantId}/staff/${this.user.id}`).catch((e) => {
      console.warn("Failed to delete staff link from backend", e);
      throw e;
    });

    if (this.user.restaurantRoles) {
      delete this.user.restaurantRoles[restaurantId];
    }

    const remainingIds = Object.keys(this.user.restaurantRoles || {});
    if (this.user.restaurantId === restaurantId) {
      this.user.restaurantId = remainingIds.length > 0 ? remainingIds[0] : null;
    }

    await AsyncStorage.setItem('user', JSON.stringify(this.user));
    if (this.user.restaurantId) {
      await AsyncStorage.setItem('selected_restaurant_id', this.user.restaurantId);
    } else {
      await AsyncStorage.removeItem('selected_restaurant_id');
    }

    // Apenas rebusca a lista de workspaces (o que importa para o seletor);
    // as telas de domínio já disparam seus próprios refresh* no mount.
    await dataStore.refreshWorkspaces();
  }

  async refreshProfile() {
    if (!this.user?.restaurantId) return;
    try {
      const response = await api.get('/auth/me');
      const data = response.data;
      if (data.activeRole && data.restaurantId) {
        const frontRole = mapBackendRoleToFrontend(data.activeRole);
        this.user.restaurantRoles = {
          ...this.user.restaurantRoles,
          [data.restaurantId]: frontRole,
        };
        // Se o restaurantId retornado for diferente do ativo, atualiza também
        if (data.restaurantId && data.restaurantId !== this.user.restaurantId) {
          this.user.restaurantId = data.restaurantId;
        }
        await AsyncStorage.setItem('user', JSON.stringify(this.user));
      }
    } catch (e) {
      console.warn('refreshProfile() falhou:', e);
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.patch('/auth/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }
}

export const authStore = new AuthStore();
