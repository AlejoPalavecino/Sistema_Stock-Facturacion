import React, { useState, useEffect, useCallback } from 'react';
import { Purchase, PurchaseItem, Supplier, Product } from '../../types';
import { Modal } from '../shared/Modal.tsx';
import { SupplierPicker } from './SupplierPicker.tsx';
import { ProductPicker } from '../invoicing/ProductPicker.tsx';
import { PurchaseItemsTable } from './PurchaseItemsTable.tsx';
import { formatARS } from '../../utils/format.ts';
import * as purchasesRepo from '../../services/db/purchasesRepo.ts';

interface PurchaseFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const getInitialState = (): Omit<Purchase, 'id'|'createdAt'|'updatedAt'|'totalAmountARS'|'status'> => ({
    supplierId: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    notes: '',
});

export const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState(getInitialState);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isSupplierPickerOpen, setSupplierPickerOpen] = useState(false);
  const [isProductPickerOpen, setProductPickerOpen] = useState(false);

  const total = React.useMemo(() => formData.items.reduce((sum, item) => sum + item.lineTotalARS, 0), [formData.items]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData(prev => ({ ...prev, supplierId: supplier.id }));
    setSelectedSupplierName(supplier.businessName);
    setSupplierPickerOpen(false);
  };

  const handleProductSelect = (product: Product) => {
    const newItem: PurchaseItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      qty: 1,
      unitPriceARS: 0, // Cost price to be entered by user
      lineTotalARS: 0,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setProductPickerOpen(false);
  };
  
  const handleItemUpdate = (index: number, updatedItem: PurchaseItem) => {
      setFormData(prev => {
          const newItems = [...prev.items];
          newItems[index] = updatedItem;
          return { ...prev, items: newItems };
      });
  };
  
  const handleItemRemove = (index: number) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index)}));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await purchasesRepo.create(formData);
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la factura.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block mb-1.5 text-base font-medium text-slate-600">Proveedor</label>
          <div 
            onClick={() => setSupplierPickerOpen(true)} 
            className="w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg min-h-[42px] flex items-center cursor-pointer"
          >
            {selectedSupplierName || 'Seleccionar proveedor...'}
          </div>
        </div>
        <div>
          <label className="block mb-1.5 text-base font-medium text-slate-600">Nº Factura Proveedor</label>
          <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleFieldChange} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg"/>
        </div>
        <div>
          <label className="block mb-1.5 text-base font-medium text-slate-600">Fecha</label>
          <input type="date" name="date" value={formData.date} onChange={handleFieldChange} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg"/>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Ítems de la Compra</h3>
        <PurchaseItemsTable 
            items={formData.items}
            onUpdate={handleItemUpdate}
            onRemove={handleItemRemove}
        />
        <button 
            onClick={() => setProductPickerOpen(true)} 
            className="mt-4 bg-green-500 text-white font-semibold text-base py-2 px-4 rounded-lg shadow-sm hover:bg-green-600"
        >
            Agregar Producto
        </button>
      </div>

      <div className="flex justify-between items-start gap-4">
        <div className="flex-grow">
            <label className="block mb-1.5 text-base font-medium text-slate-600">Notas</label>
            <textarea name="notes" value={formData.notes} onChange={handleFieldChange} rows={3} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg"></textarea>
        </div>
        <div className="w-full max-w-sm bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between text-xl font-bold text-slate-900">
                <span>Total Factura</span>
                <span>{formatARS(total)}</span>
            </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-center my-4">{error}</p>}

      <div className="flex justify-end gap-4 border-t border-slate-200 pt-6 mt-6">
        <button onClick={onCancel} className="text-base font-semibold text-slate-700 py-2.5 px-5 rounded-lg hover:bg-slate-100">
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">
          {isSaving ? 'Guardando...' : 'Guardar Factura'}
        </button>
      </div>
      
      <Modal isOpen={isSupplierPickerOpen} onClose={() => setSupplierPickerOpen(false)} title="Seleccionar Proveedor">
          <SupplierPicker onSelect={handleSupplierSelect} />
      </Modal>

      <Modal isOpen={isProductPickerOpen} onClose={() => setProductPickerOpen(false)} title="Agregar Producto">
          <ProductPicker onSelectProduct={handleProductSelect} allowZeroStock={true} />
      </Modal>
    </div>
  );
};