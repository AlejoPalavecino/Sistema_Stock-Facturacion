
import React, { useState, useRef, useCallback } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.ts';
import { useCategories } from '../hooks/useCategories.ts';
import { ProductTable } from '../components/products/ProductTable.tsx';
import { ProductForm } from '../components/products/ProductForm.tsx';
import { EmptyState } from '../components/shared/EmptyState.tsx';
import { Product } from '../types';
import { Modal } from '../components/shared/Modal.tsx';
import { ConfirmModal } from '../components/shared/ConfirmModal.tsx';
import { CategoryManager } from '../components/products/CategoryManager.tsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
import { Pagination } from '../components/shared/Pagination.tsx';
import { PageHeader } from '../components/shared/PageHeader.tsx';
import { PlusIcon, ExportIcon, CategoryIcon, HistoryIcon, EmptyBoxIcon } from '../components/shared/Icons.tsx';
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
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const handleExportExcel = useCallback(() => {
    exportProducts('excel');
  }, [exportProducts]);

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
            <PageHeader title="Control de Stock" backTo="/" />
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        </div>
    );
  }

  if (error || categoriesError) {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <PageHeader title="Control de Stock" backTo="/" />
            <p className="text-pastel-red-600">Error: {error || categoriesError}</p>
        </div>
    );
  }

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader title="Control de Stock" backTo="/" />

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
               <button className="btn btn-primary" onClick={() => setEditingProduct('new')}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nuevo Producto
              </button>
              <button className="btn btn-secondary" onClick={handleExportExcel}>
                  <ExportIcon className="h-5 w-5 mr-2" />
                  Exportar Excel
              </button>
              <button
                  className="btn btn-secondary"
                  onClick={() => setIsCategoryManagerOpen(true)}
              >
                  <CategoryIcon className="h-5 w-5 mr-2" />
                  Gestionar Categorías
              </button>
              <Router.Link to="/stock/history" className="btn btn-secondary">
                  <HistoryIcon className="h-5 w-5 mr-2" />
                  Ver Historial
              </Router.Link>
            </ActionBar>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-cream-200 mb-6 flex flex-wrap items-center gap-4">
                <select
                    value={categoryFilter || ''}
                    onChange={(e) => setCategoryFilter(e.target.value || null)}
                    className="form-select w-full sm:w-auto text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500 px-3 py-2.5"
                >
                    <option value="">Todas las Categorías</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select
                    value={sortedBy}
                    onChange={(e) => setSortedBy(e.target.value as any)}
                    className="form-select w-full sm:w-auto text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500 px-3 py-2.5"
                >
                    <option value="name">Ordenar por Nombre</option>
                    <option value="sku">Ordenar por SKU</option>
                    <option value="stock">Ordenar por Stock</option>
                    <option value="salePrice">Ordenar por Precio Venta</option>
                </select>
                <label className="flex items-center text-base font-medium text-text-medium">
                    <input
                        type="checkbox"
                        checked={showOnlyLowStock}
                        onChange={(e) => setShowOnlyLowStock(e.target.checked)}
                        className="h-4 w-4 rounded border-cream-300 text-pastel-blue-600 focus:ring-pastel-blue-500"
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
            ¿Estás seguro de que quieres eliminar el producto <strong className="font-semibold text-text-dark">{productToDelete?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </ConfirmModal>

      <Modal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        title="Gestionar Categorías"
        size="lg"
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