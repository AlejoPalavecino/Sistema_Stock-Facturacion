import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InvoiceForm } from '../components/invoicing/InvoiceForm';
import { InvoiceList } from '../components/invoicing/InvoiceList';
import { useInvoices } from '../hooks/useInvoices';
import { Invoice } from '../types/invoice';
import { Modal } from '../components/shared/Modal';
import { IssuePreview } from '../components/invoicing/IssuePreview';
import * as clientsRepo from '../services/db/clientsRepo';

// Add declarations for CDN libraries
declare const html2canvas: any;
declare const jspdf: any;


const Facturacion: React.FC = () => {
    const invoiceActions = useInvoices();
    const { invoices, loading, error, createDraft, getById, cancelInvoice } = invoiceActions;

    const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleOpenCancelModal = (id: string) => {
        const invoice = invoices.find(inv => inv.id === id);
        if (invoice) {
            setInvoiceToCancel(invoice);
        }
    };

    const handleConfirmCancel = async () => {
        if (invoiceToCancel) {
            await cancelInvoice(invoiceToCancel.id);
            setInvoiceToCancel(null);
        }
    };
    
    const handleDownloadAndEmail = async () => {
        if (!viewingInvoice) return;

        const invoiceElement = document.getElementById('invoice-preview-content');
        if (!invoiceElement) {
            console.error('Invoice element not found for PDF generation.');
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Fetch client email
            let clientEmail: string | undefined;
            if (viewingInvoice.clientId) {
                const client = await clientsRepo.getById(viewingInvoice.clientId);
                clientEmail = client?.email;
            }

            // 2. Generate PDF
            const { jsPDF } = jspdf;
            const canvas = await html2canvas(invoiceElement, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            
            const pdfWidth = 210; 
            const pageHeight = 297; 
            const imgHeight = canvas.height * pdfWidth / canvas.width;
            
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // 3. Save PDF
            pdf.save(`Factura-${viewingInvoice.pos}-${viewingInvoice.number}.pdf`);

            // 4. Open email client if email exists
            if (clientEmail) {
                const subject = `Factura Nº ${viewingInvoice.pos}-${viewingInvoice.number}`;
                const body = `Hola ${viewingInvoice.clientName},\n\nAdjuntamos la factura correspondiente a tu reciente operación.\n\nPor favor, no dudes en contactarnos si tienes alguna consulta.\n\nSaludos cordiales,\nTu Empresa`;
                const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoLink;
            } else {
                console.warn(`Cliente ${viewingInvoice.clientName} no tiene un email registrado. Se omitió el envío.`);
                // Optionally, show a non-intrusive notification to the user here.
            }

        } catch (error) {
            console.error('Error generating PDF or preparing email:', error);
        } finally {
            setIsProcessing(false);
        }
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
                            actions={invoiceActions}
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
                                onCancel={handleOpenCancelModal}
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
                    size="4xl"
                >
                    <div className="-m-6">
                        <div id="invoice-preview-content">
                           <IssuePreview invoice={viewingInvoice} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6 p-6 border-t border-slate-200 print-hidden">
                             <button
                                onClick={() => setViewingInvoice(null)}
                                className="text-sm font-semibold text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                             >
                                Cerrar
                            </button>
                            <button
                                onClick={handleDownloadAndEmail}
                                disabled={isProcessing}
                                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Procesando...' : 'Imprimir / Guardar PDF'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <Modal
                isOpen={!!invoiceToCancel}
                onClose={() => setInvoiceToCancel(null)}
                title="Confirmar Anulación"
            >
                {invoiceToCancel && (
                    <div>
                        <p className="text-slate-600 mb-6">
                            ¿Estás seguro de que quieres anular la factura <strong className="font-semibold text-slate-800">{invoiceToCancel.pos}-{invoiceToCancel.number}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setInvoiceToCancel(null)}
                                className="text-sm font-semibold text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            >
                                Anular Factura
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Facturacion;