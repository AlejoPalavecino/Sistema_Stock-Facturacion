import React, { useState, useCallback } from 'react';
import * as Router from 'react-router-dom';
import { useClientDetails } from '../hooks/useClientDetails';
import { formatARS } from '../utils/format';
import { PaymentModal } from '../components/clients/PaymentModal';
import { DebtModal } from '../components/clients/DebtModal';
import { ClientForm } from '../components/clients/ClientForm';
import { Payment, Client, AccountAdjustment, Invoice } from '../types';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { DetailHeader } from '../components/shared/DetailHeader.tsx';
import { ClientInvoiceList } from '../components/clients/ClientInvoiceList.tsx';
import { ViewChequeModal } from '../components/clients/ViewChequeModal.tsx';
import { ManageChequesModal } from '../components/clients/ManageChequesModal.tsx';

export const ClientDetail: React.FC = () => {
    const { clientId } = Router.useParams<{ clientId: string }>();
    const { client, debt, invoices, payments, loading, error, addPayment, updateClient, addAdjustment, confirmChequePayment, getPendingChequesForInvoice } = useClientDetails(clientId!);
    
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
    const [chequeToView, setChequeToView] = useState<Payment | null>(null);
    const [isDebtModalOpen, setDebtModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(!clientId);
    const [isManageChequesModalOpen, setManageChequesModalOpen] = useState(false);
    const [invoiceToManageCheques, setInvoiceToManageCheques] = useState<Invoice | null>(null);

    const handleOpenPaymentModal = useCallback((invoice: Invoice) => {
        setInvoiceToPay(invoice);
        setPaymentModalOpen(true);
    }, []);
    
    const handleOpenManageChequesModal = useCallback((invoice: Invoice) => {
        setInvoiceToManageCheques(invoice);
        setManageChequesModalOpen(true);
    }, []);

    const handleSavePayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'clientId' | 'updatedAt'>) => {
        await addPayment(paymentData);
        setPaymentModalOpen(false);
        setInvoiceToPay(null);
    }, [addPayment]);

    const handleViewCheque = useCallback((payment: Payment) => {
        setChequeToView(payment);
    }, []);

    const handleConfirmCheque = useCallback(async (paymentId: string) => {
        await confirmChequePayment(paymentId);
        // If the management modal is open, we can close it upon confirmation, or leave it open
        // Let's leave it open to allow confirming multiple cheques. The list inside will update.
    }, [confirmChequePayment]);

    const handleSaveAdjustment = useCallback(async (adjustmentData: Omit<AccountAdjustment, 'id' | 'createdAt' | 'clientId' | 'updatedAt'>) => {
        await addAdjustment(adjustmentData);
    }, [addAdjustment]);

    const handleSaveClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            if (clientId) {
                await updateClient(clientData);
                setIsEditing(false);
            }
        } catch (e) {
            console.error(e);
        }
    }, [clientId, updateClient]);
    
    if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
    if (error) return <div className="text-red-500 p-8">{error}</div>;
    if (!client) return <div className="p-8">Cliente no encontrado.</div>;


    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <DetailHeader
                    backTo="/clientes"
                    title={client.name}
                    subtitle={`${client.docType}: ${client.docNumber}`}
                    email={client.email}
                >
                    <p className="text-base text-slate-700">Deuda Total</p>
                    <p className={`text-3xl sm:text-4xl font-bold ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatARS(debt)}
                    </p>
                </DetailHeader>

                <main>
                    {isEditing ? (
                         <ClientForm 
                            clientToEdit={client}
                            onSave={handleSaveClient}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <>
                            <div className="flex flex-wrap justify-end mb-6 gap-3">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50"
                                >
                                    Editar Cliente
                                </button>
                                <button
                                    onClick={() => setDebtModalOpen(true)}
                                    className="bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50"
                                >
                                    Registrar Deuda/Ajuste
                                </button>
                            </div>
                            
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
                                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Historial de Facturas</h2>
                                <ClientInvoiceList 
                                    invoices={invoices} 
                                    getPendingChequesForInvoice={getPendingChequesForInvoice}
                                    onPay={handleOpenPaymentModal}
                                    onManageCheques={handleOpenManageChequesModal}
                                />
                            </div>
                        </>
                    )}
                </main>
            </div>

            {invoiceToPay && (
                 <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    onSave={handleSavePayment}
                    invoice={invoiceToPay}
                />
            )}
            
            {invoiceToManageCheques && (
                 <ManageChequesModal
                    isOpen={isManageChequesModalOpen}
                    onClose={() => setManageChequesModalOpen(false)}
                    invoice={invoiceToManageCheques}
                    pendingCheques={getPendingChequesForInvoice(invoiceToManageCheques.id)}
                    onConfirmCheque={handleConfirmCheque}
                />
            )}

            {chequeToView && (
                <ViewChequeModal 
                    isOpen={!!chequeToView}
                    onClose={() => setChequeToView(null)}
                    payment={chequeToView}
                />
            )}
            
            <DebtModal
                isOpen={isDebtModalOpen}
                onClose={() => setDebtModalOpen(false)}
                onSave={handleSaveAdjustment}
            />

        </div>
    );
};