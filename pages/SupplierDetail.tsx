
import React, { useState, useCallback } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { useSupplierDetails } from '../hooks/useSupplierDetails';
import { formatARS } from '../utils/format';
import { SupplierHistoryTable } from '../components/suppliers/SupplierHistoryTable';
import { PurchaseModal } from '../components/suppliers/PurchaseModal';
import { SupplierPaymentModal } from '../components/suppliers/SupplierPaymentModal';
import { SupplierForm } from '../components/suppliers/SupplierForm';
import { Purchase } from '../types/purchase';
import { SupplierPayment } from '../types/supplierPayment';
import { Supplier } from '../types/supplier';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export const SupplierDetail: React.FC = () => {
    const { supplierId } = Router.useParams<{ supplierId: string }>();
    const { supplier, debt, history, loading, error, addPurchase, addPayment, updateSupplier } = useSupplierDetails(supplierId!);
    
    const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleSavePurchase = useCallback(async (purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'supplierId' | 'status'>) => {
        await addPurchase(purchaseData);
        setPurchaseModalOpen(false);
    }, [addPurchase]);
    
    const handleSavePayment = useCallback(async (paymentData: Omit<SupplierPayment, 'id' | 'createdAt' | 'supplierId'>) => {
        await addPayment(paymentData);
        setPaymentModalOpen(false);
    }, [addPayment]);

    const handleSaveSupplier = useCallback(async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            await updateSupplier(supplierData);
            setIsEditing(false);
        } catch (e) {
            console.error(e); // Error is handled in the hook
        }
    }, [updateSupplier]);
    
    if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
    if (error) return <div className="text-red-500 p-8">{error}</div>;
    if (!supplier) return <div className="p-8">Proveedor no encontrado.</div>;


    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <Router.Link to="/proveedores" className="inline-block mb-4">
                        <button className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 shadow-sm transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Volver a Proveedores
                        </button>
                    </Router.Link>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{supplier.businessName}</h1>
                            <p className="text-slate-500">{supplier.docType}: {supplier.cuit}</p>
                            <p className="text-slate-500">{supplier.email}</p>
                        </div>
                        <div className="text-left md:text-right mt-4 md:mt-0">
                            <p className="text-sm text-slate-600">Deuda con Proveedor</p>
                            <p className={`text-3xl font-bold ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatARS(debt)}
                            </p>
                        </div>
                    </div>
                </header>

                <main>
                    {isEditing ? (
                         <SupplierForm
                            supplierToEdit={supplier}
                            onSave={handleSaveSupplier}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <>
                            <div className="flex flex-wrap justify-end mb-6 gap-3">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50"
                                >
                                    Editar Proveedor
                                </button>
                                <button
                                    onClick={() => setPurchaseModalOpen(true)}
                                    className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50"
                                >
                                    Registrar Compra
                                </button>
                                <button
                                    onClick={() => setPaymentModalOpen(true)}
                                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700"
                                >
                                    Registrar Pago
                                </button>
                            </div>
                            
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">Historial de Cuenta Corriente</h2>
                                <SupplierHistoryTable history={history} />
                            </div>
                        </>
                    )}
                </main>
            </div>

            <PurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setPurchaseModalOpen(false)}
                onSave={handleSavePurchase}
            />
            
            <SupplierPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                onSave={handleSavePayment}
            />

        </div>
    );
};
