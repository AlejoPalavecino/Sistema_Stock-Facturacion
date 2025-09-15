
import { Product, ProductId, Category, ProductImportResult } from '../../types/product';
import { generarSKU } from '../../utils/sku';
import * as categoriesRepo from './categoriesRepo';
import * as historyRepo from './historyRepo';

const STORAGE_KEY = 'products_v1';

// This is a simplified in-memory store that syncs with localStorage.
// We use a module-level variable to simulate a database.
let products: Product[] = [];

try {
    const storedProducts = localStorage.getItem(STORAGE_KEY);
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    }
} catch (error) {
    console.error("Failed to load products from localStorage", error);
    products = [];
}

const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

const findProduct = (id: ProductId) => {
    const product = products.find(p => p.id === id);
    if (!product) throw new Error(`Product with id ${id} not found`);
    return product;
};

// --- Public API ---

export const list = async (): Promise<Product[]> => {
    return Promise.resolve([...products]);
};

export const getById = async (id: ProductId): Promise<Product | null> => {
    return Promise.resolve(products.find(p => p.id === id) || null);
};

export const create = async (
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sku'> & { sku?: string }
): Promise<Product> => {
    if (!data.name) throw new Error("Product name is required.");
    const validCategories = await categoriesRepo.list();
    if (!validCategories.includes(data.category)) {
        throw new Error(`Category "${data.category}" is not a valid category.`);
    }
    
    let sku = data.sku || generarSKU(data.name, data.category);
    while (products.some(p => p.sku === sku)) {
        sku = generarSKU(data.name, data.category, true); // force retry with random suffix
    }

    const newProduct: Product = {
        id: crypto.randomUUID(),
        ...data,
        sku,
        priceARS: Math.max(0, data.priceARS),
        stock: Math.max(0, data.stock),
        minStock: Math.max(0, data.minStock),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);
    persist();

    // Log history
    await historyRepo.add({
        productId: newProduct.id,
        productSku: newProduct.sku,
        productName: newProduct.name,
        type: 'creation',
        change: newProduct.stock,
        newStock: newProduct.stock,
        notes: 'Producto creado.'
    });

    return Promise.resolve(newProduct);
};

export const update = async (id: ProductId, patch: Partial<Omit<Product, 'id'>>): Promise<Product> => {
    const product = findProduct(id);
    const oldStock = product.stock;
    
    if (patch.category) {
        const validCategories = await categoriesRepo.list();
        if (!validCategories.includes(patch.category)) {
            throw new Error(`Category "${patch.category}" is not a valid category.`);
        }
    }

    const updatedProduct = {
        ...product,
        ...patch,
        id: product.id, // ensure id is not changed
        updatedAt: new Date().toISOString(),
    };

    products = products.map(p => p.id === id ? updatedProduct : p);
    persist();

    // Log history only if stock changed
    if (patch.stock !== undefined && patch.stock !== oldStock) {
        await historyRepo.add({
            productId: updatedProduct.id,
            productSku: updatedProduct.sku,
            productName: updatedProduct.name,
            type: 'manual_adjustment',
            change: updatedProduct.stock - oldStock,
            newStock: updatedProduct.stock,
            notes: 'Ajuste manual de stock.'
        });
    }

    return Promise.resolve(updatedProduct);
};

export const remove = async (id: ProductId): Promise<void> => {
    const productToDelete = findProduct(id);
    
    products = products.filter(p => p.id !== id);
    persist();

    // Log history
    await historyRepo.add({
        productId: productToDelete.id,
        productSku: productToDelete.sku,
        productName: productToDelete.name,
        type: 'deletion',
        change: -productToDelete.stock,
        newStock: 0,
        notes: 'Producto eliminado.'
    });

    return Promise.resolve();
};

export const adjustStock = async (id: ProductId, delta: number, notes: string): Promise<Product> => {
    const product = findProduct(id);
    const oldStock = product.stock;
    const newStock = oldStock + delta;

    if (newStock < 0) {
        throw new Error(`Stock insuficiente para ${product.name}. Stock actual: ${oldStock}, se necesita: ${-delta}`);
    }

    const updatedProduct = { ...product, stock: newStock, updatedAt: new Date().toISOString() };
    products = products.map(p => p.id === id ? updatedProduct : p);
    persist();
    
    await historyRepo.add({
        productId: updatedProduct.id,
        productSku: updatedProduct.sku,
        productName: updatedProduct.name,
        type: 'manual_adjustment', // This will be overwritten by invoicing logic if needed
        change: delta,
        newStock: updatedProduct.stock,
        notes: notes,
    });

    return Promise.resolve(updatedProduct);
};


export const batchCreate = async (data: any[]): Promise<ProductImportResult> => {
    const results: ProductImportResult = {
        successCount: 0,
        errors: [],
    };
    const validCategories = await categoriesRepo.list();

    for (const item of data) {
        if (!item || typeof item !== 'object') {
            results.errors.push({ item, reason: 'El registro no es un objeto válido.' });
            continue;
        }

        // Normalize keys to handle case variations
        const normalizedItem: any = {};
        for (const key in item) {
            normalizedItem[key.toLowerCase()] = item[key];
        }

        const { name, category, pricears: priceARS, stock, minstock: minStock, sku, active } = normalizedItem;

        // Validations
        if (!name || typeof name !== 'string' || name.trim() === '') {
            results.errors.push({ item, reason: 'El campo "name" es obligatorio y debe ser un texto.' });
            continue;
        }
        if (!category || !validCategories.includes(category)) {
            results.errors.push({ item, reason: `La "category" no es válida. Debe ser una de las categorías existentes.` });
            continue;
        }
        if (typeof priceARS !== 'number' || priceARS < 0) {
            results.errors.push({ item, reason: 'El "priceARS" debe ser un número no negativo.' });
            continue;
        }
        if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
            results.errors.push({ item, reason: 'El "stock" debe ser un número entero no negativo.' });
            continue;
        }
        if (typeof minStock !== 'number' || !Number.isInteger(minStock) || minStock < 0) {
            results.errors.push({ item, reason: 'El "minStock" debe ser un número entero no negativo.' });
            continue;
        }
        
        try {
            const productData = {
                name: name.trim(),
                category: category as Category,
                priceARS: priceARS,
                stock: stock,
                minStock: minStock,
                sku: (sku && typeof sku === 'string') ? sku : undefined,
                active: typeof active === 'boolean' ? active : true,
            };

            const newProduct = await create(productData); // Use create to ensure SKU generation and single point of entry
            
            // Overwrite the history log from 'create' to be more specific
            await historyRepo.overwriteLast({
                type: 'import',
                notes: 'Importado desde archivo.'
            });

            results.successCount++;
        } catch (error) {
            const reason = error instanceof Error ? error.message : 'Error desconocido al crear el producto.';
            results.errors.push({ item, reason });
        }
    }
    
    return Promise.resolve(results);
};

export const isCategoryInUse = async (categoryName: Category): Promise<boolean> => {
    return Promise.resolve(products.some(p => p.category === categoryName));
};

export const updateCategoryName = async (oldName: Category, newName: Category): Promise<void> => {
    products = products.map(p => {
        if (p.category === oldName) {
            return { ...p, category: newName, updatedAt: new Date().toISOString() };
        }
        return p;
    });
    persist();
    return Promise.resolve();
};
