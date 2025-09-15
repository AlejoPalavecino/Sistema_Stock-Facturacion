import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InvoiceForm } from '../components/invoicing/InvoiceForm';
import { InvoiceList } from '../components/invoicing/InvoiceList';
import { useInvoices } from '../hooks/useInvoices';
import { Invoice } from '../types/invoice';
import { Modal } from '../components/shared/Modal';
import { IssuePreview } from '../components/invoicing/IssuePreview';

const Facturacion: React.FC = () => {
    const { invoices, loading, error, createDraft, getById } = useInvoices();
    const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

    const handleNewInvoice = async () => {
        const newDraft = await createDraft();
        if (newDraft) {
            setEditingInvoiceId(newDraft.id);
        }
    };

    const handleEditInvoice = (id: string) => {
        setEditingInvoiceId(id);
    };

    const handleCloseForm = () => {
        setEditingInvoiceId(null);
    };

    const handleViewInvoice = async (id: string) => {
        const invoiceToView = await getById(id);
        if (invoiceToView) {
            setViewingInvoice(invoiceToView);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };


    if (loading) return <p>Cargando facturas...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <Link to="/" className="inline-block mb-2">
                           <button className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 shadow-sm transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Volver al Dashboard
                            </button>
                        </Link>
                        <h1 className="text-4xl font-bold text-slate-800">Facturación</h1>
                    </div>
                </header>

                <main>
                    {editingInvoiceId ? (
                        <InvoiceForm
                            invoiceId={editingInvoiceId}
                            onClose={handleCloseForm}
                        />
                    ) : (
                        <>
                           <div className="mb-6">
                                <button
                                    onClick={handleNewInvoice}
                                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-flex items-center"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Nueva Factura
                                </button>
                            </div>
                            <InvoiceList 
                                invoices={invoices} 
                                onEdit={handleEditInvoice}
                                onView={handleViewInvoice}
                            />
                        </>
                    )}
                </main>
            </div>
            
            {viewingInvoice && (
                <Modal 
                    isOpen={!!viewingInvoice} 
                    onClose={() => setViewingInvoice(null)} 
                    title={`Factura ${viewingInvoice.pos}-${viewingInvoice.number}`}
                >
                    <div id="invoice-preview-content">
                       <IssuePreview invoice={viewingInvoice} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6 print-hidden">
                         <button
                            onClick={() => setViewingInvoice(null)}
                            className="text-sm font-semibold text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                         >
                            Cerrar
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            Imprimir / Guardar PDF
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Facturacion;