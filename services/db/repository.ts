import { readJSON, writeJSON } from '../../utils/storage.ts';

interface Entity {
  id: string;
}

/**
 * Creates a generic repository for a given entity type that handles
 * all the boilerplate for localStorage persistence and CRUD operations.
 *
 * @param storageKey The key to use for localStorage.
 * @param seedData A function that provides initial data if none exists.
 * @returns A repository object with CRUD methods.
 */
export function createRepository<T extends Entity>(storageKey: string, seedData: () => T[] = () => []) {
  let items: T[] = readJSON({ key: storageKey, version: 'v1' }, []);
  if (items.length === 0) {
      items = seedData();
  }

  const persist = () => {
    writeJSON({ key: storageKey, version: 'v1' }, items);
  };

  const list = async (): Promise<T[]> => {
    return Promise.resolve([...items]);
  };

  const getById = async (id: string): Promise<T | null> => {
    return Promise.resolve(items.find(item => item.id === id) || null);
  };

  const create = async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> => {
    // FIX: Cast to 'unknown' first to resolve the generic type conversion error.
    const newItem = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as T;
    items.push(newItem);
    persist();
    return Promise.resolve(newItem);
  };

  const update = async (id: string, patch: Partial<Omit<T, 'id'>>): Promise<T> => {
    let updatedItem: T | null = null;
    items = items.map(item => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return item;
    });
    
    if (!updatedItem) {
        throw new Error(`Entity with id ${id} not found.`);
    }

    persist();
    return Promise.resolve(updatedItem);
  };

  const remove = async (id: string): Promise<void> => {
    const initialLength = items.length;
    items = items.filter(item => item.id !== id);
    if (items.length === initialLength) {
        throw new Error(`Entity with id ${id} not found.`);
    }
    persist();
    return Promise.resolve();
  };
  
  // Expose internal state and methods for more complex repositories to extend
  return {
    list,
    getById,
    create,
    update,
    remove,
    // --- Methods for extension ---
    // Use these within more specific repos for complex logic
    _getCollection: () => items,
    _setCollection: (newItems: T[]) => {
      items = newItems;
    },
    _persist: persist,
  };
}
