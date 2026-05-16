import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable } from "mobx";
import { apiMenuService } from "../services/api-menu-service";
import { apiOrderService, mapStatusToFrontend } from "../services/api-order-service";
import api from "../services/api-service";
import { apiStaffService, mapRoleToFrontend } from "../services/api-staff-service";
import { apiStockService } from "../services/api-stock-service";
import { authStore } from "./AuthStore";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  ingredients?: any[];
  hasRemovals?: boolean;
  hasAdditionals?: boolean;
  serves?: string | number;
  image?: string | null;
  isActive?: boolean;
  stockProductId?: string;
  available?: boolean;
}

export type OrderStatus = 'PENDENTE' | 'PREPARANDO' | 'SAIU_PARA_ENTREGA' | 'CONCLUIDO' | 'CANCELADO';

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
}

export interface Order {
  id: string;
  clientName: string;
  table: string;
  total: number;
  status: OrderStatus;
  time: string;
  createdAt: string;
  items?: any[];
  address?: {
    cep: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    complemento: string;
    semNumero?: boolean;
  };
  additionalInfo?: string;
  statusHistory: StatusHistoryEntry[];
}

export interface IngredientItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
}

export interface Branch {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  address: string;
}

export interface ModuleItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  acquired: boolean;
  showInNavbar: boolean;
}

export interface RestaurantDetails {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  category: string;
  address: string;
  deliveryFee: number;
  operatingHours: string;
  logoUrl?: string;
  inviteCode?: string;
  inviteCodeExpires?: string;
  ratingAverage?: number;
  ratingCount?: number;
}

export interface StaffMember {
  userId: string;
  name: string;
  email: string;
  role: 'GERENTE' | 'GARCOM' | 'COZINHA' | 'INDEFINIDO';
  customDescription?: string;
  performanceStats?: {
    tablesServed?: number;
    ratingAverage?: number;
    dishesPrepared?: number;
    revenueGenerated?: number;
    speedAverageMinutes?: number;
  };
}

const DEFAULT_BRANCHES: Branch[] = [
  { id: '1', name: 'Almocu - Filial Centro', cnpj: '12.345.678/0002-00', phone: '(11) 98765-4321', address: 'Rua São Bento, 456 - Centro, São Paulo - SP' },
  { id: '2', name: 'Almocu - Filial Shopping', cnpj: '12.345.678/0003-00', phone: '(11) 98765-8765', address: 'Av. Paulista, 1230 - Bela Vista, São Paulo - SP' }
];

const DEFAULT_MODULES: ModuleItem[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Visão geral de vendas, faturamento e desempenho comercial.', price: 0, icon: 'DashboardIcon', acquired: true, showInNavbar: true },
  { id: 'cardapio', name: 'Cardápio', description: 'Cadastro e gestão completa do menu de refeições e distribuidores.', price: 0, icon: 'CardapioIcon', acquired: true, showInNavbar: true },
  { id: 'pedidos', name: 'Pedidos Ativos', description: 'Acompanhamento de pedidos em tempo real com alertas sonoros.', price: 0, icon: 'BagIcon', acquired: true, showInNavbar: true },
  { id: 'ingredientes', name: 'Estoque', description: 'Controle inteligente de insumos e matérias-primas com alerta.', price: 0, icon: 'ClocheIcon', acquired: true, showInNavbar: true },
  { id: 'funcionarios', name: 'Funcionários', description: 'Gestão da equipe, atribuição de cargos e códigos de convites.', price: 0, icon: 'SettingsIcon', acquired: true, showInNavbar: false },
];

const DEFAULT_RESTAURANT: RestaurantDetails = {
  id: 'rest_default',
  name: 'Cantina Bella Italia',
  cnpj: '12.345.678/0001-99',
  phone: '(11) 3456-7890',
  category: 'Italiana',
  address: 'Rua das Flores, 123 - Jardins, São Paulo - SP',
  deliveryFee: 7.50,
  operatingHours: 'Terça a Domingo: 11:30 às 23:00',
  ratingAverage: 4.8,
  ratingCount: 15,
};

class DataStore {
  menuItems: MenuItem[] = [];
  orders: Order[] = [];
  ingredients: IngredientItem[] = [];
  branches: Branch[] = [];
  modules: ModuleItem[] = [];
  restaurantDetails: RestaurantDetails | null = null;
  restaurants: RestaurantDetails[] = [];
  staff: StaffMember[] = [];
  isInitialized: boolean = false;
  activeNotifications: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    if (!authStore.user) return;
    
