import { useState, useEffect, useCallback } from 'react';
import * as clientsRepo from '../services/db/clientsRepo';
import * as invoicesRepo from '../services/db/invoicesRepo';
import * as paymentsRepo from '../services/db/paymentsRepo';
import * as adjustmentsRepo from '../services/db/adjustmentsRepo';
import { Client, Invoice, Payment, AccountAdjustment, PaymentId } from '../types';
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
            setInvoices(invoicesData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

    const checkAndUpdateInvoiceStatus = useCallback(async (invoiceId: string) => {
        const invoice = await invoicesRepo.getById(invoiceId);
        if (!invoice || invoice.status !== 'PENDIENTE_PAGO') return;

        const paymentsForInvoice = await paymentsRepo.listByInvoice(invoiceId);

        // A cheque is only considered "paid" for the invoice total if it has been marked as "COBRADO"
        const totalPaid = paymentsForInvoice
            .filter(p => p.paymentMethod !== 'CHEQUE' || p.chequeDetails?.status === 'COBRADO')
            .reduce((sum, p) => sum + p.amountARS, 0);
        
        if (totalPaid >= invoice.totals.totalARS) {
            await invoicesRepo.markAsPaid(invoiceId);
        }
    }, []);

    const addPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'clientId'>) => {
        if (!clientId) return;
        try {
            const newPayment = await paymentsRepo.create({ ...paymentData, clientId });
            // Only update invoice status immediately if it's not a cheque
            if (newPayment.invoiceId && newPayment.paymentMethod !== 'CHEQUE') {
                await checkAndUpdateInvoiceStatus(newPayment.invoiceId);
            }
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
            throw err;
        }
    }, [clientId, fetchData, checkAndUpdateInvoiceStatus]);
    
    const confirmChequePayment = useCallback(async (paymentId: PaymentId) => {
        if (!clientId) return;
        try {
            const allPayments = await paymentsRepo.listByClient(clientId);
            const paymentToUpdate = allPayments.find(p => p.id === paymentId);
            
            if (!paymentToUpdate || !paymentToUpdate.chequeDetails || !paymentToUpdate.invoiceId) {
                throw new Error("Pago con cheque inválido o no encontrado.");
            }

            const updatedPayment = {
                ...paymentToUpdate,
                chequeDetails: {
                    ...paymentToUpdate.chequeDetails,
                    status: 'COBRADO' as const,
                }
            };

            await paymentsRepo.update(paymentId, updatedPayment);
            await checkAndUpdateInvoiceStatus(paymentToUpdate.invoiceId);
            await fetchData();

        } catch (err) {
             setError(err instanceof Error ? err.message : "No se pudo confirmar el cobro del cheque.");
            throw err;
        }
    }, [clientId, fetchData, checkAndUpdateInvoiceStatus]);
    
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
    
    const getPendingChequesForInvoice = useCallback((invoiceId: string) => {
        return payments.filter(p => 
            p.invoiceId === invoiceId && 
            p.paymentMethod === 'CHEQUE' && 
            p.chequeDetails?.status === 'PENDIENTE'
        );
    }, [payments]);

    const { debt, history } = useClientDetailCalculations(invoices, payments, adjustments);

    return { client, debt, invoices, payments, history, loading, error, addPayment, updateClient, addAdjustment, confirmChequePayment, getPendingChequesForInvoice };
}