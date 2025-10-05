import React, { memo } from 'react';
// FIX: Import StatusPillVariant from the central types file.
import { Purchase, PurchaseStatus, StatusPillVariant } from '../../types';
import { formatARS } from '../../utils/format';
// FIX: Only import the StatusPill component as it does not export StatusPillVariant.
import { StatusPill } from '../shared/StatusPill.tsx';

interface PurchaseListProps {
  purchases: Purchase[];
  onPay: (purchase: Purchase) => void;
}

const statusMap: Record<PurchaseStatus, { label: string; variant: StatusPillVariant }> = {
    PENDIENTE: { label: 'Pendiente', variant: 'warning' },
    PAGADA: { label: 'Pagada', variant: 'success' },
    ANULADA: { label: 'Anulada', variant: 'danger' },
};

export const PurchaseList: React.FC<PurchaseListProps> = memo(({ purchases, onPay }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="text-left text-sm font-semibold text-slate-600 uppercase bg-slate-100">
                    <tr>
                        <th className="px-4 py-3">Nº Factura</th>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                     {purchases.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-10 text-slate-500 text-base">
                                No se encontraron facturas de compra.
                            </td>
                        </tr>
                    ) : (
                        purchases.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 text-base">
                                <td className="px-4 py-3 font-mono text-slate-700">{p.invoiceNumber}</td>
                                <td className="px-4 py-3 text-slate-600">{new Date(p.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    <StatusPill variant={statusMap[p.status].variant}>
                                        {statusMap[p.status].label}
                                    </StatusPill>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatARS(p.totalAmountARS)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-3">
                                        {p.status === 'PENDIENTE' && (
                                            <button onClick={() => onPay(p)} className="font-medium text-green-600 hover:underline text-base">
                                                Registrar Pago
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
});
