
import { readJSON, writeJSON } from '@/utils/storage';

const STORAGE_OPTIONS = { key: 'categories_v1', version: 'v1' as const };
const DEFAULT_CATEGORIES = ['Librería', 'Papelería', 'Escolar', 'Tecnología', 'General'];

let categories: string[] = readJSON(STORAGE_OPTIONS, DEFAULT_CATEGORIES);

if (categories.length === 0) {
    categories = [...DEFAULT_CATEGORIES];
}

const persist = () => {
    writeJSON(STORAGE_OPTIONS, categories);
};

// --- Public API ---

export const list = async (): Promise<string[]> => {
    return Promise.resolve([...categories]);
};

export const create = async (name: string): Promise<string> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error("El nombre de la categoría no puede estar vacío.");
    }
    const nameExists = categories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
        throw new Error(`La categoría "${trimmedName}" ya existe.`);
    }
    categories.push(trimmedName);
    persist();
    return Promise.resolve(trimmedName);
};

export const update = async (oldName: string, newName: string): Promise<string> => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
        throw new Error("El nuevo nombre de la categoría no puede estar vacío.");
    }
    const oldIndex = categories.findIndex(cat => cat.toLowerCase() === oldName.toLowerCase());
    if (oldIndex === -1) {
        throw new Error(`La categoría "${oldName}" no fue encontrada.`);
    }
    const newNameExists = categories.some((cat, index) => index !== oldIndex && cat.toLowerCase() === trimmedNewName.toLowerCase());
    if (newNameExists) {
        throw new Error(`La categoría "${trimmedNewName}" ya existe.`);
    }
    categories[oldIndex] = trimmedNewName;
    persist();
    return Promise.resolve(trimmedNewName);
};

export const remove = async (name: string): Promise<void> => {
    const initialLength = categories.length;
    categories = categories.filter(cat => cat.toLowerCase() !== name.toLowerCase());
    if (categories.length === initialLength) {
        throw new Error(`La categoría "${name}" no fue encontrada.`);
    }
    persist();
    return Promise.resolve();
};
