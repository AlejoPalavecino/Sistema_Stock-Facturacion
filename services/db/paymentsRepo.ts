import { Payment } from '../../types/payment.ts';
import { createRepository } from './repository.ts';

const repo = createRepository<Payment>('payments_v1');

export const list = repo.list;
export const update = repo.update;

export const listByClient = async (clientId: string): Promise<Payment[]> => {
    const allPayments = await repo.list();
    return allPayments.filter(p => p.clientId === clientId);
};

export const listByInvoice = async (invoiceId: string): Promise<Payment[]> => {
    const allPayments = await repo.list();
    return allPayments.filter(p => p.invoiceId === invoiceId);
};


export const create = async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
    if (data.amountARS <= 0) throw new Error("El monto del pago debe ser positivo.");
    return repo.create(data);
};