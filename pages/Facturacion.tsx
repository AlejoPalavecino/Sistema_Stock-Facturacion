
import React, { useState, useCallback } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { InvoiceForm } from '../components/invoicing/InvoiceForm.tsx';
import { InvoiceList } from '../components/invoicing/InvoiceList.tsx';
import { useInvoices } from '../hooks/useInvoices.ts';
import { Invoice } from '../types/invoice.ts';
import { Modal } from '../components/shared/Modal.tsx';
import { IssuePreview } from '../components/invoicing/IssuePreview.tsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';

// Add declarations for CDN libraries
declare const html2canvas: any;
declare const jspdf: any;

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-8V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);


const Facturacion: React.FC = () => {
    const invoiceActions = useInvoices();
    const { invoices, loading, error, createDraft, getById, cancelInvoice, exportInvoices } = invoiceActions;

    const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleNewInvoice = useCallback(async () => {
        const newDraft = await createDraft();
        if (newDraft) {
            setEditingInvoiceId(newDraft.id);
        }
    }, [createDraft]);

    const handleEditInvoice = useCallback((id: string) => {
        setEditingInvoiceId(id);
    }, []);

    const handleCloseForm = useCallback(() => {
        setEditingInvoiceId(null);
    }, []);

    const handleCloseViewModal = useCallback(() => {
        setViewingInvoice(null);
    }, []);

    const handleViewInvoice = useCallback(async (id: string) => {
        const invoiceToView = await getById(id);
        if (invoiceToView) {
            setViewingInvoice(invoiceToView);
        }
    }, [getById]);

    const handleOpenCancelModal = useCallback((id: string) => {
        const invoice = invoices.find(inv => inv.id === id);
        if (invoice) {
            setInvoiceToCancel(invoice);
        }
    }, [invoices]);

    const handleConfirmCancel = useCallback(async () => {
        if (invoiceToCancel) {
            await cancelInvoice(invoiceToCancel.id);
            setInvoiceToCancel(null);
        }
    }, [invoiceToCancel, cancelInvoice]);

    const generatePdf = useCallback(async () => {
        const invoiceElement = document.getElementById('invoice-preview-content');
        if (!invoiceElement) {
            console.error('Invoice element not found for PDF generation.');
            return null;
        }
        
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
        return pdf;
    }, []);
    
    const handleSavePdf = useCallback(async () => {
        if (!viewingInvoice) return;
        setIsProcessing(true);
        try {
            const pdf = await generatePdf();
            pdf?.save(`Factura-${viewingInvoice.pos}-${viewingInvoice.number}.pdf`);
        } catch (error) {
            console.error('Error saving PDF:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [viewingInvoice, generatePdf]);
    
    const handlePrint = useCallback(() => {
        const invoiceContent = document.getElementById('invoice-preview-content');
        if (!invoiceContent) {
            console.error("Contenido de la factura no encontrado para imprimir.");
            return;
        }

        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        printContainer.innerHTML = invoiceContent.innerHTML;
        
        document.body.appendChild(printContainer);
        document.body.classList.add('is-printing');
        
        window.print();
        
        document.body.removeChild(printContainer);
        document.body.classList.remove('is-printing');
    }, []);


    if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
    if (error) return <p className="text-red-500 p-8">{error}</p>;

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <Router.Link to="/" className="inline-block mb-2">
                       <button className="flex items-center text-base font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 shadow-sm transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Volver al Dashboard
                        </button>
                    </Router.Link>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mt-2">
                        <h1 className="text-4xl font-bold text-slate-900">Facturación</h1>
                        {!editingInvoiceId && (
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={handleNewInvoice}
                                    className="bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-flex items-center justify-center md:justify-start"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Nueva Factura
                                </button>
                                <button
                                    onClick={() => exportInvoices('excel')}
                                    className="bg-white text-slate-800 font-semibold text-base py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-flex items-center justify-center md:justify-start"
                                >
                                    <ExportIcon />
                                    Exportar Excel
                                </button>
                            </div>
                        )}
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
                        <InvoiceList 
                            invoices={invoices} 
                            onEdit={handleEditInvoice}
                            onView={handleViewInvoice}
                            onCancel={handleOpenCancelModal}
                        />
                    )}
                </main>
            </div>
            
            {viewingInvoice && (
                <Modal 
                    isOpen={!!viewingInvoice} 
                    onClose={handleCloseViewModal}
                    title={`Factura ${viewingInvoice.pos}-${viewingInvoice.number}`}
                    size="4xl"
                >
                    <div className="-m-6">
                        <div id="invoice-preview-content">
                           <IssuePreview invoice={viewingInvoice} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6 p-6 border-t border-slate-200 print-hidden">
                             <button
                                onClick={handleCloseViewModal}
                                className="text-base font-semibold text-slate-700 py-2.5 px-5 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                             >
                                Cerrar
                            </button>
                             <button
                                onClick={handleSavePdf}
                                disabled={isProcessing}
                                className="bg-blue-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Procesando...' : 'Guardar PDF'}
                            </button>
                             <button
                                onClick={handlePrint}
                                className="bg-slate-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors flex items-center"
                                title="Imprimir Factura"
                            >
                                <PrintIcon />
                                Imprimir
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
                        <p className="text-slate-600 mb-6 text-base">
                            ¿Estás seguro de que quieres anular la factura <strong className="font-semibold text-slate-800">{invoiceToCancel.pos}-{invoiceToCancel.number}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setInvoiceToCancel(null)}
                                className="text-base font-semibold text-slate-700 py-2.5 px-5 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                className="bg-red-600 text-white font-semibold text-base py-2.5 px-5 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
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
