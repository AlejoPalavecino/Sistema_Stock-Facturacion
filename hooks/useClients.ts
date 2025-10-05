import { useState, useEffect, useMemo, useCallback } from 'react';
import { Client, ClientImportRow, ClientImportResult, ClientWithDebt, Invoice, Payment, AccountAdjustment } from '../types';
import * as clientsRepo from '../services/db/clientsRepo.ts';
import * as invoicesRepo from '../services/db/invoicesRepo.ts';
import * as paymentsRepo from '../services/db/paymentsRepo.ts';
import * as adjustmentsRepo from '../services/db/adjustmentsRepo.ts';
import { onStorageChange, downloadBlob } from '../utils/storage.ts';
import { usePagination } from './usePagination.ts';
import { useClientsWithDebtCalculator } from './useAccountCalculations.ts';

// For SheetJS global variable from CDN
declare var XLSX: any;

type SortableKeys = 'name' | 'docNumber' | 'createdAt' | 'debt';

export function useClients() {
  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [rawInvoices, setRawInvoices] = useState<Invoice[]>([]);
  const [rawPayments, setRawPayments] = useState<Payment[]>([]);
  const [rawAdjustments, setRawAdjustments] = useState<AccountAdjustment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [sortBy, setSortBy] = useState<SortableKeys>('name');
  
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsData, invoicesData, paymentsData, adjustmentsData] = await Promise.all([
          clientsRepo.list(),
          invoicesRepo.list(),
          paymentsRepo.list(),
          adjustmentsRepo.list()
      ]);
      
      setRawClients(clientsData);
      setRawInvoices(invoicesData);
      setRawPayments(paymentsData);
      setRawAdjustments(adjustmentsData);
      
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const clientsWithDebt = useClientsWithDebtCalculator(rawClients, rawInvoices, rawPayments, rawAdjustments);

  useEffect(() => {
    fetchClients();
    const keysToWatch = ['clients_v1', 'invoices_v1', 'payments_v1', 'adjustments_v1'];
    const cleanups = keysToWatch.map(key => onStorageChange(key, fetchClients));
    return () => cleanups.forEach(cleanup => cleanup());
  }, [fetchClients]);
  
  const handleRepoAction = useCallback(async (action: () => Promise<any>) => {
      try {
          setError(null);
          await action();
          // Data will be re-fetched by the storage listener, but we can force it for immediate feedback
          await fetchClients();
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
          throw err;
      }
  }, [fetchClients]);

  const createClient = useCallback(async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    await handleRepoAction(() => clientsRepo.create(data));
  }, [handleRepoAction]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    await handleRepoAction(() => clientsRepo.update(id, data));
  }, [handleRepoAction]);
  
  const deactivateClient = useCallback(async (id: string) => {
      await handleRepoAction(() => clientsRepo.deactivate(id));
  }, [handleRepoAction]);
  
  const seedIfEmpty = useCallback(async () => {
      await handleRepoAction(clientsRepo.seedIfEmpty);
  }, [handleRepoAction]);
  
  const importClients = useCallback(async (data: ClientImportRow[]): Promise<ClientImportResult> => {
      const result = await clientsRepo.batchCreate(data);
      if (result.successCount > 0) {
          await fetchClients();
      }
      return result;
  }, [fetchClients]);

  const filteredAndSortedClients = useMemo(() => {
    let result = [...clientsWithDebt];

    if (onlyActive) {
      result = result.filter(c => c.active);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.docNumber.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA < valB) return (sortBy === 'createdAt' || sortBy === 'debt') ? 1 : -1;
      if (valA > valB) return (sortBy === 'createdAt' || sortBy === 'debt') ? -1 : 1;
      return 0;
    });

    return result;
  }, [clientsWithDebt, searchQuery, onlyActive, sortBy]);

  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination<ClientWithDebt>(filteredAndSortedClients);

  const exportClients = useCallback((format: 'json' | 'csv' | 'excel', onlyFiltered: boolean = true) => {
    const dataToExport = onlyFiltered ? filteredAndSortedClients : clientsWithDebt;
    // remove debt from export, as it's a calculated field
    const clientsOnly = dataToExport.map(({debt, ...client}) => client);
    
    if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(clientsOnly);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
        XLSX.writeFile(workbook, "clientes_export.xlsx");
        return;
    }
    
    let blob: Blob;
    if (format === 'json') {
        blob = new Blob([JSON.stringify(clientsOnly, null, 2)], { type: 'application/json' });
    } else { // csv
        const headers = Object.keys(clientsOnly[0] || {}).join(',');
        const rows = clientsOnly.map(client => 
            Object.values(client).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
        );
        const csvContent = `${headers}\n${rows.join('\n')}`;
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    }

    downloadBlob(blob, `clientes_export.${format}`);
  }, [clientsWithDebt, filteredAndSortedClients]);


  return {
    clients: paginatedData,
    loading,
    error,
    createClient,
    updateClient,
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
    currentPage,
    totalPages,
    setCurrentPage,
    totalClients: filteredAndSortedClients.length
  };
}