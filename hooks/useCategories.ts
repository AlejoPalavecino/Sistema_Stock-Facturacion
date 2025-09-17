import { useState, useEffect, useCallback } from 'react';
import * as categoriesRepo from '../services/db/categoriesRepo';
import * as productsRepo from '../services/db/productsRepo';

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesRepo.list();
      setCategories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar las categorías.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (name: string) => {
    try {
      setError(null);
      await categoriesRepo.create(name);
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : `No se pudo añadir la categoría.`;
      setError(message);
      throw err;
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (oldName: string, newName: string) => {
    if (oldName === newName) return;
    try {
      setError(null);
      await categoriesRepo.update(oldName, newName);
      await productsRepo.updateCategoryName(oldName, newName); // Keep data consistent
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : `No se pudo actualizar la categoría.`;
      setError(message);
      throw err;
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (name: string) => {
    try {
      setError(null);
      const isInUse = await productsRepo.isCategoryInUse(name);
      if (isInUse) {
        throw new Error(`La categoría "${name}" está en uso y no se puede eliminar.`);
      }
      await categoriesRepo.remove(name);
      await fetchCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : `No se pudo eliminar la categoría.`;
      setError(message);
      throw err;
    }
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
