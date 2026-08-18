import React, { useState } from 'react';
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
                  <tr key={item.id} className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isBelowThreshold && item.quantity > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`}>
                        {item.status}
                      </span>
                    </td>
                    {role !== 'Worker' && (
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => {
                            if (window.confirm(`Mark 1 unit of ${item.name} as damaged?`)) {
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
}
