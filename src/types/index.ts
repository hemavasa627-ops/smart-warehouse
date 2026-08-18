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
  dailyUsageRate: number;
  damagedQuantity: number;
}

export type UserRole = 'Admin' | 'Manager' | 'Worker';

export interface LogEntry {
  id: string;
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'SCAN' | 'EXPORT' | 'ALLOCATE' | 'EXCEPTION' | 'DISPATCH' | 'REORDER';
  details: string;
  timestamp: string;
  userRole: UserRole;
}

export type OrderStatus = 'Created' | 'Priority Assigned' | 'Stock Allocated' | 'Picking' | 'Packing' | 'QC' | 'Dispatched' | 'Exception: Stock';
export type Priority = 'NORMAL' | 'URGENT' | 'UNASSIGNED';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  status: OrderStatus;
  priority: Priority;
  deadline: string; // ISO string
  timestamps: Partial<Record<OrderStatus, string>>;
}

export interface FulfillmentData {
  date: string;
  fulfilled: number;
  unfulfilled: number;
  rate: number;
}
