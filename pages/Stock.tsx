
import React, { useState, useRef, useCallback } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.ts';
import { useCategories } from '../hooks/useCategories.ts';
import { ProductTable } from '../components/products/ProductTable.tsx';
import { ProductForm } from '../components/products/ProductForm.tsx';
import { EmptyState } from '../components/products/EmptyState.tsx';
import { Product, ProductImportResult } from '../types/product.ts';
import { Modal } from '../components/shared/Modal.tsx';
import { CategoryManager } from '../components/products/CategoryManager.tsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';

// For SheetJS global variable from CDN
declare var XLSX: any;

// SVG Icons for the actions bar
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const ImportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const CategoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);
const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const Stock: React.FC = () => {
  const {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    removeProduct,
    seedIfEmpty,
    importProducts,
    exportProducts,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    showOnlyLowStock,
    setShowOnlyLowStock,
    sortedBy,
    setSortedBy,
  } = useProducts();

  const { categories, addCategory, updateCategory, deleteCategory, loading: categoriesLoading, error: categoriesError } = useCategories();

  const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = useCallback(() => {
    exportProducts('excel');
  }, [exportProducts]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = e.target?.result;
            const jsonData = JSON.parse(data as string);
            if (!Array.isArray(jsonData)) {
                throw new Error("El archivo JSON debe contener un array de productos.");
            }
            const result = await importProducts(jsonData);
            setImportResult(result);
        } catch (error) {
            const reason = error instanceof Error ? error.message : "Error desconocido al procesar el archivo.";
            setImportResult({ successCount: 0, errors: [{ item: 'General', reason }] });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.readAsText(file);
  }, [importProducts]);
  
  const handleFormSave = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct && editingProduct !== 'new') {
      await updateProduct(editingProduct.id, productData);
    } else {
      await createProduct(productData);
    }
    setEditingProduct(null);
  }, [editingProduct, updateProduct, createProduct]);

  const handleOpenDeleteModal = useCallback((product: Product) => {
    setProductToDelete(product);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setProductToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (productToDelete) {
      await removeProduct(productToDelete.id);
      handleCloseDeleteModal();
    }
  }, [productToDelete, removeProduct, handleCloseDeleteModal]);


  const PageHeader = () => (
    <header className="mb-8">
      <Router.Link to="/" className="inline-block mb-2">
        <button className="flex items-center text-base font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50 shadow-sm transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
        </button>
      </Router.Link>
      <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Control de Stock</h1>
    </header>
  );

  if (loading || categoriesLoading) {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <PageHeader />
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        </div>
    );
  }

  if (error || categoriesError) {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <PageHeader />
            <p className="text-red-600">Error: {error || categoriesError}</p>
        </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader />

        {editingProduct ? (
          <ProductForm
            productToEdit={editingProduct === 'new' ? undefined : editingProduct}
            onSave={handleFormSave}
            onCancel={() => setEditingProduct(null)}
            categories={categories}
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              {/* Primary Actions */}
              <div className="flex flex-wrap items-center gap-3">
                 <button className="flex items-center justify-center bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" onClick={() => setEditingProduct('new')}>
                    <PlusIcon />
                    Nuevo Producto
                </button>
                <button className="flex items-center justify-center bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" onClick={handleExportExcel}>
                    <ExportIcon />
                    Exportar Excel
                </button>
                <button className="flex items-center justify-center bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" onClick={handleImportClick}>
                    <ImportIcon />
                    Importar JSON
                </button>
                <button
                    className="flex items-center justify-center bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    onClick={() => setIsCategoryManagerOpen(true)}
                >
                    <CategoryIcon />
                    Gestionar Categorías
                </button>
                <Router.Link to="/stock/history" className="flex items-center justify-center bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                    <HistoryIcon />
                    Ver Historial
                </Router.Link>
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
              </div>

              {/* Filters */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-base text-slate-900 border border-slate-300 rounded-lg bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center gap-4">
                <select
                    value={categoryFilter || ''}
                    onChange={(e) => setCategoryFilter(e.target.value || null)}
                    className="form-select w-full sm:w-auto text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2.5"
                >
                    <option value="">Todas las Categorías</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select
                    value={sortedBy}
                    onChange={(e) => setSortedBy(e.target.value as any)}
                    className="form-select w-full sm:w-auto text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2.5"
                >
                    <option value="name">Ordenar por Nombre</option>
                    <option value="sku">Ordenar por SKU</option>
                    <option value="stock">Ordenar por Stock</option>
                    <option value="priceARS">Ordenar por Precio</option>
                </select>
                <label className="flex items-center text-base font-medium text-slate-700">
                    <input
                        type="checkbox"
                        checked={showOnlyLowStock}
                        onChange={(e) => setShowOnlyLowStock(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">Ver solo bajo stock</span>
                </label>
            </div>
            
            {products.length > 0 ? (
              <ProductTable
                products={products}
                onEdit={setEditingProduct}
                onDelete={handleOpenDeleteModal}
              />
            ) : (
              <EmptyState onSeed={seedIfEmpty} />
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={!!productToDelete}
        onClose={handleCloseDeleteModal}
        title="Confirmar Eliminación"
      >
        {productToDelete && (
          <div>
            <p className="text-slate-600 mb-6 text-base">
              ¿Estás seguro de que quieres eliminar el producto <strong className="font-semibold text-slate-800">{productToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="text-base font-semibold text-slate-700 py-2.5 px-5 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Eliminar Producto
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!importResult}
        onClose={() => setImportResult(null)}
        title="Resultado de la Importación"
      >
        {importResult && (
          <div>
            <p className="text-slate-800 font-semibold text-base">
              {importResult.successCount} productos importados correctamente.
            </p>
            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-red-600 font-semibold text-base">
                  {importResult.errors.length} productos no se pudieron importar:
                </p>
                <ul className="list-disc list-inside mt-2 text-base text-slate-600 max-h-60 overflow-y-auto">
                  {importResult.errors.map((err, index) => (
                    <li key={index} className="mt-1">
                      <strong>Dato:</strong> {JSON.stringify(err.item).substring(0, 50)}... 
                      <br/>
                      <span className="text-red-500"><strong>Error:</strong> {err.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setImportResult(null)}
                className="bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        title="Gestionar Categorías"
      >
        <CategoryManager
            categories={categories}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
            error={categoriesError}
        />
      </Modal>

    </div>
  );
};

export default Stock;
