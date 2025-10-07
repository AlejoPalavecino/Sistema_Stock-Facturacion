import React from 'react';
import { StatusPillVariant } from '../../types';

interface StatusPillProps {
    variant: StatusPillVariant;
    children: React.ReactNode;
}

const variantClassMap: Record<StatusPillVariant, string> = {
    success: 'status-pill-success',
    warning: 'status-pill-warning',
    danger: 'status-pill-danger',
    info: 'status-pill-info',
    neutral: 'status-pill-neutral',
};

export const StatusPill: React.FC<StatusPillProps> = ({ variant, children }) => {
    const variantClass = variantClassMap[variant] || variantClassMap.neutral;
    return (
        <span className={`status-pill ${variantClass}`}>
            {children}
        </span>
    );
};
