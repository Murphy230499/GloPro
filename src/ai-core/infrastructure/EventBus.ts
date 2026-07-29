import { IEventBus, EventCallback } from '../contracts/events.types';

export class EventBus implements IEventBus {
  private readonly listeners = new Map<string, Set<EventCallback>>();

  async emit(event: string, data: unknown): Promise<void> {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const cb of callbacks) {
      await cb(data);
    }
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }
}
