import React, { useMemo, useState } from 'react';
import { useProducts } from '../../hooks/useProducts.ts';
import { useCategories } from '../../hooks/useCategories.ts';
import { Product } from '../../types/product.ts';
import { formatARS } from '../../utils/format.ts';
import { SearchIcon } from '../shared/Icons.tsx';
import { QuickAddProductForm } from '../products/QuickAddProductForm.tsx';

interface ProductPickerProps {
  onSelectProduct: (product: Product) => void;
  allowZeroStock?: boolean;
}

export const ProductPicker: React.FC<ProductPickerProps> = ({ onSelectProduct, allowZeroStock = false }) => {
  const { products, loading, error, searchQuery, setSearchQuery } = useProducts();
  const { categories } = useCategories();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  const availableProducts = useMemo(() => {
    return products.filter(p => p.active && (allowZeroStock || p.stock > 0));
  }, [products, allowZeroStock]);

  return (
    <div>
       <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
          </div>
          <input
              type="text"
              placeholder="Buscar producto por nombre o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 text-base text-slate-900 border border-slate-300 rounded-lg bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
      </div>
      {loading && <p>Cargando productos...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
        <ul className="divide-y divide-slate-200">
          {availableProducts.length === 0 && !loading && (
            <li className="p-4 text-center text-slate-500">No se encontraron productos disponibles.</li>
          )}
          {availableProducts.map(product => (
            <li 
              key={product.id} 
              onClick={() => onSelectProduct(product)}
              className="p-3 flex justify-between items-center cursor-pointer hover:bg-blue-50"
            >
              <div>
                <p className="font-medium text-slate-800">{product.name}</p>
                <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatARS(product.priceARS)}</p>
                <p className="text-xs text-slate-500">Stock: {product.stock}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center mt-4">
        <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="text-sm font-semibold text-blue-600 hover:underline">
          {showQuickAdd ? 'Cancelar Alta Rápida' : 'Alta Rápida de Producto'}
        </button>
      </div>

      {showQuickAdd && <QuickAddProductForm onProductCreated={onSelectProduct} categories={categories} />}
    </div>
  );
};