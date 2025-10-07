import React, { useState, useEffect, memo, useCallback } from 'react';
import { Supplier, IvaCondition, PaymentTerms, DocType } from '../../types';
import { validateDoc, normalizeDocNumber } from '../../utils/doc';
import { isValidCBU, normalizeCBU, normalizeAlias } from '../../utils/bank';
import * as suppliersRepo from '../../services/db/suppliersRepo';
import { CheckCircleIcon, ExclamationCircleIcon } from '../shared/Icons.tsx';

interface SupplierFormProps {
  supplierToEdit?: Supplier;
  onSave: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const initialFormData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
  businessName: '',
  docType: 'CUIT',
  cuit: '',
  ivaCondition: 'RI',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  contactName: '',
  paymentTerms: 'CONTADO',
  bank: { bankName: '', cbu: '', alias: '' },
  notes: '',
  active: true,
};

export const SupplierForm: React.FC<SupplierFormProps> = memo(({ supplierToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingCuit, setIsCheckingCuit] = useState(false);
  const [cuitIsValid, setCuitIsValid] = useState(false);

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
          ...supplierToEdit,
          bank: supplierToEdit.bank || { bankName: '', cbu: '', alias: '' }
      });
      // Assume existing CUIT is valid on load
      if (supplierToEdit.cuit) {
        setCuitIsValid(true);
      }
    } else {
      setFormData(initialFormData);
      setCuitIsValid(false);
    }
  }, [supplierToEdit]);
  
  const validateCuit = useCallback(async (cuit: string) => {
      setIsCheckingCuit(true);
      setCuitIsValid(false);
      setErrors(prev => ({...prev, cuit: undefined}));

      const docValidation = validateDoc('CUIT', cuit);
      if (!docValidation.ok) {
          setErrors(prev => ({ ...prev, cuit: docValidation.message }));
          setIsCheckingCuit(false);
          return;
      }
      
      try {
          const exists = await suppliersRepo.checkCuitExists(cuit, supplierToEdit?.id);
          if (exists) {
              setErrors(prev => ({ ...prev, cuit: 'Este CUIT ya está registrado.' }));
          } else {
              setErrors(prev => ({...prev, cuit: undefined}));
              setCuitIsValid(true);
          }
      } catch (e) {
          setErrors(prev => ({ ...prev, cuit: 'No se pudo verificar el CUIT.' }));
      } finally {
          setIsCheckingCuit(false);
      }
  }, [supplierToEdit?.id]);

  useEffect(() => {
    if (supplierToEdit && formData.cuit === supplierToEdit.cuit) {
      return;
    }
      
    const handler = setTimeout(() => {
      if (formData.docType === 'CUIT' && formData.cuit) {
        validateCuit(formData.cuit);
      } else {
        setErrors(prev => ({...prev, cuit: undefined}));
        setCuitIsValid(false);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [formData.cuit, formData.docType, supplierToEdit, validateCuit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.businessName.trim()) newErrors.businessName = 'La Razón Social es obligatoria.';
    
    const docValidation = validateDoc(formData.docType, formData.cuit);
    if (!docValidation.ok) newErrors.cuit = docValidation.message;

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'El formato del email es inválido.';
    }
    
    if (formData.bank?.cbu && !isValidCBU(formData.bank.cbu)) {
        newErrors.cbu = 'El CBU debe tener 22 dígitos.';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
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

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'cbu') processedValue = normalizeCBU(value);
    if (name === 'alias') processedValue = normalizeAlias(value);
    
    setFormData(prev => ({
        ...prev,
        bank: {
            ...prev.bank!,
            [name]: processedValue,
        }
    }));
  };
  
  const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, cuit: normalizeDocNumber(e.target.value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && !errors.cuit && !isCheckingCuit) {
      onSave(formData);
    }
  };

  const formFieldClasses = "block w-full px-3 py-2 text-base text-text-dark bg-white border border-cream-300 rounded-lg placeholder-text-light focus:ring-pastel-blue-500 focus:border-pastel-blue-500";
  const labelClasses = "block mb-1.5 text-base font-medium text-text-medium";

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-cream-200">
      <h2 className="text-2xl font-bold text-text-dark mb-6">{supplierToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <h3 className="text-lg font-semibold text-text-medium border-b border-cream-200 pb-2 mb-4">Datos Generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <label htmlFor="businessName" className={labelClasses}>Razón Social</label>
            <input type="text" id="businessName" name="businessName" className={formFieldClasses} value={formData.businessName} onChange={handleChange} required />
            {errors.businessName && <p role="alert" className="text-pastel-red-600 text-xs mt-1">{errors.businessName}</p>}
          </div>
          
          <div>
            <label htmlFor="docType" className={labelClasses}>Tipo Documento</label>
            <select id="docType" name="docType" className={formFieldClasses} value={formData.docType} onChange={handleChange}>
              {(['CUIT', 'SD'] as DocType[]).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div>
            <label htmlFor="cuit" className={labelClasses}>CUIT</label>
            <div className="relative">
              <input 
                type="text" 
                id="cuit" 
                name="cuit" 
                className={`${formFieldClasses} pr-10 ${errors.cuit ? 'border-pastel-red-500 focus:border-pastel-red-500 focus:ring-pastel-red-500' : ''} ${cuitIsValid ? 'border-pastel-green-500 focus:border-pastel-green-500 focus:ring-pastel-green-500' : ''}`}
                value={formData.cuit} 
                onChange={handleCuitChange} 
                disabled={formData.docType === 'SD'} 
                aria-invalid={!!errors.cuit}
                aria-describedby="cuit-error"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isCheckingCuit && (
                  <svg className="animate-spin h-5 w-5 text-text-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {!isCheckingCuit && cuitIsValid && !errors.cuit && (
                    <CheckCircleIcon className="h-5 w-5 text-pastel-green-500" />
                )}
                {!isCheckingCuit && errors.cuit && (
                     <ExclamationCircleIcon className="h-5 w-5 text-pastel-red-500" />
                )}
              </div>
            </div>
            {errors.cuit && <p id="cuit-error" role="alert" className="text-pastel-red-600 text-xs mt-1">{errors.cuit}</p>}
          </div>

          <div>
            <label htmlFor="ivaCondition" className={labelClasses}>Condición IVA</label>
            <select id="ivaCondition" name="ivaCondition" className={formFieldClasses} value={formData.ivaCondition} onChange={handleChange}>
              {(['RI', 'MONOTRIBUTO', 'EXENTO', 'CF'] as IvaCondition[]).map(c => <option key={c} value={c}>{c === 'CF' ? 'Consumidor Final' : c === 'RI' ? 'Resp. Inscripto' : c}</option>)}
            </select>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-text-medium border-b border-cream-200 pb-2 mb-4 mt-8">Datos de Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
                <label htmlFor="contactName" className={labelClasses}>Nombre de Contacto</label>
                <input type="text" id="contactName" name="contactName" className={formFieldClasses} value={formData.contactName} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="email" className={labelClasses}>Email</label>
                <input type="email" id="email" name="email" className={formFieldClasses} value={formData.email} onChange={handleChange} />
                {errors.email && <p role="alert" className="text-pastel-red-600 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
                <label htmlFor="phone" className={labelClasses}>Teléfono</label>
                <input type="text" id="phone" name="phone" className={formFieldClasses} value={formData.phone} onChange={handleChange} />
            </div>
            <div className="lg:col-span-3">
                <label htmlFor="address" className={labelClasses}>Dirección</label>
                <input type="text" id="address" name="address" className={formFieldClasses} value={formData.address} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="city" className={labelClasses}>Ciudad</label>
                <input type="text" id="city" name="city" className={formFieldClasses} value={formData.city} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="province" className={labelClasses}>Provincia</label>
                <input type="text" id="province" name="province" className={formFieldClasses} value={formData.province} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="postalCode" className={labelClasses}>Código Postal</label>
                <input type="text" id="postalCode" name="postalCode" className={formFieldClasses} value={formData.postalCode} onChange={handleChange} />
            </div>
        </div>

        <h3 className="text-lg font-semibold text-text-medium border-b border-cream-200 pb-2 mb-4 mt-8">Condiciones y Datos Bancarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
                <label htmlFor="paymentTerms" className={labelClasses}>Condiciones de Pago</label>
                <select id="paymentTerms" name="paymentTerms" className={formFieldClasses} value={formData.paymentTerms} onChange={handleChange}>
                    <option value="CONTADO">Contado</option>
                    <option value="CTA_CTE_15">Cta Cte 15 días</option>
                    <option value="CTA_CTE_30">Cta Cte 30 días</option>
                    <option value="CTA_CTE_60">Cta Cte 60 días</option>
                </select>
            </div>
            <div>
                <label htmlFor="bankName" className={labelClasses}>Banco</label>
                <input type="text" id="bankName" name="bankName" className={formFieldClasses} value={formData.bank?.bankName || ''} onChange={handleBankChange} />
            </div>
            <div>
                <label htmlFor="cbu" className={labelClasses}>CBU</label>
                <input type="text" id="cbu" name="cbu" className={formFieldClasses} value={formData.bank?.cbu || ''} onChange={handleBankChange} />
                {errors.cbu && <p role="alert" className="text-pastel-red-600 text-xs mt-1">{errors.cbu}</p>}
            </div>
            <div>
                <label htmlFor="alias" className={labelClasses}>Alias</label>
                <input type="text" id="alias" name="alias" className={formFieldClasses} value={formData.bank?.alias || ''} onChange={handleBankChange} />
            </div>
        </div>
        
        <h3 className="text-lg font-semibold text-text-medium border-b border-cream-200 pb-2 mb-4 mt-8">Otros Datos</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="notes" className={labelClasses}>Notas</label>
            <textarea id="notes" name="notes" rows={3} className={formFieldClasses} value={formData.notes} onChange={handleChange}></textarea>
          </div>
          <div>
            <label className="flex items-center text-base font-medium text-text-medium">
              <input type="checkbox" name="active" className="h-4 w-4 rounded border-cream-300 text-pastel-blue-600 focus:ring-pastel-blue-500" checked={formData.active} onChange={handleChange} />
              <span className="ml-2">Proveedor Activo</span>
            </label>
          </div>
        </div>


        <div className="mt-8 flex items-center justify-end gap-4">
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
          <button type="submit" disabled={isCheckingCuit} className="btn btn-primary disabled:opacity-50 disabled:cursor-wait">
            {isCheckingCuit ? 'Verificando...' : 'Guardar Proveedor'}
          </button>
        </div>
      </form>
    </div>
  );
});