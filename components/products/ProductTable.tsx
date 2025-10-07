import React, { memo } from 'react';
import { Product, ProductWithSalePrice } from '../../types';
import { formatARS } from '../../utils/format.ts';
import { EditIcon, DeleteIcon } from '../shared/Icons.tsx';
import { StatusPill } from '../shared/StatusPill.tsx';

interface ProductTableProps {
  products: ProductWithSalePrice[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = memo(({ products, onEdit, onDelete }) => {

  return (
    <div className="bg-white rounded-lg shadow-sm border border-cream-200">
      <table className="w-full text-left table-auto">
        <thead className="text-sm text-text-medium uppercase bg-cream-100 font-semibold tracking-wider border-b-2 border-cream-300">
          <tr className="divide-x divide-cream-200">
            <th scope="col" className="px-4 py-3">SKU</th>
            <th scope="col" className="px-4 py-3">Nombre</th>
            <th scope="col" className="px-4 py-3">Marca</th>
            <th scope="col" className="px-4 py-3">Categoría</th>
            <th scope="col" className="px-4 py-3 text-right">P. Neto (S/IVA)</th>
            <th scope="col" className="px-4 py-3 text-center">IVA (%)</th>
            <th scope="col" className="px-4 py-3 text-right">P. Venta</th>
            <th scope="col" className="px-4 py-3 text-center">Stock</th>
            <th scope="col" className="px-4 py-3">Estado</th>
            <th scope="col" className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {products.map((product) => {
            const isLowStock = product.stock < product.minStock;
            return (
                <tr key={product.id} className="divide-x divide-cream-200 hover:bg-cream-100 text-base odd:bg-white even:bg-cream-50">
                    <td className="px-4 py-3 font-mono text-sm text-text-medium">{product.sku}</td>
                    <th scope="row" className="px-4 py-3 font-medium text-text-dark">
                        {product.name}
                    </th>
                    <td className="px-4 py-3 text-text-medium">{product.brand}</td>
                    <td className="px-4 py-3 text-text-medium">{product.category}</td>
                    <td className="px-4 py-3 text-right text-text-medium">{formatARS(product.netPrice)}</td>
                    <td className="px-4 py-3 text-center text-text-medium">{product.vatRate}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-dark">{formatARS(product.salePrice)}</td>
                    <td className="px-4 py-3 text-center font-medium text-text-dark" aria-live="polite">{product.stock}</td>
                    <td className="px-4 py-3">
                        <StatusPill variant={isLowStock ? 'warning' : 'success'}>
                            {isLowStock ? 'Bajo stock' : 'OK'}
                        </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                            <button 
                                className="p-2 text-text-light hover:text-pastel-blue-600 hover:bg-pastel-blue-100 rounded-md transition-colors"
                                aria-label={`Editar ${product.name}`} 
                                title={`Editar ${product.name}`}
                                onClick={() => onEdit(product)}
                            >
                                <EditIcon />
                            </button>
                            <button 
                                className="p-2 text-text-light hover:text-pastel-red-600 hover:bg-pastel-red-100 rounded-md transition-colors" 
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