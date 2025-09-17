import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ClientWithDebt } from '../../types/client';
import { formatARS } from '../../utils/format';

interface ClientTableProps {
  clients: ClientWithDebt[];
  onDelete: (client: ClientWithDebt) => void;
  onToggleActive: (id: string) => void;
}

const StatusPill: React.FC<{ active: boolean }> = ({ active }) => {
    const pillClasses = active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600';
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${pillClasses}`}>{active ? 'Activo' : 'Inactivo'}</span>;
};

export const ClientTable: React.FC<ClientTableProps> = memo(({ clients, onDelete, onToggleActive }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
      <table className="w-full text-sm text-left text-slate-500">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
          <tr>
            <th scope="col" className="px-6 py-3">Nombre</th>
            <th scope="col" className="px-6 py-3">Documento</th>
            <th scope="col" className="px-6 py-3">Cond. IVA</th>
            <th scope="col" className="px-6 py-3">Email</th>
            <th scope="col" className="px-6 py-3">Estado</th>
            <th scope="col" className="px-6 py-3 text-right">Deuda</th>
            <th scope="col" className="px-6 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="bg-white border-b hover:bg-slate-50">
              <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{client.name}</th>
              <td className="px-6 py-4">{client.docType} {client.docNumber}</td>
              <td className="px-6 py-4">{client.ivaCondition}</td>
              <td className="px-6 py-4">{client.email}</td>
              <td className="px-6 py-4"><StatusPill active={client.active} /></td>
              <td className={`px-6 py-4 text-right font-semibold ${client.debt > 0 ? 'text-red-600' : 'text-slate-700'}`}>{formatARS(client.debt)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-3">
                  <Link to={`/clientes/${client.id}`} className="font-medium text-blue-600 hover:underline text-sm">Ver Detalle</Link>
                  <button onClick={() => onToggleActive(client.id)} className="font-medium text-slate-600 hover:underline text-sm">{client.active ? 'Desactivar' : 'Activar'}</button>
                  <button onClick={() => onDelete(client)} className="font-medium text-red-600 hover:underline text-sm">Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
