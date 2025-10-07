import React, { memo } from 'react';
import { PlusIcon } from './Icons';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = memo(({ icon, title, description, action }) => {
  return (
    <div className="text-center bg-white rounded-lg shadow-sm border-2 border-dashed border-cream-200 p-12">
      {icon}
      <h3 className="mt-4 text-xl font-semibold text-text-dark">{title}</h3>
      <p className="mt-2 text-sm text-text-light">{description}</p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="btn btn-primary"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
});