import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable } from "mobx";
import { apiMenuService } from "../services/api-menu-service";
import { apiOrderService, mapStatusToFrontend } from "../services/api-order-service";
import api from "../services/api-service";
import { apiStaffService, mapRoleToFrontend } from "../services/api-staff-service";
import { apiStockService } from "../services/api-stock-service";
import { apiSupplierService, SupplierInput } from "../services/api-supplier-service";
import { authStore } from "./AuthStore";

const MENU_IMAGE_BASE_URL = 'http://localhost:3000';

const resolveImageUrl = (imageUrl?: string | null): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${MENU_IMAGE_BASE_URL}${imageUrl}`;
};

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  ingredients?: any[];
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
  brand?: string;
  unit: string;
  stock: number;
  minQuantity?: number;
  supplierId?: string;
  supplierName?: string;
}

export interface SupplierAddress {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  complement?: string;
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
  maxBranches?: number;
  plan?: 'BASIC' | 'PROFESSIONAL' | 'NETWORK' | 'PREMIUM';
  status?: 'active' | 'pending' | 'suspended';
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
  role: 'GERENTE' | 'GARCOM' | 'COZINHA' | 'CAIXA' | 'COMUM' | 'INDEFINIDO';
  customDescription?: string;
  performanceStats?: {
    tablesServed?: number;
    ratingAverage?: number;
    dishesPrepared?: number;
    revenueGenerated?: number;
    speedAverageMinutes?: number;
  };
}

export interface InviteCodeInfo {
  code: string;
  expiresAt: number; // timestamp em ms
}

const DEFAULT_BRANCHES: Branch[] = [
  { id: '1', name: 'Almocu - Filial Centro', cnpj: '12.345.678/0002-00', phone: '(11) 98765-4321', address: 'Rua São Bento, 456 - Centro, São Paulo - SP' },
  { id: '2', name: 'Almocu - Filial Shopping', cnpj: '12.345.678/0003-00', phone: '(11) 98765-8765', address: 'Av. Paulista, 1230 - Bela Vista, São Paulo - SP' }
];

const DEFAULT_MODULES: ModuleItem[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Visão geral de vendas, faturamento e desempenho comercial.', price: 0, icon: 'DashboardIcon', acquired: true, showInNavbar: true },
  { id: 'cardapio', name: 'Cardápio', description: 'Cadastro e gestão completa do menu de refeições e distribuidores.', price: 0, icon: 'CardapioIcon', acquired: true, showInNavbar: true },
  { id: 'pedidos', name: 'Pedidos', description: 'Acompanhamento de pedidos em tempo real com alertas sonoros.', price: 0, icon: 'BagIcon', acquired: true, showInNavbar: true },
  { id: 'estoque', name: 'Estoque', description: 'Controle inteligente de insumos e matérias-primas com alerta.', price: 0, icon: 'ClocheIcon', acquired: true, showInNavbar: true },
  { id: 'funcionarios', name: 'Funcionários', description: 'Gestão da equipe, atribuição de cargos e códigos de convites.', price: 0, icon: 'UsersIcon', acquired: true, showInNavbar: false },
  { id: 'fornecedores', name: 'Fornecedores', description: 'Cadastro de fornecedores vinculados aos itens de estoque.', price: 0, icon: 'TruckIcon', acquired: true, showInNavbar: false },
];

const DEFAULT_RESTAURANT: RestaurantDetails = {
  id: 'rest_default',
  name: 'Cantina Bella Italia',
  cnpj: '12.345.678/0001-99',
  maxBranches: 1,
  plan: 'BASIC',
  status: 'active',
  ratingAverage: 4.8,
  ratingCount: 15,
};

class DataStore {
  menuItems: MenuItem[] = [];
  orders: Order[] = [];
  ingredients: IngredientItem[] = [];
  suppliers: SupplierItem[] = [];
  branches: Branch[] = [];
  modules: ModuleItem[] = [];
  restaurantDetails: RestaurantDetails | null = null;
  restaurants: RestaurantDetails[] = [];
  staff: StaffMember[] = [];
  isInitialized: boolean = false;
  activeNotifications: string[] = [];
  inviteCodeInfo: InviteCodeInfo | null = null;
  isRefreshingInviteCode: boolean = false;
  isRefreshingWorkspaces: boolean = false;
  isRefreshingMenu: boolean = false;
  isRefreshingStock: boolean = false;
  isRefreshingSuppliers: boolean = false;
  isRefreshingStaff: boolean = false;
  isRefreshingOrders: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    if (!authStore.user) return;

    await this.loadLocalConfig();

    const restId = authStore.user.restaurantId;

    if (!restId) {
      // Sem workspace ativo: garante pelo menos a lista de workspaces para o seletor
      await this.refreshWorkspaces();
      this.isInitialized = true;
      return;
    }

    const settled = await Promise.allSettled([
      this.refreshWorkspaces(),
      this.refreshInviteCode(),
      this.refreshMenu(),
      this.refreshStock(),
      this.refreshSuppliers().then(() => this.enrichIngredientsWithSupplierNames()),
      this.refreshStaff(),
      this.refreshOrders(),
    ]);

    settled.forEach((result, idx) => {
      if (result.status === 'rejected') {
        const labels = [
          'refreshWorkspaces',
          'refreshInviteCode',
          'refreshMenu',
          'refreshStock',
          'refreshSuppliers',
          'refreshStaff',
          'refreshOrders',
        ];
        console.warn(`[DataStore.init] ${labels[idx]} falhou:`, result.reason);
      }
    });

    this.isInitialized = true;
  }

  async loadLocalConfig() {
    if (!authStore.user) return;
    const restId = authStore.user.restaurantId;
    try {
      const storedModules = await AsyncStorage.getItem(
        `modules_${authStore.user.email}_${restId || 'default'}`
      );
      const loadedModules = storedModules ? JSON.parse(storedModules) : [];
      this.modules = DEFAULT_MODULES.map((defMod) => {
        const found = loadedModules.find((m: any) => m.id === defMod.id);
        const isGerente = authStore.activeRole === 'GERENTE';

        // PERSISTIR o showInNavbar salvo pelo usuário, não o default
        let showInNavbar = found ? found.showInNavbar : defMod.showInNavbar;
        if (defMod.id === 'funcionarios' || defMod.id === 'fornecedores') {
          showInNavbar = isGerente;
        }
        return found
          ? { ...defMod, acquired: found.acquired, showInNavbar }
          : { ...defMod, showInNavbar };
      });
    } catch (e) {
      console.error('Failed to load modules from storage, using defaults.', e);
      this.modules = DEFAULT_MODULES.map((m) => ({ ...m }));
    }
  }

  async refreshWorkspaces() {
    if (this.isRefreshingWorkspaces) return;
    if (!authStore.user) return;
    this.isRefreshingWorkspaces = true;
    try {
      const restResponse = await api.get('/restaurants/my');
      const myRestaurants = restResponse.data || [];
      const restId = authStore.user.restaurantId;

      this.restaurants = myRestaurants
        .filter((r: any) => r.restaurantId)
        .map((r: any) => ({
          id: r.restaurantId._id,
          name: r.restaurantId.name,
          cnpj: r.restaurantId.cnpj,
        }));

      if (restId) {
        const activeLink = myRestaurants.find(
          (r: any) => r.restaurantId && r.restaurantId._id === restId
        );
        if (activeLink) {
          const rDetails = activeLink.restaurantId;
          this.restaurantDetails = {
            id: rDetails._id,
            name: rDetails.name,
            cnpj: rDetails.cnpj,
            maxBranches: typeof rDetails.maxBranches === 'number' ? rDetails.maxBranches : 1,
            plan: rDetails.plan || 'BASIC',
            status: rDetails.status || 'active',
            inviteCode: rDetails.inviteCode,
            ratingAverage: 5.0,
            ratingCount: 1,
          };
        } else if (!this.restaurantDetails) {
          this.restaurantDetails = {
            ...DEFAULT_RESTAURANT,
            id: restId,
            name: 'Novo Restaurante',
          };
        }

        const filiais = myRestaurants.filter(
          (r: any) => r.restaurantId && r.restaurantId.parentId === restId
        );
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
      } else {
        if (!this.restaurantDetails) {
          this.restaurantDetails = null;
        }
        if (this.branches.length === 0) {
          this.branches = [...DEFAULT_BRANCHES];
        }
      }
    } catch (e) {
      console.warn('refreshWorkspaces() falhou - mantendo valores anteriores:', e);
      if (!this.restaurantDetails && authStore.user.restaurantId) {
        this.restaurantDetails = {
          ...DEFAULT_RESTAURANT,
          id: authStore.user.restaurantId,
          name: 'Restaurante',
        };
      }
      if (this.branches.length === 0) {
        this.branches = [...DEFAULT_BRANCHES];
      }
    } finally {
      this.isRefreshingWorkspaces = false;
    }
  }

  // ── Métodos de refresh focado (substitutos do init() completo) ──

  async refreshMenu() {
    if (this.isRefreshingMenu) return;
    if (!authStore.user?.restaurantId) return;
    this.isRefreshingMenu = true;
    try {
      const menuData = await apiMenuService.getMenu(1, 100);
      const menuItemsFromApi = menuData.items || [];
      this.menuItems = menuItemsFromApi.map((item: any) => ({
        id: item._id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category || 'Geral',
        isActive: item.isActive !== false,
        available: item.isActive !== false,
        ingredients: (() => {
            if (item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0) {
              return item.ingredients.map((ing: any) => {
                const ingId = ing.stockProductId || ing.id || (typeof ing === 'string' ? ing : 'unknown');
                const matchedStock = this.ingredients.find(i => i.id === ingId);
                if (matchedStock) {
                  return { id: matchedStock.id, name: matchedStock.name, quantity: ing.quantity?.toString() || '1', unit: matchedStock.unit, info: ing.info || '' };
                }
                return { id: ingId, name: ing.name || 'Ingrediente Base', quantity: ing.quantity?.toString() || '1', unit: ing.unit || 'un', info: ing.info || '' };
              });
            }
            if (item.stockProductId && typeof item.stockProductId === 'string' && !item.stockProductId.startsWith('[')) {
              const matchedIng = this.ingredients.find(i => i.id === item.stockProductId);
              if (matchedIng) {
                return [{ id: matchedIng.id, name: matchedIng.name, quantity: '1', unit: matchedIng.unit, info: '' }];
              }
            }
            if (item.stockProductId && typeof item.stockProductId === 'string' && item.stockProductId.startsWith('[')) {
               try {
                  const embedded = JSON.parse(item.stockProductId);
                  if (Array.isArray(embedded) && embedded.length > 0) {
                    return embedded.map((ing: any) => {
                      const ingId = ing.stockProductId || ing.id || (typeof ing === 'string' ? ing : 'unknown');
                      const matchedStock = this.ingredients.find(i => i.id === ingId);
                      return { id: matchedStock ? matchedStock.id : ingId, name: matchedStock ? matchedStock.name : (ing.name || 'Ingrediente'), quantity: ing.quantity?.toString() || '1', unit: matchedStock ? matchedStock.unit : (ing.unit || 'un'), info: ing.info || '' };
                    });
                  }
               } catch(e) {}
            }
            return [];
        })(),
        image: resolveImageUrl(item.imageUrl),
      }));
      // Salvar em cache local
      const userKey = authStore.user!.email;
      const restId = authStore.user!.restaurantId;
      await AsyncStorage.setItem(`menu_${userKey}_${restId}_menu`, JSON.stringify(this.menuItems));
    } catch (e) {
      console.warn('refreshMenu() falhou:', e);
    } finally {
      this.isRefreshingMenu = false;
    }
  }

  async refreshStock() {
    if (this.isRefreshingStock) return;
    if (!authStore.user?.restaurantId) return;
    this.isRefreshingStock = true;
    try {
      const stockData = await apiStockService.getStock(1, 100);
      const stockItemsFromApi = stockData.items || [];
      this.ingredients = stockItemsFromApi.map((ing: any) => ({
        id: ing._id,
        name: ing.name,
        brand: ing.brand || '',
        unit: ing.unit || 'un',
        stock: ing.quantity || 0,
        minQuantity: ing.minQuantity || 0,
        supplierId: ing.supplierId || undefined,
      }));
      this.enrichIngredientsWithSupplierNames();
    } catch (e) {
      console.warn('refreshStock() falhou:', e);
    } finally {
      this.isRefreshingStock = false;
    }
  }

  async refreshSuppliers() {
    if (this.isRefreshingSuppliers) return;
    if (!authStore.user?.restaurantId) return;
    this.isRefreshingSuppliers = true;
    try {
      const data = await apiSupplierService.getSuppliers(1, 100);
      const items = data.items || [];
      this.suppliers = items.map((s: any) => ({
        id: s._id,
        name: s.name,
        contactName: s.contactName,
        phone: s.phone,
        email: s.email,
        cnpj: s.cnpj,
        address: s.address,
        notes: s.notes,
        isActive: s.isActive !== false,
        createdAt: s.createdAt,
      }));
    } catch (e) {
      console.warn('refreshSuppliers() falhou:', e);
    } finally {
      this.isRefreshingSuppliers = false;
    }
  }

  enrichIngredientsWithSupplierNames() {
    this.ingredients = this.ingredients.map((ing) => {
      if (!ing.supplierId) return ing;
      const supplier = this.suppliers.find((s) => s.id === ing.supplierId);
      return { ...ing, supplierName: supplier?.name };
    });
  }

  async refreshOrders() {
    if (this.isRefreshingOrders) return;
    if (!authStore.user?.restaurantId) return;
    this.isRefreshingOrders = true;
    try {
      // Garçom, caixa e comum usam /orders/user (não podem ver pedidos de todos)
      const isLimitedRole = authStore.activeRole === 'GARCOM' || authStore.activeRole === 'CAIXA' || authStore.activeRole === 'COMUM';
      const ordersData = isLimitedRole
        ? await apiOrderService.getUserOrders()
        : await apiOrderService.getOrders();
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData?.items || []);
      this.orders = ordersList.map((ord: any) => {
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
    } catch (e) {
      console.warn('refreshOrders() falhou - mantendo pedidos anteriores:', e);
    } finally {
      this.isRefreshingOrders = false;
    }
  }

  async refreshStaff() {
    if (this.isRefreshingStaff) return;
    if (!authStore.user?.restaurantId) return;
    this.isRefreshingStaff = true;
    const restId = authStore.user.restaurantId;
    try {
      const staffData = await apiStaffService.getStaff(restId, 1, 50);
      const staffList = Array.isArray(staffData) ? staffData : (staffData?.items || []);
      this.staff = staffList.map((st: any) => {
        const rawUserId = st.userId;
        const userId = typeof rawUserId === 'string' ? rawUserId : (rawUserId?._id || rawUserId?.id || '');
        return {
          userId,
          name: rawUserId?.name || 'Funcionário',
          email: rawUserId?.email || rawUserId?.username || 'email@restaurante.com',
          role: mapRoleToFrontend(st.role),
          performanceStats: { tablesServed: 10, ratingAverage: 4.9, dishesPrepared: 5, revenueGenerated: 250.00 }
        };
      });
      const userKey = authStore.user!.email;
      await AsyncStorage.setItem(`staff_${userKey}_${restId}_staff`, JSON.stringify(this.staff));
    } catch (e) {
      console.warn('refreshStaff() falhou:', e);
    } finally {
      this.isRefreshingStaff = false;
    }
  }

  async refreshInviteCode() {
    // Evita múltiplas chamadas simultâneas (guarda contra race condition do tick)
    if (this.isRefreshingInviteCode) return;
    if (!authStore.user?.restaurantId) return;

    this.isRefreshingInviteCode = true;
    const restId = authStore.user.restaurantId;
    try {
      const data: any = await apiStaffService.getInviteCode(restId);
      // API retorna { code: string, expiresInSeconds: number }
      const seconds = data?.expiresInSeconds ?? data?.expireInSeconds;
      if (data && data.code && seconds != null && Number(seconds) > 0) {
        this.inviteCodeInfo = {
          code: data.code,
          expiresAt: Date.now() + Number(seconds) * 1000,
        };
      }
    } catch (e) {
      console.warn('refreshInviteCode() falhou:', e);
      // Não limpa o código atual — mantém o último valor
    } finally {
      this.isRefreshingInviteCode = false;
    }
  }

  // ── Mutações granulares (preparam terreno para real-time) ──
  // Estas funções NÃO fazem chamadas de rede — apenas patcham os arrays
  // observáveis. O canal de eventos chamará estas quando receber atualizações
  // do backend, evitando refresh* completo da página.

  upsertOrder(order: Order) {
    if (!order?.id) return;
    const idx = this.orders.findIndex((o) => o.id === order.id);
    if (idx === -1) {
      this.orders = [order, ...this.orders];
    } else {
      const next = [...this.orders];
      next[idx] = { ...next[idx], ...order };
      this.orders = next;
    }
  }

  removeOrder(id: string) {
    this.orders = this.orders.filter((o) => o.id !== id);
  }

  upsertMenuItem(item: MenuItem) {
    if (!item?.id) return;
    const idx = this.menuItems.findIndex((m) => m.id === item.id);
    if (idx === -1) {
      this.menuItems = [...this.menuItems, item];
    } else {
      const next = [...this.menuItems];
      next[idx] = { ...next[idx], ...item };
      this.menuItems = next;
    }
  }

  removeMenuItem(id: string) {
    this.menuItems = this.menuItems.filter((m) => m.id !== id);
  }

  adjustStock(id: string, delta: number) {
    const idx = this.ingredients.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const next = [...this.ingredients];
    next[idx] = {
      ...next[idx],
      stock: Math.max(0, (next[idx].stock ?? 0) + delta),
    };
    this.ingredients = next;
  }

  upsertStaff(member: StaffMember) {
    if (!member?.userId) return;
    const idx = this.staff.findIndex((s) => s.userId === member.userId);
    if (idx === -1) {
      this.staff = [...this.staff, member];
    } else {
      const next = [...this.staff];
      next[idx] = { ...next[idx], ...member };
      this.staff = next;
    }
  }

  removeStaff(userId: string) {
    this.staff = this.staff.filter((s) => s.userId !== userId);
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
    this.refreshWorkspaces();
  }

  findRestaurantByInviteCode(inviteCode: string) {
    return null; // A validação de código agora é delegada totalmente ao backend (/restaurants/join)
  }

  async joinRestaurantStaff(restaurantId: string, member: StaffMember) {
    await this.refreshStaff();
  }

  async assignStaffRole(email: string, role: 'GERENTE' | 'GARCOM' | 'COZINHA' | 'CAIXA' | 'COMUM') {
    if (!this.restaurantDetails) return;
    const member = this.staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (member) {
      await apiStaffService.updateStaffRole(this.restaurantDetails.id, member.userId, role);
      await this.refreshStaff();
    }
  }

  async removeStaffMember(email: string) {
    if (!this.restaurantDetails) return;
    const member = this.staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (member) {
      await apiStaffService.removeStaff(this.restaurantDetails.id, member.userId);
      await this.refreshStaff();
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

  async addItem(item: Omit<MenuItem, 'id'> & { imageLocalUri?: string | null }) {
    const { imageLocalUri, ...payload } = item;
    const created = await apiMenuService.createProduct(payload);
    const newId = created?._id ?? created?.id;
    if (newId && imageLocalUri) {
      try {
        await apiMenuService.uploadProductImage(newId, imageLocalUri);
      } catch (uploadError) {
        console.warn('Upload de imagem falhou (item criado sem foto):', uploadError);
      }
    }
    await this.refreshMenu();
    return created;
  }

  async updateItem(id: string, updatedData: Partial<MenuItem> & { imageLocalUri?: string | null }) {
    const previousItems = [...this.menuItems];
    const { imageLocalUri, ...payload } = updatedData;

    // 🚀 Optimistic update
    const index = this.menuItems.findIndex(i => i.id === id);
    if (index !== -1) {
      this.menuItems[index] = { ...this.menuItems[index], ...payload };
    }

    try {
      await apiMenuService.updateProduct(id, payload);
      if (imageLocalUri) {
        try {
          await apiMenuService.uploadProductImage(id, imageLocalUri);
        } catch (uploadError) {
          console.warn('Upload de imagem na edição falhou (dados atualizados sem foto):', uploadError);
        }
      }
      await this.refreshMenu();
    } catch (error) {
      // 🔙 Reverte
      this.menuItems = previousItems;
      console.error("Failed to update menu item:", error);
      throw error;
    }
  }

  async removeItem(id: string) {
    const previousItems = [...this.menuItems];

    // 🚀 Optimistic update
    this.menuItems = this.menuItems.filter(i => i.id !== id);

    try {
      await apiMenuService.deleteProduct(id);
      await this.refreshMenu();
    } catch (error) {
      // 🔙 Reverte
      this.menuItems = previousItems;
      console.error("Failed to remove menu item:", error);
      throw error;
    }
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

    await this.refreshOrders();
    return created;
  }

  async updateOrder(id: string, updatedFields: Partial<Order>) {
    // Deleta o pedido antigo e recria com os dados atualizados
    try {
      await apiOrderService.deleteOrder(id);
    } catch (deleteErr) {
      console.warn('Failed to delete order for update, trying direct update anyway.', deleteErr);
    }

    const orderData = updatedFields as Omit<Order, 'id' | 'status' | 'time' | 'createdAt' | 'statusHistory'>;
    try {
      const created = await this.addOrder(orderData);
      return created;
    } catch (createErr) {
      console.error('Failed to recreate order after update.', createErr);
      // Recarrega pedidos para manter consistência
      await this.refreshOrders();
      throw createErr;
    }
  }

  async updateOrderStatus(id: string) {
    const orderIndex = this.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return null;

    const currentOrder = this.orders[orderIndex];
    let nextStatus: OrderStatus | null = null;
    const isDelivery = !!currentOrder.address;

    if (currentOrder.status === 'PENDENTE') {
      nextStatus = 'PREPARANDO';
    } else if (currentOrder.status === 'PREPARANDO') {
      nextStatus = isDelivery ? 'SAIU_PARA_ENTREGA' : 'CONCLUIDO';
    } else if (currentOrder.status === 'SAIU_PARA_ENTREGA') {
      nextStatus = 'CONCLUIDO';
    }

    if (!nextStatus) return null;

    // Save previous state for revert on failure
    const previousOrders = this.orders.map(o => ({ ...o }));

    try {
      // 🚀 Optimistic update: atualiza UI instantaneamente
      this.orders[orderIndex] = {
        ...currentOrder,
        status: nextStatus,
        statusHistory: [
          ...currentOrder.statusHistory,
          { status: nextStatus, timestamp: new Date().toISOString() },
        ],
      };

      // Chama API
      await apiOrderService.updateOrderStatus(id, nextStatus);

      // Reconcilia somente os pedidos com o servidor
      await this.refreshOrders();
      return nextStatus;
    } catch (error) {
      // 🔙 Reverte optimistic update em caso de falha
      this.orders = previousOrders;
      console.error("Failed to update order status:", error);
      throw error;
    }
  }

  async cancelOrder(id: string) {
    const orderIndex = this.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return;

    const previousOrders = this.orders.map(o => ({ ...o }));

    try {
      // 🚀 Optimistic update
      if (orderIndex !== -1) {
        this.orders[orderIndex] = {
          ...this.orders[orderIndex],
          status: 'CANCELADO',
          statusHistory: [
            ...this.orders[orderIndex].statusHistory,
            { status: 'CANCELADO' as OrderStatus, timestamp: new Date().toISOString() },
          ],
        };
      }

      await apiOrderService.updateOrderStatus(id, 'CANCELADO');
      await this.refreshOrders();
    } catch (error) {
      // 🔙 Reverte
      this.orders = previousOrders;
      console.error("Failed to cancel order:", error);
      throw error;
    }
  }

  async closeOrder(id: string, paymentMethod: string, rating: number) {
    const orderIndex = this.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return;

    const previousOrders = this.orders.map(o => ({ ...o }));
    const previousRestaurantDetails = this.restaurantDetails ? { ...this.restaurantDetails } : null;

    try {
      // 🚀 Optimistic update
      if (orderIndex !== -1) {
        this.orders[orderIndex] = {
          ...this.orders[orderIndex],
          status: 'CONCLUIDO',
          statusHistory: [
            ...this.orders[orderIndex].statusHistory,
            { status: 'CONCLUIDO' as OrderStatus, timestamp: new Date().toISOString() },
          ],
        };
      }

      if (rating > 0) {
        this.accumulateRating(rating);
      }

      await apiOrderService.updateOrderStatus(id, 'CONCLUIDO');
      await this.refreshOrders();
    } catch (error) {
      // 🔙 Reverte
      this.orders = previousOrders;
      if (previousRestaurantDetails) {
        this.restaurantDetails = previousRestaurantDetails;
      }
      console.error("Failed to close order:", error);
      throw error;
    }
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
      brand: ingredient.brand,
      quantity: ingredient.stock,
      unit: ingredient.unit,
      minQuantity: ingredient.minQuantity,
      supplierId: ingredient.supplierId,
    });

    // Recarrega só o estoque para confirmar o dado salvo no servidor
    try {
      await this.refreshStock();
    } catch (e) {
      console.warn("refreshStock() após addIngredient falhou - dado salvo no servidor", e);
    }

    return created;
  }

  async removeIngredient(id: string) {
    const previousIngredients = [...this.ingredients];

    // 🚀 Optimistic update
    this.ingredients = this.ingredients.filter(i => i.id !== id);

    try {
      await apiStockService.deleteStock(id);
      await this.refreshStock();
    } catch (error) {
      // 🔙 Reverte
      this.ingredients = previousIngredients;
      console.error("Failed to remove ingredient:", error);
      throw error;
    }
  }

  async updateIngredient(id: string, updates: Partial<IngredientItem>) {
    const previousIngredients = [...this.ingredients];

    // 🚀 Optimistic update
    const index = this.ingredients.findIndex(i => i.id === id);
    if (index !== -1) {
      this.ingredients[index] = { ...this.ingredients[index], ...updates };
    }

    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.brand !== undefined) payload.brand = updates.brand;
      if (updates.stock !== undefined) payload.quantity = updates.stock;
      if (updates.unit !== undefined) payload.unit = updates.unit;
      if (updates.minQuantity !== undefined) payload.minQuantity = updates.minQuantity;
      if (updates.supplierId !== undefined) payload.supplierId = updates.supplierId;

      await apiStockService.updateStock(id, payload);
      await this.refreshStock();
    } catch (error) {
      // 🔙 Reverte
      this.ingredients = previousIngredients;
      console.error("Failed to update ingredient:", error);
      throw error;
    }
  }

  async addSupplier(input: SupplierInput) {
    const created = await apiSupplierService.createSupplier(input);
    await this.refreshSuppliers();
    this.enrichIngredientsWithSupplierNames();
    return created;
  }

  async updateSupplier(id: string, updates: Partial<SupplierInput>) {
    const previousSuppliers = [...this.suppliers];

    // 🚀 Optimistic update
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      this.suppliers[index] = { ...this.suppliers[index], ...updates };
    }

    try {
      await apiSupplierService.updateSupplier(id, updates);
      await this.refreshSuppliers();
      this.enrichIngredientsWithSupplierNames();
    } catch (error) {
      // 🔙 Reverte
      this.suppliers = previousSuppliers;
      console.error('Failed to update supplier:', error);
      throw error;
    }
  }

  async removeSupplier(id: string) {
    const previousSuppliers = [...this.suppliers];

    // 🚀 Optimistic update
    this.suppliers = this.suppliers.filter(s => s.id !== id);

    try {
      await apiSupplierService.deleteSupplier(id);
      await this.refreshSuppliers();
      this.enrichIngredientsWithSupplierNames();
    } catch (error) {
      // 🔙 Reverte
      this.suppliers = previousSuppliers;
      console.error('Failed to remove supplier:', error);
      throw error;
    }
  }

  async updateIngredientStock(id: string, delta: number) {
    const previousIngredients = [...this.ingredients];

    // 🚀 Optimistic update
    const index = this.ingredients.findIndex(i => i.id === id);
    if (index !== -1) {
      this.ingredients[index] = {
        ...this.ingredients[index],
        stock: Math.max(0, this.ingredients[index].stock + delta),
      };
    }

    try {
      await apiStockService.adjustStock(id, delta);
      await this.refreshStock();
    } catch (error) {
      // 🔙 Reverte
      this.ingredients = previousIngredients;
      console.error("Failed to adjust ingredient stock:", error);
      throw error;
    }
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
      // filiais afetam o contexto do restaurante: rebusca workspaces
      await this.refreshWorkspaces();
    }).catch(err => {
      console.error("Failed to sync new branch to backend", err);
    });

    return newBranchObj;
  }

  async removeBranch(id: string) {
    // As filiais compartilham o modelo de restaurante e são removidas desvinculando-se delas
    await authStore.removeRestaurantWorkspace(id);
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
    this.suppliers = [];
    this.branches = [...DEFAULT_BRANCHES];
    this.modules = DEFAULT_MODULES.map(m => ({ ...m }));
    this.restaurantDetails = null;
    this.restaurants = [];
    this.staff = [];
    this.inviteCodeInfo = null;
    this.isRefreshingInviteCode = false;
    this.isRefreshingWorkspaces = false;
    this.isRefreshingMenu = false;
    this.isRefreshingStock = false;
    this.isRefreshingSuppliers = false;
    this.isRefreshingStaff = false;
    this.isRefreshingOrders = false;
  }
}

export const dataStore = new DataStore();
