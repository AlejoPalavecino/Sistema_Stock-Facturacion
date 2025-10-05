import { useState, useEffect, useCallback } from 'react';
import * as clientsRepo from '../services/db/clientsRepo';
import * as invoicesRepo from '../services/db/invoicesRepo';
import * as paymentsRepo from '../services/db/paymentsRepo';
import * as adjustmentsRepo from '../services/db/adjustmentsRepo';
import { Client, Invoice, Payment, AccountAdjustment } from '../types';
import { onStorageChange } from '../utils/storage';
import { useClientDetailCalculations } from './useAccountCalculations';

export function useClientDetails(clientId: string) {
    const [client, setClient] = useState<Client | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [adjustments, setAdjustments] = useState<AccountAdjustment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!clientId) return;
        try {
            setLoading(true);
            setError(null);
            
            const [clientData, invoicesData, paymentsData, adjustmentsData] = await Promise.all([
                clientsRepo.getById(clientId),
                invoicesRepo.listByClient(clientId),
                paymentsRepo.listByClient(clientId),
                adjustmentsRepo.listByClient(clientId),
            ]);

            if (!clientData) throw new Error("Cliente no encontrado");
            
            setClient(clientData);
            setInvoices(invoicesData);
            setPayments(paymentsData);
            setAdjustments(adjustmentsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar los detalles del cliente.");
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchData();
        const keysToWatch = ['clients_v1', 'invoices_v1', 'payments_v1', 'adjustments_v1'];
        const cleanups = keysToWatch.map(key => onStorageChange(key, fetchData));
        return () => cleanups.forEach(cleanup => cleanup());
    }, [fetchData]);

    // FIX: Corrected the Omit type to not require `updatedAt`, which is handled by the repository.
    const addPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'clientId'>) => {
        if (!clientId) return;
        try {
            await paymentsRepo.create({ ...paymentData, clientId });
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
            throw err;
        }
    }, [clientId, fetchData]);
    
    const addAdjustment = useCallback(async (adjustmentData: Omit<AccountAdjustment, 'id' | 'createdAt' | 'clientId'>) => {
        if (!clientId) return;
        try {
            await adjustmentsRepo.create({ ...adjustmentData, clientId });
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el ajuste.");
            throw err;
        }
    }, [clientId, fetchData]);
    
    const updateClient = useCallback(async (data: Partial<Client>) => {
        if (!client) return;
        try {
            await clientsRepo.update(clientId, data);
            await fetchData();
        } catch(err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar el cliente.");
            throw err;
        }
    }, [client, clientId, fetchData]);

    const { debt, history } = useClientDetailCalculations(invoices, payments, adjustments);


    return { client, debt, history, loading, error, addPayment, updateClient, addAdjustment };
}