
import { Product, ProductId, Category, ProductImportResult } from '../../types/product.ts';
import { generarSKU } from '../../utils/sku.ts';
import * as categoriesRepo from './categoriesRepo';
import * as historyRepo from './historyRepo';
import { StockMovementType } from '../../types/index.ts';
import { createRepository } from './repository.ts';

const repo = createRepository<Product>('products_v1');

// --- Public API ---

export const list = repo.list;
export const getById = repo.getById;

export const create = async (
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sku'> & { sku?: string }
): Promise<Product> => {
    if (!data.name) throw new Error("Product name is required.");
    const validCategories = await categoriesRepo.list();
    if (!validCategories.includes(data.category)) {
        throw new Error(`Category "${data.category}" is not a valid category.`);
    }
    
    let sku = data.sku || generarSKU(data.name, data.category);
    const allProducts = await repo.list();
    while (allProducts.some(p => p.sku === sku)) {
        sku = generarSKU(data.name, data.category, true);
    }

    const productData = {
        ...data,
        sku,
        priceARS: Math.max(0, data.priceARS),
        stock: Math.max(0, data.stock),
        minStock: Math.max(0, data.minStock),
    };

    const newProduct = await repo.create(productData);

    await historyRepo.add({
        productId: newProduct.id,
        productSku: newProduct.sku,
        productName: newProduct.name,
        type: 'creation',
        change: newProduct.stock,
        newStock: newProduct.stock,
        notes: 'Producto creado.'
    });

    return newProduct;
};

export const update = async (id: ProductId, patch: Partial<Omit<Product, 'id'>>): Promise<Product> => {
    const product = await getById(id);
    if (!product) throw new Error(`Product with id ${id} not found`);

    const oldStock = product.stock;
    
    if (patch.category) {
        const validCategories = await categoriesRepo.list();
        if (!validCategories.includes(patch.category)) {
            throw new Error(`Category "${patch.category}" is not a valid category.`);
        }
    }

    const updatedProduct = await repo.update(id, patch);

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

    return updatedProduct;
};

export const remove = async (id: ProductId): Promise<void> => {
    const productToDelete = await getById(id);
    if (!productToDelete) throw new Error(`Product with id ${id} not found`);
    
    await repo.remove(id);

    await historyRepo.add({
        productId: productToDelete.id,
        productSku: productToDelete.sku,
        productName: productToDelete.name,
        type: 'deletion',
        change: -productToDelete.stock,
        newStock: 0,
        notes: 'Producto eliminado.'
    });
};

export const adjustStock = async (id: ProductId, delta: number, type: StockMovementType, notes: string): Promise<Product> => {
    const product = await getById(id);
    if (!product) throw new Error(`Product with id ${id} not found`);

    const oldStock = product.stock;
    const newStock = oldStock + delta;

    if (newStock < 0) {
        throw new Error(`Stock insuficiente para ${product.name}. Stock actual: ${oldStock}, se necesita: ${-delta}`);
    }

    const updatedProduct = await repo.update(id, { stock: newStock });
    
    await historyRepo.add({
        productId: updatedProduct.id,
        productSku: updatedProduct.sku,
        productName: updatedProduct.name,
        type: type,
        change: delta,
        newStock: updatedProduct.stock,
        notes: notes,
    });

    return updatedProduct;
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

        const normalizedItem: any = {};
        for (const key in item) {
            normalizedItem[key.toLowerCase()] = item[key];
        }

        const { name, category, pricears: priceARS, stock, minstock: minStock, sku, active } = normalizedItem;

        if (!name || typeof name !== 'string' || !category || !validCategories.includes(category) || typeof priceARS !== 'number' || typeof stock !== 'number' || typeof minStock !== 'number') {
            results.errors.push({ item, reason: 'Faltan campos obligatorios o tienen un formato incorrecto (name, category, priceARS, stock, minStock).' });
            continue;
        }
        
        try {
            const productData = {
                name: name.trim(),
                category: category as Category,
                priceARS, stock, minStock,
                sku: (sku && typeof sku === 'string') ? sku : undefined,
                active: typeof active === 'boolean' ? active : true,
            };

            await create(productData);
            
            await historyRepo.overwriteLast({
                type: 'import',
                notes: 'Importado desde archivo.'
            });

            results.successCount++;
        } catch (error) {
            const reason = error instanceof Error ? error.message : 'Error desconocido.';
            results.errors.push({ item, reason });
        }
    }
    
    return Promise.resolve(results);
};

export const isCategoryInUse = async (categoryName: Category): Promise<boolean> => {
    const allProducts = await list();
    return allProducts.some(p => p.category === categoryName);
};

export const updateCategoryName = async (oldName: Category, newName: Category): Promise<void> => {
    const collection = repo._getCollection();
    const updatedCollection = collection.map(p => {
        if (p.category === oldName) {
            return { ...p, category: newName, updatedAt: new Date().toISOString() };
        }
        return p;
    });
    repo._setCollection(updatedCollection);
    repo._persist();
};
