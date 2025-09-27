
import { Invoice, InvoiceStatus, InvoiceId } from '../../types/invoice.ts';
import { getNextInvoiceNumber, incrementInvoiceNumber } from '../../utils/numbering.ts';
import { readJSON, writeJSON } from '../../utils/storage.ts';

const STORAGE_OPTIONS = { key: 'invoices_v1', version: 'v1' as const };
let invoices: Invoice[] = readJSON(STORAGE_OPTIONS, []);

const persist = () => {
    writeJSON(STORAGE_OPTIONS, invoices);
};

const findInvoice = (id: InvoiceId) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) throw new Error(`Invoice with id ${id} not found`);
    return invoice;
};

// --- Public API ---

export const list = async (): Promise<Invoice[]> => {
    return Promise.resolve([...invoices]);
};

export const listByClient = async (clientId: string): Promise<Invoice[]> => {
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    return Promise.resolve(clientInvoices);
};

export const getById = async (id: InvoiceId): Promise<Invoice | null> => {
    return Promise.resolve(invoices.find(inv => inv.id === id) || null);
};

export const create = async (
    draftData: Partial<Omit<Invoice, 'id'|'createdAt'|'updatedAt'|'number'|'status'>>
): Promise<Invoice> => {
    const pos = draftData.pos || '0001';
    const newInvoice: Invoice = {
        id: crypto.randomUUID(),
        type: draftData.type || 'B',
        concept: draftData.concept || 'PRODUCTOS',
        pos: pos,
        number: getNextInvoiceNumber(pos), // Preview number
        clientId: draftData.clientId || '',
        clientName: draftData.clientName || '',
        clientDocType: draftData.clientDocType || 'DNI',
        clientDocNumber: draftData.clientDocNumber || '',
        items: draftData.items || [],
        totals: draftData.totals || { netARS: 0, ivaARS: 0, totalARS: 0 },
        paymentMethod: draftData.paymentMethod || 'EFECTIVO',
        status: 'BORRADOR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    invoices.push(newInvoice);
    persist();
    return Promise.resolve(newInvoice);
};

export const update = async (id: InvoiceId, patch: Partial<Invoice>): Promise<Invoice> => {
    const invoice = findInvoice(id);
    if (invoice.status !== 'BORRADOR') {
        throw new Error("Only draft invoices can be updated.");
    }
    const updatedInvoice = { ...invoice, ...patch, updatedAt: new Date().toISOString() };
    invoices = invoices.map(inv => inv.id === id ? updatedInvoice : inv);
    persist();
    return Promise.resolve(updatedInvoice);
};

export const issue = async (finalDraftData: Invoice): Promise<Invoice> => {
    const invoiceToIssue = findInvoice(finalDraftData.id); // verify it exists
    if (invoiceToIssue.status !== 'BORRADOR') {
        throw new Error('Only draft invoices can be issued.');
    }

    const issuedInvoice: Invoice = {
        ...finalDraftData,
        id: invoiceToIssue.id, // Keep original ID
        status: 'EMITIDA',
        number: incrementInvoiceNumber(finalDraftData.pos),
        cae: Date.now().toString() + Math.floor(Math.random() * 100),
        caeDue: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d.toISOString();
        })(),
        updatedAt: new Date().toISOString(),
        createdAt: invoiceToIssue.createdAt, // Keep original creation date
    };

    invoices = invoices.map(inv => (inv.id === issuedInvoice.id ? issuedInvoice : inv));
    persist();
    return Promise.resolve(issuedInvoice);
};


export const setStatus = async (id: InvoiceId, status: InvoiceStatus): Promise<Invoice> => {
    const invoice = findInvoice(id);
    
    if (status === 'EMITIDA') {
        throw new Error("Internal error: Use the `issue` function to set status to EMITIDA.");
    }
    
    const updatedInvoice = { ...invoice, status, updatedAt: new Date().toISOString() };
    invoices = invoices.map(inv => inv.id === id ? updatedInvoice : inv);
    persist();
    return Promise.resolve(updatedInvoice);
};


export const remove = async (id: InvoiceId): Promise<void> => {
    const invoice = findInvoice(id);
    if (invoice.status !== 'BORRADOR') {
        throw new Error("Only draft invoices can be removed.");
    }
    invoices = invoices.filter(inv => inv.id !== id);
    persist();
    return Promise.resolve();
};

export const hasInvoicesForClient = async (clientId: string): Promise<boolean> => {
    return Promise.resolve(invoices.some(inv => inv.clientId === clientId));
};
