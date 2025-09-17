
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { SupplierWithDebt, Supplier } from '../../types';
import { formatARS } from '../../utils/format';

interface SupplierTableProps {
  suppliers: SupplierWithDebt[];
  // FIX: Added onEdit prop to allow in-page editing from the Proveedores screen.
  onEdit: (supplier: SupplierWithDebt) => void;
  onDelete: (supplier: SupplierWithDebt) => void;
  onToggleActive: (id: string) => void;
}

const StatusPill: React.FC<{ active: boolean }> = ({ active }) => {
    const pillClasses = active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600';
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${pillClasses}`}>{active ? 'Activo' : 'Inactivo'}</span>;
};

export const SupplierTable: React.FC<SupplierTableProps> = memo(({ suppliers, onEdit, onDelete, onToggleActive }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
      <table className="w-full text-sm text-left text-slate-500">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
          <tr>
            <th scope="col" className="px-6 py-3">Razón Social</th>
            <th scope="col" className="px-6 py-3">CUIT</th>
            <th scope="col" className="px-6 py-3">Cond. IVA</th>
            <th scope="col" className="px-6 py-3">Contacto</th>
            <th scope="col" className="px-6 py-3 text-right">Deuda</th>
            <th scope="col" className="px-6 py-3">Estado</th>
            <th scope="col" className="px-6 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="bg-white border-b hover:bg-slate-50">
              <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{supplier.businessName}</th>
              <td className="px-6 py-4">{supplier.cuit}</td>
              <td className="px-6 py-4">{supplier.ivaCondition}</td>
              <td className="px-6 py-4">{supplier.contactName || '-'}</td>
              <td className={`px-6 py-4 text-right font-semibold ${supplier.debt > 0 ? 'text-red-600' : 'text-slate-700'}`}>{formatARS(supplier.debt)}</td>
              <td className="px-6 py-4"><StatusPill active={supplier.active} /></td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-3">
                  {/* FIX: Add Edit button to trigger the onEdit handler. */}
                  <button onClick={() => onEdit(supplier)} className="font-medium text-blue-600 hover:underline text-sm">Editar</button>
                  <Link to={`/proveedores/${supplier.id}`} className="font-medium text-blue-600 hover:underline text-sm">Ver Detalle</Link>
                  <button onClick={() => onToggleActive(supplier.id)} className="font-medium text-slate-600 hover:underline text-sm">{supplier.active ? 'Desactivar' : 'Activar'}</button>
                  <button onClick={() => onDelete(supplier)} className="font-medium text-red-600 hover:underline text-sm">Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
