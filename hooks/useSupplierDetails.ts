import { useState, useEffect, useCallback, useMemo } from 'react';
import * as suppliersRepo from '../services/db/suppliersRepo';
import * as purchasesRepo from '../services/db/purchasesRepo';
import * as supplierPaymentsRepo from '../services/db/supplierPaymentsRepo';
import { Supplier } from '../types/supplier';
import { Purchase } from '../types/purchase';
import { SupplierPayment } from '../types/supplierPayment';

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

    // FIX: Corrected the type of `data` to not expect `status`, as it's set within the function.
    const addPurchase = async (data: Omit<Purchase, 'id' | 'createdAt' | 'supplierId' | 'status'>) => {
        if (!supplierId) return;
        try {
            await purchasesRepo.create({ ...data, supplierId, status: 'PENDIENTE' });
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar la compra.");
            throw err;
        }
    };

    const addPayment = async (data: Omit<SupplierPayment, 'id' | 'createdAt' | 'supplierId'>) => {
        if (!supplierId) return;
        try {
            await supplierPaymentsRepo.create({ ...data, supplierId });
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
            throw err;
        }
    };

    const updateSupplier = async (data: Partial<Supplier>) => {
        if (!supplier) return;
        try {
            await suppliersRepo.update(supplierId, data);
            await fetchData();
        } catch(err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar el proveedor.");
            throw err;
        }
    };

    const { debt, history } = useMemo(() => {
        const totalPurchased = purchases.reduce((sum, p) => sum + p.totalAmountARS, 0);
        const totalPaid = payments.reduce((sum, p) => sum + p.amountARS, 0);
        const debt = totalPurchased - totalPaid;

        const purchaseHistory: SupplierHistoryItem[] = purchases
            .map(p => ({ type: 'PURCHASE', date: p.date, data: p }));

        const paymentHistory: SupplierHistoryItem[] = payments
            .map(p => ({ type: 'PAYMENT', date: p.date, data: p }));

        const history = [...purchaseHistory, ...paymentHistory]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { debt, history };
    }, [purchases, payments]);

    return { supplier, debt, history, loading, error, addPurchase, addPayment, updateSupplier };
}
