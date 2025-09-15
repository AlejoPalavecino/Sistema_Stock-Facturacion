import { Invoice, InvoiceStatus, InvoiceId } from '../../types/invoice';
import { getNextInvoiceNumber, incrementInvoiceNumber } from '../../utils/numbering';

const STORAGE_KEY = 'invoices_v1';
let invoices: Invoice[] = [];

try {
    const storedInvoices = localStorage.getItem(STORAGE_KEY);
    if (storedInvoices) {
        invoices = JSON.parse(storedInvoices);
    }
} catch (error) {
    console.error("Failed to load invoices from localStorage", error);
}

const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
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

export const setStatus = async (id: InvoiceId, status: InvoiceStatus): Promise<Invoice> => {
    const invoice = findInvoice(id);
    let patch: Partial<Invoice> = { status };

    if (status === 'EMITIDA' && invoice.status === 'BORRADOR') {
        patch.number = incrementInvoiceNumber(invoice.pos);
        patch.cae = Date.now().toString() + Math.floor(Math.random() * 100); // Simulated CAE
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        patch.caeDue = dueDate.toISOString();
    }
    
    const updatedInvoice = { ...invoice, ...patch, updatedAt: new Date().toISOString() };
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