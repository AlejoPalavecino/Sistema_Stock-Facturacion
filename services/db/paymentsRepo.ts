
import { Payment } from '@/types/payment';
import { createRepository } from './repository.ts';

const repo = createRepository<Payment>('payments_v1');

export const list = repo.list;

export const listByClient = async (clientId: string): Promise<Payment[]> => {
    const allPayments = await repo.list();
    return allPayments.filter(p => p.clientId === clientId);
};

// FIX: Corrected the Omit type to not require `updatedAt`, which is handled by the repository.
export const create = async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
    if (data.amountARS <= 0) throw new Error("El monto del pago debe ser positivo.");
    return repo.create(data);
};