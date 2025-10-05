import { useState, useEffect, useCallback } from 'react';
import * as suppliersRepo from '../services/db/suppliersRepo';
import * as purchasesRepo from '../services/db/purchasesRepo';
import * as supplierPaymentsRepo from '../services/db/supplierPaymentsRepo';
import { Supplier, Purchase, SupplierPayment } from '../types';
import { useSupplierDetailCalculations } from './useAccountCalculations';

export type SupplierHistoryItem = 
    | { type: 'PURCHASE'; date: string; data: Purchase }
    | { type: 'PAYMENT'; date: string; data: SupplierPayment };

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
            setPurchases(purchasesData);
            setPayments(paymentsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar los detalles del proveedor.");
        } finally {
            setLoading(false);
        }
    }, [supplierId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addPurchase = useCallback(async (data: Omit<Purchase, 'id' | 'createdAt' | 'supplierId' | 'status'>) => {
        if (!supplierId) return;
        try {
            await purchasesRepo.create({ ...data, supplierId, status: 'PENDIENTE' });
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar la compra.");
            throw err;
        }
    }, [supplierId, fetchData]);

    // FIX: Corrected the Omit type to not require `updatedAt`, which is handled by the repository.
    const addPayment = useCallback(async (data: Omit<SupplierPayment, 'id' | 'createdAt' | 'updatedAt' | 'supplierId'>) => {
        if (!supplierId) return;
        try {
            await supplierPaymentsRepo.create({ ...data, supplierId });
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
            throw err;
        }
    }, [supplierId, fetchData]);

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

    const { debt, history } = useSupplierDetailCalculations(purchases, payments);

    return { supplier, debt, history, loading, error, addPurchase, addPayment, updateSupplier };
}