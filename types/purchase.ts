export type PurchaseId = string;
export type PurchaseStatus = 'PENDIENTE' | 'PAGADA' | 'ANULADA';

export interface PurchaseItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unitPriceARS: number; // Cost price
  lineTotalARS: number;
}

export interface Purchase {
  id: PurchaseId;
  supplierId: string;
  invoiceNumber: string; // Supplier's invoice number
  date: string; // ISO
  items: PurchaseItem[];
  totalAmountARS: number;
  status: PurchaseStatus;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
