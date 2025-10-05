import { useState, useEffect, useMemo, useCallback } from 'react';
import { Supplier, SupplierWithDebt, Purchase, SupplierPayment } from '../types';
import * as suppliersRepo from '../services/db/suppliersRepo';
import * as purchasesRepo from '../services/db/purchasesRepo';
import * as supplierPaymentsRepo from '../services/db/supplierPaymentsRepo';
import { onStorageChange } from '../utils/storage';
import { usePagination } from './usePagination';
import { useSuppliersWithDebtCalculator } from './useAccountCalculations';


type SortableKeys = 'businessName' | 'cuit' | 'createdAt' | 'debt';

export function useSuppliers() {
  const [rawSuppliers, setRawSuppliers] = useState<Supplier[]>([]);
  const [rawPurchases, setRawPurchases] = useState<Purchase[]>([]);
  const [rawPayments, setRawPayments] = useState<SupplierPayment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithDebt, setOnlyWithDebt] = useState(false);
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
  const seedIfEmpty = useCallback(() => handleRepoAction(suppliersRepo.seedIfEmpty), [handleRepoAction]);

  const filteredAndSortedSuppliers = useMemo(() => {
    let result = [...suppliersWithDebt];
    if (onlyWithDebt) result = result.filter(s => s.debt > 0);
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
  }, [suppliersWithDebt, searchQuery, onlyWithDebt, sortBy]);

  const { paginatedData, currentPage, totalPages, setCurrentPage } = usePagination<SupplierWithDebt>(filteredAndSortedSuppliers);

  return {
    suppliers: paginatedData,
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
    totalSuppliers: filteredAndSortedSuppliers.length,
    fetchSuppliers,
  };
}