import { PaymentMethod } from './common';

export type PaymentId = string;

export type ChequeStatus = 'PENDIENTE' | 'COBRADO' | 'RECHAZADO';

export interface ChequeDetails {
  number: string;
  bank: string;
  paymentDate: string; // ISO date string for when the cheque can be cashed
  type: 'COMUN' | 'DIFERIDO';
  holderName: string;
  holderCuit: string;
  status: ChequeStatus;
}

export interface Payment {
  id: PaymentId;
  clientId: string;
  invoiceId?: string; // Link payment to a specific invoice
  amountARS: number;
  date: string; // ISO date string for the payment date
  paymentMethod: PaymentMethod;
  chequeDetails?: ChequeDetails;
  notes?: string;
  createdAt: string; // ISO date string for creation record
  updatedAt: string;
}