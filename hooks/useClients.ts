import { useState, useEffect, useMemo, useCallback } from 'react';
import { Client, Invoice, Payment, AccountAdjustment, ClientWithDebt } from '../types';
import * as clientsRepo from '../services/db/clientsRepo.ts';
import * as invoicesRepo from '../services/db/invoicesRepo.ts';
import * as paymentsRepo from '../services/db/paymentsRepo.ts';
import * as adjustmentsRepo from '../services/db/adjustmentsRepo.ts';
import { onStorageChange } from '../utils/storage.ts';
import { usePagination } from './usePagination.ts';
import { useClientsWithDebtCalculator } from './useAccountCalculations.ts';

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
  const [onlyWithDebt, setOnlyWithDebt] = useState(false);
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
      } catch (err)
 {
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
          throw err;
      }
  }, [fetchClients]);

  const createClient = useCallback(async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    await handleRepoAction(() => clientsRepo.create(data));
  }, [handleRepoAction]);
  
  const seedIfEmpty = useCallback(async () => {
      await handleRepoAction(clientsRepo.seedIfEmpty);
  }, [handleRepoAction]);

  const filteredAndSortedClients = useMemo(() => {
    let result = [...clientsWithDebt].filter(c => c.active);

    if (onlyWithDebt) {
      result = result.filter(c => c.debt > 0);
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
  }, [clientsWithDebt, searchQuery, onlyWithDebt, sortBy]);

  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination<ClientWithDebt>(filteredAndSortedClients);

  return {
    clients: paginatedData,
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
    totalClients: filteredAndSortedClients.length
  };
}