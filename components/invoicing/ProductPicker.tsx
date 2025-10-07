import React, { useMemo, useState } from 'react';
// FIX: The `ProductWithSalePrice` type is imported from the central types file, not from the hook where it is not exported. The unused `Product` import was also removed.
import { useProducts } from '../../hooks/useProducts.ts';
import { ProductWithSalePrice } from '../../types';
import { useCategories } from '../../hooks/useCategories.ts';
import { formatARS } from '../../utils/format.ts';
import { SearchIcon } from '../shared/Icons.tsx';
import { QuickAddProductForm } from '../products/QuickAddProductForm.tsx';

interface ProductPickerProps {
  onSelectProduct: (product: ProductWithSalePrice) => void;
  allowZeroStock?: boolean;
}

export const ProductPicker: React.FC<ProductPickerProps> = ({ onSelectProduct, allowZeroStock = false }) => {
  const { products, loading, error, searchQuery, setSearchQuery } = useProducts({ disablePagination: true });
  const { categories } = useCategories();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  const activeProducts = useMemo(() => {
    return products.filter(p => p.active);
  }, [products]);

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
              className="search-input block w-full"
          />
      </div>
      {loading && <p>Cargando productos...</p>}
      {error && <p className="text-pastel-red-500">{error}</p>}
      
      <div className="max-h-80 overflow-y-auto border border-cream-200 rounded-lg">
        <ul className="divide-y divide-cream-200">
          {activeProducts.length === 0 && !loading && (
            <li className="p-4 text-center text-text-medium">No se encontraron productos disponibles.</li>
          )}
          {activeProducts.map(product => {
            const isOutOfStock = !allowZeroStock && product.stock <= 0;
            return (
                <li 
                    key={product.id} 
                    onClick={isOutOfStock ? undefined : () => onSelectProduct(product)}
                    className={`p-3 flex justify-between items-center transition-colors ${isOutOfStock ? 'opacity-60 cursor-not-allowed bg-cream-50' : 'cursor-pointer hover:bg-cream-100'}`}
                    aria-disabled={isOutOfStock}
                    title={isOutOfStock ? 'Producto sin stock' : ''}
                >
                    <div>
                        <p className="font-medium text-text-dark">{product.name}</p>
                        <p className="text-xs text-text-light font-mono">{product.sku}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-text-dark">{formatARS(product.salePrice)}</p>
                        <p className={`text-xs font-semibold ${isOutOfStock ? 'text-pastel-red-600' : 'text-text-medium'}`}>
                            Stock: {product.stock}
                        </p>
                    </div>
                </li>
            );
          })}
        </ul>
      </div>

      <div className="text-center mt-4">
        <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="text-sm font-semibold text-pastel-blue-600 hover:underline">
          {showQuickAdd ? 'Cancelar Alta Rápida' : 'Alta Rápida de Producto'}
        </button>
      </div>

      {showQuickAdd && <QuickAddProductForm onProductCreated={onSelectProduct} categories={categories} />}
    </div>
  );
};