import { Purchase, PurchaseId, PurchaseStatus } from '../../types';
import { createRepository } from './repository.ts';
import * as productsRepo from './productsRepo.ts';

const repo = createRepository<Purchase>('purchases_v1');

export const list = repo.list;
export const getById = repo.getById;
export const update = repo.update;

export const listBySupplier = async (supplierId: string): Promise<Purchase[]> => {
    const allPurchases = await repo.list();
    return allPurchases.filter(p => p.supplierId === supplierId);
};

export const create = async (data: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt' | 'totalAmountARS' | 'status'>): Promise<Purchase> => {
    if (!data.supplierId) throw new Error("Se requiere un proveedor.");
    if (!data.invoiceNumber) throw new Error("Se requiere el número de factura del proveedor.");
    if (data.items.length === 0) throw new Error("La factura debe tener al menos un ítem.");

    const totalAmountARS = data.items.reduce((sum, item) => sum + item.lineTotalARS, 0);

    const purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        totalAmountARS,
        status: 'PENDIENTE',
    };
    
    const newPurchase = await repo.create(purchaseData);

    // Adjust stock for each item
    for (const item of newPurchase.items) {
        await productsRepo.adjustStock(
            item.productId,
            item.qty,
            'purchase',
            `Compra a proveedor - Factura ${newPurchase.invoiceNumber}`
        );
    }
    
    return newPurchase;
};

export const setStatus = async (id: PurchaseId, status: PurchaseStatus): Promise<Purchase> => {
    return repo.update(id, { status });
};
