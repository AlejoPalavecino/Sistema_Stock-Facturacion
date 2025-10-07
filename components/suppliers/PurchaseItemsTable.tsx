import React, { memo } from 'react';
import { PurchaseItem } from '../../types';
import { formatARS } from '../../utils/format.ts';
import { DeleteIcon } from '../shared/Icons.tsx';

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

    const formFieldClasses = "block w-full px-3 py-2 text-base text-center text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500";

    return (
        <div className="overflow-x-auto border border-cream-200 rounded-lg">
            <table className="w-full text-sm text-left">
                <thead className="bg-cream-100 text-left text-sm font-semibold text-text-medium uppercase border-b-2 border-cream-300">
                    <tr className="divide-x divide-cream-200">
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3 text-center">Cantidad</th>
                        <th className="px-4 py-3 text-right">Costo Unitario</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-8 text-text-medium">
                                No hay ítems en la factura.
                            </td>
                        </tr>
                    )}
                    {items.map((item, index) => (
                        <tr key={item.productId + index} className="divide-x divide-cream-200 hover:bg-cream-100 odd:bg-white even:bg-cream-50">
                            <td className="px-4 py-2 font-mono text-xs text-text-light">{item.sku}</td>
                            <td className="px-4 py-2 font-medium text-text-dark">{item.name}</td>
                            <td className="px-4 py-2 w-28">
                                <input 
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 1)}
                                    className={formFieldClasses}
                                    min="1"
                                />
                            </td>
                            <td className="px-4 py-2 text-right w-36">
                                <input 
                                    type="number"
                                    value={item.unitPriceARS}
                                    onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                    className={`${formFieldClasses} text-right`}
                                    min="0"
                                    step="0.01"
                                />
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-text-dark">{formatARS(item.lineTotalARS)}</td>
                            <td className="px-4 py-2 text-center">
                                <button onClick={() => onRemove(index)} className="p-1 text-text-light hover:text-pastel-red-600 rounded-md">
                                    <DeleteIcon />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});