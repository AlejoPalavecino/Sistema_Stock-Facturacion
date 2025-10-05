import { useState, useEffect, useCallback } from 'react';
import * as suppliersRepo from '../services/db/suppliersRepo';
import * as purchasesRepo from '../services/db/purchasesRepo';
import * as supplierPaymentsRepo from '../services/db/supplierPaymentsRepo';
import { Supplier, Purchase, SupplierPayment } from '../types';
import { useSupplierDetailCalculations } from './useAccountCalculations';
import { onStorageChange } from '../utils/storage';

export function useSupplierDetails(supplierId: string) {
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!supplierId) return;
        try {
            setLoading(true);
            setError(null);
            
            const [supplierData, purchasesData, paymentsData] = await Promise.all([
                suppliersRepo.getById(supplierId),
                purchasesRepo.listBySupplier(supplierId),
                supplierPaymentsRepo.listBySupplier(supplierId),
            ]);

            if (!supplierData) throw new Error("Proveedor no encontrado");
            
            setSupplier(supplierData);
            setPurchases(purchasesData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setPayments(paymentsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar los detalles del proveedor.");
        } finally {
            setLoading(false);
        }
    }, [supplierId]);

    useEffect(() => {
        fetchData();
        const keysToWatch = ['suppliers_v1', 'purchases_v1', 'supplier_payments_v1'];
        const cleanups = keysToWatch.map(key => onStorageChange(key, fetchData));
        return () => cleanups.forEach(c => c());
    }, [fetchData]);

    const checkAndUpdatePurchaseStatus = useCallback(async (purchaseId: string) => {
        const purchase = await purchasesRepo.getById(purchaseId);
        if (!purchase || purchase.status === 'PAGADA') return;

        const paymentsForPurchase = await supplierPaymentsRepo.listByPurchase(purchaseId);
        const totalPaid = paymentsForPurchase.reduce((sum, p) => sum + p.amountARS, 0);

        if (totalPaid >= purchase.totalAmountARS) {
            await purchasesRepo.setStatus(purchaseId, 'PAGADA');
        }
    }, []);

    const addPayment = useCallback(async (data: Omit<SupplierPayment, 'id' | 'createdAt' | 'updatedAt' | 'supplierId'>) => {
        if (!supplierId) return;
        try {
            await supplierPaymentsRepo.create({ ...data, supplierId });
            await checkAndUpdatePurchaseStatus(data.purchaseId);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
            throw err;
        }
    }, [supplierId, fetchData, checkAndUpdatePurchaseStatus]);

    const updateSupplier = useCallback(async (data: Partial<Supplier>) => {
        if (!supplier) return;
        try {
            await suppliersRepo.update(supplierId, data);
            await fetchData();
        } catch(err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar el proveedor.");
            throw err;
        }
    }, [supplier, supplierId, fetchData]);

    const { debt } = useSupplierDetailCalculations(purchases, payments);

    return { supplier, debt, purchases, payments, loading, error, addPayment, updateSupplier };
}