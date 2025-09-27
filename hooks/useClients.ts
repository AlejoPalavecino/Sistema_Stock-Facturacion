
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Client, ClientImportRow, ClientImportResult, ClientWithDebt } from '../types/client.ts';
import * as clientsRepo from '../services/db/clientsRepo.ts';
import * as invoicesRepo from '../services/db/invoicesRepo.ts';
import * as paymentsRepo from '../services/db/paymentsRepo.ts';
import * as adjustmentsRepo from '../services/db/adjustmentsRepo.ts';
import { onStorageChange, downloadBlob } from '../utils/storage.ts';

// For SheetJS global variable from CDN
declare var XLSX: any;

type SortableKeys = 'name' | 'docNumber' | 'createdAt' | 'debt';

export function useClients() {
  const [clientsWithDebt, setClientsWithDebt] = useState<ClientWithDebt[]>([]);
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
      
      const paymentsByClient = new Map<string, number>();
      for (const payment of paymentsData) {
          paymentsByClient.set(payment.clientId, (paymentsByClient.get(payment.clientId) || 0) + payment.amountARS);
      }

      const debtByClient = new Map<string, number>();
      for (const invoice of invoicesData) {
          if (invoice.status === 'EMITIDA') {
            debtByClient.set(invoice.clientId, (debtByClient.get(invoice.clientId) || 0) + invoice.totals.totalARS);
          }
      }
      
      const adjustmentsByClient = new Map<string, number>();
      for (const adj of adjustmentsData) {
          const amount = adj.type === 'DEBIT' ? adj.amountARS : -adj.amountARS;
          adjustmentsByClient.set(adj.clientId, (adjustmentsByClient.get(adj.clientId) || 0) + amount);
      }


      const clientsWithDebtData = clientsData.map(client => {
          const totalInvoiced = debtByClient.get(client.id) || 0;
          const totalPaid = paymentsByClient.get(client.id) || 0;
          const totalAdjustments = adjustmentsByClient.get(client.id) || 0;
          return { ...client, debt: totalInvoiced - totalPaid + totalAdjustments };
      });

      setClientsWithDebt(clientsWithDebtData);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

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
    clients: filteredAndSortedClients,
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
  };
}
