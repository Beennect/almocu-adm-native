import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api-service';
import { dataStore } from '@/stores/DataStore';
import { eventBus } from '../event-bus';
import { mapStatusToFrontend } from '../api-order-service';

/** Converte um pedido do formato do backend para o formato do frontend */
function normalizeOrder(ord: any): any {
  if (!ord) return ord;
  const mappedId = ord._id || ord.id;
  const dateStr = ord.createdAt
    ? new Date(ord.createdAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '00:00';

  return {
    id: mappedId,
    clientName: ord.clientName || ord.origin || 'Cliente',
    table: ord.origin || 'Balcão',
    total: ord.totalValue,
    status: mapStatusToFrontend(ord.status),
    time: dateStr,
    createdAt: ord.createdAt || new Date().toISOString(),
    updatedAt: ord.updatedAt,
    userId: ord.userId?._id || ord.userId,
    deliveryUserId: ord.deliveryUserId?._id || ord.deliveryUserId || undefined,
    additionalInfo: ord.observations || '',
    address: ord.deliveryAddress
      ? {
          rua: ord.deliveryAddress.street || '',
          numero: ord.deliveryAddress.number || '',
          semNumero: !ord.deliveryAddress.number,
          bairro: ord.deliveryAddress.neighborhood || '',
          cidade: ord.deliveryAddress.city || '',
          estado: ord.deliveryAddress.state || '',
          cep: ord.deliveryAddress.zipCode || '',
          complemento: ord.deliveryAddress.complement || '',
        }
      : undefined,
    items: ord.items
      ? ord.items.map((i: any) => ({
          id: i.productId?._id || i.productId,
          name: i.name || 'Produto',
          quantity: i.quantity,
          price: i.price || 0,
        }))
      : [],
    statusHistory: ord.statusHistory
      ? ord.statusHistory.map((h: any) => ({
          status: mapStatusToFrontend(h.status),
          timestamp: h.timestamp,
        }))
      : [
          {
            status: mapStatusToFrontend(ord.status),
            timestamp: ord.createdAt || new Date().toISOString(),
          },
        ],
  };
}

class SocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;
  private currentRestaurantId: string | null = null;

  /** Conecta ao WebSocket com o token JWT e restaurantId */
  connect(token: string, restaurantId?: string | null) {
    // Se já conectado com o mesmo token e mesmo restaurante, não reconecta
    if (this.socket?.connected && this.token === token && this.currentRestaurantId === restaurantId) return;

    this.disconnect();
    this.token = token;
    this.currentRestaurantId = restaurantId || null;

    this.socket = io(`${API_URL}/ws`, {
      auth: { token, restaurantId: restaurantId || undefined },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
    });

    this.socket.on('connect', () => {
      console.log('[SocketManager] Conectado ao WebSocket');
    });

    this.socket.on('disconnect', (reason) => {
      // Razões comuns: 'io server disconnect' (servidor forçou), 'transport close' (rede),
      // 'transport error' (erro de transporte), 'ping timeout'
      if (reason === 'io server disconnect') {
        // Não reconecta automaticamente se o servidor forçou a desconexão
        console.log('[SocketManager] Desconectado pelo servidor');
      } else {
        console.log('[SocketManager] Desconectado:', reason);
      }
    });

    this.socket.on('connect_error', (err) => {
      // Erro comum: namespace não encontrado, CORS, rede, etc.
      console.warn('[SocketManager] Erro de conexão:', err.message);
      if (err.message?.includes('namespace')) {
        console.warn('[SocketManager] Namespace /ws não encontrado no servidor');
      }
    });

    // ── Eventos de negócio ──
    this.socket.on('order:created', (order: any) => {
      const normalized = normalizeOrder(order);
      dataStore.upsertOrder(normalized);
      eventBus.emit('order:created', normalized);
    });

    this.socket.on('order:statusChanged', (order: any) => {
      const normalized = normalizeOrder(order);
      dataStore.upsertOrder(normalized);
      eventBus.emit('order:statusChanged', normalized);
    });

    this.socket.on('order:canceled', (payload: any) => {
      const id = payload?.id || payload?._id;
      if (id) {
        dataStore.removeOrder(id);
        eventBus.emit('order:canceled', { id });
      }
    });

    this.socket.on('menu:changed', () => {
      dataStore.refreshMenu();
      eventBus.emit('menu:changed', {});
    });

    this.socket.on('stock:changed', () => {
      dataStore.refreshStock();
      eventBus.emit('stock:changed', {});
    });

    this.socket.on('staff:changed', () => {
      dataStore.refreshStaff();
      eventBus.emit('staff:changed', {});
    });

    this.socket.on('table:changed', () => {
      dataStore.fetchTables();
      eventBus.emit('table:changed', {});
    });

    this.socket.on('connected', (data: any) => {
      console.log('[SocketManager]', data?.message);
    });

    this.socket.on('error', (error: any) => {
      console.warn('[SocketManager] Erro do servidor:', error?.message);
    });
  }

  /** Desconecta e limpa */
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.currentRestaurantId = null;
  }

  /** Retorna se está conectado */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  /** Registra callback para mudanças de conexão */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    if (!this.socket) {
      callback(false);
      return () => {};
    }
    const onConnect = () => callback(true);
    const onDisconnect = () => callback(false);
    this.socket.on('connect', onConnect);
    this.socket.on('disconnect', onDisconnect);
    return () => {
      this.socket?.off('connect', onConnect);
      this.socket?.off('disconnect', onDisconnect);
    };
  }
}

export const socketManager = new SocketManager();
