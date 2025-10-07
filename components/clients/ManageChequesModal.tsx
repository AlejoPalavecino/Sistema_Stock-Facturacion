
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Gestionar Cheques - Factura ${invoice.pos}-${invoice.number}`} size="lg">
            <div>
                {pendingCheques.length === 0 ? (
                    <p className="text-text-medium text-center py-4">No hay cheques pendientes para esta factura.</p>
                ) : (
                    <ul className="divide-y divide-cream-200 border border-cream-200 rounded-lg">
                        {pendingCheques.map(payment => (
                             <li key={payment.id} className="p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-text-dark">Cheque N° {payment.chequeDetails?.number}</p>
                                    <p className="text-sm text-text-medium">
                                        {payment.chequeDetails?.bank} - {formatARS(payment.amountARS)}
                                    </p>
                                     <p className="text-xs text-text-light">
                                        Vence: {new Date(payment.chequeDetails!.paymentDate).toLocaleDateString('es-AR')}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => onConfirmCheque(payment.id)}
                                    className="bg-pastel-green-100 text-pastel-green-700 font-semibold text-sm py-1.5 px-3 rounded-md hover:bg-green-200"
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
                        className="btn btn-primary"
                     >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};