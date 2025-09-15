import { Payment } from '../types/payment';

const STORAGE_KEY = 'payments_v1';
let payments: Payment[] = [];

try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        payments = JSON.parse(stored);
    }
} catch (error) {
    console.error("Failed to load payments from localStorage", error);
}

const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
};

export const list = async (): Promise<Payment[]> => {
    return Promise.resolve([...payments]);
};

export const listByClient = async (clientId: string): Promise<Payment[]> => {
    const clientPayments = payments.filter(p => p.clientId === clientId);
    return Promise.resolve(clientPayments);
};

export const create = async (data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
    if (data.amountARS <= 0) throw new Error("El monto del pago debe ser positivo.");
    const newPayment: Payment = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
    };
    payments.push(newPayment);
    persist();
    return Promise.resolve(newPayment);
};