    try {
      const restId = authStore.user.restaurantId;
      if (!restId) {
        this.clear();
        this.isInitialized = true;
        return;
      }

      // 1. Carregar detalhes do restaurante e filiais do backend
      const restResponse = await api.get('/restaurants/my');
      const myRestaurants = restResponse.data;
      const activeLink = myRestaurants.find((r: any) => r.restaurantId && r.restaurantId._id === restId);
      
      if (activeLink) {
        const rDetails = activeLink.restaurantId;
        this.restaurantDetails = {
          id: rDetails._id,
          name: rDetails.name,
          cnpj: rDetails.cnpj,
          phone: '(11) 3456-7890',
          category: 'Restaurante',
          address: 'Endereço Principal',
          deliveryFee: 0,
          operatingHours: 'Sempre Aberto',
          inviteCode: rDetails.inviteCode,
          ratingAverage: 5.0,
          ratingCount: 1,
        };
      } else {
        this.restaurantDetails = {
          ...DEFAULT_RESTAURANT,
          id: restId,
          name: 'Novo Restaurante'
        };
      }

      // Carregar filiais vinculadas (branches) do backend
      const filiais = myRestaurants.filter((r: any) => r.restaurantId && r.restaurantId.parentId === restId);
      this.branches = filiais.map((f: any) => ({
        id: f.restaurantId._id,
        name: f.restaurantId.name,
        cnpj: f.restaurantId.cnpj,
        phone: '(11) 3456-7890',
        address: 'Endereço da Filial',
      }));
      if (this.branches.length === 0) {
        this.branches = [...DEFAULT_BRANCHES];
      }

      // 2. Carregar produtos (Cardápio) da API
      const menuData = await apiMenuService.getMenu(1, 100);
      const menuItemsFromApi = menuData.items || [];
      this.menuItems = menuItemsFromApi.map((item: any) => ({
        id: item._id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.brand || 'Geral', // backend brand maps to frontend category
        isActive: item.isActive !== false,
        available: item.isActive !== false,
        ingredients: [
          { id: item.stockProductId || 'placeholder', name: 'Ingrediente Base', quantity: '1', unit: 'un' }
        ],
        hasRemovals: false,
        hasAdditionals: false,
        serves: 1,
        image: null,
      }));

      // 3. Carregar estoque (Ingredientes) da API
      const stockData = await apiStockService.getStock(1, 100);
      const stockItemsFromApi = stockData.items || [];
      this.ingredients = stockItemsFromApi.map((ing: any) => ({
        id: ing._id,
        name: ing.name,
        unit: ing.unit || 'un',
        stock: ing.quantity || 0,
      }));

      // 4. Carregar equipe (Staff) da API
      try {
        const staffData = await apiStaffService.getStaff(restId);
        this.staff = staffData.map((st: any) => ({
          userId: st.userId?._id || st.userId,
          name: st.userId?.name || 'Funcionário',
          email: st.userId?.email || st.userId?.username || 'email@restaurante.com',
          role: mapRoleToFrontend(st.role),
          performanceStats: { tablesServed: 10, ratingAverage: 4.9, dishesPrepared: 5, revenueGenerated: 250.00 }
        }));
      } catch (staffErr) {
        console.warn("Failed to fetch staff from API, keeping default.", staffErr);
        this.staff = [
          {
            userId: authStore.user.id || authStore.user.email,
            name: authStore.user.name,
            email: authStore.user.email,
            role: authStore.activeRole,
            performanceStats: { tablesServed: 12, ratingAverage: 4.9, dishesPrepared: 0, revenueGenerated: 1450.00 }
          }
        ];
      }

      // 5. Carregar pedidos (Orders) da API
      const ordersData = await apiOrderService.getOrders();
      this.orders = ordersData.map((ord: any) => {
        const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '00:00';
        return {
          id: ord._id,
          clientName: ord.origin || 'Garçom',
          table: ord.origin || 'Balcão',
          total: ord.totalValue,
          status: mapStatusToFrontend(ord.status),
          time: dateStr,
          createdAt: ord.createdAt || new Date().toISOString(),
          items: ord.items ? ord.items.map((i: any) => ({
            id: i.productId?._id || i.productId,
            name: i.name || 'Produto',
            quantity: i.quantity,
            price: i.price || 0,
          })) : [],
          statusHistory: ord.statusHistory ? ord.statusHistory.map((h: any) => ({
            status: mapStatusToFrontend(h.status),
            timestamp: h.timestamp,
          })) : [{ status: mapStatusToFrontend(ord.status), timestamp: ord.createdAt || new Date().toISOString() }],
        };
      });

      // Carregar configurações de módulos salvos localmente
      const storedModules = await AsyncStorage.getItem(`modules_${authStore.user.email}_${restId}`);
      const loadedModules = storedModules ? JSON.parse(storedModules) : [];
      this.modules = DEFAULT_MODULES.map(defMod => {
        const found = loadedModules.find((m: any) => m.id === defMod.id);
        const isGerente = authStore.activeRole === 'GERENTE';
        let showInNavbar = defMod.showInNavbar;
        if (defMod.id === 'funcionarios') {
          showInNavbar = isGerente;
        }
        return found ? { ...defMod, acquired: found.acquired, showInNavbar } : { ...defMod, showInNavbar };
      });

    } catch (e) {
      console.error("Failed to load backend data in DataStore", e);
    } finally {
      this.isInitialized = true;
    }
  }

  async clearOrders() {
    this.orders = [];
  }

  async save() {
    // Legacy offline compatibility (e.g. keeping modules settings local)
    if (!authStore.user || !authStore.user.restaurantId) return;
    try {
      const userKey = authStore.user.email;
      const restId = authStore.user.restaurantId;
      await AsyncStorage.setItem(`modules_${userKey}_${restId}`, JSON.stringify(this.modules));
    } catch (e) {
      console.error("Failed to save local config", e);
    }
  }

  createRestaurantDetails(details: RestaurantDetails) {
    this.restaurantDetails = details;
    this.init();
  }

  findRestaurantByInviteCode(inviteCode: string) {
    return null; // A validação de código agora é delegada totalmente ao backend (/restaurants/join)
  }

  async joinRestaurantStaff(restaurantId: string, member: StaffMember) {
    await this.init();
  }

  generateInviteCode() {
    return this.restaurantDetails?.inviteCode || '';
  }

  async assignStaffRole(email: string, role: 'GERENTE' | 'GARCOM' | 'COZINHA') {
    if (!this.restaurantDetails) return;
    const member = this.staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (member) {
      await apiStaffService.updateStaffRole(this.restaurantDetails.id, member.userId, role);
      await this.init();
    }
  }

  async removeStaffMember(email: string) {
    if (!this.restaurantDetails) return;
    const member = this.staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (member) {
      await apiStaffService.removeStaff(this.restaurantDetails.id, member.userId);
      await this.init();
    }
  }

  toggleMenuItemActive(itemId: string) {
    const index = this.menuItems.findIndex(i => i.id === itemId);
    if (index !== -1) {
      this.menuItems[index].isActive = !this.menuItems[index].isActive;
    }
  }

  toggleMenuItemAvailability(itemId: string) {
    const index = this.menuItems.findIndex(i => i.id === itemId);
    if (index !== -1) {
      const item = this.menuItems[index];
      const newAvailable = !(item.available ?? true);
      item.available = newAvailable;
      item.isActive = newAvailable;
      this.updateItem(itemId, { isActive: newAvailable }).catch(e => {
        console.warn("Failed to sync item availability with backend", e);
      });
    }
  }

  async addItem(item: Omit<MenuItem, 'id'>) {
    const created = await apiMenuService.createProduct(item);
    await this.init();
    return created;
  }

  async updateItem(id: string, updatedData: Partial<MenuItem>) {
    await apiMenuService.updateProduct(id, updatedData);
    await this.init();
  }

  async removeItem(id: string) {
    await apiMenuService.deleteProduct(id);
    await this.init();
  }

  async addOrder(order: Omit<Order, 'id' | 'status' | 'time' | 'createdAt' | 'statusHistory'>) {
    const isValidMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

    const items = order.items
      ? order.items
          .filter((i: any) => isValidMongoId(i.id || i.productId))
          .map((i: any) => ({
            productId: i.id || i.productId,
            quantity: i.quantity,
          }))
      : [];

    if (items.length === 0) {
      throw new Error('Nenhum item válido no pedido. Verifique se os produtos foram cadastrados no cardápio.');
    }

    const created = await apiOrderService.createOrder({
      items,
      origin: order.table || order.clientName || 'Mesa',
      observations: order.additionalInfo || '',
    });

    await this.init();
    return created;
  }

  async updateOrder(id: string, updatedFields: Partial<Order>) {
    // Updates are handled through standard transitions
  }

  async updateOrderStatus(id: string) {
    const order = this.orders.find(o => o.id === id);
    if (!order) return;

    let nextStatus: OrderStatus | null = null;
    const isDelivery = !!order.address;

    if (order.status === 'PENDENTE') {
      nextStatus = 'PREPARANDO';
    } else if (order.status === 'PREPARANDO') {
      nextStatus = isDelivery ? 'SAIU_PARA_ENTREGA' : 'CONCLUIDO';
    } else if (order.status === 'SAIU_PARA_ENTREGA') {
      nextStatus = 'CONCLUIDO';
    }

    if (nextStatus) {
      await apiOrderService.updateOrderStatus(id, nextStatus);
      await this.init();
    }
  }

  async cancelOrder(id: string) {
    await apiOrderService.updateOrderStatus(id, 'CANCELADO');
    await this.init();
  }

  async closeOrder(id: string, paymentMethod: string, rating: number) {
    await apiOrderService.updateOrderStatus(id, 'CONCLUIDO');
    if (rating > 0) {
      this.accumulateRating(rating);
    }
    await this.init();
  }

  accumulateRating(rating: number) {
    if (this.restaurantDetails) {
      const currentAvg = this.restaurantDetails.ratingAverage ?? 5.0;
      const currentCount = this.restaurantDetails.ratingCount ?? 0;
      const newCount = currentCount + 1;
      const newAvg = parseFloat(((currentAvg * currentCount + rating) / newCount).toFixed(1));
      this.restaurantDetails.ratingAverage = newAvg;
      this.restaurantDetails.ratingCount = newCount;
    }
  }

  clearNotifications() {
    this.activeNotifications = [];
  }

  async addIngredient(ingredient: Omit<IngredientItem, 'id'>) {
    const created = await apiStockService.createStock({
      name: ingredient.name,
      quantity: ingredient.stock,
      unit: ingredient.unit,
    });
    await this.init();
    return created;
  }

  async removeIngredient(id: string) {
    await apiStockService.deleteStock(id);
    await this.init();
  }

  async updateIngredient(id: string, updates: Partial<IngredientItem>) {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.stock !== undefined) payload.quantity = updates.stock;
    if (updates.unit !== undefined) payload.unit = updates.unit;

    await apiStockService.updateStock(id, payload);
    await this.init();
  }

  async updateIngredientStock(id: string, delta: number) {
    await apiStockService.adjustStock(id, delta);
    await this.init();
  }

  addBranch(branch: Omit<Branch, 'id'>): Branch {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newBranchObj: Branch = {
      id: tempId,
      name: branch.name,
      cnpj: branch.cnpj,
      phone: branch.phone,
      address: branch.address,
    };

    // Optimistic UI updates
    this.branches.push(newBranchObj);

    // Call backend in the background
    api.post('/restaurants/branch', {
      name: branch.name,
      parentId: authStore.user?.restaurantId,
    }).then(async (response) => {
      const backendBranch = response.data;
      if (backendBranch && backendBranch._id) {
        const found = this.branches.find(b => b.id === tempId);
        if (found) {
          found.id = backendBranch._id;
        }
      }
      await this.init();
    }).catch(err => {
      console.error("Failed to sync new branch to backend", err);
    });

    return newBranchObj;
  }

  async removeBranch(id: string) {
    // As filiais compartilham o modelo de restaurante e são removidas desvinculando-se delas
    await authStore.removeRestaurantWorkspace(id);
  }

  async updateRestaurantDetails(details: Partial<RestaurantDetails>) {
    // Mock local placeholder updates
    if (this.restaurantDetails) {
      this.restaurantDetails = { ...this.restaurantDetails, ...details };
    }
  }

  purchaseModule(moduleId: string) {
    const index = this.modules.findIndex(m => m.id === moduleId);
    if (index !== -1) {
      this.modules[index].acquired = true;
      this.modules[index].showInNavbar = true;
      this.save();
    }
  }

  toggleModuleNavbar(moduleId: string, value: boolean) {
    const index = this.modules.findIndex(m => m.id === moduleId);
    if (index !== -1) {
      this.modules[index].showInNavbar = value;
      this.save();
    }
  }

  clear() {
    this.menuItems = [];
    this.orders = [];
    this.ingredients = [];
    this.branches = [...DEFAULT_BRANCHES];
    this.modules = DEFAULT_MODULES.map(m => ({ ...m }));
    this.restaurantDetails = null;
    this.staff = [];
  }
}

export const dataStore = new DataStore();
