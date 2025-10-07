import React, { memo } from 'react';
import { Invoice, InvoiceStatus, StatusPillVariant, Payment } from '../../types';
import { formatARS } from '../../utils/format';
import { StatusPill } from '../shared/StatusPill.tsx';

interface ClientInvoiceListProps {
  invoices: Invoice[];
  getPendingChequesForInvoice: (invoiceId: string) => Payment[];
  onPay: (invoice: Invoice) => void;
  onManageCheques: (invoice: Invoice) => void;
}

const statusMap: Record<InvoiceStatus, { label: string; variant: StatusPillVariant }> = {
    BORRADOR: { label: 'Borrador', variant: 'warning' },
    PENDIENTE_PAGO: { label: 'Pendiente', variant: 'warning' },
    PAGADA: { label: 'Pagada', variant: 'success' },
    ANULADA: { label: 'Anulada', variant: 'danger' },
};

export const ClientInvoiceList: React.FC<ClientInvoiceListProps> = memo(({ invoices, getPendingChequesForInvoice, onPay, onManageCheques }) => {
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="text-left text-sm font-semibold text-text-medium uppercase bg-cream-100 border-b-2 border-cream-300">
                    <tr className="divide-x divide-cream-200">
                        <th className="px-4 py-3">Número</th>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                     {invoices.filter(inv => inv.status !== 'BORRADOR').length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-10 text-text-medium text-base">
                                No se encontraron facturas emitidas para este cliente.
                            </td>
                        </tr>
                    ) : (
                        invoices.filter(inv => inv.status !== 'BORRADOR').map(inv => {
                            const pendingCheques = getPendingChequesForInvoice(inv.id);
                            
                            return (
                                <tr key={inv.id} className="divide-x divide-cream-200 hover:bg-cream-100 text-base odd:bg-white even:bg-cream-50">
                                    <td className="px-4 py-3 font-mono text-text-medium">{inv.pos}-{inv.number}</td>
                                    <td className="px-4 py-3 text-text-medium">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <StatusPill variant={statusMap[inv.status].variant}>
                                            {statusMap[inv.status].label}
                                        </StatusPill>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-text-dark">{formatARS(inv.totals.totalARS)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-3">
                                            {inv.status === 'PENDIENTE_PAGO' && (
                                                <>
                                                    {pendingCheques.length > 0 && (
                                                        <button 
                                                            onClick={() => onManageCheques(inv)} 
                                                            className="font-medium text-pastel-blue-600 hover:underline text-base"
                                                        >
                                                            Gestionar Cheques ({pendingCheques.length})
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => onPay(inv)} 
                                                        className="font-medium text-pastel-green-600 hover:underline text-base"
                                                    >
                                                        Registrar Pago
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
});