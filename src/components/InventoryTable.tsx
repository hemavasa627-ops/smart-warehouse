import React, { useState } from 'react';
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
    link.download = `Smart_Warehouse_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
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

    doc.save(`Smart_Warehouse_Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
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
                    <tr key={item.id} className={`border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isBelowThreshold && item.quantity > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
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
}