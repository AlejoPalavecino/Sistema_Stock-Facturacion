
import { Payment } from '@/types/payment';
import { readJSON, writeJSON } from '@/utils/storage';

const STORAGE_OPTIONS = { key: 'payments_v1', version: 'v1' as const };
let payments: Payment[] = readJSON(STORAGE_OPTIONS, []);

const persist = () => {
    writeJSON(STORAGE_OPTIONS, payments);
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
