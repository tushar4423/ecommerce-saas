export type InventoryAdjustmentReason =
  | 'Restock / New Shipment'
  | 'Studio Sample / Photoshoot'
  | 'Damaged / Quality Defect'
  | 'Customer Return Replenishment'
  | 'Physical Audit Correction'
  | 'Boutique Transfer'
  | 'Other';

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  size: string;
  color: string;
  previousStock: number;
  newStock: number;
  changeDelta: number;
  reason: InventoryAdjustmentReason | string;
  notes?: string;
  adminEmail: string;
  adminName?: string;
  createdAt: string;
}

export interface ProductInventorySummary {
  productId: string;
  name: string;
  sku: string;
  category: string;
  primaryImage: string;
  totalStock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  variants: Array<{
    id: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
    price?: number;
  }>;
}
