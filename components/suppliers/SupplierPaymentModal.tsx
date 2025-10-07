
import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { SupplierPayment, PaymentMethod, Purchase } from '../../types';
import * as supplierPaymentsRepo from '../../services/db/supplierPaymentsRepo';
import { formatARS } from '../../utils/format';

interface SupplierPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (paymentData: Omit<SupplierPayment, 'id' | 'createdAt' | 'supplierId' | 'updatedAt'>) => Promise<void>;
    purchase: Purchase;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({ isOpen, onClose, onSave, purchase }) => {
    const [amountARS, setAmountARS] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFERENCIA');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [paidAmount, setPaidAmount] = useState(0);

    useEffect(() => {
        const calculateInitialAmount = async () => {
            if (isOpen && purchase) {
                const payments = await supplierPaymentsRepo.listByPurchase(purchase.id);
                const totalPaid = payments.reduce((sum, p) => sum + p.amountARS, 0);
                setPaidAmount(totalPaid);
                const remaining = purchase.totalAmountARS - totalPaid;
                setAmountARS(remaining > 0 ? remaining.toFixed(2) : '');
                setNotes(`Pago Factura ${purchase.invoiceNumber}`);
            }
        };
        calculateInitialAmount();
    }, [isOpen, purchase]);

    const handleSubmit = async () => {
        const amount = parseFloat(amountARS);
        if (isNaN(amount) || amount <= 0) {
            setError("El monto debe ser un número positivo.");
            return;
        }
         if (amount > purchase.totalAmountARS - paidAmount) {
            setError("El monto del pago no puede superar el saldo pendiente.");
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await onSave({
                purchaseId: purchase.id,
                amountARS: amount,
                date: new Date(date).toISOString(),
                paymentMethod,
                notes,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al guardar el pago.");
        } finally {
            setIsSaving(false);
        }
    };

    const remainingDebt = purchase.totalAmountARS - paidAmount;
    const formFieldClasses = "block w-full px-3 py-2 text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500";
    const labelClasses = "block mb-1.5 text-sm font-medium text-text-medium";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago a Proveedor" size="lg">
             <div className="bg-cream-100 p-3 rounded-lg mb-4 text-sm">
                <p><strong>Factura:</strong> {purchase.invoiceNumber}</p>
                <p><strong>Total Factura:</strong> {formatARS(purchase.totalAmountARS)}</p>
                <p><strong>Saldo Pendiente:</strong> <span className="font-bold text-pastel-red-600">{formatARS(remainingDebt)}</span></p>
            </div>
            <div className="space-y-4">
                <div>
                    <label className={labelClasses}>Monto a Pagar (ARS)</label>
                    <input type="number" value={amountARS} onChange={e => setAmountARS(e.target.value)} className={formFieldClasses} placeholder="0.00" />
                </div>
                <div>
                    <label className={labelClasses}>Fecha del Pago</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={formFieldClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Método de Pago</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className={formFieldClasses}>
                        {(['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE'] as PaymentMethod[]).map(pm => <option key={pm} value={pm}>{pm}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>Notas (Opcional)</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={formFieldClasses} placeholder="Ej: N° de comprobante"/>
                </div>
                {error && <p className="text-pastel-red-600 text-sm">{error}</p>}
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="btn btn-primary">
                        {isSaving ? 'Guardando...' : 'Guardar Pago'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};