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
}`,

  'src/context/EngineContext.tsx': `import React, { createContext, useContext, useState, useEffect } from 'react';
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
        
        addLog('EXCEPTION', \`Marked \${qty} of \${item.name} (\${sku}) as damaged.\`);
        addLog('REORDER', \`Auto-Reorder triggered for \${item.name} (\${sku}) due to damage.\`);
        
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
        addLog('UPDATE', \`Order \${order.id} priority auto-assigned to \${nextPriority}\`);
      } 
      else if (order.status === 'Priority Assigned') {
        const canFulfill = checkAllocation(order);
        if (canFulfill) {
          nextStatus = 'Stock Allocated';
          executeAllocation(order);
          addLog('ALLOCATE', \`Order \${order.id} stock fully allocated\`);
        } else {
          nextStatus = 'Exception: Stock';
          addLog('EXCEPTION', \`Order \${order.id} failed allocation due to insufficient stock\`);
        }
      }
      else if (order.status === 'Stock Allocated') nextStatus = 'Picking';
      else if (order.status === 'Picking') nextStatus = 'Packing';
      else if (order.status === 'Packing') nextStatus = 'QC';
      else if (order.status === 'QC') {
        nextStatus = 'Dispatched';
        addLog('DISPATCH', \`Order \${order.id} dispatched successfully\`);
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
      addLog('UPDATE', \`Order \${orderId} resolved via Partial Fulfillment\`);
      progressOrder(orderId, 'Stock Allocated');
      // For simplicity in this demo, we assume the manager adjusted the quantities manually or approved a split shipment
    } else {
      addLog('UPDATE', \`Order \${orderId} marked as Backorder\`);
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
};`,

  'src/components/Layout.tsx': `import React, { useState } from 'react';
import { LayoutDashboard, Package, Activity, Bell, Shield, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useEngine } from '../context/EngineContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { inventory, orders, role, setRole } = useEngine();
  const [showNotifications, setShowNotifications] = useState(false);

  const exceptions = orders.filter(o => o.status === 'Exception: Stock');
  const lowStock = inventory.filter(i => i.status !== 'In Stock');
  const totalAlerts = exceptions.length + lowStock.length;

  const navItems = [
    { id: 'active-orders', label: 'Active Orders', icon: LayoutDashboard },
    { id: 'inventory-health', label: 'Inventory Health', icon: Package },
    { id: 'control-tower', label: 'Control Tower', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
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
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">System Alerts</div>
                  <div className="max-h-64 overflow-y-auto">
                    {totalAlerts === 0 ? (
                      <p className="p-4 text-sm text-slate-500 text-center">Systems nominal.</p>
                    ) : (
                      <div className="p-2 space-y-1">
                        {exceptions.map(ex => (
                          <div key={ex.id} className="p-2 text-sm rounded bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300">
                            <strong>Order Exception:</strong> {ex.id} lacks stock allocation!
                          </div>
                        ))}
                        {lowStock.map(item => (
                          <div key={item.id} className="p-2 text-sm rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
                            <strong>Low Stock:</strong> {item.name} ({item.quantity} left).
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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

  'src/components/ActiveOrders.tsx': `import React from 'react';
import { useEngine } from '../context/EngineContext';
import { ArrowRight, AlertOctagon, CheckCircle2, Clock } from 'lucide-react';
import { OrderStatus } from '../types';

export default function ActiveOrders() {
  const { orders, progressOrder } = useEngine();

  const getActionLabel = (status: OrderStatus) => {
    switch(status) {
      case 'Created': return 'Assign Priority';
      case 'Priority Assigned': return 'Run Allocation';
      case 'Stock Allocated': return 'Start Picking';
      case 'Picking': return 'Send to Packing';
      case 'Packing': return 'Send to QC';
      case 'QC': return 'Dispatch Order';
      default: return null;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    if (status === 'Dispatched') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (status === 'Exception: Stock') return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Active Orders Pipeline</h2>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Order ID</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Customer</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Deadline</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Priority</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Status</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const actionLabel = getActionLabel(order.status);
              return (
                <tr key={order.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 font-medium">{order.id}</td>
                  <td className="py-4 px-6 text-sm">{order.customer}</td>
                  <td className="py-4 px-6 text-sm">
                    <div className="flex items-center text-slate-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(order.deadline).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {order.priority === 'URGENT' ? (
                      <span className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400">
                        <AlertOctagon className="w-3 h-3 mr-1" /> URGENT
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">{order.priority}</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={\`px-2.5 py-1 rounded-full text-xs font-medium border \${getStatusBadge(order.status)}\`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {actionLabel ? (
                      <button 
                        onClick={() => progressOrder(order.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        {actionLabel} <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    ) : (
                      order.status === 'Dispatched' ? <CheckCircle2 className="w-5 h-5 text-emerald-500 inline-block" /> : <span className="text-sm text-rose-500">Requires Attention</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,

  'src/components/ControlTower.tsx': `import React from 'react';
import { useEngine } from '../context/EngineContext';
import { AlertOctagon, TrendingDown, Activity, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ControlTower() {
  const { orders, resolveException } = useEngine();

  const exceptions = orders.filter(o => o.status === 'Exception: Stock');

  // Calculate bottlenecks
  const bottleneckData = orders.filter(o => o.timestamps['Picking'] && o.timestamps['Created']).map(o => {
    const created = new Date(o.timestamps['Created']!).getTime();
    const allocated = o.timestamps['Stock Allocated'] ? new Date(o.timestamps['Stock Allocated']!).getTime() : created;
    const picking = o.timestamps['Picking'] ? new Date(o.timestamps['Picking']!).getTime() : allocated;
    const packing = o.timestamps['Packing'] ? new Date(o.timestamps['Packing']!).getTime() : Date.now();
    
    // Duration in minutes
    return {
      order: o.id,
      pickingTime: Math.round((picking - allocated) / 60000),
      packingTime: Math.round((packing - picking) / 60000),
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Exceptions Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center text-rose-600 dark:text-rose-400 mb-4">
            <AlertOctagon className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">Exception Handling</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">Orders blocked by inventory limits.</p>
          
          <div className="space-y-4">
            {exceptions.length === 0 ? (
              <p className="text-emerald-500 text-sm font-medium">No active exceptions.</p>
            ) : exceptions.map(order => (
              <div key={order.id} className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-900/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold">{order.id}</span>
                  <span className="text-xs bg-rose-200 dark:bg-rose-800 px-2 py-0.5 rounded text-rose-800 dark:text-rose-200">STOCK OUT</span>
                </div>
                <p className="text-xs mb-3 text-slate-600 dark:text-slate-300">
                  Requested: {order.items.map(i => \`\${i.quantity}x \${i.sku}\`).join(', ')}
                </p>
                <div className="flex space-x-2">
                  <button onClick={() => resolveException(order.id, 'Partial')} className="flex-1 bg-white dark:bg-slate-800 text-xs font-medium py-1.5 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    Partial Fulfill
                  </button>
                  <button onClick={() => resolveException(order.id, 'Backorder')} className="flex-1 bg-rose-600 text-white text-xs font-medium py-1.5 rounded hover:bg-rose-700 transition">
                    Backorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Bottlenecks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center text-indigo-600 dark:text-indigo-400 mb-6">
            <Activity className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">Operational Bottlenecks (Minutes/Stage)</h2>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottleneckData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="order" type="category" stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                <Bar dataKey="pickingTime" name="Picking Duration" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="packingTime" name="Packing Duration" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 text-sm rounded-lg border border-amber-200 dark:border-amber-800/50">
            <Clock className="w-4 h-4 mr-2" />
            <strong>Insight:</strong> Order ORD-003 has been stuck in the Picking phase significantly longer than average. Check Aisle 1 for blockages.
          </div>
        </div>

      </div>
    </div>
  );
}`,

  'src/components/InventoryHealth.tsx': `import React, { useState } from 'react';
import { useEngine } from '../context/EngineContext';
import { Search, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';

export default function InventoryHealth() {
  const { inventory, markDamaged, role } = useEngine();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Predictive Reordering Widget */}
      <div className="bg-indigo-600 rounded-xl p-6 shadow-sm text-white flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center mb-1"><TrendingUp className="w-5 h-5 mr-2" /> Predictive Reordering</h2>
          <p className="text-indigo-200 text-sm">Decision Engine suggests restocking these items before they run out based on daily usage rates.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          {inventory.filter(i => (i.quantity / i.dailyUsageRate) < 5 && i.quantity > 0).map(item => (
            <div key={item.id} className="bg-white/10 p-3 rounded-lg border border-white/20 backdrop-blur-sm">
              <p className="text-xs text-indigo-200 font-medium">{item.sku}</p>
              <p className="font-bold">{item.name}</p>
              <p className="text-xs mt-1 text-rose-300">{Math.floor(item.quantity / item.dailyUsageRate)} days of stock left</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search SKU, Name..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Item</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Location</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Quantity</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Damaged (Loss)</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300">Status</th>
                {role !== 'Worker' && <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const isBelowThreshold = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id} className={\`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors \${isBelowThreshold && item.quantity > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}\`}>
                    <td className="py-4 px-6">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{item.location}</td>
                    <td className="py-4 px-6 font-medium">{item.quantity}</td>
                    <td className="py-4 px-6">
                      <span className="text-rose-500 font-medium">{item.damagedQuantity}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={\`px-2.5 py-1 rounded-full text-xs font-medium border \${item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'}\`}>
                        {item.status}
                      </span>
                    </td>
                    {role !== 'Worker' && (
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => {
                            if (window.confirm(\`Mark 1 unit of \${item.name} as damaged?\`)) {
                              markDamaged(item.sku, 1);
                            }
                          }} 
                          className="inline-flex items-center px-3 py-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                        >
                          <ShieldAlert className="w-3 h-3 mr-1" /> Mark Damaged
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`,

  'src/App.tsx': `import React, { useState } from 'react';
import Layout from './components/Layout';
import ActiveOrders from './components/ActiveOrders';
import InventoryHealth from './components/InventoryHealth';
import ControlTower from './components/ControlTower';

function App() {
  const [activeTab, setActiveTab] = useState('active-orders');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'active-orders' && <ActiveOrders />}
      {activeTab === 'inventory-health' && <InventoryHealth />}
      {activeTab === 'control-tower' && <ControlTower />}
    </Layout>
  );
}

export default App;`,

  'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { EngineProvider } from './context/EngineContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <EngineProvider>
        <App />
      </EngineProvider>
    </ThemeProvider>
  </React.StrictMode>,
)`,
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\\n');
}
console.log('Engine architecture updated successfully.');
