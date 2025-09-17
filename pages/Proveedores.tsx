import React, { useState, useRef } from 'react';
// FIX: Using namespace import for react-router-dom to avoid potential module resolution issues.
import * as rr from 'react-router-dom';
import { useSuppliers } from '../hooks/useSuppliers';
import { Supplier } from '../types/supplier';
import { SupplierTable } from '../components/suppliers/SupplierTable';
import { SupplierForm } from '../components/suppliers/SupplierForm';
import { EmptyState } from '../components/suppliers/EmptyState';
import { SupplierImport } from '../components/suppliers/SupplierImport';
import { Modal } from '../components/shared/Modal';

// Icons
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);

const Proveedores: React.FC = () => {
  const {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    removeSupplier,
    deactivateSupplier,
    seedIfEmpty,
    importSuppliers,
    exportSuppliers,
    searchQuery,
    setSearchQuery,
    onlyActive,
    setOnlyActive,
    sortBy,
    setSortBy,
  } = useSuppliers();

  const [editingSupplier, setEditingSupplier] = useState<Supplier | 'new' | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleFormSave = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSupplier && editingSupplier !== 'new') {
      await updateSupplier(editingSupplier.id, supplierData);
    } else {
      await createSupplier(supplierData);
    }
    setEditingSupplier(null);
  };

  const handleOpenDeleteModal = (supplier: Supplier) => {
    setDeleteError(null);
    setSupplierToDelete(supplier);
  };

  const handleConfirmDelete = async () => {
    if (supplierToDelete) {
      try {
        await removeSupplier(supplierToDelete.id);
        setSupplierToDelete(null);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : 'Error desconocido.');
      }
    }
  };
  
  const handleExport = (format: 'json' | 'csv') => {
    const blob = exportSuppliers(format, true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proveedores_export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const PageHeader = () => (
    <header className="mb-8">
      <rr.Link to="/" className="inline-block mb-2">
        <button className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 shadow-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Volver al Dashboard
        </button>
      </rr.Link>
      <h1 className="text-4xl font-bold text-slate-800">Proveedores</h1>
    </header>
  );

  if (loading && !suppliers.length) {
    return <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"><PageHeader /><p>Cargando...</p></div>;
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" onClick={() => setEditingSupplier('new')}>
                <PlusIcon /> Nuevo Proveedor
              </button>
              <button onClick={() => setImportModalOpen(true)} className="flex items-center justify-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50">Importar</button>
              <button onClick={() => handleExport('json')} className="flex items-center justify-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50">Exportar JSON</button>
              <button onClick={() => handleExport('csv')} className="flex items-center justify-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50">Exportar CSV</button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
              <input type="text" placeholder="Buscar por Razón Social o CUIT..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 text-base text-slate-900 border border-slate-300 rounded-lg bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center gap-4">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="form-select w-full sm:w-auto text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2">
              <option value="businessName">Ordenar por Razón Social</option>
              <option value="cuit">Ordenar por CUIT</option>
              <option value="debt">Ordenar por Deuda</option>
              <option value="createdAt">Ordenar por Fecha Creación</option>
            </select>
            <label className="flex items-center text-sm font-medium text-slate-700">
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2">Mostrar solo activos</span>
            </label>
          </div>

        {suppliers.length > 0 ? (
            <SupplierTable suppliers={suppliers} onDelete={handleOpenDeleteModal} onToggleActive={deactivateSupplier} />
        ) : (
            <EmptyState onSeed={seedIfEmpty} />
        )}
        </>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader />
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        {renderContent()}
      </div>

      <Modal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Proveedores">
        <SupplierImport onImport={importSuppliers} onClose={() => setImportModalOpen(false)} />
      </Modal>

      <Modal isOpen={!!supplierToDelete} onClose={() => setSupplierToDelete(null)} title="Confirmar Eliminación">
        {supplierToDelete && (
          <div>
            <p className="text-slate-600 mb-4">
              ¿Estás seguro de que quieres eliminar a <strong className="font-semibold text-slate-800">{supplierToDelete.businessName}</strong>? Esta acción no se puede deshacer.
            </p>
            {deleteError && <p role="alert" className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setSupplierToDelete(null)} className="text-sm font-semibold text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100">Cancelar</button>
              <button onClick={handleConfirmDelete} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700">Eliminar Proveedor</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Proveedores;
