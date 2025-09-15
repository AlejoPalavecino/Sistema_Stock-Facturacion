import React, { useState, useEffect } from 'react';
import * as clientsRepo from '../../services/db/clientsRepo';
import { Client } from '../../types/client';

interface ClientPickerProps {
  onSelectClient: (client: Client) => void;
}

export const ClientPicker: React.FC<ClientPickerProps> = ({ onSelectClient }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim().length > 1) {
        const clients = await clientsRepo.searchByNameOrDoc(searchQuery);
        setResults(clients);
      } else {
        setResults([]);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar cliente por nombre o documento..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg placeholder-slate-600 focus:ring-blue-500 focus:border-blue-500 mb-4"
      />
      
      <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg mb-4">
        <ul className="divide-y divide-slate-200">
          {results.map(client => (
            <li 
              key={client.id} 
              onClick={() => onSelectClient(client)}
              className="p-3 cursor-pointer hover:bg-blue-50"
            >
              <p className="font-medium text-slate-800">{client.name}</p>
              <p className="text-xs text-slate-500">{client.docType}: {client.docNumber}</p>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="text-center">
        <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="text-sm font-semibold text-blue-600 hover:underline">
          {showQuickAdd ? 'Cancelar Alta Rápida' : 'Alta Rápida de Cliente'}
        </button>
      </div>

      {showQuickAdd && <QuickAddForm onClientCreated={onSelectClient} />}
    </div>
  );
};


const QuickAddForm: React.FC<{ onClientCreated: (client: Client) => void }> = ({ onClientCreated }) => {
    const [name, setName] = useState('');
    const [docType, setDocType] = useState<Client['docType']>('DNI');
    const [docNumber, setDocNumber] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim() || !docNumber.trim()) {
            setError('Nombre y número de documento son obligatorios.');
            return;
        }
        try {
            const newClient = await clientsRepo.createQuick(name, docType, docNumber);
            onClientCreated(newClient);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block mb-1 text-sm font-medium text-slate-600">Nombre</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg placeholder-slate-600 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                 <div>
                    <label className="block mb-1 text-sm font-medium text-slate-600">Nº Documento</label>
                    <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg placeholder-slate-600 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium text-slate-600">Tipo Documento</label>
                    <select value={docType} onChange={e => setDocType(e.target.value as any)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                        <option value="DNI">DNI</option>
                        <option value="CUIT">CUIT</option>
                        <option value="CUIL">CUIL</option>
                        <option value="SD">Sin Documento</option>
                    </select>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="mt-4 text-right">
                <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 text-sm">
                    Crear y Seleccionar
                </button>
            </div>
        </form>
    );
};