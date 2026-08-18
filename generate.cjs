const fs = require('fs');
const path = require('path');

const files = {
  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})`,

  'src/index.css': `@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`,

  'src/App.css': '',

  'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { InventoryProvider } from './context/InventoryContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <InventoryProvider>
        <App />
      </InventoryProvider>
    </ThemeProvider>
  </React.StrictMode>,
)`,

  'src/App.tsx': `import React, { useState } from 'react';
import Layout from './components/Layout';
import DashboardOverview from './components/DashboardOverview';
import Analytics from './components/Analytics';
import InventoryTable from './components/InventoryTable';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardOverview />}
      {activeTab === 'inventory' && <InventoryTable />}
      {activeTab === 'analytics' && <Analytics />}
    </Layout>
  );
}

export default App;`,

  'src/types/index.ts': `export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface FulfillmentData {
  date: string;
  fulfilled: number;
  unfulfilled: number;
  rate: number;
}`,

  'src/context/ThemeContext.tsx': `import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};`,

  'src/context/InventoryContext.tsx': `import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, FulfillmentData } from '../types';

interface InventoryContextType {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  deleteItem: (id: string) => void;
  fulfillmentData: FulfillmentData[];
}

const mockInitialData: InventoryItem[] = [
  { id: '1', name: 'Wireless Mouse', sku: 'WM-001', category: 'Electronics', quantity: 150, location: 'Aisle 1', status: 'In Stock', lastUpdated: new Date().toISOString() },
  { id: '2', name: 'Mechanical Keyboard', sku: 'MK-002', category: 'Electronics', quantity: 12, location: 'Aisle 2', status: 'Low Stock', lastUpdated: new Date().toISOString() },
  { id: '3', name: 'Desk Chair', sku: 'DC-003', category: 'Furniture', quantity: 0, location: 'Aisle 3', status: 'Out of Stock', lastUpdated: new Date().toISOString() },
  { id: '4', name: 'USB-C Cable', sku: 'UC-004', category: 'Accessories', quantity: 500, location: 'Aisle 1', status: 'In Stock', lastUpdated: new Date().toISOString() },
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

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>(mockInitialData);
  const [fulfillmentData] = useState<FulfillmentData[]>(mockFulfillmentData);

  const addItem = (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString()
    };
    setItems(prev => [newItem, ...prev]);
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
        if (quantity === 0) status = 'Out of Stock';
        else if (quantity < 20) status = 'Low Stock';
        
        return { ...item, quantity, status, lastUpdated: new Date().toISOString() };
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <InventoryContext.Provider value={{ items, addItem, updateItemQuantity, deleteItem, fulfillmentData }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within an InventoryProvider');
  return context;
};`,

  'src/components/Layout.tsx': `import React from 'react';
import { Package, LayoutDashboard, BarChart3, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2" />
          <span className="font-bold text-lg tracking-tight">ShelfSync</span>
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
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            {theme === 'dark' ? <Sun className="h-5 w-5 text-slate-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>
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

  'src/components/DashboardOverview.tsx': `import React from 'react';
import { Package, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export default function DashboardOverview() {
  const { items, fulfillmentData } = useInventory();

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const lowStock = items.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').length;
  const inStock = items.filter(item => item.status === 'In Stock').length;
  
  const currentFulfillment = fulfillmentData[fulfillmentData.length - 1]?.rate || 0;

  const cards = [
    { title: 'Total Items', value: totalItems.toLocaleString(), icon: Package, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'In Stock Types', value: inStock, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Low/Out of Stock', value: lowStock, icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Fulfillment Rate', value: \`\${currentFulfillment}%\`, icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
              <div className={\`p-3 rounded-lg \${card.bg}\`}>
                <Icon className={\`h-6 w-6 \${card.color}\`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {items.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">SKU: {item.sku} • Location: {item.location}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.quantity} in stock</p>
                <p className="text-xs text-slate-400">{new Date(item.lastUpdated).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,

  'src/components/Analytics.tsx': `import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useInventory } from '../context/InventoryContext';

export default function Analytics() {
  const { fulfillmentData } = useInventory();

  return (
    <div className="space-y-6">
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

  'src/components/InventoryTable.tsx': `import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Search, Plus, Download, Edit2, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import AddItemModal from './AddItemModal';

export default function InventoryTable() {
  const { items, updateItemQuantity, deleteItem } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csv = Papa.unparse(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`ShelfSync_Inventory_\${new Date().toISOString().split('T')[0]}.csv\`;
    link.click();
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
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search SKU, Name, or Category..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </button>
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
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No items found matching your search.</td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={\`px-2.5 py-1 rounded-full text-xs font-medium border \${getStatusColor(item.status)}\`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {isAddModalOpen && <AddItemModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}`,

  'src/components/AddItemModal.tsx': `import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(3, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  location: z.string().min(2, 'Location is required'),
});

type FormData = z.infer<typeof schema>;

export default function AddItemModal({ onClose }: { onClose: () => void }) {
  const { addItem } = useInventory();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 0 }
  });

  const onSubmit = (data: FormData) => {
    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (data.quantity === 0) status = 'Out of Stock';
    else if (data.quantity < 20) status = 'Low Stock';

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
              <input 
                {...register('sku')} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="e.g. WK-001"
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input 
                type="number"
                {...register('quantity', { valueAsNumber: true })} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              {errors.quantity && <p className="text-rose-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input 
                {...register('location')} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="e.g. Aisle 4"
              />
              {errors.location && <p className="text-rose-500 text-xs mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Add Item
            </button>
          </div>
        </form>
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
console.log('All files generated successfully.');
