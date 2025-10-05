import { PaymentMethod } from './common';

export type PaymentId = string;

export interface Payment {
  id: PaymentId;
  clientId: string;
  amountARS: number;
  date: string; // ISO date string for the payment date
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string; // ISO date string for creation record
  updatedAt: string;
}