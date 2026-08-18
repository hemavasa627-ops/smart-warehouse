import React from 'react';
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
    link.download = `Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`;
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
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
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
}