import { useState, useEffect, useCallback, useMemo } from 'react';
import * as clientsRepo from '../services/db/clientsRepo';
import * as invoicesRepo from '../services/db/invoicesRepo';
import * as paymentsRepo from '../services/db/paymentsRepo';
import * as adjustmentsRepo from '../services/db/adjustmentsRepo';
import { Client } from '../types/client';
import { Invoice } from '../types/invoice';
import { Payment } from '../types/payment';
import { AccountAdjustment } from '../types/adjustment';

export type ClientHistoryItem = 
    | { type: 'INVOICE'; date: string; data: Invoice }
    | { type: 'PAYMENT'; date: string; data: Payment }
    | { type: 'ADJUSTMENT'; date: string; data: AccountAdjustment };

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
    }, [fetchData]);

    const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'clientId'>) => {
        if (!clientId) return;
        try {
            await paymentsRepo.create({ ...paymentData, clientId });
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
            throw err;
        }
    };
    
    const addAdjustment = async (adjustmentData: Omit<AccountAdjustment, 'id' | 'createdAt' | 'clientId'>) => {
        if (!clientId) return;
        try {
            await adjustmentsRepo.create({ ...adjustmentData, clientId });
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el ajuste.");
            throw err;
        }
    };
    
    const updateClient = async (data: Partial<Client>) => {
        if (!client) return;
        try {
            await clientsRepo.update(clientId, data);
            await fetchData();
        } catch(err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar el cliente.");
            throw err;
        }
    };

    const { debt, history } = useMemo(() => {
        const totalInvoiced = invoices
            .filter(inv => inv.status === 'EMITIDA')
            .reduce((sum, inv) => sum + inv.totals.totalARS, 0);
        
        const totalPaid = payments.reduce((sum, p) => sum + p.amountARS, 0);

        const totalAdjustments = adjustments.reduce((sum, adj) => {
            return sum + (adj.type === 'DEBIT' ? adj.amountARS : -adj.amountARS);
        }, 0);
        
        const debt = totalInvoiced - totalPaid + totalAdjustments;

        const invoiceHistory: ClientHistoryItem[] = invoices
            .filter(inv => inv.status === 'EMITIDA')
            .map(inv => ({ type: 'INVOICE', date: inv.createdAt, data: inv }));

        const paymentHistory: ClientHistoryItem[] = payments
            .map(p => ({ type: 'PAYMENT', date: p.date, data: p }));

        const adjustmentHistory: ClientHistoryItem[] = adjustments
            .map(adj => ({ type: 'ADJUSTMENT', date: adj.date, data: adj }));

        const history = [...invoiceHistory, ...paymentHistory, ...adjustmentHistory]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { debt, history };
    }, [invoices, payments, adjustments]);


    return { client, debt, history, loading, error, addPayment, updateClient, addAdjustment };
}