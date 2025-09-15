import { SupplierPayment } from '../../types';

const STORAGE_KEY = 'supplier_payments_v1';
let payments: SupplierPayment[] = [];

try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        payments = JSON.parse(stored);
    }
} catch (error) {
    console.error("Failed to load supplier payments from localStorage", error);
}

const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
};

export const list = async (): Promise<SupplierPayment[]> => Promise.resolve([...payments]);

export const listBySupplier = async (supplierId: string): Promise<SupplierPayment[]> => {
    return Promise.resolve(payments.filter(p => p.supplierId === supplierId));
};

export const create = async (data: Omit<SupplierPayment, 'id' | 'createdAt'>): Promise<SupplierPayment> => {
    if (data.amountARS <= 0) throw new Error("El monto del pago debe ser positivo.");
    
    const newPayment: SupplierPayment = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
    };
    payments.push(newPayment);
    persist();
    return Promise.resolve(newPayment);
};
