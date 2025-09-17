import React, { useState, useMemo } from 'react';
import * as productsRepo from '../../services/db/productsRepo';
import { Product } from '../../types/product';
import { Modal } from '../shared/Modal';
import { ProductPicker } from '../invoicing/ProductPicker';
import { formatARS } from '../../utils/format';
import { QuickSaleReceipt, QuickSaleItem } from './QuickSaleReceipt';

// Add declarations for CDN libraries
declare const html2canvas: any;
declare const jspdf: any;

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmptyCartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const GenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({ isOpen, onClose }) => {
    const [cart, setCart] = useState<QuickSaleItem[]>([]);
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProductPickerOpen, setProductPickerOpen] = useState(false);

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.priceARS * item.qty, 0), [cart]);

    const handleAddProduct = (product: Product) => {
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
    };
    
    const handleUpdateQty = (productId: string, newQty: number) => {
        setCart(prevCart => {
            const itemToUpdate = prevCart.find(item => item.id === productId);
            if (!itemToUpdate) return prevCart;
            
            const clampedQty = Math.max(1, Math.min(itemToUpdate.stock, newQty));
            
            return prevCart.map(item =>
                item.id === productId ? { ...item, qty: clampedQty } : item
            );
        });
    };

    const handleRemoveItem = (productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };
    
    const resetState = () => {
        setCart([]);
        setEmail('');
        setError(null);
        setIsProcessing(false);
        onClose();
    };
    
    const generateReceiptPdf = async () => {
        const receiptElement = document.getElementById('quick-sale-receipt-content');
        if (!receiptElement) {
            console.error('Receipt element not found for PDF generation.');
            return null;
        }
        
        // Temporarily make the element visible for rendering, but off-screen
        receiptElement.style.position = 'absolute';
        receiptElement.style.left = '-9999px';
        receiptElement.classList.remove('hidden');

        const { jsPDF } = jspdf;
        const canvas = await html2canvas(receiptElement, { scale: 3 });
        const imgData = canvas.toDataURL('image/png');
        
        // Hide it again
        receiptElement.style.position = '';
        receiptElement.style.left = '';
        receiptElement.classList.add('hidden');

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [80, 150] // Approximate receipt size
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = canvas.height * pdfWidth / canvas.width;

        pdf.addImage(imgData, 'PNG', 5, 5, pdfWidth - 10, imgHeight - 10);
        return pdf;
    };


    const handleGenerateReceipt = async () => {
        setError(null);
        if (cart.length === 0) {
            setError("Agregue al menos un producto a la venta.");
            return;
        }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Por favor, ingrese un correo electrónico válido.");
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Generate and download PDF
            const pdf = await generateReceiptPdf();
            if (!pdf) {
                throw new Error("No se pudo generar el comprobante PDF.");
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            pdf.save(`Comprobante-VentaRapida-${timestamp}.pdf`);

            // 2. Adjust stock
            for (const item of cart) {
                await productsRepo.adjustStock(item.id, -item.qty, 'sale', 'Venta Rápida (Remito)');
            }
            
            // 3. Prepare and open email client
            if (email.trim()) {
                const subject = `Comprobante de Venta`;
                const body = `Hola,\n\nAdjuntamos el comprobante correspondiente a tu reciente compra.\n\nPor favor, no dudes en contactarnos si tienes alguna consulta.\n\nSaludos cordiales.`;
                const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoLink;
            }
            
            resetState();

        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al procesar la venta.');
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <>
            <Modal isOpen={isOpen} onClose={resetState} title="Venta Rápida" size="2xl">
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
                                                <p className="font-medium text-slate-800">{item.name}</p>
                                                <p className="text-xs text-slate-500">{formatARS(item.priceARS)}</p>
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
                                                    className="w-12 text-center border-none focus:ring-0 text-slate-800 font-medium bg-white"
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

                                            <p className="w-20 text-right font-semibold text-slate-800">{formatARS(item.priceARS * item.qty)}</p>
                                            
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-600 rounded-full p-1 transition-colors" aria-label={`Quitar ${item.name}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                             )}
                         </div>
                         <button onClick={() => setProductPickerOpen(true)} className="w-full bg-slate-100 text-slate-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                           <AddIcon />
                           Agregar Producto
                         </button>
                    </div>
                    {/* Right side: Summary */}
                    <div className="bg-slate-100 p-6 rounded-lg flex flex-col justify-between">
                        <div>
                             <div className="mb-6">
                                <label htmlFor="quick-sale-email" className="block mb-1.5 text-sm font-medium text-slate-700">Email del Cliente (opcional)</label>
                                <input
                                  type="email"
                                  id="quick-sale-email"
                                  value={email}
                                  onChange={e => setEmail(e.target.value)}
                                  className="block w-full px-3 py-2 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Para enviar copia del comprobante"
                                />
                             </div>
                             <div className="space-y-2 border-t border-slate-200 pt-4">
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
                                disabled={isProcessing}
                                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <GenerateIcon />
                                {isProcessing ? 'Procesando...' : 'Finalizar y Generar Comprobante'}
                            </button>
                         </div>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isProductPickerOpen} onClose={() => setProductPickerOpen(false)} title="Agregar Producto">
                <ProductPicker onSelectProduct={handleAddProduct} />
            </Modal>
            
            <div className="hidden" id="quick-sale-receipt-content">
                <QuickSaleReceipt items={cart} total={total} />
            </div>
        </>
    );
};