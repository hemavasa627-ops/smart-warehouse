export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minThreshold: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Worker';

export interface LogEntry {
  id: string;
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'SCAN' | 'EXPORT';
  details: string;
  timestamp: string;
  userRole: UserRole;
}

export interface FulfillmentData {
  date: string;
  fulfilled: number;
  unfulfilled: number;
  rate: number;
}