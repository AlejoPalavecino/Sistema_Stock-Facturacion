import { useState, useEffect, useCallback } from 'react';
import { StockMovement } from '../types/history';
import * as historyRepo from '../services/db/historyRepo';

export function useStockHistory() {
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await historyRepo.list();
      // Sort by most recent first
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar el historial.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    fetchHistory,
  };
}
