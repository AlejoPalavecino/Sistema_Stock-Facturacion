import { useState, useEffect, useCallback } from 'react';
import * as invoicesRepo from '../services/db/invoicesRepo';
import * as productsRepo from '../services/db/productsRepo';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types/invoice';
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

    const createDraft = async (): Promise<Invoice> => {
        const newDraft = await invoicesRepo.create({});
        await fetchInvoices();
        return newDraft;
    };
    
    const updateInvoice = async (id: string, invoiceData: Invoice): Promise<Invoice> => {
        const invoiceWithTotals = {
            ...invoiceData,
            totals: sumTotals(invoiceData.items),
        };
        const updated = await invoicesRepo.update(id, invoiceWithTotals);
        await fetchInvoices();
        return updated;
    };
    
    const issueInvoice = async (id: string): Promise<Invoice> => {
        const invoice = await getById(id);
        if (!invoice) throw new Error('Factura no encontrada.');
        if (invoice.status !== 'BORRADOR') throw new Error('Solo se pueden emitir borradores.');
        if (!invoice.clientId) throw new Error('Debe seleccionar un cliente.');
        if (invoice.items.length === 0) throw new Error('La factura debe tener al menos un ítem.');

        // Verify stock for all items
        for (const item of invoice.items) {
            const product = await productsRepo.getById(item.productId);
            if (!product || product.stock < item.qty) {
                throw new Error(`Stock insuficiente para "${item.name}". Stock disponible: ${product?.stock || 0}.`);
            }
        }

        // Deduct stock
        for (const item of invoice.items) {
            await productsRepo.adjustStock(item.productId, -item.qty, `Venta - Factura ${invoice.pos}-${invoice.number}`);
        }
        
        // Finalize invoice (set number, CAE, etc.)
        const issuedInvoice = await invoicesRepo.setStatus(id, 'EMITIDA');
        await fetchInvoices();
        return issuedInvoice;
    };

    const cancelInvoice = async (id: string): Promise<Invoice> => {
        const invoice = await getById(id);
        if (!invoice) throw new Error('Factura no encontrada.');
        if (invoice.status !== 'EMITIDA') throw new Error('Solo se pueden anular facturas emitidas.');
        // Note: Stock is NOT replenished in this simple version.
        const cancelled = await invoicesRepo.setStatus(id, 'ANULADA');
        await fetchInvoices();
        return cancelled;
    };
    
    const removeDraft = async(id: string): Promise<void> => {
        const invoice = await getById(id);
        if (!invoice || invoice.status !== 'BORRADOR') throw new Error('Solo se pueden eliminar borradores.');
        await invoicesRepo.remove(id);
        await fetchInvoices();
    };

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
