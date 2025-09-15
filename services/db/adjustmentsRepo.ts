import { AccountAdjustment } from '../types/adjustment';

const STORAGE_KEY = 'adjustments_v1';
let adjustments: AccountAdjustment[] = [];

try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        adjustments = JSON.parse(stored);
    }
} catch (error) {
    console.error("Failed to load adjustments from localStorage", error);
}

const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adjustments));
};

export const list = async (): Promise<AccountAdjustment[]> => {
    return Promise.resolve([...adjustments]);
};

export const listByClient = async (clientId: string): Promise<AccountAdjustment[]> => {
    const clientAdjustments = adjustments.filter(p => p.clientId === clientId);
    return Promise.resolve(clientAdjustments);
};

export const create = async (data: Omit<AccountAdjustment, 'id' | 'createdAt'>): Promise<AccountAdjustment> => {
    if (data.amountARS <= 0) throw new Error("El monto del ajuste debe ser positivo.");
    if (!data.description) throw new Error("La descripción es obligatoria.");

    const newAdjustment: AccountAdjustment = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
    };
    adjustments.push(newAdjustment);
    persist();
    return Promise.resolve(newAdjustment);
};