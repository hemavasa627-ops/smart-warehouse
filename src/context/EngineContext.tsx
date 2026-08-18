import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, LogEntry, UserRole, Order, OrderStatus } from '../types';

interface EngineContextType {
  inventory: InventoryItem[];
  orders: Order[];
  logs: LogEntry[];
  role: UserRole;
  setRole: (role: UserRole) => void;
  markDamaged: (sku: string, qty: number) => void;
  progressOrder: (orderId: string, targetState?: OrderStatus) => void;
  resolveException: (orderId: string, resolution: 'Partial' | 'Backorder') => void;
}

const mockInventory: InventoryItem[] = [
  { id: '1', name: 'Wireless Mouse', sku: 'WM-001', category: 'Electronics', quantity: 150, minThreshold: 20, location: 'Aisle 1', status: 'In Stock', lastUpdated: new Date().toISOString(), dailyUsageRate: 5, damagedQuantity: 0 },
  { id: '2', name: 'Mechanical Keyboard', sku: 'MK-002', category: 'Electronics', quantity: 12, minThreshold: 15, location: 'Aisle 2', status: 'Low Stock', lastUpdated: new Date().toISOString(), dailyUsageRate: 2, damagedQuantity: 0 },
  { id: '3', name: 'Desk Chair', sku: 'DC-003', category: 'Furniture', quantity: 50, minThreshold: 10, location: 'Aisle 3', status: 'In Stock', lastUpdated: new Date().toISOString(), dailyUsageRate: 1, damagedQuantity: 0 },
  { id: '4', name: 'USB-C Cable', sku: 'UC-004', category: 'Accessories', quantity: 500, minThreshold: 50, location: 'Aisle 1', status: 'In Stock', lastUpdated: new Date().toISOString(), dailyUsageRate: 25, damagedQuantity: 0 },
];

// Mock timelines for bottleneck chart
const pastTime = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60000).toISOString();

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: 'Tech Corp',
    items: [{ sku: 'WM-001', name: 'Wireless Mouse', quantity: 50 }],
    status: 'Created',
    priority: 'UNASSIGNED',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days
    timestamps: { 'Created': pastTime(10) }
  },
  {
    id: 'ORD-002',
    customer: 'Urgent Studios',
    items: [{ sku: 'MK-002', name: 'Mechanical Keyboard', quantity: 20 }], // Asking for 20, we only have 12 -> Exception trigger
    status: 'Priority Assigned',
    priority: 'URGENT',
    deadline: new Date(Date.now() + 43200000).toISOString(), // 12 hours
    timestamps: { 'Created': pastTime(120), 'Priority Assigned': pastTime(110) }
  },
  {
    id: 'ORD-003',
    customer: 'Global Trade',
    items: [{ sku: 'UC-004', name: 'USB-C Cable', quantity: 100 }],
    status: 'Picking',
    priority: 'NORMAL',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    timestamps: { 'Created': pastTime(300), 'Priority Assigned': pastTime(290), 'Stock Allocated': pastTime(280), 'Picking': pastTime(60) } // Taking a long time in Picking!
  },
  {
    id: 'ORD-004',
    customer: 'Alpha Design',
    items: [{ sku: 'DC-003', name: 'Desk Chair', quantity: 5 }],
    status: 'Packing',
    priority: 'NORMAL',
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    timestamps: { 'Created': pastTime(400), 'Priority Assigned': pastTime(390), 'Stock Allocated': pastTime(380), 'Picking': pastTime(350), 'Packing': pastTime(10) } 
  }
];

