import { PaymentMethod } from './common';
// FIX: Import PurchaseId to resolve type error.
import { PurchaseId } from './purchase';

export type SupplierPaymentId = string;

export interface SupplierPayment {
  id: SupplierPaymentId;
  supplierId: string;
  purchaseId: PurchaseId; // Link payment to a specific purchase
  amountARS: number;
  date: string; // ISO
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string;
}
