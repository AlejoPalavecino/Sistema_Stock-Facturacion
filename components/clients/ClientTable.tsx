import React, { memo } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { ClientWithDebt } from '../../types';
import { formatARS } from '../../utils/format.ts';
import { StatusPill } from '../shared/StatusPill.tsx';

interface ClientTableProps {
  clients: ClientWithDebt[];
}

export const ClientTable: React.FC<ClientTableProps> = memo(({ clients }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-cream-200">
      <table className="w-full text-base text-left">
        <thead className="text-sm text-text-medium uppercase bg-cream-100 font-semibold tracking-wider border-b-2 border-cream-300">
          <tr className="divide-x divide-cream-200">
            <th scope="col" className="px-6 py-4">Nombre</th>
            <th scope="col" className="px-6 py-4">Documento</th>
            <th scope="col" className="px-6 py-4">Cond. IVA</th>
            <th scope="col" className="px-6 py-4">Email</th>
            <th scope="col" className="px-6 py-4">Estado</th>
            <th scope="col" className="px-6 py-4 text-right">Deuda</th>
            <th scope="col" className="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">
          {clients.map((client) => (
            <tr key={client.id} className="divide-x divide-cream-200 hover:bg-cream-100 odd:bg-white even:bg-cream-50">
              <th scope="row" className="px-6 py-4 font-medium text-text-dark whitespace-nowrap">{client.name}</th>
              <td className="px-6 py-4 text-text-medium">{client.docType} {client.docNumber}</td>
              <td className="px-6 py-4 text-text-medium">{client.ivaCondition}</td>
              <td className="px-6 py-4 text-text-medium">{client.email}</td>
              <td className="px-6 py-4">
                <StatusPill variant={client.debt > 0 ? 'danger' : 'success'}>
                    {client.debt > 0 ? 'Con Deuda' : 'Sin Deuda'}
                </StatusPill>
              </td>
              <td className={`px-6 py-4 text-right font-semibold ${client.debt > 0 ? 'text-pastel-red-600' : 'text-text-dark'}`}>{formatARS(client.debt)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-4">
                  <Router.Link to={`/clientes/${client.id}`} className="font-medium text-pastel-blue-600 hover:underline text-base">Ver Detalle</Router.Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});