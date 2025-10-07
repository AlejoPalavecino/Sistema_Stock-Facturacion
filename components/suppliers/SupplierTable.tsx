import React, { memo } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { SupplierWithDebt, Supplier } from '../../types';
import { formatARS } from '../../utils/format';
import { StatusPill } from '../shared/StatusPill';

interface SupplierTableProps {
  suppliers: SupplierWithDebt[];
  // FIX: Added onEdit prop to allow in-page editing from the Proveedores screen.
  onEdit: (supplier: SupplierWithDebt) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = memo(({ suppliers, onEdit }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-cream-200">
      <table className="w-full text-left">
        <thead className="text-sm font-semibold text-text-medium uppercase bg-cream-100 border-b-2 border-cream-300">
          <tr className="divide-x divide-cream-200">
            <th scope="col" className="px-6 py-4">Razón Social</th>
            <th scope="col" className="px-6 py-4">CUIT</th>
            <th scope="col" className="px-6 py-4">Cond. IVA</th>
            <th scope="col" className="px-6 py-4">Contacto</th>
            <th scope="col" className="px-6 py-4 text-right">Deuda</th>
            <th scope="col" className="px-6 py-4">Estado</th>
            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="divide-x divide-cream-200 hover:bg-cream-100 text-base odd:bg-white even:bg-cream-50">
              <th scope="row" className="px-6 py-4 font-medium text-text-dark whitespace-nowrap">{supplier.businessName}</th>
              <td className="px-6 py-4 text-text-medium">{supplier.cuit}</td>
              <td className="px-6 py-4 text-text-medium">{supplier.ivaCondition}</td>
              <td className="px-6 py-4 text-text-medium">{supplier.contactName || '-'}</td>
              <td className={`px-6 py-4 text-right font-semibold ${supplier.debt > 0 ? 'text-pastel-red-600' : 'text-text-dark'}`}>{formatARS(supplier.debt)}</td>
              <td className="px-6 py-4">
                <StatusPill variant={supplier.debt > 0 ? 'danger' : 'success'}>
                  {supplier.debt > 0 ? 'Con Deuda' : 'Sin Deuda'}
                </StatusPill>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-3">
                  {/* FIX: Add Edit button to trigger the onEdit handler. */}
                  <button onClick={() => onEdit(supplier)} className="font-medium text-pastel-blue-600 hover:underline text-base">Editar</button>
                  <Router.Link to={`/proveedores/${supplier.id}`} className="font-medium text-pastel-blue-600 hover:underline text-base">Ver Detalle</Router.Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});