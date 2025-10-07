
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
    primary: 'btn btn-primary',
    danger: 'btn btn-danger',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div>
        <div className="text-text-medium mb-6 text-base">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={confirmButtonClasses[confirmVariant]}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};