import React from 'react';

interface StockAdjustProps {
  stock: number;
  onAdjust: (delta: number) => void;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
);


export const StockAdjust: React.FC<StockAdjustProps> = ({ stock, onAdjust }) => {
  const buttonClasses = "p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-1.5">
      <button
        className={buttonClasses}
        onClick={() => onAdjust(-1)}
        disabled={stock <= 0}
        aria-label="Disminuir stock en 1"
        title="Disminuir stock en 1"
      >
        <MinusIcon />
      </button>
      <button
        className={buttonClasses}
        onClick={() => onAdjust(1)}
        aria-label="Aumentar stock en 1"
        title="Aumentar stock en 1"
      >
        <PlusIcon />
      </button>
    </div>
  );
};
