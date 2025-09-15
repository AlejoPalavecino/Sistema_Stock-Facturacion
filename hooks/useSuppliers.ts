import { useState, useEffect, useMemo, useCallback } from 'react';
import { Supplier, SupplierWithDebt, SupplierImportRow, SupplierImportResult } from '../types/supplier';
import * as suppliersRepo from '../services/db/suppliersRepo';
import * as purchasesRepo from '../services/db/purchasesRepo';
import * as supplierPaymentsRepo from '../services/db/supplierPaymentsRepo';


type SortableKeys = 'businessName' | 'cuit' | 'createdAt' | 'debt';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<SupplierWithDebt[]>([]);
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

      const debtBySupplier = new Map<string, number>();
      purchasesData.forEach(p => {
          debtBySupplier.set(p.supplierId, (debtBySupplier.get(p.supplierId) || 0) + p.totalAmountARS);
      });
      paymentsData.forEach(p => {
          debtBySupplier.set(p.supplierId, (debtBySupplier.get(p.supplierId) || 0) - p.amountARS);
      });

      const suppliersWithDebt = suppliersData.map(s => ({
          ...s,
          debt: debtBySupplier.get(s.id) || 0
      }));

      setSuppliers(suppliersWithDebt);
    } catch (err) {
      setError('No se pudieron cargar los proveedores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleRepoAction = async (action: () => Promise<any>) => {
    try {
      setError(null);
      await action();
      await fetchSuppliers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(message);
      throw err; // Re-throw to be caught in UI if needed
    }
  };

  const createSupplier = (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => handleRepoAction(() => suppliersRepo.create(data));
  const updateSupplier = (id: string, data: Partial<Supplier>) => handleRepoAction(() => suppliersRepo.update(id, data));
  const removeSupplier = (id: string) => handleRepoAction(() => suppliersRepo.remove(id));
  const deactivateSupplier = (id: string) => handleRepoAction(() => suppliersRepo.deactivate(id));
  const seedIfEmpty = () => handleRepoAction(suppliersRepo.seedIfEmpty);

  const importSuppliers = async (data: SupplierImportRow[]): Promise<SupplierImportResult> => {
      const result = await suppliersRepo.batchCreate(data);
      if (result.successCount > 0) {
          await fetchSuppliers();
      }
      return result;
  };

  const exportSuppliers = (format: 'json' | 'csv', onlyFiltered: boolean = true): Blob => {
      const dataToExport = onlyFiltered ? filteredAndSortedSuppliers : suppliers;
      if (format === 'json') {
          return new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      } else {
          // Flatten bank data for CSV
          const flatData = dataToExport.map(s => {
              const { bank, ...rest } = s;
              return {
                  ...rest,
                  bankName: bank?.bankName,
                  cbu: bank?.cbu,
                  alias: bank?.alias,
              };
          });
          const headers = Object.keys(flatData[0] || {}).join(',');
          const rows = flatData.map(s => 
              Object.values(s).map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
          );
          const csvContent = `${headers}\n${rows.join('\n')}`;
          return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      }
  };

  const filteredAndSortedSuppliers = useMemo(() => {
    let result = [...suppliers];
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
  }, [suppliers, searchQuery, onlyActive, sortBy]);

  return {
    suppliers: filteredAndSortedSuppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    removeSupplier,
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
  };
}