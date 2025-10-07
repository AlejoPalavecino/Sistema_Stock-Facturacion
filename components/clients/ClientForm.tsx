import React, { useState, useEffect, memo } from 'react';
import { Client, DocType, IvaCondition } from '../../types';
import { validateDoc, normalizeDocNumber } from '../../utils/doc.ts';
import { UserIcon, AtSymbolIcon, PhoneIcon, LocationMarkerIcon } from '../shared/Icons.tsx';

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

  const formFieldClasses = "block w-full px-3 py-2.5 text-base text-text-dark bg-white border border-cream-300 rounded-lg placeholder-text-light focus:outline-none focus:ring-1 focus:ring-pastel-blue-500 focus:border-pastel-blue-500 transition-shadow";
  const labelClasses = "block mb-1.5 text-base font-medium text-text-medium";

  return (
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Main Information */}
            <fieldset>
              <legend className="text-xl font-semibold text-text-dark border-b border-cream-200 pb-2 mb-6 w-full">
                Información Principal
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className={labelClasses}>Nombre / Razón Social</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon />
                    </div>
                    <input type="text" id="name" name="name" className={`${formFieldClasses} pl-10`} value={formData.name} onChange={handleChange} required placeholder="Ej: Juan Pérez" />
                  </div>
                  {errors.name && <p role="alert" className="text-pastel-red-600 text-sm mt-1.5">{errors.name}</p>}
                </div>
                
                <div>
                  <label htmlFor="docType" className={labelClasses}>Tipo Documento</label>
                  <select id="docType" name="docType" className={formFieldClasses} value={formData.docType} onChange={handleChange}>
                    {(['DNI', 'CUIT', 'CUIL', 'SD'] as DocType[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="docNumber" className={labelClasses}>Nº Documento</label>
                  <input type="text" id="docNumber" name="docNumber" className={formFieldClasses} value={formData.docNumber} onChange={handleDocChange} placeholder="Solo números" />
                  {errors.docNumber && <p role="alert" className="text-pastel-red-600 text-sm mt-1.5">{errors.docNumber}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="ivaCondition" className={labelClasses}>Condición frente al IVA</label>
                  <select id="ivaCondition" name="ivaCondition" className={formFieldClasses} value={formData.ivaCondition} onChange={handleChange}>
                    {(['CF', 'RI', 'MONOTRIBUTO'] as IvaCondition[]).map(c => <option key={c} value={c}>{c === 'CF' ? 'Consumidor Final' : c === 'RI' ? 'Responsable Inscripto' : c}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>
            
            {/* Section 2: Contact Information */}
            <fieldset>
              <legend className="text-xl font-semibold text-text-dark border-b border-cream-200 pb-2 mb-6 w-full">
                Datos de Contacto
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label htmlFor="email" className={labelClasses}>Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AtSymbolIcon />
                    </div>
                    <input type="email" id="email" name="email" className={`${formFieldClasses} pl-10`} value={formData.email} onChange={handleChange} placeholder="ejemplo@correo.com" />
                  </div>
                  {errors.email && <p role="alert" className="text-pastel-red-600 text-sm mt-1.5">{errors.email}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className={labelClasses}>Teléfono</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon />
                    </div>
                    <input type="text" id="phone" name="phone" className={`${formFieldClasses} pl-10`} value={formData.phone} onChange={handleChange} placeholder="Ej: 1122334455" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClasses}>Dirección</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LocationMarkerIcon />
                    </div>
                    <input type="text" id="address" name="address" className={`${formFieldClasses} pl-10`} value={formData.address} onChange={handleChange} placeholder="Ej: Av. Corrientes 1234" />
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          
          {/* Sidebar Column */}
          <div className="lg:col-span-1">
            <fieldset>
              <legend className="text-xl font-semibold text-text-dark border-b border-cream-200 pb-2 mb-6 w-full">
                Información Adicional
              </legend>
              <div className="space-y-5">
                <div>
                  <label htmlFor="notes" className={labelClasses}>Notas</label>
                  <textarea id="notes" name="notes" rows={5} className={formFieldClasses} value={formData.notes} onChange={handleChange} placeholder="Información relevante sobre el cliente..."></textarea>
                </div>
                
                <div>
                  <label className="flex items-center text-base font-medium text-text-medium cursor-pointer p-3 bg-cream-100 border border-cream-200 rounded-lg hover:bg-cream-200">
                    <input type="checkbox" name="active" className="h-4 w-4 rounded border-cream-300 text-pastel-blue-600 focus:ring-pastel-blue-500" checked={formData.active} onChange={handleChange} />
                    <span className="ml-3">Cliente Activo</span>
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-cream-200 flex items-center justify-end gap-4">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Guardar Cliente
          </button>
        </div>
      </form>
  );
});