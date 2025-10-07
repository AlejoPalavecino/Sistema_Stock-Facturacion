
import React, { useMemo } from 'react';
import { formatARS } from '../../utils/format';

export type HistoryType = 'FACTURA' | 'PAGO' | 'AJUSTE';

export interface ClientHistoryItem {
  type: HistoryType;
  date: string; // ISO
  amountARS?: number; // Should be signed: + for debit, - for credit
  note?: string;
  data?: {
    id?: string | number;
    description?: string;
  };
}

interface ClientHistoryTableProps {
  history: ClientHistoryItem[];
  balance: number; // The final, current balance
  emptyMessage?: string;
}

export default function ClientHistoryTable({
  history,
  balance,
  emptyMessage = 'Sin movimientos registrados',
}: ClientHistoryTableProps) {
    
  const historyWithBalance = useMemo(() => {
    let currentBalance = balance;
    // History is newest-first. We iterate backwards from the current balance.
    return history.map(item => {
        const itemBalance = currentBalance;
        // To find the balance *before* this item, we subtract its effect.
        currentBalance -= (item.amountARS ?? 0);
        return { ...item, balance: itemBalance };
    });
  }, [history, balance]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base text-left text-text-medium">
        <thead className="text-sm font-semibold text-text-medium uppercase bg-cream-100 border-b-2 border-cream-300">
          <tr className="divide-x divide-cream-200">
            <th scope="col" className="px-6 py-4">Fecha</th>
            <th scope="col" className="px-6 py-4">Descripción</th>
            <th scope="col" className="px-6 py-4 text-right">Debe (Débito)</th>
            <th scope="col" className="px-6 py-4 text-right">Haber (Crédito)</th>
            <th scope="col" className="px-6 py-4 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {historyWithBalance.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-10 text-text-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            historyWithBalance.map((item, index) => (
              <tr key={`${item.type}-${item.data?.id ?? index}`} className="divide-x divide-cream-200 hover:bg-cream-100 odd:bg-white even:bg-cream-50">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(item.date).toLocaleDateString('es-AR')}</td>
                <td className="px-6 py-4 font-medium text-text-dark">{item.data?.description ?? item.note ?? '—'}</td>
                <td className="px-6 py-4 text-right font-medium text-pastel-red-600">
                  {(item.amountARS ?? 0) > 0 ? formatARS(item.amountARS!) : '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium text-pastel-green-600">
                  {(item.amountARS ?? 0) < 0 ? formatARS(Math.abs(item.amountARS!)) : '-'}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-text-dark">
                  {formatARS(item.balance)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
