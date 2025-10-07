import React, { useState, useEffect } from 'react';
import * as suppliersRepo from '../../services/db/suppliersRepo.ts';
import { Supplier } from '../../types';

interface SupplierPickerProps {
  onSelect: (supplier: Supplier) => void;
}

export const SupplierPicker: React.FC<SupplierPickerProps> = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const suppliers = await suppliersRepo.list();
            const activeSuppliers = suppliers.filter(s => s.active);
            setAllSuppliers(activeSuppliers);
            setFilteredSuppliers(activeSuppliers);
        } catch (error) {
            console.error("Failed to load suppliers", error);
        } finally {
            setLoading(false);
        }
    };
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
        setFilteredSuppliers(allSuppliers);
        return;
    }
    const q = searchQuery.toLowerCase().trim();
    const filtered = allSuppliers.filter(s => 
        s.businessName.toLowerCase().includes(q) || s.cuit.includes(q)
    );
    setFilteredSuppliers(filtered);
  }, [searchQuery, allSuppliers]);

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar proveedor por razón social o CUIT..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input block w-full mb-4"
      />
      
      <div className="max-h-60 overflow-y-auto border border-cream-200 rounded-lg mb-4">
        {loading ? (
            <p className="p-4 text-center text-text-medium">Cargando proveedores...</p>
        ) : (
            <ul className="divide-y divide-cream-200">
                {filteredSuppliers.length > 0 ? filteredSuppliers.map(supplier => (
                    <li 
                      key={supplier.id} 
                      onClick={() => onSelect(supplier)}
                      className="p-3 cursor-pointer hover:bg-cream-50"
                    >
                      <p className="font-medium text-text-dark">{supplier.businessName}</p>
                      <p className="text-xs text-text-medium">CUIT: {supplier.cuit}</p>
                    </li>
                )) : (
                    <li className="p-4 text-center text-text-medium">No se encontraron proveedores.</li>
                )}
            </ul>
        )}
      </div>
    </div>
  );
};