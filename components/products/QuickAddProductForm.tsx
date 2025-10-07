import React, { useState } from 'react';
import * as productsRepo from '../../services/db/productsRepo.ts';
import { Product, ProductWithSalePrice } from '../../types';

interface QuickAddProductFormProps {
    onProductCreated: (product: ProductWithSalePrice) => void;
    categories: string[];
}

export const QuickAddProductForm: React.FC<QuickAddProductFormProps> = ({ onProductCreated, categories }) => {
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState(categories[0] || '');
    const [netPrice, setNetPrice] = useState('');
    const [vatRate, setVatRate] = useState(21);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const price = parseFloat(netPrice);
        if (!name.trim() || !brand.trim()) {
            setError('El nombre y la marca son obligatorios.');
            return;
        }
        if (!category) {
            setError('Debe seleccionar una categoría.');
            return;
        }
        if (isNaN(price) || price < 0) {
            setError('El precio neto debe ser un número válido.');
            return;
        }

        setIsSaving(true);
        try {
            const newProductData = {
                name,
                brand,
                category,
                netPrice: price,
                vatRate,
                stock: 0, // Stock will be added by the purchase invoice
                minStock: 0, // Can be edited later
                active: true,
            };
            const newProduct = await productsRepo.create(newProductData);
            onProductCreated({
                ...newProduct,
                salePrice: newProduct.netPrice * (1 + newProduct.vatRate / 100)
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido al crear el producto.');
        } finally {
            setIsSaving(false);
        }
    };

    const formFieldClasses = "block w-full px-3 py-2 text-base text-text-dark bg-white border border-cream-300 rounded-lg focus:ring-pastel-blue-500 focus:border-pastel-blue-500";
    const labelClasses = "block mb-1 text-sm font-medium text-text-medium";

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-cream-100 border border-cream-200 rounded-lg">
            <h4 className="text-base font-semibold text-text-dark mb-3">Alta Rápida de Producto</h4>
            <div className="space-y-4">
                 <div>
                    <label className={labelClasses}>Nombre del Producto</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={formFieldClasses} />
                </div>
                 <div>
                    <label className={labelClasses}>Marca</label>
                    <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className={formFieldClasses} />
                </div>
                 <div>
                    <label className={labelClasses}>Categoría</label>
                     <select value={category} onChange={e => setCategory(e.target.value)} className={formFieldClasses}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                 <div>
                    <label className={labelClasses}>Precio Neto (sin IVA)</label>
                    <input type="number" value={netPrice} onChange={e => setNetPrice(e.target.value)} className={formFieldClasses} placeholder="0.00" />
                </div>
                <div>
                    <label className={labelClasses}>Tasa de IVA</label>
                    <select value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value))} className={formFieldClasses}>
                        <option value={21}>21%</option>
                        <option value={10.5}>10.5%</option>
                        <option value={0}>0%</option>
                    </select>
                </div>
            </div>
            {error && <p className="text-pastel-red-500 text-sm mt-2">{error}</p>}
            <div className="mt-4 text-right">
                <button type="submit" disabled={isSaving} className="btn btn-primary text-sm py-2 px-4">
                    {isSaving ? 'Guardando...' : 'Crear y Seleccionar'}
                </button>
            </div>
        </form>
    );
};