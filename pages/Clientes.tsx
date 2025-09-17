
import React, { useState, useCallback } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { Client, ClientWithDebt } from '@/types/client';
import { ClientTable } from '@/components/clients/ClientTable';
import { ClientForm } from '@/components/clients/ClientForm';
import { EmptyState } from '@/components/clients/EmptyState';
import { ClientImport } from '@/components/clients/ClientImport';
import { Modal } from '@/components/shared/Modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// Icons
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const Clientes: React.FC = () => {
  const {
    clients,
    loading,
    error,
    createClient,
    removeClient,
    deactivateClient,
    seedIfEmpty,
    importClients,
    exportClients,
    searchQuery,
    setSearchQuery,
    onlyActive,
    setOnlyActive,
    sortBy,
    setSortBy,
  } = useClients();

  const [isNewClientModalOpen, setNewClientModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientWithDebt | null>(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const handleFormSave = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createClient(clientData);
    setNewClientModalOpen(false);
  }, [createClient]);

  const handleOpenDeleteModal = useCallback((client: ClientWithDebt) => {
    setClientToDelete(client);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (clientToDelete) {
      await removeClient(clientToDelete.id);
      setClientToDelete(null);
    }
  }, [clientToDelete, removeClient]);

  const handleExport = useCallback((format: 'json' | 'csv') => {
    const blob = exportClients(format, true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_export.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportClients]);

  const PageHeader = () => (
    <header className="mb-8">
      <Router.Link to="/" className="inline-block mb-2">
        <button className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 shadow-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Dashboard
        </button>
      </Router.Link>
      <h1 className="text-4xl font-bold text-slate-800">Clientes</h1>
    </header>
  );

  if (loading) {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <PageHeader />
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader />

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        
        <>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" onClick={() => setNewClientModalOpen(true)}>
                <PlusIcon /> Nuevo Cliente
              </button>
              <button onClick={() => setImportModalOpen(true)} className="flex items-center justify-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Importar
              </button>
              <button onClick={() => handleExport('json')} className="flex items-center justify-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Exportar JSON
              </button>
              <button onClick={() => handleExport('csv')} className="flex items-center justify-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Exportar CSV
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 text-base text-slate-900 border border-slate-300 rounded-lg bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-select w-full sm:w-auto text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
            >
              <option value="name">Ordenar por Nombre</option>
              <option value="debt">Ordenar por Deuda</option>
              <option value="docNumber">Ordenar por Documento</option>
              <option value="createdAt">Ordenar por Fecha Creación</option>
            </select>
            <label className="flex items-center text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">Mostrar solo activos</span>
            </label>
          </div>

          {clients.length > 0 ? (
            <ClientTable
              clients={clients}
              onDelete={handleOpenDeleteModal}
              onToggleActive={deactivateClient}
            />
          ) : (
            <EmptyState onSeed={seedIfEmpty} />
          )}
        </>
      </div>

      <Modal isOpen={isNewClientModalOpen} onClose={() => setNewClientModalOpen(false)} title="Nuevo Cliente">
         <ClientForm
            onSave={handleFormSave}
            onCancel={() => setNewClientModalOpen(false)}
          />
      </Modal>

      <Modal isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} title="Confirmar Eliminación">
        {clientToDelete && (
          <div>
            <p className="text-slate-600 mb-6">
              ¿Estás seguro de que quieres eliminar a <strong className="font-semibold text-slate-800">{clientToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setClientToDelete(null)} className="text-sm font-semibold text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100">Cancelar</button>
              <button onClick={handleConfirmDelete} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700">Eliminar Cliente</button>
            </div>
          </div>
        )}
      </Modal>
      
      <Modal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Clientes">
        <ClientImport onImport={importClients} />
      </Modal>
    </div>
  );
};

export default Clientes;
