const fs = require('fs');
const path = require('path');

const files = {
  'src/types/index.ts': `export interface InventoryItem {
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
}`,

  'src/context/InventoryContext.tsx': `import React, { createContext, useContext, useState, useEffect } from 'react';
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
    addLog('ADD', \`Added new item: \${item.name} (SKU: \${item.sku}) with qty \${item.quantity}\`);
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
          if (quantity === 0) status = 'Out of Stock';
          else if (quantity <= item.minThreshold) status = 'Low Stock';
          
          addLog('UPDATE', \`Updated qty for \${item.name} (SKU: \${item.sku}) from \${item.quantity} to \${quantity}\`);
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
      addLog('DELETE', \`Deleted item: \${itemToDelete.name} (SKU: \${itemToDelete.sku})\`);
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
};`,

  'src/components/Layout.tsx': `import React, { useState } from 'react';
import { Package, LayoutDashboard, BarChart3, Moon, Sun, History, Bell, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useInventory } from '../context/InventoryContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { items, role, setRole } = useInventory();
  const [showNotifications, setShowNotifications] = useState(false);

  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold && item.quantity > 0);
  const outOfStockItems = items.filter(item => item.quantity === 0);
  const totalAlerts = lowStockItems.length + outOfStockItems.length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'Activity Logs', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
          <span className="font-bold text-lg tracking-tight">Smart Warehouse</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={\`w-full flex items-center px-4 py-3 rounded-lg transition-colors \${isActive ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 relative">
          <h1 className="text-xl font-semibold capitalize">{activeTab.replace('-', ' ')}</h1>
          
          <div className="flex items-center space-x-4">
            {/* RBAC Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <Shield className="h-4 w-4 text-slate-500 ml-2" />
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent border-none text-sm font-medium py-1 px-2 focus:ring-0 outline-none cursor-pointer"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Worker">Worker</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
                <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                {totalAlerts > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">Alerts</div>
                  <div className="max-h-64 overflow-y-auto">
                    {totalAlerts === 0 ? (
                      <p className="p-4 text-sm text-slate-500 text-center">No alerts right now.</p>
                    ) : (
                      <div className="p-2 space-y-1">
                        {outOfStockItems.map(item => (
                          <div key={item.id} className="p-2 text-sm rounded bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300">
                            <strong>{item.name}</strong> is out of stock!
                          </div>
                        ))}
                        {lowStockItems.map(item => (
                          <div key={item.id} className="p-2 text-sm rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
                            <strong>{item.name}</strong> is low ({item.quantity} left, threshold: {item.minThreshold}).
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              {theme === 'dark' ? <Sun className="h-5 w-5 text-slate-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}`,

  'src/components/History.tsx': `import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Download } from 'lucide-react';
import Papa from 'papaparse';

export default function History() {
  const { logs, addLog } = useInventory();

  const handleExportLogs = () => {
    const csv = Papa.unparse(logs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`Activity_Logs_\${new Date().toISOString().split('T')[0]}.csv\`;
    link.click();
    addLog('EXPORT', 'Exported activity logs to CSV');
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'ADD': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      case 'DELETE': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200';
      case 'SCAN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Activity Logs</h2>
        <button onClick={handleExportLogs} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <Download className="h-4 w-4 mr-2" /> Export Logs
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300 w-48">Timestamp</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300 w-32">User Role</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300 w-32">Action</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-4 px-6 font-medium text-sm">{log.userRole}</td>
                  <td className="py-4 px-6">
                    <span className={\`px-2.5 py-1 rounded-full text-xs font-medium border \${getActionColor(log.action)}\`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`,

  'src/components/ScannerModal.tsx': `import React, { useEffect, useState } from 'react';
import { X, ScanLine } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export default function ScannerModal({ onClose, onScan }: { onClose: () => void, onScan: (sku: string) => void }) {
  const { addLog } = useInventory();
  const [scanning, setScanning] = useState(true);

  // Simulate scanning a barcode after 2 seconds
  useEffect(() => {
    addLog('SCAN', 'Opened Barcode Scanner');
    const timer = setTimeout(() => {
      setScanning(false);
      onScan('MK-002'); // Mock scanned SKU
    }, 2000);
    return () => clearTimeout(timer);
  }, [addLog, onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-2">Scan Barcode / QR Code</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Align the code within the frame</p>
        
        <div className="relative w-64 h-64 mx-auto mb-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border-4 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
          {scanning ? (
            <>
              <ScanLine className="h-12 w-12 text-indigo-500 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent h-1/2 w-full animate-scan"></div>
            </>
          ) : (
            <p className="text-emerald-500 font-bold">Scanned: MK-002</p>
          )}
        </div>
        
        <p className="text-sm text-slate-500">
          {scanning ? "Simulating camera input..." : "Processing result..."}
        </p>
      </div>
    </div>
  );
}`,

  'src/components/InventoryTable.tsx': `import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Search, Plus, Download, Edit2, Trash2, Camera, FileText } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AddItemModal from './AddItemModal';
import ScannerModal from './ScannerModal';

export default function InventoryTable() {
  const { items, updateItemQuantity, deleteItem, role, addLog } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const csv = Papa.unparse(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`Smart_Warehouse_Inventory_\${new Date().toISOString().split('T')[0]}.csv\`;
    link.click();
    addLog('EXPORT', 'Exported inventory report to CSV');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Smart Warehouse Inventory Report', 14, 15);
    
    const tableData = items.map(item => [
      item.sku,
      item.name,
      item.category,
      item.quantity.toString(),
      item.minThreshold.toString(),
      item.status,
      item.location
    ]);

    autoTable(doc, {
      head: [['SKU', 'Name', 'Category', 'Qty', 'Min', 'Status', 'Location']],
      body: tableData,
      startY: 20,
    });

    doc.save(\`Smart_Warehouse_Inventory_\${new Date().toISOString().split('T')[0]}.pdf\`);
    addLog('EXPORT', 'Exported inventory report to PDF');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Stock': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      case 'Low Stock': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'Out of Stock': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search SKU, Name..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsScannerOpen(true)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Scan Barcode">
            <Camera className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download className="h-4 w-4 mr-2" /> CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <FileText className="h-4 w-4 mr-2" /> PDF
          </button>
          {role !== 'Worker' && (
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Item</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Category</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Location</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Quantity</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Status</th>
                {role !== 'Worker' && <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={role !== 'Worker' ? 6 : 5} className="py-8 text-center text-slate-500">No items found matching your search.</td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isBelowThreshold = item.quantity <= item.minThreshold;
                  
                  return (
                    <tr key={item.id} className={\`border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors \${isBelowThreshold && item.quantity > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}\`}>
                      <td className="py-4 px-6">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{item.category}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{item.location}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                            min="0"
                            disabled={role === 'Worker'}
                          />
                          {isBelowThreshold && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Low (Min: {item.minThreshold})</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={\`px-2.5 py-1 rounded-full text-xs font-medium border \${getStatusColor(item.status)}\`}>
                          {item.status}
                        </span>
                      </td>
                      {role !== 'Worker' && (
                        <td className="py-4 px-6 text-right space-x-2">
                          <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {isAddModalOpen && <AddItemModal onClose={() => setIsAddModalOpen(false)} />}
      {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScan={(sku) => {
        setSearchTerm(sku);
        setIsScannerOpen(false);
      }} />}
    </div>
  );
}`,

  'src/components/AddItemModal.tsx': `import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Camera } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import ScannerModal from './ScannerModal';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(3, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  minThreshold: z.number().min(0, 'Must be positive'),
  location: z.string().min(2, 'Location is required'),
});

type FormData = z.infer<typeof schema>;

export default function AddItemModal({ onClose }: { onClose: () => void }) {
  const { addItem } = useInventory();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 0, minThreshold: 10 }
  });

  const onSubmit = (data: FormData) => {
    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (data.quantity === 0) status = 'Out of Stock';
    else if (data.quantity <= data.minThreshold) status = 'Low Stock';

    addItem({ ...data, status });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold">Add New Item</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <input 
              {...register('name')} 
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="e.g. Wireless Keyboard"
            />
            {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <div className="relative">
                <input 
                  {...register('sku')} 
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. WK-001"
                />
                <button type="button" onClick={() => setIsScannerOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              {errors.sku && <p className="text-rose-500 text-xs mt-1">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input 
                {...register('category')} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="e.g. Electronics"
              />
              {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Qty</label>
              <input 
                type="number"
                {...register('quantity', { valueAsNumber: true })} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              {errors.quantity && <p className="text-rose-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Alert</label>
              <input 
                type="number"
                {...register('minThreshold', { valueAsNumber: true })} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              {errors.minThreshold && <p className="text-rose-500 text-xs mt-1">{errors.minThreshold.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input 
                {...register('location')} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="Aisle 4"
              />
              {errors.location && <p className="text-rose-500 text-xs mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Save Item
            </button>
          </div>
        </form>
      </div>

      {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScan={(sku) => {
        setValue('sku', sku);
        setIsScannerOpen(false);
      }} />}
    </div>
  );
}`,

  'src/App.tsx': `import React, { useState } from 'react';
import Layout from './components/Layout';
import DashboardOverview from './components/DashboardOverview';
import Analytics from './components/Analytics';
import InventoryTable from './components/InventoryTable';
import History from './components/History';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardOverview />}
      {activeTab === 'inventory' && <InventoryTable />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'history' && <History />}
    </Layout>
  );
}

export default App;`,

  'src/components/Analytics.tsx': `import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useInventory } from '../context/InventoryContext';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Analytics() {
  const { fulfillmentData, addLog } = useInventory();

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Smart Warehouse Analytics Report', 14, 15);
    
    const tableData = fulfillmentData.map(data => [
      data.date,
      data.fulfilled.toString(),
      data.unfulfilled.toString(),
      data.rate + '%'
    ]);

    autoTable(doc, {
      head: [['Date', 'Fulfilled Orders', 'Unfulfilled Orders', 'Success Rate']],
      body: tableData,
      startY: 20,
    });

    doc.save(\`Analytics_Report_\${new Date().toISOString().split('T')[0]}.pdf\`);
    addLog('EXPORT', 'Exported Analytics report to PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Performance Analytics</h2>
        <button onClick={handleExportPDF} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <FileText className="h-4 w-4 mr-2" /> Export Report (PDF)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-6">Fulfillment Rate (%)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fulfillmentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis domain={['auto', 100]} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-6">Orders Processed</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fulfillmentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
              />
              <Legend />
              <Bar dataKey="fulfilled" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unfulfilled" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}`,
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
}
console.log('Advanced features updated successfully.');
