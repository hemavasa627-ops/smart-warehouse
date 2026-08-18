import React, { useEffect, useState } from 'react';
import { X, ScanLine } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export default function ScannerModal({ onClose, onScan }: { onClose: () => void, onScan: (sku: string) => void }) {
  const { addLog } = useInventory();
  const [scanning, setScanning] = useState(true);

  // Simulate scanning a barcode after 2 seconds
  useEffect(() => {
    addLog('SCAN', 'Opened Barcode Scanner');
    const timer = setTimeout(() => {
      setScanning(false);
      onScan('MK-002'); // Mock scanned SKU
    }, 2000);
    return () => clearTimeout(timer);
  }, [addLog, onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-2">Scan Barcode / QR Code</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Align the code within the frame</p>
        
        <div className="relative w-64 h-64 mx-auto mb-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border-4 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
          {scanning ? (
            <>
              <ScanLine className="h-12 w-12 text-indigo-500 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent h-1/2 w-full animate-scan"></div>
            </>
          ) : (
            <p className="text-emerald-500 font-bold">Scanned: MK-002</p>
          )}
        </div>
        
        <p className="text-sm text-slate-500">
          {scanning ? "Simulating camera input..." : "Processing result..."}
        </p>
      </div>
    </div>
  );
}