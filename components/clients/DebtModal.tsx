
import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { AccountAdjustment, AdjustmentType } from '../../types';

interface DebtModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (adjustmentData: Omit<AccountAdjustment, 'id' | 'createdAt' | 'clientId' | 'updatedAt'>) => Promise<void>;
}

export const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, onSave }) => {
    const [amountARS, setAmountARS] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<AdjustmentType>('DEBIT');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        const amount = parseFloat(amountARS);
        if (isNaN(amount) || amount <= 0) {
            setError("El monto debe ser un número positivo.");
            return;
        }
        if (!description.trim()) {
            setError("La descripción es obligatoria.");
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await onSave({
                amountARS: amount,
                date: new Date(date).toISOString(),
                type,
                description,
            });
            // Reset form on success
            setAmountARS('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al guardar el ajuste.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleClose = () => {
        setError('');
        setIsSaving(false);
        onClose();
    };

    const formFieldClasses = "block w-full px-3 py-2 text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500";
    const labelClasses = "block mb-1.5 text-sm font-medium text-text-medium";

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Deuda / Ajuste" size="lg">
            <div className="space-y-4">
                <div>
                    <label className={labelClasses}>Tipo de Ajuste</label>
                    <select value={type} onChange={e => setType(e.target.value as AdjustmentType)} className={formFieldClasses}>
                        <option value="DEBIT">Deuda (Débito)</option>
                        <option value="CREDIT">Saldo a favor (Crédito)</option>
                    </select>
                </div>
                 <div>
                    <label className={labelClasses}>Monto (ARS)</label>
                    <input type="number" value={amountARS} onChange={e => setAmountARS(e.target.value)} className={formFieldClasses} placeholder="0.00" />
                </div>
                <div>
                    <label className={labelClasses}>Fecha</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={formFieldClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Descripción</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={formFieldClasses} placeholder="Ej: Saldo inicial, Recargo, etc." />
                </div>
                {error && <p className="text-pastel-red-600 text-sm">{error}</p>}
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={handleClose} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="btn btn-primary">
                        {isSaving ? 'Guardando...' : 'Guardar Ajuste'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};