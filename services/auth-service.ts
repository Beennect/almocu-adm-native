import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from './api-service';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  restaurantId?: string;
  restaurantRole?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  restaurantId?: string;
  email?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  private readonly TOKEN_KEY = '@auth_token';
  private readonly USER_KEY = '@user_data';

  private mapUserFromBackend(backendUser: any): User {
    return {
      id: backendUser._id || backendUser.id || '',
      username: backendUser.username || '',
      email: backendUser.email || '',
      roles: Array.isArray(backendUser.roles) ? backendUser.roles : 
            (backendUser.role ? [backendUser.role] : []),
      restaurantId: backendUser.restaurantId || backendUser.restaurant_id || undefined,
      restaurantRole: backendUser.restaurantRole || backendUser.restaurant_role || undefined,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[Auth] Tentando login com:', { username: credentials.username, email: credentials.email });
      
      const loginPayload = {
        username: credentials.username,
        password: credentials.password,
        ...(credentials.email && { email: credentials.email }),
        ...(credentials.restaurantId && { restaurantId: credentials.restaurantId }),
      };
      
      const response = await authApi.post<any>('/auth/login', loginPayload);
      console.log('[Auth] Resposta do backend:', response.data);
      
      // Suportar diferentes formatos de resposta
      const data = response.data;
      let access_token = data.access_token || data.token || data.accessToken || '';
      let user = data.user || data.profile || data.data || data;

      if (!access_token) {
        console.error('[Auth] Token não encontrado na resposta:', data);
        throw new Error('Token não encontrado na resposta do servidor');
      }

      if (!user || typeof user !== 'object') {
        console.error('[Auth] Dados do usuário não encontrados:', data);
        throw new Error('Dados do usuário não encontrados na resposta');
      }

      // Mapear usuário para formato do frontend
      user = this.mapUserFromBackend(user);

      // Salvar token e dados do usuário
      await AsyncStorage.setItem(this.TOKEN_KEY, access_token);
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));

      // Configurar token no header das futuras requisições
      this.setAuthToken(access_token);

      return { access_token, user };
    } catch (error: any) {
      console.error('[Auth] Erro no login:', error.response?.data || error.message);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const registerPayload = {
        name: data.name,
        email: data.email,
        username: data.username,
        password: data.password,
      };
      console.log('[Auth] Tentando registro com:', { username: registerPayload.username, email: registerPayload.email });
      
      const response = await authApi.post<any>('/auth/register', registerPayload);
      console.log('[Auth] Resposta do registro:', response.data);
      
      // O register retorna apenas o usuário, não o token
      // Precisamos fazer login automaticamente para obter o token
      const userData = response.data;
      
      if (!userData || typeof userData !== 'object') {
        console.error('[Auth] Dados do usuário não encontrados:', response.data);
        throw new Error('Dados do usuário não encontrados na resposta');
      }

      // Mapear usuário para formato do frontend
      const user = this.mapUserFromBackend(userData);

      // Salvar dados do usuário (sem token ainda)
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));

      // Fazer login automaticamente para obter o token
      console.log('[Auth] Fazendo login automático após registro...');
      const loginResponse = await this.login({ 
        username: data.username, 
        password: data.password 
      });

      return { access_token: loginResponse.access_token, user };
    } catch (error: any) {
      console.error('[Auth] Erro no registro:', error.response?.data || error.message);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('[AuthService] Iniciando logout...');
      const token = await this.getToken();
      console.log('[AuthService] Token encontrado:', !!token);
      if (token) {
        // Chamar endpoint de logout da API
        await authApi.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[AuthService] Logout na API realizado');
      }
    } catch (error) {
      console.warn('[AuthService] Erro ao fazer logout na API:', error);
    } finally {
      console.log('[AuthService] Limpando dados locais...');
      // Sempre limpar dados locais, independente do resultado da API
      await AsyncStorage.removeItem(this.TOKEN_KEY);
      await AsyncStorage.removeItem(this.USER_KEY);
      this.removeAuthToken();
      console.log('[AuthService] Dados locais removidos');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const user = await this.getUser();
      return !!(token && user);
    } catch (error) {
      return false;
    }
  }

  setAuthToken(token: string): void {
    authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private removeAuthToken(): void {
    delete authApi.defaults.headers.common['Authorization'];
  }

  // Método para verificar se o token ainda é válido
  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      // Você pode implementar uma chamada para verificar se o token é válido
      // Por exemplo, uma rota protegida que retorna 200 se válido
      await authApi.get('/auth/verify');
      return true;
    } catch (error) {
      // Token inválido ou expirado
      await this.logout();
      return false;
    }
  }
}

export const authService = new AuthService();