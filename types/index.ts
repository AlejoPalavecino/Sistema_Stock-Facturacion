// Re-exporting all types from their specific files for centralized access
export * from './product';
export * from './history';
export * from './invoice';
// FIX: Explicitly export types from './client' to avoid re-exporting the conflicting 'IvaCondition' type.
export type { DocType, Client, ClientWithDebt, ClientImportRow, ClientImportResult } from './client';
export * from './adjustment';
// Fix: Explicitly export from './payment' to avoid re-exporting the conflicting 'PaymentMethod' type.
export type { Payment, PaymentId } from './payment';
export * from './supplier';
export * from './purchase';
export * from './supplierPayment';

// This can be expanded for other models like suppliers if needed.