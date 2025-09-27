
import { Supplier, SupplierImportRow, DocTypeSupplier, IvaCondition, PaymentTerms, SupplierImportResult } from '../../types/supplier';
import { normalizeCUIT, validateSupplierDoc } from '../../utils/doc';
import { normalizeCBU, normalizeAlias, isValidCBU } from '../../utils/bank';

const STORAGE_KEY = 'suppliers_v1';
let suppliers: Supplier[] = [];

// Seed data
const seedData = (): Supplier[] => [
    { id: crypto.randomUUID(), businessName: 'Papeles Cuyanos SA', docType: 'CUIT', cuit: '30712345678', ivaCondition: 'RI', active: true, email: 'contacto@papelescuyanos.com', phone: '2614567890', address: 'Carril Rodriguez Peña 2130', city: 'Maipú', province: 'Mendoza', postalCode: '5515', contactName: 'Carlos Rivera', paymentTerms: 'CTA_CTE_30', bank: { bankName: 'Banco Nación', cbu: '0110599520000012345678', alias: 'PAPELES.CUYO.SA' }, notes: 'Principal proveedor de resmas A4.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: crypto.randomUUID(), businessName: 'Insumos Andes SRL', docType: 'CUIT', cuit: '30709998883', ivaCondition: 'RI', active: true, email: 'ventas@insumosandes.com', phone: '1155667788', address: 'Av. San Martín 950', city: 'CABA', province: 'Buenos Aires', postalCode: '1004', contactName: 'Ana Torres', paymentTerms: 'CONTADO', bank: { bankName: 'Banco Galicia', cbu: '0070021220000012345678', alias: 'ANDES.SRL' }, notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: crypto.randomUUID(), businessName: 'Distribuidora Escolar Mendoza', docType: 'CUIT', cuit: '20279991119', ivaCondition: 'MONOTRIBUTO', active: true, email: 'distribuidora.mza@email.com', phone: '2615889900', address: 'Las Heras 450', city: 'Mendoza', province: 'Mendoza', postalCode: '5500', contactName: 'Laura Paez', paymentTerms: 'CTA_CTE_15', bank: {}, notes: 'Proveedor de mochilas y cartucheras.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        suppliers = JSON.parse(stored);
    }
} catch (error) {
    console.error("Failed to load suppliers from localStorage", error);
}

const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
};

const findSupplier = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) throw new Error(`Supplier with id ${id} not found`);
    return supplier;
};

// --- Public API ---

export const list = async (): Promise<Supplier[]> => Promise.resolve([...suppliers]);

export const search = async (query: string): Promise<Supplier[]> => {
    const q = query.toLowerCase();
    return Promise.resolve(suppliers.filter(s => 
        s.businessName.toLowerCase().includes(q) || s.cuit.includes(q)
    ));
};

export const getById = async (id: string): Promise<Supplier | null> => Promise.resolve(suppliers.find(s => s.id === id) || null);

export const create = async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> => {
    if (!data.businessName.trim()) throw new Error("La Razón Social es obligatoria.");

    const normalizedCuit = normalizeCUIT(data.cuit);
    const docValidation = validateSupplierDoc(data.docType, normalizedCuit);
    if (!docValidation.ok) throw new Error(docValidation.message);

    if (data.docType === 'CUIT') {
        const existing = suppliers.find(s => normalizeCUIT(s.cuit) === normalizedCuit);
        if (existing) throw new Error(`Ya existe un proveedor con el CUIT ${data.cuit}.`);
    }

    if (data.bank?.cbu && !isValidCBU(data.bank.cbu)) {
        throw new Error("El CBU debe tener 22 dígitos.");
    }
    
    const newSupplier: Supplier = {
        id: crypto.randomUUID(),
        ...data,
        cuit: normalizedCuit,
        bank: data.bank ? {
            ...data.bank,
            cbu: normalizeCBU(data.bank.cbu || ''),
            alias: normalizeAlias(data.bank.alias || ''),
        } : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    suppliers.push(newSupplier);
    persist();
    return Promise.resolve(newSupplier);
};

export const update = async (id: string, patch: Partial<Supplier>): Promise<Supplier> => {
    const supplier = findSupplier(id);
    const updatedSupplier = { ...supplier, ...patch, updatedAt: new Date().toISOString() };
    
    const normalizedCuit = normalizeCUIT(updatedSupplier.cuit);
    const docValidation = validateSupplierDoc(updatedSupplier.docType, normalizedCuit);
    if (!docValidation.ok) throw new Error(docValidation.message);

    if (updatedSupplier.docType === 'CUIT') {
        const existing = suppliers.find(s => s.id !== id && normalizeCUIT(s.cuit) === normalizedCuit);
        if (existing) throw new Error(`Ya existe otro proveedor con el CUIT ${updatedSupplier.cuit}.`);
    }
    updatedSupplier.cuit = normalizedCuit;
    
    if (updatedSupplier.bank?.cbu && !isValidCBU(updatedSupplier.bank.cbu)) {
        throw new Error("El CBU debe tener 22 dígitos.");
    }

    suppliers = suppliers.map(s => s.id === id ? updatedSupplier : s);
    persist();
    return Promise.resolve(updatedSupplier);
};

export const deactivate = async (id: string): Promise<Supplier> => {
    const supplier = findSupplier(id);
    const updatedSupplier = { ...supplier, active: !supplier.active, updatedAt: new Date().toISOString() };
    suppliers = suppliers.map(s => s.id === id ? updatedSupplier : s);
    persist();
    return Promise.resolve(updatedSupplier);
};

export const seedIfEmpty = async (): Promise<void> => {
    if (suppliers.length === 0) {
        suppliers = seedData();
        persist();
    }
    return Promise.resolve();
};

export const batchCreate = async (data: SupplierImportRow[]): Promise<SupplierImportResult> => {
    const result: SupplierImportResult = { successCount: 0, errors: [] };

    for(const row of data) {
        try {
            const supplierData: Omit<Supplier, 'id'|'createdAt'|'updatedAt'> = {
                businessName: row.businessName || '',
                docType: row.docType || 'CUIT',
                cuit: row.cuit || '',
                ivaCondition: row.ivaCondition || 'RI',
                email: row.email,
                phone: row.phone,
                address: row.address,
                city: row.city,
                province: row.province,
                postalCode: row.postalCode,
                contactName: row.contactName,
                paymentTerms: row.paymentTerms || 'CONTADO',
                bank: {
                    bankName: row['bank.bankName'],
                    cbu: row['bank.cbu'],
                    alias: row['bank.alias'],
                },
                notes: row.notes,
                active: row.active ?? true,
            };
            await create(supplierData);
            result.successCount++;
        } catch (e) {
            result.errors.push({ item: row, reason: e instanceof Error ? e.message : 'Error desconocido' });
        }
    }
    return result;
};
