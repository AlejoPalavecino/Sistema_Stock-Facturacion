
import { Client, DocType, ClientImportRow, IvaCondition } from '@/types/client';
import { normalizeDocNumber, validateDoc } from '@/utils/doc';
import * as invoicesRepo from './invoicesRepo';
import { readJSON, writeJSON } from '@/utils/storage';

const STORAGE_OPTIONS = { key: 'clients_v1', version: 'v1' as const };

// FIX: Explicitly set the return type to Client[] to ensure type safety.
// This prevents TypeScript from inferring 'docType' and 'ivaCondition' as generic strings.
const seedData = (): Client[] => {
    return [
        { id: crypto.randomUUID(), name: 'Juan Pérez', docType: 'DNI', docNumber: '30123456', ivaCondition: 'CF', active: true, email: 'juan.perez@example.com', phone: '1122334455', address: 'Av. Corrientes 1234, CABA', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Librería San Martín SRL', docType: 'CUIT', docNumber: '30712345678', ivaCondition: 'RI', active: true, email: 'compras@libreriasm.com', phone: '1198765432', address: 'Florida 500, CABA', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'María Gómez', docType: 'DNI', docNumber: '28333444', ivaCondition: 'MONOTRIBUTO', active: false, email: 'maria.gomez@example.com', phone: '1133445566', address: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
}

let clients: Client[] = readJSON(STORAGE_OPTIONS, []);

if (clients.length === 0) {
    clients = seedData();
}

const persist = () => {
    writeJSON(STORAGE_OPTIONS, clients);
};

const findClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) throw new Error(`Client with id ${id} not found`);
    return client;
};

// --- Public API ---

export const list = async (): Promise<Client[]> => {
    return Promise.resolve([...clients]);
};

export const getById = async (id: string): Promise<Client | null> => {
    return Promise.resolve(clients.find(c => c.id === id) || null);
};

export const searchByNameOrDoc = async (query: string): Promise<Client[]> => {
    const q = query.toLowerCase();
    const results = clients.filter(c => 
        c.name.toLowerCase().includes(q) || c.docNumber.includes(q)
    );
    return Promise.resolve(results);
};

export const create = async (data: Omit<Client, 'id'|'createdAt'|'updatedAt'>): Promise<Client> => {
    if (!data.name.trim()) throw new Error("El nombre es obligatorio.");
    
    const normalizedDoc = normalizeDocNumber(data.docNumber);
    const validation = validateDoc(data.docType, normalizedDoc);
    if (!validation.ok) throw new Error(validation.message);
    
    if (data.docType !== 'SD' && normalizedDoc) {
        const existing = clients.find(c => c.docType === data.docType && normalizeDocNumber(c.docNumber) === normalizedDoc);
        if (existing) {
            throw new Error(`Ya existe un cliente con ${data.docType} ${data.docNumber}.`);
        }
    }

    const newClient: Client = {
        id: crypto.randomUUID(),
        ...data,
        docNumber: normalizedDoc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    clients.push(newClient);
    persist();
    return Promise.resolve(newClient);
};

export const update = async (id: string, patch: Partial<Client>): Promise<Client> => {
    const client = findClient(id);
    const updatedClient = { ...client, ...patch, updatedAt: new Date().toISOString() };
    
    const normalizedDoc = normalizeDocNumber(updatedClient.docNumber);
    const validation = validateDoc(updatedClient.docType, normalizedDoc);
    if (!validation.ok) throw new Error(validation.message);

    if (updatedClient.docType !== 'SD' && normalizedDoc) {
        const existing = clients.find(c => c.id !== id && c.docType === updatedClient.docType && normalizeDocNumber(c.docNumber) === normalizedDoc);
        if (existing) {
            throw new Error(`Ya existe otro cliente con ${updatedClient.docType} ${updatedClient.docNumber}.`);
        }
    }
    updatedClient.docNumber = normalizedDoc;
    
    clients = clients.map(c => c.id === id ? updatedClient : c);
    persist();
    return Promise.resolve(updatedClient);
};

export const remove = async (id: string): Promise<void> => {
    const hasInvoices = await invoicesRepo.hasInvoicesForClient(id);
    if (hasInvoices) {
        throw new Error("No se puede eliminar el cliente porque tiene facturas asociadas. Por favor, desactívelo en su lugar.");
    }
    clients = clients.filter(c => c.id !== id);
    persist();
    return Promise.resolve();
};

export const deactivate = async (id: string): Promise<Client> => {
    const client = findClient(id);
    const updatedClient = { ...client, active: !client.active, updatedAt: new Date().toISOString() };
    clients = clients.map(c => c.id === id ? updatedClient : c);
    persist();
    return Promise.resolve(updatedClient);
};

export const createQuick = async (
    name: string, 
    docType: Client['docType'], 
    docNumber: string
): Promise<Client> => {
    return create({
        name,
        docType,
        docNumber,
        ivaCondition: 'CF',
        active: true
    });
};

export const batchCreate = async (data: ClientImportRow[]) => {
    const result = { successCount: 0, errors: [] as { item: any; reason: string }[] };

    for(const row of data) {
        try {
            const clientData: Omit<Client, 'id'|'createdAt'|'updatedAt'> = {
                name: row.name || '',
                docType: row.docType || 'DNI',
                docNumber: row.docNumber || '',
                ivaCondition: row.ivaCondition || 'CF',
                email: row.email,
                phone: row.phone,
                address: row.address,
                notes: row.notes,
                active: row.active ?? true,
            };
            await create(clientData);
            result.successCount++;
        } catch (e) {
            result.errors.push({ item: row, reason: e instanceof Error ? e.message : 'Error desconocido' });
        }
    }
    return result;
};

export const seedIfEmpty = async (): Promise<void> => {
    if (clients.length === 0) {
        clients = seedData();
        persist();
    }
    return Promise.resolve();
};
