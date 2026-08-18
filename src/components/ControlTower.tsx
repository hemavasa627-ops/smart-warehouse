import React from 'react';
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
                  Requested: {order.items.map(i => `${i.quantity}x ${i.sku}`).join(', ')}
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
}
