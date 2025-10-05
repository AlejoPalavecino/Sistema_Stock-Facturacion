import React, { useState, memo } from 'react';
import { EditIcon, DeleteIcon, SaveIcon, CancelIcon } from '../shared/Icons';

interface CategoryManagerProps {
  categories: string[];
  onAdd: (name: string) => Promise<void>;
  onUpdate: (oldName: string, newName: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
  error: string | null;
}

export const CategoryManager: React.FC<CategoryManagerProps> = memo(({ categories, onAdd, onUpdate, onDelete, error }) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      await onAdd(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleStartEdit = (cat: string) => {
    setEditingCategory({ oldName: cat, newName: cat });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleSaveEdit = async () => {
    if (editingCategory && editingCategory.newName.trim()) {
      await onUpdate(editingCategory.oldName, editingCategory.newName.trim());
      setEditingCategory(null);
    }
  };
  
  return (
    <div>
      {error && <p role="alert" className="text-red-600 text-sm mb-4">{error}</p>}
      
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Nueva categoría..."
          className="flex-grow w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Añadir
        </button>
      </form>

      <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
        <ul className="divide-y divide-slate-200">
          {categories.map(cat => (
            <li key={cat} className="p-3 flex items-center justify-between">
              {editingCategory?.oldName === cat ? (
                <input
                  type="text"
                  value={editingCategory.newName}
                  onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                  className="flex-grow px-2 py-1 text-base text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <span className="text-slate-700">{cat}</span>
              )}

              <div className="flex gap-1.5 ml-2">
                {editingCategory?.oldName === cat ? (
                  <>
                    <button onClick={handleSaveEdit} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-md transition-colors" title="Guardar">
                      <SaveIcon />
                    </button>
                    <button onClick={handleCancelEdit} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors" title="Cancelar">
                      <CancelIcon />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleStartEdit(cat)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Editar">
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(cat)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Eliminar">
                      <DeleteIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});