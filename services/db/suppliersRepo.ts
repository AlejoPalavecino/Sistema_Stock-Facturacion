

import { Supplier, SupplierImportRow, SupplierImportResult } from '../../types/supplier';
import { normalizeDocNumber, validateDoc } from '../../utils/doc';
import { normalizeCBU, normalizeAlias, isValidCBU } from '../../utils/bank';
import { createRepository } from './repository.ts';

const seedData = (): Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>[] => [
    { businessName: 'Papeles Cuyanos SA', docType: 'CUIT', cuit: '30712345678', ivaCondition: 'RI', active: true, email: 'contacto@papelescuyanos.com', phone: '2614567890', address: 'Carril Rodriguez Peña 2130', city: 'Maipú', province: 'Mendoza', postalCode: '5515', contactName: 'Carlos Rivera', paymentTerms: 'CTA_CTE_30', bank: { bankName: 'Banco Nación', cbu: '0110599520000012345678', alias: 'PAPELES.CUYO.SA' }, notes: 'Principal proveedor de resmas A4.' },
    { businessName: 'Insumos Andes SRL', docType: 'CUIT', cuit: '30709998883', ivaCondition: 'RI', active: true, email: 'ventas@insumosandes.com', phone: '1155667788', address: 'Av. San Martín 950', city: 'CABA', province: 'Buenos Aires', postalCode: '1004', contactName: 'Ana Torres', paymentTerms: 'CONTADO', bank: { bankName: 'Banco Galicia', cbu: '0070021220000012345678', alias: 'ANDES.SRL' }, notes: '' },
    { businessName: 'Distribuidora Escolar Mendoza', docType: 'CUIT', cuit: '20279991119', ivaCondition: 'MONOTRIBUTO', active: true, email: 'distribuidora.mza@email.com', phone: '2615889900', address: 'Las Heras 450', city: 'Mendoza', province: 'Mendoza', postalCode: '5500', contactName: 'Laura Paez', paymentTerms: 'CTA_CTE_15', bank: {}, notes: 'Proveedor de mochilas y cartucheras.' },
];

const repo = createRepository<Supplier>('suppliers_v1', () => {
    return seedData().map(s => ({
        ...s,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }));
});

// --- Public API ---
export const list = repo.list;
export const getById = repo.getById;

export const create = async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> => {
    if (!data.businessName.trim()) throw new Error("La Razón Social es obligatoria.");

    const normalizedCuit = normalizeDocNumber(data.cuit);
    const docValidation = validateDoc(data.docType, normalizedCuit);
    if (!docValidation.ok) throw new Error(docValidation.message);

    if (data.docType === 'CUIT') {
        const allSuppliers = await repo.list();
        const existing = allSuppliers.find(s => normalizeDocNumber(s.cuit) === normalizedCuit);
        if (existing) throw new Error(`Ya existe un proveedor con el CUIT ${data.cuit}.`);
    }

    if (data.bank?.cbu && !isValidCBU(data.bank.cbu)) {
        throw new Error("El CBU debe tener 22 dígitos.");
    }
    
    const supplierData = {
        ...data,
        cuit: normalizedCuit,
        bank: data.bank ? {
            ...data.bank,
            cbu: normalizeCBU(data.bank.cbu || ''),
            alias: normalizeAlias(data.bank.alias || ''),
        } : undefined,
    };

    return repo.create(supplierData);
};

export const update = async (id: string, patch: Partial<Supplier>): Promise<Supplier> => {
    const supplier = await getById(id);
    if (!supplier) throw new Error(`Supplier with id ${id} not found.`);

    const updatedData = { ...supplier, ...patch };

    const normalizedCuit = normalizeDocNumber(updatedData.cuit);
    const docValidation = validateDoc(updatedData.docType, normalizedCuit);
    if (!docValidation.ok) throw new Error(docValidation.message);

    if (updatedData.docType === 'CUIT') {
        const allSuppliers = await repo.list();
        const existing = allSuppliers.find(s => s.id !== id && normalizeDocNumber(s.cuit) === normalizedCuit);
        if (existing) throw new Error(`Ya existe otro proveedor con el CUIT ${updatedData.cuit}.`);
    }

    if (updatedData.bank?.cbu && !isValidCBU(updatedData.bank.cbu)) {
        throw new Error("El CBU debe tener 22 dígitos.");
    }
    
    return repo.update(id, { ...patch, cuit: normalizedCuit });
};

export const deactivate = async (id: string): Promise<Supplier> => {
    const supplier = await getById(id);
    if (!supplier) throw new Error(`Supplier with id ${id} not found.`);
    return repo.update(id, { active: !supplier.active });
};

export const seedIfEmpty = async (): Promise<void> => {
    const allSuppliers = await repo.list();
    if (allSuppliers.length === 0) {
        for (const supplierData of seedData()) {
            await repo.create(supplierData);
        }
    }
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