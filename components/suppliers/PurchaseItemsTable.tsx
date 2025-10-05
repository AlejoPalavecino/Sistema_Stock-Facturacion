import React, { memo } from 'react';
import { PurchaseItem } from '../../types';
import { formatARS } from '../../utils/format.ts';

interface PurchaseItemsTableProps {
  items: PurchaseItem[];
  onUpdate: (index: number, item: PurchaseItem) => void;
  onRemove: (index: number) => void;
}

export const PurchaseItemsTable: React.FC<PurchaseItemsTableProps> = memo(({ items, onUpdate, onRemove }) => {
    
    const handleQtyChange = (index: number, newQty: number) => {
        const item = items[index];
        const qty = Math.max(1, newQty);
        const updatedItem = { ...item, qty, lineTotalARS: item.unitPriceARS * qty };
        onUpdate(index, updatedItem);
    };
    
    const handlePriceChange = (index: number, newPrice: number) => {
        const item = items[index];
        const price = Math.max(0, newPrice);
        const updatedItem = { ...item, unitPriceARS: price, lineTotalARS: price * item.qty };
        onUpdate(index, updatedItem);
    };

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-left text-sm font-semibold text-slate-600 uppercase">
                    <tr>
                        <th className="px-4 py-2">SKU</th>
                        <th className="px-4 py-2">Producto</th>
                        <th className="px-4 py-2 text-center">Cantidad</th>
                        <th className="px-4 py-2 text-right">Costo Unitario</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500">
                                No hay ítems en la factura.
                            </td>
                        </tr>
                    )}
                    {items.map((item, index) => (
                        <tr key={item.productId + index} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono text-xs text-slate-500">{item.sku}</td>
                            <td className="px-4 py-2 font-medium text-slate-800">{item.name}</td>
                            <td className="px-4 py-2 w-28">
                                <input 
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 1)}
                                    className="block w-full px-3 py-2 text-base text-center text-slate-900 bg-white border border-slate-300 rounded-lg"
                                    min="1"
                                />
                            </td>
                            <td className="px-4 py-2 text-right w-36">
                                <input 
                                    type="number"
                                    value={item.unitPriceARS}
                                    onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                    className="block w-full px-3 py-2 text-base text-right text-slate-900 bg-white border border-slate-300 rounded-lg"
                                    min="0"
                                    step="0.01"
                                />
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatARS(item.lineTotalARS)}</td>
                            <td className="px-4 py-2 text-center">
                                <button onClick={() => onRemove(index)} className="p-1 text-slate-400 hover:text-red-600 rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});