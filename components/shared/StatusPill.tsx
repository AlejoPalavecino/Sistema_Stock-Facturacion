import React from 'react';
import { StatusPillVariant } from '../../types';

interface StatusPillProps {
    variant: StatusPillVariant;
    children: React.ReactNode;
}

const variantClasses: Record<StatusPillVariant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-slate-100 text-slate-700',
};

export const StatusPill: React.FC<StatusPillProps> = ({ variant, children }) => {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]}`}>
            {children}
        </span>
    );
};