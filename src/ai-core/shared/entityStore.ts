import { base44 } from '@/api/base44Client';

export async function fetchEntityList<T = any>(entityName: string, localStorageKey: string): Promise<T[]> {
  try {
    const apiEntity = (base44.entities as any)[entityName];
    if (apiEntity && typeof apiEntity.list === 'function') {
      return (await apiEntity.list()) as T[];
    }
  } catch (e) {
    // Graceful fallback to localStorage for offline / mock resilience
  }
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      try {
        return JSON.parse(stored) as T[];
      } catch (e) {
        return [];
      }
    }
  }
  return [];
}

export async function saveEntityLocal<T = any>(localStorageKey: string, item: T): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(localStorageKey);
    const list: T[] = stored ? JSON.parse(stored) : [];
    list.push(item);
    localStorage.setItem(localStorageKey, JSON.stringify(list));
  }
}
