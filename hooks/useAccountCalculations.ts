import { useMemo } from 'react';
import { Client, ClientWithDebt, Invoice, Payment, AccountAdjustment, Supplier, SupplierWithDebt, Purchase, SupplierPayment } from '../types';
import { type ClientHistoryItem } from '../components/clients/ClientHistoryTable.tsx';
import { type SupplierHistoryItem } from '../hooks/useSupplierDetails.ts';


export function useClientsWithDebtCalculator(
    rawClients: Client[],
    rawInvoices: Invoice[],
    rawPayments: Payment[],
    rawAdjustments: AccountAdjustment[]
): ClientWithDebt[] {
    return useMemo(() => {
        const paymentsByClient = new Map<string, number>();
        for (const payment of rawPayments) {
            paymentsByClient.set(payment.clientId, (paymentsByClient.get(payment.clientId) || 0) + payment.amountARS);
        }

        const debtByClient = new Map<string, number>();
        for (const invoice of rawInvoices) {
            if (invoice.status === 'EMITIDA' && invoice.clientId) {
                debtByClient.set(invoice.clientId, (debtByClient.get(invoice.clientId) || 0) + invoice.totals.totalARS);
            }
        }
        
        const adjustmentsByClient = new Map<string, number>();
        for (const adj of rawAdjustments) {
            const amount = adj.type === 'DEBIT' ? adj.amountARS : -adj.amountARS;
            adjustmentsByClient.set(adj.clientId, (adjustmentsByClient.get(adj.clientId) || 0) + amount);
        }

        return rawClients.map(client => {
            const totalInvoiced = debtByClient.get(client.id) || 0;
            const totalPaid = paymentsByClient.get(client.id) || 0;
            const totalAdjustments = adjustmentsByClient.get(client.id) || 0;
            return { ...client, debt: totalInvoiced - totalPaid + totalAdjustments };
        });

    }, [rawClients, rawInvoices, rawPayments, rawAdjustments]);
}

export function useClientDetailCalculations(
    invoices: Invoice[],
    payments: Payment[],
    adjustments: AccountAdjustment[]
): { debt: number; history: ClientHistoryItem[] } {
    return useMemo(() => {
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
            .map(inv => ({
                type: 'FACTURA',
                date: inv.createdAt,
                amountARS: inv.totals.totalARS,
                data: { id: inv.id, description: `Factura ${inv.pos}-${inv.number}` }
            }));

        const paymentHistory: ClientHistoryItem[] = payments
            .map(p => ({
                type: 'PAGO',
                date: p.date,
                amountARS: p.amountARS,
                note: p.notes,
                data: { id: p.id, description: `Pago recibido (${p.paymentMethod})` }
            }));

        const adjustmentHistory: ClientHistoryItem[] = adjustments
            .map(adj => ({
                type: 'AJUSTE',
                date: adj.date,
                amountARS: adj.amountARS,
                data: { id: adj.id, description: `${adj.description} (${adj.type})` }
            }));

        const history: ClientHistoryItem[] = [...invoiceHistory, ...paymentHistory, ...adjustmentHistory]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { debt, history };
    }, [invoices, payments, adjustments]);
}

export function useSuppliersWithDebtCalculator(
    rawSuppliers: Supplier[],
    rawPurchases: Purchase[],
    rawPayments: SupplierPayment[]
): SupplierWithDebt[] {
    return useMemo(() => {
        const debtBySupplier = new Map<string, number>();
        rawPurchases.forEach(p => {
            debtBySupplier.set(p.supplierId, (debtBySupplier.get(p.supplierId) || 0) + p.totalAmountARS);
        });
        rawPayments.forEach(p => {
            debtBySupplier.set(p.supplierId, (debtBySupplier.get(p.supplierId) || 0) - p.amountARS);
        });

        return rawSuppliers.map(s => ({
            ...s,
            debt: debtBySupplier.get(s.id) || 0
        }));

    }, [rawSuppliers, rawPurchases, rawPayments]);
}


export function useSupplierDetailCalculations(
    purchases: Purchase[],
    payments: SupplierPayment[]
): { debt: number; history: SupplierHistoryItem[] } {
    return useMemo(() => {
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
}