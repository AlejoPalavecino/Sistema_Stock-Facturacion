import React from 'react';
import { Invoice } from '../../types/invoice';
import { formatARS } from '../../utils/format';

interface IssuePreviewProps {
  invoice: Invoice;
}

export const IssuePreview: React.FC<IssuePreviewProps> = ({ invoice }) => {
  return (
    <div className="invoice-preview-container p-4 sm:p-8 bg-white text-xs">
      {/* Header */}
      <header className="flex justify-between items-start pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">LOGO EMPRESA</h1>
          <p>Razón Social: Tu Empresa S.A.</p>
          <p>Domicilio: Calle Falsa 123, CABA</p>
          <p>Condición IVA: Responsable Inscripto</p>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold">FACTURA</h2>
          <p className="font-mono text-sm">
            Punto de Venta: {invoice.pos} Nº: {invoice.number}
          </p>
          <p>Fecha de Emisión: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          <div className="mt-2 text-3xl font-bold inline-block border-2 border-black px-2 py-1">
             {invoice.type}
          </div>
        </div>
      </header>

      {/* Client Info */}
      <section className="mt-4 pb-4 border-b">
        <p><strong>Cliente:</strong> {invoice.clientName}</p>
        <p><strong>{invoice.clientDocType}:</strong> {invoice.clientDocNumber}</p>
        <p><strong>Condición frente al IVA:</strong> Consumidor Final</p>
      </section>

      {/* Items Table */}
      <section className="mt-4">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-1 text-left">Código</th>
              <th className="p-1 text-left">Producto/Servicio</th>
              <th className="p-1 text-center">Cantidad</th>
              <th className="p-1 text-right">P. Unitario</th>
              <th className="p-1 text-center">% IVA</th>
              <th className="p-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-1">{item.sku}</td>
                <td className="p-1">{item.name}</td>
                <td className="p-1 text-center">{item.qty}</td>
                <td className="p-1 text-right">{formatARS(item.unitPriceARS)}</td>
                <td className="p-1 text-center">{item.taxRate}%</td>
                <td className="p-1 text-right">{formatARS(item.lineTotalARS)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Totals & CAE */}
      <footer className="mt-4 flex justify-end">
        <div className="w-full max-w-xs">
          <div className="flex justify-between p-1">
            <span>Subtotal Neto:</span>
            <span className="font-medium">{formatARS(invoice.totals.netARS)}</span>
          </div>
          <div className="flex justify-between p-1">
            <span>IVA:</span>
            <span className="font-medium">{formatARS(invoice.totals.ivaARS)}</span>
          </div>
          <div className="flex justify-between p-2 mt-1 bg-slate-100 font-bold text-sm">
            <span>TOTAL:</span>
            <span>{formatARS(invoice.totals.totalARS)}</span>
          </div>
        </div>
      </footer>
      
      {invoice.status === 'EMITIDA' && (
          <div className="mt-8 flex justify-between items-center text-xs">
            {/* Placeholder for QR Code */}
            <div className="w-24 h-24 border flex items-center justify-center text-slate-400">QR</div>
            <div>
                <p className="font-bold">CAE Nº: {invoice.cae}</p>
                <p><strong>Fecha Vto. de CAE:</strong> {invoice.caeDue ? new Date(invoice.caeDue).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
      )}
    </div>
  );
};
