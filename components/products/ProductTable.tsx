import React, { memo } from 'react';
import { Product } from '../../types';
import { formatARS } from '../../utils/format.ts';
import { EditIcon, DeleteIcon, LowStockIcon, OkStockIcon } from '../shared/Icons.tsx';
import { StatusPill } from '../shared/StatusPill.tsx';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = memo(({ products, onEdit, onDelete }) => {

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
      <table className="w-full text-left">
        <thead className="text-sm text-slate-600 uppercase bg-slate-100 font-semibold tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-4">SKU</th>
            <th scope="col" className="px-6 py-4">Nombre</th>
            <th scope="col" className="px-6 py-4">Categoría</th>
            <th scope="col" className="px-6 py-4 text-right">Precio (ARS)</th>
            <th scope="col" className="px-6 py-4 text-center">Stock</th>
            <th scope="col" className="px-6 py-4 text-center">Mín.</th>
            <th scope="col" className="px-6 py-4">Estado</th>
            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLowStock = product.stock < product.minStock;
            return (
                <tr key={product.id} className="bg-white border-b hover:bg-slate-50 text-base">
                <td className="px-6 py-4 font-mono text-base text-slate-700">{product.sku}</td>
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {product.name}
                </th>
                <td className="px-6 py-4 text-slate-700">{product.category}</td>
                <td className="px-6 py-4 text-right text-slate-700">{formatARS(product.priceARS)}</td>
                <td className="px-6 py-4 text-center font-medium text-slate-800" aria-live="polite">{product.stock}</td>
                <td className="px-6 py-4 text-center text-slate-700">{product.minStock}</td>
                <td className="px-6 py-4">
                    <StatusPill variant={isLowStock ? 'warning' : 'success'}>
                        {isLowStock ? <LowStockIcon /> : <OkStockIcon />}
                        {isLowStock ? 'Bajo stock' : 'OK'}
                    </StatusPill>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                            aria-label={`Editar ${product.name}`} 
                            title={`Editar ${product.name}`}
                            onClick={() => onEdit(product)}
                        >
                            <EditIcon />
                        </button>
                        <button 
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors" 
                            aria-label={`Eliminar ${product.name}`} 
                            title={`Eliminar ${product.name}`}
                            onClick={() => onDelete(product)}
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                </td>
                </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
});