const EngineContext = createContext<EngineContextType | undefined>(undefined);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [role, setRole] = useState<UserRole>('Admin');

  const addLog = (action: LogEntry['action'], details: string) => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date().toISOString(),
      userRole: role
    }, ...prev]);
  };

  const markDamaged = (sku: string, qty: number) => {
    setInventory(prev => prev.map(item => {
      if (item.sku === sku) {
        const newQty = Math.max(0, item.quantity - qty);
        let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
        if (newQty === 0) status = 'Out of Stock';
        else if (newQty <= item.minThreshold) status = 'Low Stock';
        
        addLog('EXCEPTION', `Marked ${qty} of ${item.name} (${sku}) as damaged.`);
        addLog('REORDER', `Auto-Reorder triggered for ${item.name} (${sku}) due to damage.`);
        
        return { ...item, quantity: newQty, damagedQuantity: item.damagedQuantity + qty, status };
      }
      return item;
    }));
  };

  const checkAllocation = (order: Order): boolean => {
    let canFulfill = true;
    order.items.forEach(orderItem => {
      const invItem = inventory.find(i => i.sku === orderItem.sku);
      if (!invItem || invItem.quantity < orderItem.quantity) {
        canFulfill = false;
      }
    });
    return canFulfill;
  };

  const executeAllocation = (order: Order) => {
    setInventory(prev => prev.map(invItem => {
      const orderReq = order.items.find(i => i.sku === invItem.sku);
      if (orderReq) {
        const newQty = invItem.quantity - orderReq.quantity;
        let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
        if (newQty === 0) status = 'Out of Stock';
        else if (newQty <= invItem.minThreshold) status = 'Low Stock';
        return { ...invItem, quantity: newQty, status };
      }
      return invItem;
    }));
  };

  const progressOrder = (orderId: string, forceTargetState?: OrderStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const now = new Date().toISOString();
      const updatedTimestamps = { ...order.timestamps };
      
      let nextStatus = order.status;
      let nextPriority = order.priority;

      if (order.status === 'Created') {
        nextStatus = 'Priority Assigned';
        // Auto decision engine
        const hoursToDeadline = (new Date(order.deadline).getTime() - Date.now()) / 3600000;
        nextPriority = hoursToDeadline < 24 ? 'URGENT' : 'NORMAL';
        addLog('UPDATE', `Order ${order.id} priority auto-assigned to ${nextPriority}`);
      } 
      else if (order.status === 'Priority Assigned') {
        const canFulfill = checkAllocation(order);
        if (canFulfill) {
          nextStatus = 'Stock Allocated';
          executeAllocation(order);
          addLog('ALLOCATE', `Order ${order.id} stock fully allocated`);
        } else {
          nextStatus = 'Exception: Stock';
          addLog('EXCEPTION', `Order ${order.id} failed allocation due to insufficient stock`);
        }
      }
      else if (order.status === 'Stock Allocated') nextStatus = 'Picking';
      else if (order.status === 'Picking') nextStatus = 'Packing';
      else if (order.status === 'Packing') nextStatus = 'QC';
      else if (order.status === 'QC') {
        nextStatus = 'Dispatched';
        addLog('DISPATCH', `Order ${order.id} dispatched successfully`);
      }

      // If forcing a state (like after exception resolution)
      if (forceTargetState) {
        nextStatus = forceTargetState;
      }

      updatedTimestamps[nextStatus] = now;
      return { ...order, status: nextStatus, priority: nextPriority, timestamps: updatedTimestamps };
    }));
  };

  const resolveException = (orderId: string, resolution: 'Partial' | 'Backorder') => {
    if (resolution === 'Partial') {
      addLog('UPDATE', `Order ${orderId} resolved via Partial Fulfillment`);
      progressOrder(orderId, 'Stock Allocated');
      // For simplicity in this demo, we assume the manager adjusted the quantities manually or approved a split shipment
    } else {
      addLog('UPDATE', `Order ${orderId} marked as Backorder`);
      // Keeps exception state or pushes to a waiting state, we'll keep it in Exception for demo
    }
  };

  return (
    <EngineContext.Provider value={{ inventory, orders, logs, role, setRole, markDamaged, progressOrder, resolveException }}>
      {children}
    </EngineContext.Provider>
  );
};

export const useEngine = () => {
  const context = useContext(EngineContext);
  if (!context) throw new Error('useEngine must be used within EngineProvider');
  return context;
};\n