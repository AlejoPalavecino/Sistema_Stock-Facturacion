import { useState, useEffect, useCallback } from 'react';
import * as invoicesRepo from '../services/db/invoicesRepo';
import * as productsRepo from '../services/db/productsRepo';
import { Invoice } from '../types/invoice';
import { sumTotals } from '../utils/tax';

export function useInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const data = await invoicesRepo.list();
            setInvoices(data);
            setError(null);
        } catch (e) {
            setError('No se pudieron cargar las facturas.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const getById = useCallback(async (id: string): Promise<Invoice | null> => {
        return await invoicesRepo.getById(id);
    }, []);

    const createDraft = useCallback(async (): Promise<Invoice> => {
        const newDraft = await invoicesRepo.create({});
        await fetchInvoices();
        return newDraft;
    }, [fetchInvoices]);
    
    const updateInvoice = useCallback(async (id: string, invoiceData: Invoice): Promise<Invoice> => {
        const invoiceWithTotals = {
            ...invoiceData,
            totals: sumTotals(invoiceData.items),
        };
        const updated = await invoicesRepo.update(id, invoiceWithTotals);
        await fetchInvoices();
        return updated;
    }, [fetchInvoices]);
    
    const issueInvoice = useCallback(async (invoiceData: Invoice): Promise<Invoice> => {
        if (invoiceData.status !== 'BORRADOR') throw new Error('Solo se pueden emitir borradores.');
        if (!invoiceData.clientId) throw new Error('Debe seleccionar un cliente.');
        if (invoiceData.items.length === 0) throw new Error('La factura debe tener al menos un ítem.');

        // 1. Verify stock for all items
        for (const item of invoiceData.items) {
            const product = await productsRepo.getById(item.productId);
            if (!product || product.stock < item.qty) {
                throw new Error(`Stock insuficiente para "${item.name}". Stock disponible: ${product?.stock || 0}.`);
            }
        }
        
        // 2. Prepare the final state of the draft
        const finalDraftData = {
            ...invoiceData,
            totals: sumTotals(invoiceData.items)
        };
        
        // 3. Finalize invoice (set number, CAE, status etc.)
        const issuedInvoice = await invoicesRepo.issue(finalDraftData);

        // 4. Deduct stock using final invoice number
        for (const item of issuedInvoice.items) {
            await productsRepo.adjustStock(item.productId, -item.qty, 'sale', `Venta - Factura ${issuedInvoice.pos}-${issuedInvoice.number}`);
        }
        
        await fetchInvoices();
        return issuedInvoice;
    }, [fetchInvoices]);

    const cancelInvoice = useCallback(async (id: string): Promise<Invoice> => {
        const invoice = await getById(id);
        if (!invoice) throw new Error('Factura no encontrada.');
        if (invoice.status !== 'EMITIDA') throw new Error('Solo se pueden anular facturas emitidas.');
        // Note: Stock is NOT replenished in this simple version.
        const cancelled = await invoicesRepo.setStatus(id, 'ANULADA');
        await fetchInvoices();
        return cancelled;
    }, [getById, fetchInvoices]);
    
    const removeDraft = useCallback(async(id: string): Promise<void> => {
        const invoice = await getById(id);
        if (!invoice || invoice.status !== 'BORRADOR') throw new Error('Solo se pueden eliminar borradores.');
        await invoicesRepo.remove(id);
        await fetchInvoices();
    }, [getById, fetchInvoices]);

    return {
        invoices,
        loading,
        error,
        getById,
        createDraft,
        updateInvoice,
        issueInvoice,
        cancelInvoice,
        removeDraft
    };
}
