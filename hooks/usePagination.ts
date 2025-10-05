
import { useState, useMemo, useEffect } from 'react';

const ITEMS_PER_PAGE = 15;

export function usePagination<T>(data: T[], itemsPerPage: number = ITEMS_PER_PAGE) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  // Reset to page 1 if the data array changes and the current page is out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
    itemsPerPage,
  };
}
