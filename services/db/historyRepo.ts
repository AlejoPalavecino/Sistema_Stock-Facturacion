import { StockMovement } from '../types';
import { createRepository } from './repository.ts';

const repo = createRepository<StockMovement>('stock_history_v1');

export const list = repo.list;

export const add = async (movementData: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>): Promise<StockMovement> => {
    const dataWithTimestamp = {
        ...movementData,
        timestamp: new Date().toISOString(),
    };
    return repo.create(dataWithTimestamp);
};

export const overwriteLast = async (patch: Partial<StockMovement>): Promise<void> => {
    const collection = repo._getCollection();
    if (collection.length > 0) {
        const lastIndex = collection.length - 1;
        collection[lastIndex] = { ...collection[lastIndex], ...patch, updatedAt: new Date().toISOString() };
        repo._setCollection(collection);
        repo._persist();
    }
};