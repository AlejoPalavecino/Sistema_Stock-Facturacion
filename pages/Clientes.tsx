
import React, { useState, useCallback } from 'react';
import * as Router from 'react-router-dom';
import { useClients } from '../hooks/useClients.ts';
import { Client } from '../types';
import { ClientTable } from '../components/clients/ClientTable.tsx';
import { ClientForm } from '../components/clients/ClientForm.tsx';
import { EmptyState } from '../components/shared/EmptyState.tsx';
import { Modal } from '../components/shared/Modal.tsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
import { Pagination } from '../components/shared/Pagination.tsx';
import { PageHeader } from '../components/shared/PageHeader.tsx';
import { PlusIcon, EmptyUserIcon } from '../components/shared/Icons.tsx';
import { ActionBar } from '../components/shared/ActionBar.tsx';

const Clientes: React.FC = () => {
  const {
    clients,
    loading,
    error,
    createClient,
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
    totalClients
  } = useClients();

  const [isNewClientModalOpen, setNewClientModalOpen] = useState(false);

  const handleFormSave = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createClient(clientData);
    setNewClientModalOpen(false);
  }, [createClient]);

  if (loading) {
    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <PageHeader title="Clientes" backTo="/" />
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        </div>
    );
  }

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader title="Clientes" backTo="/" />

        {error && <div className="bg-pastel-red-100 border border-pastel-red-500 text-pastel-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        
        <>
          <ActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por nombre o documento..."
          >
            <button className="btn btn-primary" onClick={() => setNewClientModalOpen(true)}>
              <PlusIcon className="h-5 w-5 mr-2" /> Nuevo Cliente
            </button>
          </ActionBar>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-cream-200 mb-6 flex flex-wrap items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-select w-full sm:w-auto text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500 px-3 py-2.5"
            >
              <option value="name">Ordenar por Nombre</option>
              <option value="debt">Ordenar por Deuda</option>
              <option value="docNumber">Ordenar por Documento</option>
              <option value="createdAt">Ordenar por Fecha Creación</option>
            </select>
            <label className="flex items-center text-base font-medium text-text-medium">
              <input
                type="checkbox"
                checked={onlyWithDebt}
                onChange={(e) => setOnlyWithDebt(e.target.checked)}
                className="h-4 w-4 rounded border-cream-300 text-pastel-blue-600 focus:ring-pastel-blue-500"
              />
              <span className="ml-2">Mostrar solo con deuda</span>
            </label>
          </div>

          {totalClients > 0 ? (
            <>
              <ClientTable
                clients={clients}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
             <EmptyState
                icon={<EmptyUserIcon />}
                title="No tienes clientes registrados"
                description="Comienza creando un nuevo cliente o carga datos de prueba para empezar."
                action={{ label: 'Cargar datos de prueba', onClick: seedIfEmpty }}
              />
          )}
        </>
      </div>

      <Modal isOpen={isNewClientModalOpen} onClose={() => setNewClientModalOpen(false)} title="Nuevo Cliente" size="5xl">
         <ClientForm
            onSave={handleFormSave}
            onCancel={() => setNewClientModalOpen(false)}
          />
      </Modal>

    </div>
  );
};

export default Clientes;