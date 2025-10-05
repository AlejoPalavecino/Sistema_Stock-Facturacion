import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Purchase } from '../../types';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'supplierId' | 'status' | 'updatedAt'>) => Promise<void>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, onSave }) => {
    const [totalAmountARS, setTotalAmountARS] = useState('');
    // FIX: Add state for invoiceNumber which is a required field.
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        const amount = parseFloat(totalAmountARS);
        if (isNaN(amount) || amount <= 0) {
            setError("El monto debe ser un número positivo.");
            return;
        }
        // FIX: Add validation for the new invoiceNumber field.
        if (!invoiceNumber.trim()) {
            setError("El número de factura del proveedor es obligatorio.");
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            // FIX: Construct a valid purchase object including invoiceNumber and items to match the expected type.
            await onSave({
                invoiceNumber,
                items: [{
                    productId: 'quick-add',
                    sku: 'N/A',
                    name: `Compra: ${invoiceNumber}`,
                    qty: 1,
                    unitPriceARS: amount,
                    lineTotalARS: amount,
                }],
                totalAmountARS: amount,
                date: new Date(date).toISOString(),
                notes,
            });
            // Reset form
            setTotalAmountARS('');
            setInvoiceNumber('');
            setNotes('');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al guardar la compra.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Compra">
            <div className="space-y-4">
                <div>
                    <label className="block mb-1.5 text-sm font-medium text-slate-700">Monto Total (ARS)</label>
                    <input type="number" value={totalAmountARS} onChange={e => setTotalAmountARS(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg" placeholder="0.00" />
                </div>
                {/* FIX: Add input field for invoiceNumber. */}
                <div>
                    <label className="block mb-1.5 text-sm font-medium text-slate-700">N° Factura Proveedor</label>
                    <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg" />
                </div>
                <div>
                    <label className="block mb-1.5 text-sm font-medium text-slate-700">Fecha de la Compra</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg" />
                </div>
                <div>
                    <label className="block mb-1.5 text-sm font-medium text-slate-700">Notas / N° Factura (Opcional)</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg" />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="text-sm font-semibold text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">
                        {isSaving ? 'Guardando...' : 'Guardar Compra'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
