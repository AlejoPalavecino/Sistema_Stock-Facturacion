import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Logic to show a limited number of page buttons for better UX on large datasets
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage: number, endPage: number;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return { pageNumbers, startPage, endPage };
  };

  const { pageNumbers, startPage, endPage } = getPageNumbers();

  const baseButtonClasses = 'px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors';
  const disabledClasses = 'text-slate-400 bg-slate-100 cursor-not-allowed';
  const enabledClasses = 'text-slate-600 bg-white hover:bg-slate-50 border border-slate-300';
  const currentButtonClasses = 'text-white bg-blue-600 border border-blue-600 hover:bg-blue-700';

  return (
    <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Pagination">
      <button onClick={handlePrevious} disabled={currentPage === 1} className={`${baseButtonClasses} ${currentPage === 1 ? disabledClasses : enabledClasses}`}>
        <ArrowLeftIcon />
      </button>

      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={`${baseButtonClasses} ${enabledClasses}`}>1</button>
          {startPage > 2 && <span className="px-2 text-slate-500">...</span>}
        </>
      )}

      {pageNumbers.map(page => (
        <button key={page} onClick={() => onPageChange(page)} className={`${baseButtonClasses} ${currentPage === page ? currentButtonClasses : enabledClasses}`}>
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-slate-500">...</span>}
          <button onClick={() => onPageChange(totalPages)} className={`${baseButtonClasses} ${enabledClasses}`}>{totalPages}</button>
        </>
      )}

      <button onClick={handleNext} disabled={currentPage === totalPages} className={`${baseButtonClasses} ${currentPage === totalPages ? disabledClasses : enabledClasses}`}>
        <ArrowRightIcon />
      </button>
    </nav>
  );
};