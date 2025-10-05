import { PaymentMethod } from './common';

export type SupplierPaymentId = string;

export interface SupplierPayment {
  id: SupplierPaymentId;
  supplierId: string;
  amountARS: number;
  date: string; // ISO
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string;
}