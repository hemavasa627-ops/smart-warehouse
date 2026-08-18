import React from 'react';
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

    doc.save(`Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
}