
import React, { useState, useEffect } from 'react';
import { useInvoices } from '../../hooks/useInvoices.ts';
import { Invoice, InvoiceItem, PaymentMethod, InvoiceType, Concept, IvaRate, Client, Product, ProductWithSalePrice } from '../../types';
import { ClientPicker } from './ClientPicker.tsx';
import { ProductPicker } from './ProductPicker.tsx';
import { InvoiceItemsTable } from './InvoiceItemsTable.tsx';
import { formatARS } from '../../utils/format.ts';
import { Modal } from '../shared/Modal.tsx';
import { sumTotals } from '../../utils/tax.ts';
import * as clientsRepo from '../../services/db/clientsRepo.ts';
import { ConfirmModal } from '../shared/ConfirmModal.tsx';
import { PlusIcon } from '../shared/Icons.tsx';

interface InvoiceFormProps {
  invoiceId: string;
  onClose: () => void;
  actions: ReturnType<typeof useInvoices>;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoiceId, onClose, actions }) => {
  const { getById, updateInvoice, issueInvoice, cancelInvoice, removeDraft } = actions;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClientPickerOpen, setClientPickerOpen] = useState(false);
  const [isProductPickerOpen, setProductPickerOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      const data = await getById(invoiceId);
      setInvoice(data);
    };
    fetchInvoice();
  }, [invoiceId, getById]);

  const handleFieldChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!invoice) return;
    const { name, value } = e.target;

    if (name === 'type' && value === 'X') {
        try {
            const cfClient = await clientsRepo.getConsumidorFinalClient();
            setInvoice({ 
                ...invoice, 
                type: 'X',
                clientId: cfClient.id,
                clientName: cfClient.name,
                clientDocType: cfClient.docType,
                clientDocNumber: cfClient.docNumber,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error setting client');
        }
    } else {
        setInvoice({ ...invoice, [name]: value });
    }
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

  const handleProductSelect = (product: ProductWithSalePrice) => {
    if (!invoice) return;
    const newItem: InvoiceItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      qty: 1,
      unitPriceARS: product.salePrice, // This is price with VAT
      taxRate: product.vatRate as IvaRate,
      lineTotalARS: product.salePrice,
    };
    const updatedItems = [...invoice.items, newItem];
    const newTotals = sumTotals(updatedItems);
    setInvoice({ ...invoice, items: updatedItems, totals: newTotals });
    setProductPickerOpen(false);
  };
  
  const handleItemUpdate = (index: number, updatedItem: InvoiceItem) => {
      if (!invoice) return;
      const newItems = [...invoice.items];
      newItems[index] = updatedItem;
      const newTotals = sumTotals(newItems);
      setInvoice({ ...invoice, items: newItems, totals: newTotals });
  };
  
  const handleItemRemove = (index: number) => {
    if (!invoice) return;
    const newItems = invoice.items.filter((_, i) => i !== index);
    const newTotals = sumTotals(newItems);
    setInvoice({ ...invoice, items: newItems, totals: newTotals });
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
        await issueInvoice(invoice);
        onClose();
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al emitir');
    }
  };

  const handleConfirmCancel = async () => {
    if (!invoice || (invoice.status !== 'PAGADA' && invoice.status !== 'PENDIENTE_PAGO')) return;
    try {
        await cancelInvoice(invoice.id);
        setCancelConfirmOpen(false);
        onClose();
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al anular');
    }
  };

  const handleConfirmDelete = async () => {
    if (!invoice || invoice.status !== 'BORRADOR') return;
    try {
        await removeDraft(invoice.id);
        setDeleteConfirmOpen(false);
        onClose();
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  if (!invoice) return <div>Cargando factura...</div>;

  const formFieldClasses = "block w-full px-3 py-2 text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500 disabled:bg-cream-100 disabled:cursor-not-allowed";
  const labelClasses = "block mb-1.5 text-base font-medium text-text-medium";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-cream-200">
      <h2 className="text-2xl font-bold text-text-dark mb-6">
        {invoice.status === 'BORRADOR' ? 'Editando Borrador' : `Factura ${invoice.pos}-${invoice.number}`}
      </h2>

      {/* Header Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className={labelClasses}>Cliente</label>
          <div 
            onClick={() => invoice.status === 'BORRADOR' && setClientPickerOpen(true)} 
            className={`w-full px-3 py-2 text-base text-text-dark bg-white border border-cream-300 rounded-lg min-h-[42px] flex items-center ${invoice.status === 'BORRADOR' ? 'cursor-pointer' : 'cursor-not-allowed bg-cream-100'}`}
          >
            {invoice.clientName || 'Seleccionar cliente...'}
          </div>
        </div>
        <div>
          <label className={labelClasses}>Tipo</label>
          <select name="type" value={invoice.type} onChange={handleFieldChange} disabled={invoice.status !== 'BORRADOR'} className={formFieldClasses}>
            {(['A', 'B', 'C', 'X'] as InvoiceType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClasses}>Punto de Venta</label>
          <div className="w-full px-3 py-2 text-base text-text-dark bg-cream-100 border border-cream-300 rounded-lg">
            {invoice.pos}
          </div>
        </div>
        <div>
          <label className={labelClasses}>Método de Pago</label>
          <select name="paymentMethod" value={invoice.paymentMethod} onChange={handleFieldChange} disabled={invoice.status !== 'BORRADOR'} className={formFieldClasses}>
            {(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTA_CTE'] as PaymentMethod[]).map(pm => <option key={pm} value={pm}>{pm}</option>)}
          </select>
        </div>
         <div>
          <label className={labelClasses}>Concepto</label>
          <div className="w-full px-3 py-2 text-base text-text-dark bg-cream-100 border border-cream-300 rounded-lg">
            {invoice.concept}
          </div>
        </div>
        <div>
            <label className={labelClasses}>Nº Expediente</label>
            <div className="w-full px-3 py-2 text-base text-text-dark bg-cream-100 border border-cream-300 rounded-lg">
                {invoice.expediente || 'N/A'}
            </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-medium mb-2">Ítems</h3>
        <InvoiceItemsTable 
            items={invoice.items}
            onUpdate={handleItemUpdate}
            onRemove={handleItemRemove}
            isEditable={invoice.status === 'BORRADOR'}
        />
        {invoice.status === 'BORRADOR' && (
            <button 
                onClick={() => setProductPickerOpen(true)} 
                className="btn btn-green mt-4"
            >
                <PlusIcon className="mr-2 h-5 w-5" />
                Agregar Producto
            </button>
        )}
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-6">
        <div className="w-full max-w-sm bg-cream-100 p-4 rounded-lg">
            <div className="flex justify-between text-base mb-2">
                <span className="text-text-medium">Subtotal (Neto)</span>
                <span className="font-medium text-text-dark">{formatARS(invoice.totals?.netARS || 0)}</span>
            </div>
            <div className="flex justify-between text-base mb-3">
                <span className="text-text-medium">IVA</span>
                <span className="font-medium text-text-dark">{formatARS(invoice.totals?.ivaARS || 0)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-text-dark border-t border-cream-200 pt-3">
                <span>Total</span>
                <span>{formatARS(invoice.totals?.totalARS || 0)}</span>
            </div>
        </div>
      </div>

      {error && <p className="text-pastel-red-600 text-center mb-4">{error}</p>}
      
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-t border-cream-200 pt-6">
        <div>
            {invoice.status === 'BORRADOR' && (
                <button onClick={() => setDeleteConfirmOpen(true)} className="text-base font-semibold text-pastel-red-600 hover:underline">Eliminar Borrador</button>
            )}
             {(invoice.status === 'PAGADA' || invoice.status === 'PENDIENTE_PAGO') && (
                <button onClick={() => setCancelConfirmOpen(true)} className="text-base font-semibold text-pastel-red-600 hover:underline">Anular Factura</button>
            )}
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar
          </button>
          {invoice.status === 'BORRADOR' && (
            <>
              <button onClick={handleSaveDraft} className="btn btn-secondary">
                Guardar Borrador
              </button>
              <button onClick={handleIssue} className="btn btn-primary">
                Emitir Factura
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        confirmText="Eliminar"
        confirmVariant="danger"
      >
        <p>¿Estás seguro de que quieres eliminar este borrador? Esta acción no se puede deshacer.</p>
      </ConfirmModal>
      
      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Confirmar Anulación"
        confirmText="Anular Factura"
        confirmVariant="danger"
      >
        <p>¿Estás seguro de que quieres anular esta factura? Esta acción no se puede deshacer.</p>
      </ConfirmModal>

      {isClientPickerOpen && (
        <Modal isOpen={isClientPickerOpen} onClose={() => setClientPickerOpen(false)} title="Seleccionar Cliente" size="lg">
          <ClientPicker onSelectClient={handleClientSelect} />
        </Modal>
      )}

      {isProductPickerOpen && (
        <Modal isOpen={isProductPickerOpen} onClose={() => setProductPickerOpen(false)} title="Agregar Producto" size="2xl">
          <ProductPicker onSelectProduct={handleProductSelect} />
        </Modal>
      )}
    </div>
  );
};