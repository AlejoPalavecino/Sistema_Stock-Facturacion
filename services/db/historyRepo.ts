
import { StockMovement } from '../../types/history.ts';
import { readJSON, writeJSON } from '../../utils/storage.ts';

const STORAGE_OPTIONS = { key: 'stock_history_v1', version: 'v1' as const };

let history: StockMovement[] = readJSON(STORAGE_OPTIONS, []);

const persist = () => {
    writeJSON(STORAGE_OPTIONS, history);
};

// --- Public API ---

export const list = async (): Promise<StockMovement[]> => {
    return Promise.resolve([...history]);
};

export const add = async (movementData: Omit<StockMovement, 'id' | 'timestamp'>): Promise<StockMovement> => {
    const newMovement: StockMovement = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...movementData,
    };
    history.push(newMovement);
    persist();
    return Promise.resolve(newMovement);
};

// This is a specific utility for the import process to avoid double logging
export const overwriteLast = async (patch: Partial<StockMovement>): Promise<void> => {
    if (history.length > 0) {
        const lastIndex = history.length - 1;
        history[lastIndex] = { ...history[lastIndex], ...patch };
        persist();
    }
    return Promise.resolve();
};
