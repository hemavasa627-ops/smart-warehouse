import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Camera } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import ScannerModal from './ScannerModal';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(3, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  minThreshold: z.number().min(0, 'Must be positive'),
  location: z.string().min(2, 'Location is required'),
});

type FormData = z.infer<typeof schema>;

export default function AddItemModal({ onClose }: { onClose: () => void }) {
  const { addItem } = useInventory();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 0, minThreshold: 10 }
  });

  const onSubmit = (data: FormData) => {
    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (data.quantity === 0) status = 'Out of Stock';
    else if (data.quantity <= data.minThreshold) status = 'Low Stock';

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
              <div className="relative">
                <input 
                  {...register('sku')} 
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. WK-001"
                />
                <button type="button" onClick={() => setIsScannerOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Qty</label>
              <input 
                type="number"
                {...register('quantity', { valueAsNumber: true })} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              {errors.quantity && <p className="text-rose-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Alert</label>
              <input 
                type="number"
                {...register('minThreshold', { valueAsNumber: true })} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              {errors.minThreshold && <p className="text-rose-500 text-xs mt-1">{errors.minThreshold.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input 
                {...register('location')} 
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="Aisle 4"
              />
              {errors.location && <p className="text-rose-500 text-xs mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Save Item
            </button>
          </div>
        </form>
      </div>

      {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScan={(sku) => {
        setValue('sku', sku);
        setIsScannerOpen(false);
      }} />}
    </div>
  );
}