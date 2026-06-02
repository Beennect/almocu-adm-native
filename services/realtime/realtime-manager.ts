import { eventBus, EventChannel } from '../event-bus';

export interface RealtimeAdapter {
  readonly name: string;
  start(): void;
  stop(): void;
  onEvent<T = any>(channel: EventChannel, handler: (payload: T) => void): () => void;
}

class BaseRealtimeAdapter implements RealtimeAdapter {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  start(): void {
    // TODO: conectar transporte real (WebSocket/SSE/polling)
  }

  stop(): void {
    // TODO: desconectar transporte
  }

  onEvent<T = any>(channel: EventChannel, handler: (payload: T) => void): () => void {
    return eventBus.on<T>(channel, handler);
  }
}

class OrdersRealtime extends BaseRealtimeAdapter {
  constructor() {
    super('orders');
  }
}

class MenuRealtime extends BaseRealtimeAdapter {
  constructor() {
    super('menu');
  }
}

class StockRealtime extends BaseRealtimeAdapter {
  constructor() {
    super('stock');
  }
}

class StaffRealtime extends BaseRealtimeAdapter {
  constructor() {
    super('staff');
  }
}

class WorkspaceRealtime extends BaseRealtimeAdapter {
  constructor() {
    super('workspace');
  }
}

export const ordersRealtime = new OrdersRealtime();
export const menuRealtime = new MenuRealtime();
export const stockRealtime = new StockRealtime();
export const staffRealtime = new StaffRealtime();
export const workspaceRealtime = new WorkspaceRealtime();

export const realtimeAdapters: RealtimeAdapter[] = [
  ordersRealtime,
  menuRealtime,
  stockRealtime,
  staffRealtime,
  workspaceRealtime,
];
