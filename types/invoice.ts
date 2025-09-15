// Fix: Import and re-export the consolidated PaymentMethod type.
import { PaymentMethod } from './payment';
export { PaymentMethod };

export type InvoiceId = string;
export type InvoiceStatus = 'BORRADOR' | 'EMITIDA' | 'ANULADA';
export type InvoiceType = 'A' | 'B' | 'C';
export type Concept = 'PRODUCTOS';
export type TaxRate = 0 | 10.5 | 21;

export interface InvoiceItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unitPriceARS: number; // Price with VAT included
  taxRate: TaxRate;
  lineTotalARS: number; // unitPriceARS * qty
}

export interface InvoiceTotals {
  netARS: number;       // Calculated backward from price with VAT
  ivaARS: number;
  totalARS: number;     // Sum of lineTotalARS
}

export interface Invoice {
  id: InvoiceId;
  type: InvoiceType;
  concept: Concept;
  pos: string;              // Point of sale, e.g., '0001'
  number: string;           // Formatted correlative: '00000001'
  clientId: string;
  clientName: string;
  clientDocType: 'DNI' | 'CUIT' | 'CUIL' | 'SD';
  clientDocNumber: string;
  items: InvoiceItem[];
  totals: InvoiceTotals;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  cae?: string;             // Simulated CAE when issued
  caeDue?: string;          // Simulated (today + 7 days)
  createdAt: string;
  updatedAt: string;
}
