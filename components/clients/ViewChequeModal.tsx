import React from 'react';
import { Modal } from '../shared/Modal';
import { Payment } from '../../types';

interface ViewChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
}

export const ViewChequeModal: React.FC<ViewChequeModalProps> = ({ isOpen, onClose, payment }) => {
    const cheque = payment.chequeDetails;

    if (!cheque) return null;

    const detailItem = (label: string, value: string | undefined) => (
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-base font-semibold text-slate-800">{value || '-'}</p>
        </div>
    );
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalles del Cheque N° ${cheque.number}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {detailItem('Número de Cheque', cheque.number)}
                {detailItem('Banco', cheque.bank)}
                {detailItem('Fecha de Cobro', new Date(cheque.paymentDate).toLocaleDateString('es-AR'))}
                {detailItem('Tipo', cheque.type)}
                {detailItem('Titular de la Cuenta', cheque.holderName)}
                {detailItem('CUIT del Titular', cheque.holderCuit)}
                {detailItem('Estado', cheque.status)}
            </div>
            <div className="flex justify-end mt-6">
                 <button
                    onClick={onClose}
                    className="bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                 >
                    Cerrar
                </button>
            </div>
        </Modal>
    );
};