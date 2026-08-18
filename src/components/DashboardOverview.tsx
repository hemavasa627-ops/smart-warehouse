import React from 'react';
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
    { title: 'Fulfillment Rate', value: `${currentFulfillment}%`, icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
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
}