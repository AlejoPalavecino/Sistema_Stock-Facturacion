import React, { useState } from 'react';
import * as productsRepo from '../../services/db/productsRepo.ts';
import { Product } from '../../types';

interface QuickAddProductFormProps {
    onProductCreated: (product: Product) => void;
    categories: string[];
}

export const QuickAddProductForm: React.FC<QuickAddProductFormProps> = ({ onProductCreated, categories }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState(categories[0] || '');
    const [priceARS, setPriceARS] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const price = parseFloat(priceARS);
        if (!name.trim()) {
            setError('El nombre es obligatorio.');
            return;
        }
        if (!category) {
            setError('Debe seleccionar una categoría.');
            return;
        }
        if (isNaN(price) || price < 0) {
            setError('El precio de venta debe ser un número válido.');
            return;
        }

        setIsSaving(true);
        try {
            const newProductData = {
                name,
                category,
                priceARS: price,
                stock: 0, // Stock will be added by the purchase invoice
                minStock: 0, // Can be edited later
                active: true,
            };
            const newProduct = await productsRepo.create(newProductData);
            onProductCreated(newProduct);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido al crear el producto.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-base font-semibold text-slate-800 mb-3">Alta Rápida de Producto</h4>
            <div className="space-y-4">
                 <div>
                    <label className="block mb-1 text-sm font-medium text-slate-600">Nombre del Producto</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg" />
                </div>
                 <div>
                    <label className="block mb-1 text-sm font-medium text-slate-600">Categoría</label>
                     <select value={category} onChange={e => setCategory(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block mb-1 text-sm font-medium text-slate-600">Precio de Venta (ARS)</label>
                    <input type="number" value={priceARS} onChange={e => setPriceARS(e.target.value)} className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg" placeholder="0.00" />
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="mt-4 text-right">
                <button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 text-sm disabled:opacity-50">
                    {isSaving ? 'Guardando...' : 'Crear y Seleccionar'}
                </button>
            </div>
        </form>
    );
};
