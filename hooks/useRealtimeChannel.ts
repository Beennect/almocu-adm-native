import { useEffect, useRef } from 'react';
import { eventBus, EventChannel, EventPayload } from '@/services/event-bus';

export function useRealtimeChannel<T = any>(
  channel: EventChannel,
  handler: (payload: EventPayload<T>) => void,
  deps: React.DependencyList = [],
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrapped = (payload: EventPayload<T>) => handlerRef.current(payload);
    return eventBus.on<T>(channel, wrapped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, ...deps]);
}
