import React from 'react';

interface QuickSaleButtonProps {
  onClick: () => void;
}

const LightningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);


export const QuickSaleButton: React.FC<QuickSaleButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full px-5 py-3 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform duration-200 ease-in-out hover:scale-105 z-40 flex items-center gap-2"
      aria-label="Iniciar Venta Rápida"
      title="Venta Rápida"
    >
      <LightningIcon />
      <span className="font-semibold text-base">Venta Rápida</span>
    </button>
  );
};