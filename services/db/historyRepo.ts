
import { StockMovement } from '../types/history';

const STORAGE_KEY = 'stock_history_v1';

let history: StockMovement[] = [];

try {
    const storedHistory = localStorage.getItem(STORAGE_KEY);
    if (storedHistory) {
        history = JSON.parse(storedHistory);
    }
} catch (error) {
    console.error("Failed to load stock history from localStorage", error);
    history = [];
}

const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
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
