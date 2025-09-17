
import React from 'react';
import { formatARS } from '@/utils/format';
import { ClientHistoryItem } from '@/hooks/useClientDetails';

interface ClientHistoryTableProps {
    history: ClientHistoryItem[];
}

export const ClientHistoryTable: React.FC<ClientHistoryTableProps> = ({ history }) => {
    
    const renderDescription = (item: ClientHistoryItem) => {
        switch (item.type) {
            case 'INVOICE':
                return `Factura ${item.data.pos}-${item.data.number}`;
            case 'PAYMENT':
                return `Pago recibido (${item.data.paymentMethod})`;
            case 'ADJUSTMENT':
                return item.data.description;
            default:
                return 'Movimiento desconocido';
        }
    };

    const renderDebit = (item: ClientHistoryItem) => {
        if (item.type === 'INVOICE') {
            return formatARS(item.data.totals.totalARS);
        }
        if (item.type === 'ADJUSTMENT' && item.data.type === 'DEBIT') {
            return formatARS(item.data.amountARS);
        }
        return '-';
    };

    const renderCredit = (item: ClientHistoryItem) => {
        if (item.type === 'PAYMENT') {
            return formatARS(item.data.amountARS);
        }
        if (item.type === 'ADJUSTMENT' && item.data.type === 'CREDIT') {
            return formatARS(item.data.amountARS);
        }
        return '-';
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th scope="col" className="px-6 py-3">Fecha</th>
                        <th scope="col" className="px-6 py-3">Descripción</th>
                        <th scope="col" className="px-6 py-3 text-right">Debe</th>
                        <th scope="col" className="px-6 py-3 text-right">Haber</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {history.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center py-10 text-slate-500">
                                No hay movimientos para este cliente.
                            </td>
                        </tr>
                    ) : (
                        history.map((item, index) => (
                            <tr key={`${item.type}-${item.data.id}-${index}`}