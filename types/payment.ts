export type PaymentId = string;
// Fix: Consolidate payment methods to resolve export ambiguity and create a single source of truth.
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE' | 'CTA_CTE';

export interface Payment {
  id: PaymentId;
  clientId: string;
  amountARS: number;
  date: string; // ISO date string for the payment date
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string; // ISO date string for creation record
}
