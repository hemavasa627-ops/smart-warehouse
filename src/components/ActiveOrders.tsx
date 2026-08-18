import React from 'react';
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
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
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
}\n