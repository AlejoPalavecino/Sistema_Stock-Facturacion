
import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { Payment, PaymentMethod, Invoice, ChequeDetails, ChequeStatus } from '../../types';
import * as paymentsRepo from '../../services/db/paymentsRepo';
import { formatARS } from '../../utils/format';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (paymentData: Omit<Payment, 'id' | 'createdAt' | 'clientId' | 'updatedAt'>) => Promise<void>;
    invoice: Invoice;
}

const initialChequeState: ChequeDetails = {
    number: '',
    bank: '',
    paymentDate: new Date().toISOString().split('T')[0],
    type: 'COMUN',
    holderName: '',
    holderCuit: '',
    status: 'PENDIENTE',
};

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSave, invoice }) => {
    const [amountARS, setAmountARS] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFERENCIA');
    const [notes, setNotes] = useState('');
    const [chequeDetails, setChequeDetails] = useState<ChequeDetails>(initialChequeState);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [paidAmount, setPaidAmount] = useState(0);

    useEffect(() => {
        const calculateInitialAmount = async () => {
            if (isOpen && invoice) {
                const payments = await paymentsRepo.listByInvoice(invoice.id);
                const totalPaid = payments.reduce((sum, p) => sum + p.amountARS, 0);
                setPaidAmount(totalPaid);
                const remaining = invoice.totals.totalARS - totalPaid;
                setAmountARS(remaining > 0 ? remaining.toFixed(2) : '');
                setNotes(`Pago Factura ${invoice.pos}-${invoice.number}`);
                setChequeDetails(initialChequeState);
            }
        };
        calculateInitialAmount();
    }, [isOpen, invoice]);

    const handleChequeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setChequeDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const amount = parseFloat(amountARS);
        if (isNaN(amount) || amount <= 0) {
            setError("El monto debe ser un número positivo.");
            return;
        }
        if (amount > invoice.totals.totalARS - paidAmount) {
            setError("El monto del pago no puede superar el saldo pendiente.");
            return;
        }
        if (paymentMethod === 'CHEQUE') {
            const { number, bank, holderName, holderCuit, type, paymentDate } = chequeDetails;
            if (!number || !bank || !holderName || !holderCuit) {
                setError("Todos los campos del cheque son obligatorios.");
                return;
            }
            if (type === 'DIFERIDO' && new Date(paymentDate) <= new Date(date)) {
                setError("Para cheques diferidos, la fecha de cobro debe ser posterior a la fecha del pago.");
                return;
            }
        }

        setError('');
        setIsSaving(true);
        try {
            await onSave({
                invoiceId: invoice.id,
                amountARS: amount,
                date: new Date(date).toISOString(),
                paymentMethod,
                notes,
                ...(paymentMethod === 'CHEQUE' && { chequeDetails }),
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al guardar el pago.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const remainingDebt = invoice.totals.totalARS - paidAmount;
    const formFieldClasses = "block w-full px-3 py-2 text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500";
    const labelClasses = "block mb-1.5 text-sm font-medium text-text-medium";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago" size="xl">
            <div className="bg-cream-100 p-3 rounded-lg mb-4 text-sm">
                <p><strong>Factura:</strong> {invoice.pos}-{invoice.number}</p>
                <p><strong>Total Factura:</strong> {formatARS(invoice.totals.totalARS)}</p>
                <p><strong>Saldo Pendiente:</strong> <span className="font-bold text-pastel-red-600">{formatARS(remainingDebt)}</span></p>
            </div>
            <div className="space-y-4">
                <div>
                    <label className={labelClasses}>Monto (ARS)</label>
                    <input type="number" value={amountARS} onChange={e => setAmountARS(e.target.value)} className={formFieldClasses} placeholder="0.00" />
                </div>
                <div>
                    <label className={labelClasses}>Fecha del Pago</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={formFieldClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Método de Pago</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className={formFieldClasses}>
                        {(['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE'] as PaymentMethod[]).map(pm => <option key={pm} value={pm}>{pm}</option>)}
                    </select>
                </div>
                
                {paymentMethod === 'CHEQUE' && (
                    <div className="p-4 border border-cream-300 rounded-lg bg-cream-50 space-y-3">
                         <h4 className="text-sm font-semibold text-text-dark">Detalles del Cheque</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <input name="number" value={chequeDetails.number} onChange={handleChequeChange} placeholder="Nº Cheque" className={`${formFieldClasses} text-sm`} />
                             <input name="bank" value={chequeDetails.bank} onChange={handleChequeChange} placeholder="Banco" className={`${formFieldClasses} text-sm`} />
                             <div className="sm:col-span-2">
                                <label className="block mb-1 text-xs font-medium text-text-medium">Fecha de Cobro (Vencimiento)</label>
                                <input type="date" name="paymentDate" value={chequeDetails.paymentDate} onChange={handleChequeChange} className={`${formFieldClasses} text-sm`} />
                             </div>
                             <select name="type" value={chequeDetails.type} onChange={handleChequeChange} className={`${formFieldClasses} text-sm`}>
                                <option value="COMUN">Común</option>
                                <option value="DIFERIDO">Diferido</option>
                             </select>
                             <input name="holderName" value={chequeDetails.holderName} onChange={handleChequeChange} placeholder="Titular de la cuenta" className={`${formFieldClasses} text-sm`} />
                             <input name="holderCuit" value={chequeDetails.holderCuit} onChange={handleChequeChange} placeholder="CUIT del Titular" className={`${formFieldClasses} text-sm`} />
                         </div>
                    </div>
                )}
                
                <div>
                    <label className={labelClasses}>Notas (Opcional)</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={formFieldClasses} />
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