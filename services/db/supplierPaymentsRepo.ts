import { SupplierPayment } from '../../types';
import { createRepository } from './repository.ts';

const repo = createRepository<SupplierPayment>('supplier_payments_v1');

export const list = repo.list;

export const listBySupplier = async (supplierId: string): Promise<SupplierPayment[]> => {
    const allPayments = await repo.list();
    return allPayments.filter(p => p.supplierId === supplierId);
};

export const listByPurchase = async (purchaseId: string): Promise<SupplierPayment[]> => {
    const allPayments = await repo.list();
    return allPayments.filter(p => p.purchaseId === purchaseId);
};

export const create = async (data: Omit<SupplierPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierPayment> => {
    if (data.amountARS <= 0) throw new Error("El monto del pago debe ser positivo.");
    if (!data.purchaseId) throw new Error("El pago debe estar asociado a una factura de compra.");
    return repo.create(data);
};
