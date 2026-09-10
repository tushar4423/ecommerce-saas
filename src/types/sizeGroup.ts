export interface SizeGroup {
  id: string;
  name: string;
  description?: string;
  sizes: string[];
  isDefault?: boolean;
  isActive: boolean;
  createdAt?: string;
}
