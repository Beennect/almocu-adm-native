export type EventChannel =
  | 'order:created'
  | 'order:statusChanged'
  | 'order:canceled'
  | 'menu:changed'
  | 'stock:changed'
  | 'staff:changed'
  | 'workspace:changed';

export type EventPayload<T = any> = T;

type Handler<T = any> = (payload: EventPayload<T>) => void;

class EventBus {
  private handlers: Map<EventChannel, Set<Handler>> = new Map();

  on<T = any>(channel: EventChannel, handler: Handler<T>): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler as Handler);
    return () => this.off(channel, handler);
  }

  off<T = any>(channel: EventChannel, handler: Handler<T>): void {
    this.handlers.get(channel)?.delete(handler as Handler);
  }

  emit<T = any>(channel: EventChannel, payload: EventPayload<T>): void {
    this.handlers.get(channel)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.warn(`[EventBus] handler for ${channel} threw:`, err);
      }
    });
  }

  clear(channel?: EventChannel): void {
    if (channel) {
      this.handlers.get(channel)?.clear();
    } else {
      this.handlers.clear();
    }
  }
}

export const eventBus = new EventBus();
