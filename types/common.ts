export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CTA_CTE' | 'CHEQUE';
export type IvaRate = 21 | 10.5 | 0;

export type StatusPillVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

// Unified types previously duplicated in client.ts and supplier.ts
export type DocType = 'DNI' | 'CUIT' | 'CUIL' | 'SD';
export type IvaCondition = 'RI' | 'MONOTRIBUTO' | 'EXENTO' | 'CF';
