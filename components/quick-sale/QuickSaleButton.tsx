import React from 'react';
import { LightningIcon } from '../shared/Icons';

interface QuickSaleButtonProps {
  onClick: () => void;
}

export const QuickSaleButton: React.FC<QuickSaleButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 btn btn-orange z-40 transition-transform duration-200 ease-in-out hover:scale-105"
      aria-label="Iniciar Venta Rápida"
      title="Venta Rápida"
    >
      <LightningIcon />
      <span className="font-semibold text-base ml-2">Venta Rápida</span>
    </button>
  );
};