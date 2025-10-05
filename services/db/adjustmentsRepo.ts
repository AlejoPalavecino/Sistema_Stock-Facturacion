
import { AccountAdjustment } from '../types/adjustment';
import { createRepository } from './repository.ts';

const repo = createRepository<AccountAdjustment>('adjustments_v1');

export const list = repo.list;

export const listByClient = async (clientId: string): Promise<AccountAdjustment[]> => {
    const allAdjustments = await repo.list();
    return allAdjustments.filter(p => p.clientId === clientId);
};

export const create = async (data: Omit<AccountAdjustment, 'id' | 'createdAt'>): Promise<AccountAdjustment> => {
    if (data.amountARS <= 0) throw new Error("El monto del ajuste debe ser positivo.");
    if (!data.description) throw new Error("La descripción es obligatoria.");
    return repo.create(data);
};
