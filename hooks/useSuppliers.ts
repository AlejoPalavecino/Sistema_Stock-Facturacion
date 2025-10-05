import { useState, useEffect, useMemo, useCallback } from 'react';
import { Supplier, SupplierWithDebt, SupplierImportRow, SupplierImportResult, Purchase, SupplierPayment } from '../types';
import * as suppliersRepo from '../services/db/suppliersRepo';
import * as purchasesRepo from '../services/db/purchasesRepo';
import * as supplierPaymentsRepo from '../services/db/supplierPaymentsRepo';
import { onStorageChange, downloadBlob } from '../utils/storage';
import { usePagination } from './usePagination';
import { useSuppliersWithDebtCalculator } from './useAccountCalculations';

// For SheetJS global variable from CDN
declare var XLSX: any;

type SortableKeys = 'businessName' | 'cuit' | 'createdAt' | 'debt';

export function useSuppliers() {
  const [rawSuppliers, setRawSuppliers] = useState<Supplier[]>([]);
  const [rawPurchases, setRawPurchases] = useState<Purchase[]>([]);
  const [rawPayments, setRawPayments] = useState<SupplierPayment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [sortBy, setSortBy] = useState<SortableKeys>('businessName');

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [suppliersData, purchasesData, paymentsData] = await Promise.all([
        suppliersRepo.list(),
        purchasesRepo.list(),
        supplierPaymentsRepo.list()
      ]);

      setRawSuppliers(suppliersData);
      setRawPurchases(purchasesData);
      setRawPayments(paymentsData);
      
    } catch (err) {
      setError('No se pudieron cargar los proveedores.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const suppliersWithDebt = useSuppliersWithDebtCalculator(rawSuppliers, rawPurchases, rawPayments);

  useEffect(() => {
    fetchSuppliers();
    const keysToWatch = ['suppliers_v1', 'purchases_v1', 'supplier_payments_v1'];
    const cleanups = keysToWatch.map(key => onStorageChange(key, fetchSuppliers));
    return () => cleanups.forEach(c => c());
  }, [fetchSuppliers]);

  const handleRepoAction = useCallback(async (action: () => Promise<any>) => {
    try {
      setError(null);
      await action();
      await fetchSuppliers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(message);
      throw err; // Re-throw to be caught in UI if needed
    }
  }, [fetchSuppliers]);

  const createSupplier = useCallback((data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => handleRepoAction(() => suppliersRepo.create(data)), [handleRepoAction]);
  const updateSupplier = useCallback((id: string, data: Partial<Supplier>) => handleRepoAction(() => suppliersRepo.update(id, data)), [handleRepoAction]);
  const deactivateSupplier = useCallback((id: string) => handleRepoAction(() => suppliersRepo.deactivate(id)), [handleRepoAction]);
  const seedIfEmpty = useCallback(() => handleRepoAction(suppliersRepo.seedIfEmpty), [handleRepoAction]);

  const importSuppliers = useCallback(async (data: SupplierImportRow[]): Promise<SupplierImportResult> => {
      const result = await suppliersRepo.batchCreate(data);
      if (result.successCount > 0) {
          await fetchSuppliers();
      }
      return result;
  }, [fetchSuppliers]);

  const filteredAndSortedSuppliers = useMemo(() => {
    let result = [...suppliersWithDebt];
    if (onlyActive) result = result.filter(s => s.active);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.businessName.toLowerCase().includes(q) || s.cuit.includes(q));
    }
    result.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA < valB) return (sortBy === 'createdAt' || sortBy === 'debt') ? 1 : -1;
      if (valA > valB) return (sortBy === 'createdAt' || sortBy === 'debt') ? -1 : 1;
      return 0;
    });
    return result;
  }, [suppliersWithDebt, searchQuery, onlyActive, sortBy]);

  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination<SupplierWithDebt>(filteredAndSortedSuppliers);
  
  const exportSuppliers = useCallback((format: 'json' | 'csv' | 'excel', onlyFiltered: boolean = true) => {
    const dataToExport = onlyFiltered ? filteredAndSortedSuppliers : suppliersWithDebt;

    if (format === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        downloadBlob(blob, 'proveedores_export.json');
        return;
    }

    // For CSV and Excel, flatten the bank data for a better structure
    const flatData = dataToExport.map(s => {
        const { bank, ...rest } = s;
        return {
            ...rest,
            bankName: bank?.bankName,
            cbu: bank?.cbu,
            alias: bank?.alias,
        };
    });

    if (format === 'excel') {
        if (typeof XLSX === 'undefined') return;
        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Proveedores");
        XLSX.writeFile(workbook, "proveedores_export.xlsx");

    } else if (format === 'csv') {
        if (!flatData.length) return;
        const headers = Object.keys(flatData[0]).join(',');
        const rows = flatData.map(s => 
            Object.values(s).map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
        );
        const csvContent = `${headers}\n${rows.join('\n')}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, 'proveedores_export.csv');
    }
  }, [suppliersWithDebt, filteredAndSortedSuppliers]);

  return {
    suppliers: paginatedData,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
    importSuppliers,
    exportSuppliers,
    seedIfEmpty,
    searchQuery,
    setSearchQuery,
    onlyActive,
    setOnlyActive,
    sortBy,
    setSortBy,
    currentPage,
    totalPages,
    setCurrentPage,
    totalSuppliers: filteredAndSortedSuppliers.length
  };
}