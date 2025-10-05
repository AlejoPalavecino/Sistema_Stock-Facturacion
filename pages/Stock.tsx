import React, { useState, useRef, useCallback } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.ts';
import { useCategories } from '../hooks/useCategories.ts';
import { ProductTable } from '../components/products/ProductTable.tsx';
import { ProductForm } from '../components/products/ProductForm.tsx';
import { EmptyState } from '../components/shared/EmptyState.tsx';
import { Product, ProductImportResult } from '../types';
import { Modal } from '../components/shared/Modal.tsx';
import { ConfirmModal } from '../components/shared/ConfirmModal.tsx';
import { CategoryManager } from '../components/products/CategoryManager.tsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
import { Pagination } from '../components/shared/Pagination.tsx';
import { PageHeader } from '../components/shared/PageHeader.tsx';
import { PlusIcon, ExportIcon, ImportIcon, CategoryIcon, HistoryIcon, EmptyBoxIcon } from '../components/shared/Icons.tsx';
import { ActionBar } from '../components/shared/ActionBar.tsx';

// For SheetJS global variable from CDN
declare var XLSX: any;

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
    currentPage,
    totalPages,
    setCurrentPage,
    totalProducts,
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

  if (loading || categoriesLoading) {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <PageHeader title="Control de Stock" backTo="/" backToText="Volver al Dashboard" />
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        </div>
    );
  }

  if (error || categoriesError) {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <PageHeader title="Control de Stock" backTo="/" backToText="Volver al Dashboard" />
            <p className="text-red-600">Error: {error || categoriesError}</p>
        </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader title="Control de Stock" backTo="/" backToText="Volver al Dashboard" />

        {editingProduct ? (
          <ProductForm
            productToEdit={editingProduct === 'new' ? undefined : editingProduct}
            onSave={handleFormSave}
            onCancel={() => setEditingProduct(null)}
            categories={categories}
          />
        ) : (
          <>
            <ActionBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar por nombre o SKU..."
            >
               <button className="flex items-center justify-center bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" onClick={() => setEditingProduct('new')}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nuevo Producto
              </button>
              <button className="flex items-center justify-center bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" onClick={handleExportExcel}>
                  <ExportIcon className="h-5 w-5 mr-2" />
                  Exportar Excel
              </button>
              <button className="flex items-center justify-center bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" onClick={handleImportClick}>
                  <ImportIcon className="h-5 w-5 mr-2" />
                  Importar JSON
              </button>
              <button
                  className="flex items-center justify-center bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  onClick={() => setIsCategoryManagerOpen(true)}
              >
                  <CategoryIcon className="h-5 w-5 mr-2" />
                  Gestionar Categorías
              </button>
              <Router.Link to="/stock/history" className="flex items-center justify-center bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                  <HistoryIcon className="h-5 w-5 mr-2" />
                  Ver Historial
              </Router.Link>
              <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
              />
            </ActionBar>

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
            
            {totalProducts > 0 ? (
              <>
                <ProductTable
                  products={products}
                  onEdit={setEditingProduct}
                  onDelete={handleOpenDeleteModal}
                />
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <EmptyState
                icon={<EmptyBoxIcon />}
                title="No hay productos en tu inventario"
                description="Puedes empezar creando un nuevo producto o cargar datos de prueba para ver cómo funciona."
                action={{ label: 'Cargar datos de prueba', onClick: seedIfEmpty }}
              />
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        confirmText="Eliminar Producto"
        confirmVariant="danger"
      >
        <p>
            ¿Estás seguro de que quieres eliminar el producto <strong className="font-semibold text-slate-800">{productToDelete?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </ConfirmModal>

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