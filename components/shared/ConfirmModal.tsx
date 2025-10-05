import React from 'react';
import { Modal } from './Modal.tsx';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText: string;
  confirmVariant?: 'danger' | 'primary';
  children: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText,
  confirmVariant = 'primary',
  children,
}) => {
  const confirmButtonClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <div className="text-slate-600 mb-6 text-base">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-base font-semibold text-slate-700 py-2.5 px-5 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`font-semibold text-base py-2.5 px-5 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${confirmButtonClasses[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
