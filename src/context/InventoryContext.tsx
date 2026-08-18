import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, FulfillmentData, LogEntry, UserRole } from '../types';

interface InventoryContextType {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  deleteItem: (id: string) => void;
  fulfillmentData: FulfillmentData[];
  logs: LogEntry[];
  addLog: (action: LogEntry['action'], details: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const mockInitialData: InventoryItem[] = [
  { id: '1', name: 'Wireless Mouse', sku: 'WM-001', category: 'Electronics', quantity: 150, minThreshold: 20, location: 'Aisle 1', status: 'In Stock', lastUpdated: new Date().toISOString() },
  { id: '2', name: 'Mechanical Keyboard', sku: 'MK-002', category: 'Electronics', quantity: 12, minThreshold: 15, location: 'Aisle 2', status: 'Low Stock', lastUpdated: new Date().toISOString() },
  { id: '3', name: 'Desk Chair', sku: 'DC-003', category: 'Furniture', quantity: 0, minThreshold: 5, location: 'Aisle 3', status: 'Out of Stock', lastUpdated: new Date().toISOString() },
  { id: '4', name: 'USB-C Cable', sku: 'UC-004', category: 'Accessories', quantity: 500, minThreshold: 50, location: 'Aisle 1', status: 'In Stock', lastUpdated: new Date().toISOString() },
];

const mockFulfillmentData: FulfillmentData[] = [
  { date: 'Mon', fulfilled: 120, unfulfilled: 5, rate: 96 },
  { date: 'Tue', fulfilled: 132, unfulfilled: 8, rate: 94.2 },
  { date: 'Wed', fulfilled: 101, unfulfilled: 2, rate: 98 },
  { date: 'Thu', fulfilled: 145, unfulfilled: 10, rate: 93.5 },
  { date: 'Fri', fulfilled: 150, unfulfilled: 0, rate: 100 },
  { date: 'Sat', fulfilled: 80, unfulfilled: 1, rate: 98.7 },
  { date: 'Sun', fulfilled: 90, unfulfilled: 2, rate: 97.8 },
];

const mockLogs: LogEntry[] = [
  { id: 'l1', action: 'UPDATE', details: 'System initialized with initial inventory.', timestamp: new Date().toISOString(), userRole: 'Admin' }
];

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>(mockInitialData);
  const [fulfillmentData] = useState<FulfillmentData[]>(mockFulfillmentData);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [role, setRole] = useState<UserRole>('Admin');

  const addLog = (action: LogEntry['action'], details: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date().toISOString(),
      userRole: role
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const addItem = (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString()
    };
    setItems(prev => [newItem, ...prev]);
    addLog('ADD', `Added new item: ${item.name} (SKU: ${item.sku}) with qty ${item.quantity}`);
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
          if (quantity === 0) status = 'Out of Stock';
          else if (quantity <= item.minThreshold) status = 'Low Stock';
          
          addLog('UPDATE', `Updated qty for ${item.name} (SKU: ${item.sku}) from ${item.quantity} to ${quantity}`);
          return { ...item, quantity, status, lastUpdated: new Date().toISOString() };
        }
        return item;
      });
      return updated;
    });
  };

  const deleteItem = (id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    if (itemToDelete) {
      addLog('DELETE', `Deleted item: ${itemToDelete.name} (SKU: ${itemToDelete.sku})`);
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <InventoryContext.Provider value={{ items, addItem, updateItemQuantity, deleteItem, fulfillmentData, logs, addLog, role, setRole }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within an InventoryProvider');
  return context;
};