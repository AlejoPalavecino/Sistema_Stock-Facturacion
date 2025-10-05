import React, { useState, useMemo, useCallback } from 'react';
import * as productsRepo from '../../services/db/productsRepo';
import { Product } from '../../types';
import { Modal } from '../shared/Modal';
import { ProductPicker } from '../invoicing/ProductPicker';
import { formatARS } from '../../utils/format';
import { QuickSaleReceipt, QuickSaleItem } from './QuickSaleReceipt';
import { EmptyCartIcon, PlusIcon, GenerateIcon, PrintIcon, DeleteIcon } from '../shared/Icons';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({ isOpen, onClose }) => {
    const [cart, setCart] = useState<QuickSaleItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProductPickerOpen, setProductPickerOpen] = useState(false);
    const [receiptDataForPreview, setReceiptDataForPreview] = useState<{ items: QuickSaleItem[], total: number } | null>(null);

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.priceARS * item.qty, 0), [cart]);

    const handleAddProduct = useCallback((product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, qty: Math.min(product.stock, item.qty + 1) } : item
                );
            }
            return [...prevCart, { ...product, qty: 1 }];
        });
        setProductPickerOpen(false);
    }, []);
    
    const handleUpdateQty = useCallback((productId: string, newQty: number) => {
        setCart(prevCart => {
            const itemToUpdate = prevCart.find(item => item.id === productId);
            if (!itemToUpdate) return prevCart;
            
            const clampedQty = Math.max(1, Math.min(itemToUpdate.stock, newQty));
            
            return prevCart.map(item =>
                item.id === productId ? { ...item, qty: clampedQty } : item
            );
        });
    }, []);

    const handleRemoveItem = useCallback((productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    }, []);
    
    const resetState = useCallback(() => {
        setCart([]);
        setError(null);
        setIsProcessing(false);
        setReceiptDataForPreview(null);
        onClose();
    }, [onClose]);
    
    const handleGenerateReceipt = useCallback(async () => {
        setError(null);
        if (cart.length === 0) {
            setError("Agregue al menos un producto a la venta.");
            return;
        }

        setIsProcessing(true);
        try {
            // Step 1: Pre-flight check for stock availability
            for (const item of cart) {
                const product = await productsRepo.getById(item.id);
                if (!product || product.stock < item.qty) {
                    throw new Error(`Stock insuficiente para "${item.name}". Stock: ${product?.stock || 0}.`);
                }
            }

            // Step 2: Adjust stock for all items
            for (const item of cart) {
                await productsRepo.adjustStock(item.id, -item.qty, 'sale', 'Venta Rápida (Remito)');
            }

            // Step 3: Set data for preview modal
            setReceiptDataForPreview({ items: cart, total: total });

        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al procesar la venta.');
        } finally {
            setIsProcessing(false);
        }
    }, [cart, total]);
    
    const handlePrint = useCallback(() => {
        const receiptContent = document.getElementById('quick-sale-receipt-preview');
        if (!receiptContent) {
            console.error("Contenido del comprobante no encontrado para imprimir.");
            return;
        }

        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        printContainer.innerHTML = receiptContent.innerHTML;
        
        document.body.appendChild(printContainer);
        document.body.classList.add('is-printing');
        
        window.print();
        
        document.body.removeChild(printContainer);
        document.body.classList.remove('is-printing');
    }, []);
    
    return (
        <>
            <Modal isOpen={isOpen && !receiptDataForPreview} onClose={resetState} title="Venta Rápida" size="2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side: Cart */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 text-lg border-b pb-2">Carrito de Venta</h3>
                         <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                             {cart.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <EmptyCartIcon />
                                    <p className="mt-2">Aún no hay productos.</p>
                                </div>
                             ) : (
                                <ul className="divide-y divide-slate-200">
                                    {cart.map(item => (
                                        <li key={item.id} className="p-3 flex items-center gap-4">
                                            <div className="flex-grow">
                                                <p className="font-medium text-slate-800 text-base">{item.name}</p>
                                                <p className="text-sm text-slate-500">{formatARS(item.priceARS)}</p>
                                            </div>

                                            {/* Improved Quantity Input */}
                                            <div className="flex items-center border border-slate-300 rounded-md">
                                                <button 
                                                    onClick={() => handleUpdateQty(item.id, item.qty - 1)} 
                                                    className="px-2 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-l-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                                    disabled={item.qty <= 1}
                                                    aria-label="Disminuir cantidad"
                                                >
                                                    -
                                                </button>
                                                <input 
                                                    type="number" 
                                                    value={item.qty}
                                                    onChange={e => handleUpdateQty(item.id, parseInt(e.target.value) || 1)}
                                                    className="w-12 text-center border-none focus:ring-0 text-slate-800 font-medium bg-white text-base"
                                                    min="1"
                                                    max={item.stock}
                                                    aria-label={`Cantidad para ${item.name}`}
                                                />
                                                <button 
                                                    onClick={() => handleUpdateQty(item.id, item.qty + 1)} 
                                                    className="px-2 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                                    disabled={item.qty >= item.stock}
                                                    aria-label="Aumentar cantidad"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <p className="w-20 text-right font-semibold text-slate-800 text-base">{formatARS(item.priceARS * item.qty)}</p>
                                            
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-600 rounded-full p-1 transition-colors" aria-label={`Quitar ${item.name}`}>
                                                <DeleteIcon />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                             )}
                         </div>
                         <button onClick={() => setProductPickerOpen(true)} className="w-full bg-slate-100 text-slate-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-base">
                           <PlusIcon />
                           Agregar Producto
                         </button>
                    </div>
                    {/* Right side: Summary */}
                    <div className="bg-slate-100 p-6 rounded-lg flex flex-col justify-between">
                        <div>
                             <div className="space-y-2">
                                 <div className="flex justify-between items-baseline">
                                    <span className="text-xl font-bold text-slate-800">Total</span>
                                    <span className="text-3xl font-bold text-slate-900">{formatARS(total)}</span>
                                 </div>
                             </div>
                             {error && <p role="alert" className="text-red-600 text-sm mt-4 text-center">{error}</p>}
                        </div>

                         <div className="mt-6">
                            <button
                                onClick={handleGenerateReceipt}
                                disabled={isProcessing || cart.length === 0}
                                className="w-full bg-green-600 text-white font-bold text-base py-3 px-4 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <GenerateIcon />
                                {isProcessing ? 'Procesando...' : 'Generar Comprobante'}
                            </button>
                         </div>
                    </div>
                </div>
            </Modal>
            
            {receiptDataForPreview && (
                <Modal isOpen={!!receiptDataForPreview} onClose={resetState} title="Vista Previa del Comprobante" size="md">
                    <div id="quick-sale-receipt-preview" className="flex justify-center bg-slate-100 p-4 rounded-md">
                        <QuickSaleReceipt items={receiptDataForPreview.items} total={receiptDataForPreview.total} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={resetState}
                            className="text-base font-semibold text-slate-700 py-2.5 px-5 rounded-lg hover:bg-slate-100"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <PrintIcon />
                            Imprimir
                        </button>
                    </div>
                </Modal>
            )}
            
            <Modal isOpen={isProductPickerOpen} onClose={() => setProductPickerOpen(false)} title="Agregar Producto">
                <ProductPicker onSelectProduct={handleAddProduct} />
            </Modal>
        </>
    );
};