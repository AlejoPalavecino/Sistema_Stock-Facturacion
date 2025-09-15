import { Purchase } from '../../types';

const STORAGE_KEY = 'purchases_v1';
let purchases: Purchase[] = [];

try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        purchases = JSON.parse(stored);
    }
} catch (error) {
    console.error("Failed to load purchases from localStorage", error);
}

const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
};

export const list = async (): Promise<Purchase[]> => Promise.resolve([...purchases]);

export const listBySupplier = async (supplierId: string): Promise<Purchase[]> => {
    return Promise.resolve(purchases.filter(p => p.supplierId === supplierId));
};

export const create = async (data: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> => {
    if (data.totalAmountARS <= 0) throw new Error("El monto de la compra debe ser positivo.");
    
    const newPurchase: Purchase = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
    };
    purchases.push(newPurchase);
    persist();
    return Promise.resolve(newPurchase);
};
