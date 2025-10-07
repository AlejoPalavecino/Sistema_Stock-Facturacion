import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, ProductId, Category, ProductWithSalePrice } from '../types';
import * as productsRepo from '../services/db/productsRepo.ts';
import { onStorageChange } from '../utils/storage.ts';
import { usePagination } from './usePagination.ts';

const DEMO_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sku'>[] = [
    { name: 'Lápiz HB #2', brand: 'Faber-Castell', category: 'Librería', netPrice: 124.38, vatRate: 21, stock: 120, minStock: 20, active: true },
    { name: 'Cuaderno A4 Rayado', brand: 'Gloria', category: 'Papelería', netPrice: 702.48, vatRate: 21, stock: 80, minStock: 15, active: true },
    { name: 'Resma de Papel A4 75g', brand: 'Boreal', category: 'Papelería', netPrice: 3719.01, vatRate: 21, stock: 15, minStock: 10, active: true },
    { name: 'Mochila Escolar', brand: 'Jansport', category: 'Escolar', netPrice: 10330.58, vatRate: 21, stock: 8, minStock: 5, active: true },
    { name: 'Pendrive 64GB', brand: 'Kingston', category: 'Tecnología', netPrice: 6446.28, vatRate: 21, stock: 25, minStock: 5, active: true },
    { name: 'Tijera Escolar', brand: 'Maped', category: 'Librería', netPrice: 371.90, vatRate: 21, stock: 50, minStock: 10, active: true },
    { name: 'Calculadora Científica', brand: 'Casio', category: 'Tecnología', netPrice: 8181.82, vatRate: 21, stock: 12, minStock: 3, active: false },
    { name: 'Cinta Adhesiva', brand: '3M', category: 'General', netPrice: 247.93, vatRate: 21, stock: 100, minStock: 25, active: true },
];

type SortableKeys = 'name' | 'sku' | 'stock' | 'salePrice';

// For SheetJS global variable from CDN
declare var XLSX: any;

interface UseProductsOptions {
  disablePagination?: boolean;
}

export function useProducts({ disablePagination = false }: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [sortedBy, setSortedBy] = useState<SortableKeys>('name');
  
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productsRepo.list();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los productos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const cleanup = onStorageChange('products_v1', fetchProducts);
    return cleanup;
  }, [fetchProducts]);

  const createProduct = useCallback(async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    await productsRepo.create(data);
    await fetchProducts();
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: ProductId, data: Partial<Product>) => {
    await productsRepo.update(id, data);
    await fetchProducts();
  }, [fetchProducts]);
  
  const removeProduct = useCallback(async (id: ProductId) => {
    await productsRepo.remove(id);
    await fetchProducts();
  }, [fetchProducts]);
  
  const seedIfEmpty = useCallback(async () => {
    const currentProducts = await productsRepo.list();
    if (currentProducts.length === 0) {
        setLoading(true);
        try {
            for (const p of DEMO_PRODUCTS) {
                await productsRepo.create(p);
            }
            await fetchProducts();
        } catch (err) {
            setError('No se pudieron cargar los datos de prueba.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
  }, [fetchProducts]);

  const filteredAndSortedProducts: ProductWithSalePrice[] = useMemo(() => {
    let result: ProductWithSalePrice[] = products.map(p => ({
        ...p,
        salePrice: p.netPrice * (1 + p.vatRate / 100)
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }

    if (showOnlyLowStock) {
      result = result.filter(p => p.stock < p.minStock);
    }

    result.sort((a, b) => {
      const valA = a[sortedBy];
      const valB = b[sortedBy];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB);
      }
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });

    return result;
  }, [products, searchQuery, categoryFilter, showOnlyLowStock, sortedBy]);
  
  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination<ProductWithSalePrice>(filteredAndSortedProducts);

  const exportProducts = useCallback((format: 'excel') => {
    if (format !== 'excel' || typeof XLSX === 'undefined') {
        console.error("XLSX library not loaded or format not supported.");
        return;
    }
    // Note: We use the raw 'products' array to export all data, not just the filtered view.
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    XLSX.writeFile(workbook, "products_export.xlsx");
  }, [products]);

  return {
    products: disablePagination ? filteredAndSortedProducts : paginatedData,
    loading,
    error,
    createProduct,
    updateProduct,
    removeProduct,
    seedIfEmpty,
    exportProducts,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    showOnlyLowStock,
    setShowOnlyLowStock,
    sortedBy,
    setSortedBy,
    currentPage,
    totalPages,
    setCurrentPage,
    totalProducts: filteredAndSortedProducts.length
  };
}