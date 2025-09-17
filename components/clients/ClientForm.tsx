
import React, { useState, useEffect, memo } from 'react';
import { Client, DocType, IvaCondition } from '@/types/client';
import { validateDoc, normalizeDocNumber } from '@/utils/doc';

interface ClientFormProps {
  clientToEdit?: Client;
  onSave: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const initialFormData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  docType: 'DNI',
  docNumber: '',
  ivaCondition: 'CF',
  email: '',
  phone: '',
  address: '',
  notes: '',
  active: true,
};

export const ClientForm: React.FC<ClientFormProps> = memo(({ clientToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (clientToEdit) {
      setFormData(clientToEdit);
    } else {
      setFormData(initialFormData);
    }
  }, [clientToEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    
    const docValidation = validateDoc(formData.docType, formData.docNumber);
    if (!docValidation.ok) newErrors.docNumber = docValidation.message;

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'El formato del email es inválido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setFormData(prev => ({ 
        ...prev, 
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
    }));
  };
  
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, docNumber: normalizeDocNumber(e.target.value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const formFieldClasses = "block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{clientToEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="name" className={labelClasses}>Nombre / Razón Social</label>
            <input type="text" id="name" name="name" className={formFieldClasses} value={formData.name} onChange={handleChange} required />
            {errors.name && <p role="alert" className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label htmlFor="docType" className={labelClasses}>Tipo Documento</label>
            <select id="docType" name="docType" className={formFieldClasses} value={formData.docType} onChange={handleChange}>
              {(['DNI', 'CUIT', 'CUIL', 'SD'] as DocType[]).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div>
            <label htmlFor="docNumber" className={labelClasses}>Nº Documento</label>
            <input type="text" id="docNumber" name="docNumber" className={formFieldClasses} value={formData.docNumber} onChange={handleDocChange} />
            {errors.docNumber && <p role="alert" className="text-red-600 text-xs mt-1">{errors.docNumber}</p>}
          </div>

          <div>
            <label htmlFor="ivaCondition" className={labelClasses}>Condición IVA</label>
            <select id="ivaCondition" name="ivaCondition" className={formFieldClasses} value={formData.ivaCondition} onChange={handleChange}>
              {(['CF', 'RI', 'MONOTRIBUTO'] as IvaCondition[]).map(c => <option key={c} value={c}>{c === 'CF' ? 'Consumidor Final' : c === 'RI' ? 'Resp. Inscripto' : c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="email" className={labelClasses}>Email</label>
            <input type="email" id="email" name="email" className={formFieldClasses} value={formData.email} onChange={handleChange} />
            {errors.email && <p role="alert" className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className={labelClasses}>Dirección</label>
            <input type="text" id="address" name="address" className={formFieldClasses} value={formData.address} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="phone" className={labelClasses}>Teléfono</label>
            <input type="text" id="phone" name="phone" className={formFieldClasses} value={formData.phone} onChange={handleChange} />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="notes" className={labelClasses}>Notas</label>
            <textarea id="notes" name="notes" rows={3} className={formFieldClasses} value={formData.notes} onChange={handleChange}></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium text-slate-700">
              <input type="checkbox" name="active" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.active} onChange={handleChange} />
              <span className="ml-2">Cliente Activo</span>
            </label>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-4">
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100">Cancelar</button>
          <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700">Guardar Cliente</button>
        </div>
      </form>
    </div>
  );
});
