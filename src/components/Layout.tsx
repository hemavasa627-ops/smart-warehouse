import React, { useState } from 'react';
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
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
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
}\n