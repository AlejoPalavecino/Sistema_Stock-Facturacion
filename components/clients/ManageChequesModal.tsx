import React from 'react';
import { Modal } from '../shared/Modal';
import { Payment, Invoice } from '../../types';
import { formatARS } from '../../utils/format';

interface ManageChequesModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  pendingCheques: Payment[];
  onConfirmCheque: (paymentId: string) => void;
}

export const ManageChequesModal: React.FC<ManageChequesModalProps> = ({ isOpen, onClose, invoice, pendingCheques, onConfirmCheque }) => {
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gestionar Cheques - Factura ${invoice.pos}-${invoice.number}`}>
            <div>
                {pendingCheques.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No hay cheques pendientes para esta factura.</p>
                ) : (
                    <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                        {pendingCheques.map(payment => (
                             <li key={payment.id} className="p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-800">Cheque N° {payment.chequeDetails?.number}</p>
                                    <p className="text-sm text-slate-600">
                                        {payment.chequeDetails?.bank} - {formatARS(payment.amountARS)}
                                    </p>
                                     <p className="text-xs text-slate-500">
                                        Vence: {new Date(payment.chequeDetails!.paymentDate).toLocaleDateString('es-AR')}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => onConfirmCheque(payment.id)}
                                    className="bg-green-100 text-green-700 font-semibold text-sm py-1.5 px-3 rounded-md hover:bg-green-200"
                                >
                                    Confirmar Cobro
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                 <div className="flex justify-end mt-6">
                     <button
                        onClick={onClose}
                        className="bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700"
                     >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};