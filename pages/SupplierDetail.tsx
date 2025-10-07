import React, { useState, useCallback } from 'react';
import * as Router from 'react-router-dom';
import { useSupplierDetails } from '../hooks/useSupplierDetails';
import { formatARS } from '../utils/format';
import { SupplierPaymentModal } from '../components/suppliers/SupplierPaymentModal';
import { SupplierForm } from '../components/suppliers/SupplierForm';
import { Purchase, SupplierPayment, Supplier } from '../types';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { DetailHeader } from '../components/shared/DetailHeader.tsx';
import { PurchaseList } from '../components/suppliers/PurchaseList.tsx';

export const SupplierDetail: React.FC = () => {
    const { supplierId } = Router.useParams<{ supplierId: string }>();
    const { supplier, debt, purchases, loading, error, addPayment, updateSupplier } = useSupplierDetails(supplierId!);
    
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [purchaseToPay, setPurchaseToPay] = useState<Purchase | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const handleOpenPaymentModal = useCallback((purchase: Purchase) => {
        setPurchaseToPay(purchase);
        setPaymentModalOpen(true);
    }, []);

    const handleSavePayment = useCallback(async (paymentData: Omit<SupplierPayment, 'id' | 'createdAt' | 'supplierId' | 'updatedAt'>) => {
        await addPayment(paymentData);
        setPaymentModalOpen(false);
        setPurchaseToPay(null);
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
    if (error) return <div className="text-pastel-red-500 p-8">{error}</div>;
    if (!supplier) return <div className="p-8">Proveedor no encontrado.</div>;

    return (
        <div className="bg-cream-100 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <DetailHeader
                    backTo="/proveedores"
                    title={supplier.businessName}
                    subtitle={supplier.cuit}
                    email={supplier.email}
                >
                    <p className="text-base text-text-medium">Deuda Total</p>
                    <p className={`text-3xl sm:text-4xl font-bold ${debt > 0 ? 'text-pastel-red-600' : 'text-pastel-green-600'}`}>
                        {formatARS(debt)}
                    </p>
                </DetailHeader>

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
                                    className="btn btn-secondary"
                                >
                                    Editar Proveedor
                                </button>
                            </div>
                            
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-cream-200">
                                <h2 className="text-2xl font-semibold text-text-dark mb-4">Historial de Facturas de Compra</h2>
                                <PurchaseList purchases={purchases} onPay={handleOpenPaymentModal} />
                            </div>
                        </>
                    )}
                </main>
            </div>
            
            {purchaseToPay && (
                <SupplierPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    onSave={handleSavePayment}
                    purchase={purchaseToPay}
                />
            )}
            
        </div>
    );
};