import React, { useState, useEffect, memo, useMemo } from 'react';
import { Product } from '../../types';
import { formatARS } from '../../utils/format';

interface ProductFormProps {
  productToEdit?: Product;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  categories: string[];
}

const initialFormData = {
  name: '',
  brand: '',
  category: '',
  netPrice: 0,
  vatRate: 21,
  stock: 0,
  minStock: 0,
  sku: '',
  active: true,
};

export const ProductForm: React.FC<ProductFormProps> = memo(({ productToEdit, onSave, onCancel, categories }) => {
  const [formData, setFormData] = useState(() => ({
      ...initialFormData,
      category: categories[0] || ''
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        brand: productToEdit.brand,
        category: productToEdit.category,
        netPrice: productToEdit.netPrice,
        vatRate: productToEdit.vatRate,
        stock: productToEdit.stock,
        minStock: productToEdit.minStock,
        sku: productToEdit.sku || '',
        active: productToEdit.active,
      });
    } else {
      setFormData({
        ...initialFormData,
        category: categories[0] || ''
      });
    }
  }, [productToEdit, categories]);

  const salePrice = useMemo(() => {
    return formData.netPrice * (1 + formData.vatRate / 100);
  }, [formData.netPrice, formData.vatRate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!formData.brand.trim()) newErrors.brand = 'La marca es obligatoria.';
    if (formData.netPrice < 0) newErrors.netPrice = 'El precio no puede ser negativo.';
    if (formData.stock < 0) newErrors.stock = 'El stock no puede ser negativo.';
    if (formData.minStock < 0) newErrors.minStock = 'El stock mínimo no puede ser negativo.';
    if (!formData.category) newErrors.category = 'Debe seleccionar una categoría.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | boolean = value;

    if (type === 'number') {
        processedValue = value === '' ? 0 : parseFloat(value);
    }
    if (name === 'active') {
        processedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const formFieldClasses = "block w-full px-3 py-2.5 text-base text-text-dark bg-white border border-cream-300 rounded-lg placeholder-text-light focus:ring-pastel-blue-500 focus:border-pastel-blue-500";
  const labelClasses = "block mb-1.5 text-base font-medium text-text-medium";

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-cream-200">
      <h2 className="text-2xl font-semibold text-text-dark mb-6">{productToEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className={labelClasses}>Nombre del Producto</label>
            <input
              type="text"
              id="name"
              name="name"
              className={formFieldClasses}
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && <p role="alert" className="text-pastel-red-600 text-sm mt-1">{errors.name}</p>}
          </div>
          
           {/* Brand */}
          <div>
            <label htmlFor="brand" className={labelClasses}>Marca</label>
            <input
              type="text"
              id="brand"
              name="brand"
              className={formFieldClasses}
              value={formData.brand}
              onChange={handleChange}
              required
            />
            {errors.brand && <p role="alert" className="text-pastel-red-600 text-sm mt-1">{errors.brand}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className={labelClasses}>Categoría</label>
            <select
              id="category"
              name="category"
              className={formFieldClasses}
              value={formData.category}
              onChange={handleChange}
            >
              <option value="" disabled>Seleccione una categoría</option>
              {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p role="alert" className="text-pastel-red-600 text-sm mt-1">{errors.category}</p>}
          </div>
          
          {/* Net Price */}
          <div>
            <label htmlFor="netPrice" className={labelClasses}>Precio Neto (S/IVA)</label>
            <input
              type="number"
              id="netPrice"
              name="netPrice"
              className={formFieldClasses}
              value={formData.netPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
            {errors.netPrice && <p role="alert" className="text-pastel-red-600 text-sm mt-1">{errors.netPrice}</p>}
          </div>
          
           {/* VAT Rate */}
          <div>
            <label htmlFor="vatRate" className={labelClasses}>IVA (%)</label>
            <select
              id="vatRate"
              name="vatRate"
              className={formFieldClasses}
              value={formData.vatRate}
              onChange={handleChange}
            >
              <option value={21}>21%</option>
              <option value={10.5}>10.5%</option>
              <option value={0}>0%</option>
            </select>
          </div>

          {/* Sale Price (Display Only) */}
          <div>
              <label className={labelClasses}>Precio Venta Final</label>
              <div className="w-full px-3 py-2.5 text-base text-text-dark bg-cream-100 border border-cream-300 rounded-lg">
                  {formatARS(salePrice)}
              </div>
          </div>


          {/* Stock */}
          <div>
            <label htmlFor="stock" className={labelClasses}>Stock Actual</label>
            <input
              type="number"
              id="stock"
              name="stock"
              className={formFieldClasses}
              value={formData.stock}
              onChange={handleChange}
              min="0"
            />
            {errors.stock && <p role="alert" className="text-pastel-red-600 text-sm mt-1">{errors.stock}</p>}
          </div>

          {/* Min Stock */}
          <div>
            <label htmlFor="minStock" className={labelClasses}>Stock Mínimo</label>
            <input
              type="number"
              id="minStock"
              name="minStock"
              className={formFieldClasses}
              value={formData.minStock}
              onChange={handleChange}
              min="0"
            />
            {errors.minStock && <p role="alert" className="text-pastel-red-600 text-sm mt-1">{errors.minStock}</p>}
          </div>
          
          {/* SKU */}
          <div className="md:col-span-2">
            <label htmlFor="sku" className={labelClasses}>SKU (opcional)</label>
            <input
              type="text"
              id="sku"
              name="sku"
              className={formFieldClasses}
              value={formData.sku}
              onChange={handleChange}
              placeholder="Se generará automáticamente si se deja en blanco"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-4">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
          >
            Guardar Producto
          </button>
        </div>
      </form>
    </div>
  );
});