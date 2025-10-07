
import React, { useState, useCallback } from 'react';
import * as Router from 'react-router-dom';
import { useSuppliers } from '../hooks/useSuppliers.ts';
import { Supplier } from '../types';
import { SupplierTable } from '../components/suppliers/SupplierTable.tsx';
import { SupplierForm } from '../components/suppliers/SupplierForm.tsx';
import { EmptyState } from '../components/shared/EmptyState.tsx';
import { Modal } from '../components/shared/Modal.tsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
import { Pagination } from '../components/shared/Pagination.tsx';
import { PageHeader } from '../components/shared/PageHeader.tsx';
import { PlusIcon, EmptyTruckIcon } from '../components/shared/Icons.tsx';
import { ActionBar } from '../components/shared/ActionBar.tsx';
import { PurchaseForm } from '../components/suppliers/PurchaseForm.tsx';


const Proveedores: React.FC = () => {
  const {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    seedIfEmpty,
    searchQuery,
    setSearchQuery,
    onlyWithDebt,
    setOnlyWithDebt,
    sortBy,
    setSortBy,
    currentPage,
    totalPages,
    setCurrentPage,
    totalSuppliers,
    fetchSuppliers,
  } = useSuppliers();

  const [editingSupplier, setEditingSupplier] = useState<Supplier | 'new' | null>(null);
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const handleFormSave = useCallback(async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSupplier && editingSupplier !== 'new') {
      await updateSupplier(editingSupplier.id, supplierData);
    } else {
      await createSupplier(supplierData);
    }
    setEditingSupplier(null);
  }, [editingSupplier, createSupplier, updateSupplier]);
  
  const handlePurchaseSave = useCallback(() => {
      setPurchaseModalOpen(false);
      fetchSuppliers();
  }, [fetchSuppliers]);

  if (loading && !suppliers.length) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader title="Proveedores" backTo="/" />
        <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  const renderContent = () => {
    if (editingSupplier) {
        return <SupplierForm
            supplierToEdit={editingSupplier === 'new' ? undefined : editingSupplier}
            onSave={handleFormSave}
            onCancel={() => setEditingSupplier(null)}
        />
    }
    return (
        <>
          <ActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por Razón Social o CUIT..."
          >
            <button className="btn btn-primary" onClick={() => setEditingSupplier('new')}>
              <PlusIcon className="h-5 w-5 mr-2" /> Nuevo Proveedor
            </button>
            <button onClick={() => setPurchaseModalOpen(true)} className="btn btn-green">
              <PlusIcon className="h-5 w-5 mr-2" /> Registrar Factura
            </button>
          </ActionBar>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-cream-200 mb-6 flex flex-wrap items-center gap-4">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="form-select w-full sm:w-auto text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500 px-3 py-2.5">
              <option value="businessName">Ordenar por Razón Social</option>
              <option value="cuit">Ordenar por CUIT</option>
              <option value="debt">Ordenar por Deuda</option>
              <option value="createdAt">Ordenar por Fecha Creación</option>
            </select>
            <label className="flex items-center text-base font-medium text-text-medium">
              <input type="checkbox" checked={onlyWithDebt} onChange={(e) => setOnlyWithDebt(e.target.checked)} className="h-4 w-4 rounded border-cream-300 text-pastel-blue-600 focus:ring-pastel-blue-500" />
              <span className="ml-2">Mostrar solo con deuda</span>
            </label>
          </div>

        {totalSuppliers > 0 ? (
          <>
            <SupplierTable suppliers={suppliers} onEdit={setEditingSupplier} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
            <EmptyState
                icon={<EmptyTruckIcon />}
                title="No hay proveedores registrados"
                description="Puedes crear un nuevo proveedor o cargar datos de prueba para empezar."
                action={{ label: 'Cargar datos de prueba', onClick: seedIfEmpty }}
            />
        )}
        </>
    );
  }

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader title="Proveedores" backTo="/" />
        {error && <div className="bg-pastel-red-100 border border-pastel-red-500 text-pastel-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        {renderContent()}
      </div>

      <Modal isOpen={isPurchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} title="Registrar Factura de Compra" size="6xl">
         <PurchaseForm onSave={handlePurchaseSave} onCancel={() => setPurchaseModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Proveedores;