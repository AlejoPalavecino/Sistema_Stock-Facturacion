import React, { useState, useMemo, memo } from 'react';
import { Invoice, InvoiceStatus, StatusPillVariant } from '../../types';
import { formatARS } from '../../utils/format';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../shared/Pagination';
import { StatusPill } from '../shared/StatusPill';

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onCancel: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

const statusMap: Record<InvoiceStatus, { label: string; variant: StatusPillVariant }> = {
    BORRADOR: { label: 'Borrador', variant: 'warning' },
    PENDIENTE_PAGO: { label: 'Pendiente', variant: 'info' },
    PAGADA: { label: 'Pagada', variant: 'success' },
    ANULADA: { label: 'Anulada', variant: 'danger' },
};

export const InvoiceList: React.FC<InvoiceListProps> = memo(({ invoices, onEdit, onView, onCancel, onMarkAsPaid }) => {
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInvoices = useMemo(() => {
        return invoices
            .filter(inv => !statusFilter || inv.status === statusFilter)
            .filter(inv => {
                const q = searchQuery.toLowerCase();
                return !q || 
                       inv.clientName.toLowerCase().includes(q) || 
                       `${inv.pos}-${inv.number}`.includes(q) ||
                       (inv.expediente && inv.expediente.toLowerCase().includes(q));
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [invoices, statusFilter, searchQuery]);

    const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination(filteredInvoices);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-cream-200">
            <h3 className="text-xl font-bold text-text-dark mb-4">Historial de Facturas</h3>
            
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input 
                    type="text" 
                    placeholder="Buscar por cliente, número o expediente..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input flex-grow"
                />
                <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="block w-full px-3 py-2.5 text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500 md:w-auto"
                >
                    <option value="">Todos los estados</option>
                    <option value="BORRADOR">Borrador</option>
                    <option value="PENDIENTE_PAGO">Pendiente de Pago</option>
                    <option value="PAGADA">Pagada</option>
                    <option value="ANULADA">Anulada</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="text-left text-sm font-semibold text-text-medium uppercase bg-cream-100 border-b-2 border-cream-300">
                        <tr className="divide-x divide-cream-200">
                            <th className="px-4 py-3">Número</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200">
                         {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-text-medium text-base">
                                    No se encontraron facturas.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map(inv => (
                                <tr key={inv.id} className="divide-x divide-cream-200 hover:bg-cream-100 text-base odd:bg-white even:bg-cream-50">
                                    <td className="px-4 py-3 font-mono text-text-medium">{inv.pos}-{inv.number}</td>
                                    <td className="px-4 py-3 font-medium text-text-dark">{inv.clientName}</td>
                                    <td className="px-4 py-3 text-text-medium">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <StatusPill variant={statusMap[inv.status].variant}>
                                            {statusMap[inv.status].label}
                                        </StatusPill>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-text-dark">{formatARS(inv.totals.totalARS)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-3">
                                            {inv.status === 'BORRADOR' && (
                                                <button onClick={() => onEdit(inv.id)} className="font-medium text-pastel-blue-600 hover:underline text-base">Editar</button>
                                            )}
                                            {inv.status === 'PENDIENTE_PAGO' && (
                                                <>
                                                    <button onClick={() => onMarkAsPaid(inv.id)} className="font-medium text-pastel-green-600 hover:underline text-base">Marcar Pagada</button>
                                                    <button onClick={() => onView(inv.id)} className="font-medium text-pastel-blue-600 hover:underline text-base">Ver</button>
                                                    <button onClick={() => onCancel(inv.id)} className="font-medium text-pastel-red-600 hover:underline text-base">Anular</button>
                                                </>
                                            )}
                                            {inv.status === 'PAGADA' && (
                                                <>
                                                    <button onClick={() => onView(inv.id)} className="font-medium text-pastel-blue-600 hover:underline text-base">Ver</button>
                                                    <button onClick={() => onCancel(inv.id)} className="font-medium text-pastel-red-600 hover:underline text-base">Anular</button>
                                                </>
                                            )}
                                            {inv.status === 'ANULADA' && (
                                                <button onClick={() => onView(inv.id)} className="font-medium text-text-medium hover:underline text-base">Ver</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
});