export type EventCallback<T = any> = (data: T) => void | Promise<void>;

export interface IEventBus {
  emit(event: string, data: unknown): Promise<void>;
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
}
