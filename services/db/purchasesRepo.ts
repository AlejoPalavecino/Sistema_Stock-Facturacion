
import { Purchase } from '../../types';
import { createRepository } from './repository.ts';

const repo = createRepository<Purchase>('purchases_v1');

export const list = repo.list;

export const listBySupplier = async (supplierId: string): Promise<Purchase[]> => {
    const allPurchases = await repo.list();
    return allPurchases.filter(p => p.supplierId === supplierId);
};

export const create = async (data: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> => {
    if (data.totalAmountARS <= 0) throw new Error("El monto de la compra debe ser positivo.");
    return repo.create(data);
};
