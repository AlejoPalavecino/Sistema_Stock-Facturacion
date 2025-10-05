

// FIX: Changed import to use the barrel file `../../types` which correctly exports all needed types.
import { Client, DocType, ClientImportRow, IvaCondition, ClientImportResult } from '../../types';
import { normalizeDocNumber, validateDoc } from '../../utils/doc.ts';
import { createRepository } from './repository.ts';

const seedData = (): Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[] => [
    { name: 'Juan Pérez', docType: 'DNI', docNumber: '30123456', ivaCondition: 'CF', active: true, email: 'juan.perez@example.com', phone: '1122334455', address: 'Av. Corrientes 1234, CABA' },
    { name: 'Librería San Martín SRL', docType: 'CUIT', docNumber: '30712345678', ivaCondition: 'RI', active: true, email: 'compras@libreriasm.com', phone: '1198765432', address: 'Florida 500, CABA' },
    { name: 'María Gómez', docType: 'DNI', docNumber: '28333444', ivaCondition: 'MONOTRIBUTO', active: false, email: 'maria.gomez@example.com', phone: '1133445566', address: '' },
];

const repo = createRepository<Client>('clients_v1', () => {
    // The generic repo handles UUID and timestamps
    return seedData().map(c => ({
        ...c,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }));
});

// --- Public API ---

export const list = repo.list;
export const getById = repo.getById;

export const create = async (data: Omit<Client, 'id'|'createdAt'|'updatedAt'>): Promise<Client> => {
    if (!data.name.trim()) throw new Error("El nombre es obligatorio.");
    
    const normalizedDoc = normalizeDocNumber(data.docNumber);
    const validation = validateDoc(data.docType, normalizedDoc);
    if (!validation.ok) throw new Error(validation.message);
    
    if (data.docType !== 'SD' && normalizedDoc) {
        const allClients = await repo.list();
        const existing = allClients.find(c => c.docType === data.docType && normalizeDocNumber(c.docNumber) === normalizedDoc);
        if (existing) {
            throw new Error(`Ya existe un cliente con ${data.docType} ${data.docNumber}.`);
        }
    }
    
    return repo.create({ ...data, docNumber: normalizedDoc });
};

export const update = async (id: string, patch: Partial<Client>): Promise<Client> => {
    const client = await getById(id);
    if (!client) throw new Error(`Client with id ${id} not found.`);

    const updatedData = { ...client, ...patch };
    const normalizedDoc = normalizeDocNumber(updatedData.docNumber);
    const validation = validateDoc(updatedData.docType, normalizedDoc);
    if (!validation.ok) throw new Error(validation.message);

    if (updatedData.docType !== 'SD' && normalizedDoc) {
        const allClients = await repo.list();
        const existing = allClients.find(c => c.id !== id && c.docType === updatedData.docType && normalizeDocNumber(c.docNumber) === normalizedDoc);
        if (existing) {
            throw new Error(`Ya existe otro cliente con ${updatedData.docType} ${updatedData.docNumber}.`);
        }
    }
    
    return repo.update(id, { ...patch, docNumber: normalizedDoc });
};

export const deactivate = async (id: string): Promise<Client> => {
    const client = await getById(id);
    if (!client) throw new Error(`Client with id ${id} not found.`);
    return repo.update(id, { active: !client.active });
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

export const batchCreate = async (data: ClientImportRow[]): Promise<ClientImportResult> => {
    const result: ClientImportResult = { successCount: 0, errors: [] };

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
    const allClients = await repo.list();
    if (allClients.length === 0) {
        for (const clientData of seedData()) {
            await repo.create(clientData);
        }
    }
};