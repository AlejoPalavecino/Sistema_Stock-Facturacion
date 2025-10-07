import React, { memo } from 'react';
import { Invoice } from '../../types';
import { formatARS } from '../../utils/format';

interface IssuePreviewProps {
  invoice: Invoice;
}

export const IssuePreview: React.FC<IssuePreviewProps> = memo(({ invoice }) => {
  return (
    <div className="p-4 sm:p-8 bg-white text-text-dark font-sans text-sm">
      <div className="border-2 border-cream-200 p-4 sm:p-8 rounded-lg">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-cream-200 gap-4">
          {/* Company Info */}
          <div className="text-xs">
            <h2 className="text-lg sm:text-xl font-bold mb-1">LOGO EMPRESA</h2>
            <p><strong>Razón Social:</strong> Tu Empresa S.A.</p>
            <p><strong>Domicilio:</strong> Calle Falsa 123, CABA</p>
            <p><strong>Condición IVA:</strong> Responsable Inscripto</p>
          </div>

          {/* Invoice Info */}
          <div className="text-left sm:text-right w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">FACTURA</h1>
            <div className="text-xs font-mono">
              <p>Punto de Venta: {invoice.pos} Nº: {invoice.number}</p>
              <p>Fecha de Emisión: {new Date(invoice.createdAt).toLocaleDateString('es-AR')}</p>
            </div>
            <div className="mt-4 text-3xl sm:text-4xl font-bold inline-block border-2 border-black px-4 py-2">
              {invoice.type}
            </div>
             {invoice.type === 'X' && (
                <div className="mt-4">
                    <p className="font-bold text-red-600 border-2 border-red-500 p-2 inline-block text-xs tracking-wider">
                        DOCUMENTO NO VÁLIDO COMO COMPROBANTE FISCAL
                    </p>
                </div>
            )}
          </div>
        </header>

        {/* Client Info Section */}
        <section className="mt-6 pb-6 border-b border-cream-200 text-xs">
          <p><strong>Cliente:</strong> {invoice.clientName}</p>
          <p><strong>{invoice.clientDocType}:</strong> {invoice.clientDocNumber}</p>
          <p><strong>Condición frente al IVA:</strong> Consumidor Final</p>
          {invoice.expediente && (
            <p className="mt-2"><strong>Nº de Expediente:</strong> {invoice.expediente}</p>
          )}
        </section>

        {/* Items Table */}
        <section className="mt-6 overflow-x-auto">
          <table className="w-full text-left min-w-[600px] border border-cream-200">
            <thead className="border-b-2 border-cream-300">
              <tr className="divide-x divide-cream-200 bg-cream-100 text-text-medium uppercase text-xs">
                <th className="p-3">Código</th>
                <th className="p-3">Producto/Servicio</th>
                <th className="p-3 text-center">Cantidad</th>
                <th className="p-3 text-right">P. Unitario</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {invoice.items.map((item, index) => (
                <tr key={index} className="divide-x divide-cream-200">
                  <td className="p-3 font-mono text-xs text-text-medium">{item.sku}</td>
                  <td className="p-3 font-medium text-text-dark">{item.name}</td>
                  <td className="p-3 text-center text-text-medium">{item.qty}</td>
                  <td className="p-3 text-right text-text-medium">{formatARS(item.unitPriceARS)}</td>
                  <td className="p-3 text-right font-semibold text-text-dark">{formatARS(item.lineTotalARS)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals Section */}
        <section className="mt-6 flex justify-end">
          <div className="w-full max-w-sm space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-medium">Subtotal Neto:</span>
              <span className="font-medium text-right">{formatARS(invoice.totals.netARS)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-medium">IVA:</span>
              <span className="font-medium text-right">{formatARS(invoice.totals.ivaARS)}</span>
            </div>
            <div className="flex justify-between items-center bg-cream-100 p-3 rounded-md mt-2">
              <span className="font-bold text-sm">TOTAL:</span>
              <span className="font-bold text-sm text-right">{formatARS(invoice.totals.totalARS)}</span>
            </div>
          </div>
        </section>

        {/* Footer with CAE and QR */}
        {(invoice.status === 'PAGADA' || invoice.status === 'PENDIENTE_PAGO') && invoice.cae && (
          <footer className="mt-12 pt-6 border-t border-cream-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            {/* QR Code Placeholder */}
            <div className="w-24 h-24 border-2 border-cream-300 flex items-center justify-center text-text-light">
              <span>QR</span>
            </div>

            {/* CAE Info */}
            <div className="text-center sm:text-right">
              <p className="font-bold">CAE Nº: <span className="font-mono">{invoice.cae}</span></p>
              <p><strong>Fecha Vto. de CAE:</strong> {invoice.caeDue ? new Date(invoice.caeDue).toLocaleDateString('es-AR') : 'N/A'}</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
});