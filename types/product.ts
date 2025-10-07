export type ProductId = string; // Using string for UUIDs

export type Category = string;

export interface Product {
  id: ProductId;
  sku: string;
  name: string;
  brand: string;
  category: Category;
  netPrice: number;         // Precio sin IVA
  vatRate: number;          // Tasa de IVA (e.g., 21 for 21%)
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithSalePrice extends Product {
    salePrice: number;
}
