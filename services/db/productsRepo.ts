import { Product, ProductId, Category } from '../../types/product.ts';
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
        netPrice: Math.max(0, data.netPrice),
        vatRate: Math.max(0, data.vatRate),
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