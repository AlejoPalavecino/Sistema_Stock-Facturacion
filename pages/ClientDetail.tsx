import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useClientDetails } from '../hooks/useClientDetails';
import { formatARS } from '../../utils/format';
import { ClientHistoryTable } from '../components/clients/ClientHistoryTable';
import { PaymentModal } from '../components/clients/PaymentModal';
import { DebtModal } from '../components/clients/DebtModal';
import { ClientForm } from '../components/clients/ClientForm';
import { Payment } from '../types/payment';
import { Client } from '../types/client';
import { AccountAdjustment } from '../types/adjustment';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export const ClientDetail: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { client, debt, history, loading, error, addPayment, updateClient, addAdjustment } = useClientDetails(clientId!);
    
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [isDebtModalOpen, setDebtModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(!clientId);

    const handleSavePayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'clientId'>) => {
        await addPayment(paymentData);
        setPaymentModalOpen(false);
    }, [addPayment]);

    const handleSaveAdjustment = useCallback(async (adjustmentData: Omit<AccountAdjustment, 'id' | 'createdAt' | 'clientId'>) => {
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
                <header className="mb-8">
                    <Link to="/clientes" className="inline-block mb-4">
                        <button className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 shadow-sm transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Volver a Clientes
                        </button>
                    </Link>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{client.name}</h1>
                            <p className="text-slate-500">{client.docType}: {client.docNumber}</p>
                            <p className="text-slate-500">{client.email}</p>
                        </div>
                        <div className="text-left md:text-right mt-4 md:mt-0">
                            <p className="text-sm text-slate-600">Deuda Total</p>
                            <p className={`text-3xl font-bold ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatARS(debt)}
                            </p>
                        </div>
                    </div>
                </header>

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
                                    className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50"
                                >
                                    Editar Cliente
                                </button>
                                <button
                                    onClick={() => setDebtModalOpen(true)}
                                    className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50"
                                >
                                    Registrar Deuda/Ajuste
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
                                <ClientHistoryTable history={history} />
                            </div>
                        </>
                    )}
                </main>
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                onSave={handleSavePayment}
            />
            
            <DebtModal
                isOpen={isDebtModalOpen}
                onClose={() => setDebtModalOpen(false)}
                onSave={handleSaveAdjustment}
            />

        </div>
    );
};
