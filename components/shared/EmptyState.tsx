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
    <div className="text-center bg-white rounded-lg shadow-sm border-2 border-dashed border-slate-200 p-12">
      {icon}
      <h3 className="mt-4 text-xl font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
});
