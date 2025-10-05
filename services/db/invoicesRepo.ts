

import { Invoice, InvoiceStatus, InvoiceId } from '../../types/invoice.ts';
import { getNextInvoiceNumber, incrementInvoiceNumber, generateNextExpediente } from '../../utils/numbering.ts';
import { createRepository } from './repository.ts';

const repo = createRepository<Invoice>('invoices_v1');

// --- Public API ---

export const list = repo.list;
export const getById = repo.getById;
export const remove = async (id: InvoiceId) => {
    const invoice = await getById(id);
    if (!invoice || invoice.status !== 'BORRADOR') {
        throw new Error("Only draft invoices can be removed.");
    }
    await repo.remove(id);
};

export const listByClient = async (clientId: string): Promise<Invoice[]> => {
    const allInvoices = await repo.list();
    return allInvoices.filter(inv => inv.clientId === clientId);
};

export const create = async (
    draftData: Partial<Omit<Invoice, 'id'|'createdAt'|'updatedAt'|'number'|'status'>>
): Promise<Invoice> => {
    const pos = draftData.pos || '0001';
    const invoiceData = {
        type: draftData.type || 'B',
        concept: draftData.concept || 'PRODUCTOS',
        pos,
        number: getNextInvoiceNumber(pos), // Preview number
        expediente: draftData.expediente !== undefined ? draftData.expediente : generateNextExpediente(),
        clientId: draftData.clientId || '',
        clientName: draftData.clientName || '',
        clientDocType: draftData.clientDocType || 'DNI',
        clientDocNumber: draftData.clientDocNumber || '',
        items: draftData.items || [],
        totals: draftData.totals || { netARS: 0, ivaARS: 0, totalARS: 0 },
        paymentMethod: draftData.paymentMethod || 'EFECTIVO',
        status: 'BORRADOR' as InvoiceStatus,
        cae: undefined,
        caeDue: undefined,
    };
    return repo.create(invoiceData);
};

export const update = async (id: InvoiceId, patch: Partial<Invoice>): Promise<Invoice> => {
    const invoice = await getById(id);
    if (!invoice || invoice.status !== 'BORRADOR') {
        throw new Error("Only draft invoices can be updated.");
    }
    return repo.update(id, patch);
};

export const issue = async (finalDraftData: Invoice): Promise<Invoice> => {
    const invoiceToIssue = await getById(finalDraftData.id);
    if (!invoiceToIssue || invoiceToIssue.status !== 'BORRADOR') {
        throw new Error('Only draft invoices can be issued.');
    }
    
    const newStatus: InvoiceStatus = finalDraftData.paymentMethod === 'CTA_CTE' ? 'PENDIENTE_PAGO' : 'PAGADA';
    const isArcaInvoice = ['A', 'B', 'C'].includes(finalDraftData.type);

    const issuedInvoiceData = {
        ...finalDraftData,
        status: newStatus,
        number: incrementInvoiceNumber(finalDraftData.pos),
        cae: isArcaInvoice ? Date.now().toString() + Math.floor(Math.random() * 100) : undefined,
        caeDue: isArcaInvoice ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d.toISOString();
        })() : undefined,
    };

    return repo.update(finalDraftData.id, issuedInvoiceData);
};

export const markAsPaid = async (id: InvoiceId): Promise<Invoice> => {
    const invoice = await getById(id);
    if (!invoice || invoice.status !== 'PENDIENTE_PAGO') {
        throw new Error("Solo las facturas pendientes de pago se pueden marcar como pagadas.");
    }
    return repo.update(id, { status: 'PAGADA' });
};


export const setStatus = async (id: InvoiceId, status: InvoiceStatus): Promise<Invoice> => {
    if (status === 'PAGADA' || status === 'PENDIENTE_PAGO') {
        throw new Error("Internal error: Use the `issue` or `markAsPaid` function to set issued statuses.");
    }
    return repo.update(id, { status });
};

export const hasInvoicesForClient = async (clientId: string): Promise<boolean> => {
    const allInvoices = await repo.list();
    return allInvoices.some(inv => inv.clientId === clientId);
};