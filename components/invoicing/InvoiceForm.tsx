import React, { useState, useEffect, useMemo } from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import { Invoice, InvoiceItem, TaxRate, PaymentMethod, InvoiceType, Concept } from '../../types/invoice';
import { Client } from '../../types/client';
import { Product } from '../../types/product';
import { ClientPicker } from './ClientPicker';
import { ProductPicker } from './ProductPicker';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { formatARS } from '../../utils/format';
import { Modal } from '../shared/Modal';

interface InvoiceFormProps {
  invoiceId: string;
  onClose: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoiceId, onClose }) => {
  const { getById, updateInvoice, issueInvoice, cancelInvoice, removeDraft } = useInvoices();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClientPickerOpen, setClientPickerOpen] = useState(false);
  const [isProductPickerOpen, setProductPickerOpen] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      const data = await getById(invoiceId);
      setInvoice(data);
    };
    fetchInvoice();
  }, [invoiceId, getById]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!invoice) return;
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
  };

  const handleClientSelect = (client: Client) => {
    if (!invoice) return;
    setInvoice({
      ...invoice,
      clientId: client.id,
      clientName: client.name,
      clientDocType: client.docType,
      clientDocNumber: client.docNumber,
    });
    setClientPickerOpen(false);
  };

  const handleProductSelect = (product: Product) => {
    if (!invoice) return;
    const newItem: InvoiceItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      qty: 1,
      unitPriceARS: product.priceARS, // Assuming price includes VAT
      taxRate: 21, // Default
      lineTotalARS: product.priceARS,
    };
    const updatedItems = [...invoice.items, newItem];
    setInvoice({ ...invoice, items: updatedItems });
    setProductPickerOpen(false);
  };
  
  const handleItemUpdate = (index: number, updatedItem: InvoiceItem) => {
      if (!invoice) return;
      const newItems = [...invoice.items];
      newItems[index] = updatedItem;
      setInvoice({ ...invoice, items: newItems });
  };
  
  const handleItemRemove = (index: number) => {
    if (!invoice) return;
    const newItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: newItems });
  };

  const handleSaveDraft = async () => {
    if (!invoice) return;
    setError(null);
    try {
      await updateInvoice(invoice.id, invoice);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  };

  const handleIssue = async () => {
    if (!invoice) return;
    setError(null);
    try {
        await issueInvoice(invoice.id);
        onClose();
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al emitir');
    }
  };

  const handleCancel = async () => {
    if (!invoice || invoice.status !== 'EMITIDA') return;
     if (window.confirm('¿Estás seguro de que quieres anular esta factura?')) {
        try {
            await cancelInvoice(invoice.id);
            onClose();
        } catch (e)
{
            setError(e instanceof Error ? e.message : 'Error al anular');
        }
    }
  };

  const handleDeleteDraft = async () => {
    if (!invoice || invoice.status !== 'BORRADOR') return;
    if (window.confirm('¿Estás seguro de que quieres eliminar este borrador?')) {
        try {
            await removeDraft(invoice.id);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al eliminar');
        }
    }
  };

  const totals = useMemo(() => invoice?.totals, [invoice]);

  if (!invoice) return <div>Cargando factura...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        {invoice.status === 'BORRADOR' ? 'Editando Borrador' : `Factura ${invoice.pos}-${invoice.number}`}
      </h2>

      {/* Header Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-600">Cliente</label>
          <div 
            onClick={() => invoice.status === 'BORRADOR' && setClientPickerOpen(true)} 
            className={`w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg min-h-[42px] flex items-center ${invoice.status === 'BORRADOR' ? 'cursor-pointer' : 'cursor-not-allowed bg-slate-100'}`}
          >
            {invoice.clientName || 'Seleccionar cliente...'}
          </div>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-600">Tipo</label>
          <select name="type" value={invoice.type} onChange={handleFieldChange} disabled={invoice.status !== 'BORRADOR'} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
            {(['A', 'B', 'C'] as InvoiceType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-600">Punto de Venta</label>
          <div className="w-full px-3 py-2 text-base text-slate-900 bg-slate-100 border border-slate-300 rounded-lg">
            {invoice.pos}
          </div>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-600">Método de Pago</label>
          <select name="paymentMethod" value={invoice.paymentMethod} onChange={handleFieldChange} disabled={invoice.status !== 'BORRADOR'} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
            {(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTA_CTE'] as PaymentMethod[]).map(pm => <option key={pm} value={pm}>{pm}</option>)}
          </select>
        </div>
         <div>
          <label className="block mb-1 text-sm font-medium text-slate-600">Concepto</label>
          <div className="w-full px-3 py-2 text-base text-slate-900 bg-slate-100 border border-slate-300 rounded-lg">
            {invoice.concept}
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Ítems</h3>
        <InvoiceItemsTable 
            items={invoice.items}
            onUpdate={handleItemUpdate}
            onRemove={handleItemRemove}
            isEditable={invoice.status === 'BORRADOR'}
        />
        {invoice.status === 'BORRADOR' && (
            <button 
                onClick={() => setProductPickerOpen(true)} 
                className="mt-4 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm"
            >
                Agregar Producto
            </button>
        )}
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-6">
        <div className="w-full max-w-sm bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Subtotal (Neto)</span>
                <span className="font-medium text-slate-800">{formatARS(totals?.netARS || 0)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-600">IVA</span>
                <span className="font-medium text-slate-800">{formatARS(totals?.ivaARS || 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-3">
                <span>Total</span>
                <span>{formatARS(totals?.totalARS || 0)}</span>
            </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-t border-slate-200 pt-6">
        <div>
            {invoice.status === 'BORRADOR' && (
                <button onClick={handleDeleteDraft} className="text-sm font-semibold text-red-600 hover:underline">Eliminar Borrador</button>
            )}
             {invoice.status === 'EMITIDA' && (
                <button onClick={handleCancel} className="text-sm font-semibold text-red-600 hover:underline">Anular Factura</button>
            )}
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="text-sm font-semibold text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Cerrar
          </button>
          {invoice.status === 'BORRADOR' && (
            <>
              <button onClick={handleSaveDraft} className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Guardar Borrador
              </button>
              <button onClick={handleIssue} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Emitir Factura
              </button>
            </>
          )}
        </div>
      </div>

      {isClientPickerOpen && (
        <Modal isOpen={isClientPickerOpen} onClose={() => setClientPickerOpen(false)} title="Seleccionar Cliente">
          <ClientPicker onSelectClient={handleClientSelect} />
        </Modal>
      )}

      {isProductPickerOpen && (
        <Modal isOpen={isProductPickerOpen} onClose={() => setProductPickerOpen(false)} title="Agregar Producto">
          <ProductPicker onSelectProduct={handleProductSelect} />
        </Modal>
      )}
    </div>
  );
};