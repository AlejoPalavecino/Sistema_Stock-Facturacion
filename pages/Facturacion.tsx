import React, { useState, useCallback } from 'react';
import * as Router from 'react-router-dom';
import { InvoiceForm } from '../components/invoicing/InvoiceForm.tsx';
import { InvoiceList } from '../components/invoicing/InvoiceList.tsx';
import { useInvoices } from '../hooks/useInvoices.ts';
import { Invoice } from '../types';
import { Modal } from '../components/shared/Modal.tsx';
import { ConfirmModal } from '../components/shared/ConfirmModal.tsx';
import { IssuePreview } from '../components/invoicing/IssuePreview.tsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
import { PageHeader } from '../components/shared/PageHeader.tsx';
import { PrintIcon, ExportIcon, PlusIcon } from '../components/shared/Icons.tsx';

// Add declarations for CDN libraries
declare const html2canvas: any;
declare const jspdf: any;


const Facturacion: React.FC = () => {
    const invoiceActions = useInvoices();
    const { invoices, loading, error, createDraft, getById, cancelInvoice, markInvoiceAsPaid, exportInvoices } = invoiceActions;

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

    const handleOpenCancelModal = useCallback(async (id: string) => {
        const invoiceToCancel = await getById(id);
        if (invoiceToCancel) {
            setInvoiceToCancel(invoiceToCancel);
        }
    }, [getById]);

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
    if (error) return <p className="text-pastel-red-500 p-8">{error}</p>;

    return (
        <div className="bg-cream-100 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <PageHeader title="Facturación" backTo="/">
                    {!editingInvoiceId && (
                        <>
                            <button
                                onClick={handleNewInvoice}
                                className="btn btn-primary"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Nueva Factura
                            </button>
                            <button
                                onClick={() => exportInvoices('excel')}
                                className="btn btn-secondary"
                            >
                                <ExportIcon className="h-5 w-5 mr-2" />
                                Exportar Excel
                            </button>
                        </>
                    )}
                </PageHeader>

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
                            onMarkAsPaid={markInvoiceAsPaid}
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
                        <div className="flex justify-end gap-3 mt-6 p-6 border-t border-cream-200 print-hidden">
                             <button
                                onClick={handleCloseViewModal}
                                className="btn btn-secondary"
                             >
                                Cerrar
                            </button>
                             <button
                                onClick={handleSavePdf}
                                disabled={isProcessing}
                                className="btn btn-primary"
                            >
                                {isProcessing ? 'Procesando...' : 'Guardar PDF'}
                            </button>
                             <button
                                onClick={handlePrint}
                                className="btn btn-neutral"
                                title="Imprimir Factura"
                            >
                                <PrintIcon className="h-5 w-5 mr-2" />
                                Imprimir
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <ConfirmModal
                isOpen={!!invoiceToCancel}
                onClose={() => setInvoiceToCancel(null)}
                onConfirm={handleConfirmCancel}
                title="Confirmar Anulación"
                confirmText="Anular Factura"
                confirmVariant="danger"
            >
                <p>
                    ¿Estás seguro de que quieres anular la factura <strong className="font-semibold text-text-dark">{invoiceToCancel?.pos}-{invoiceToCancel?.number}</strong>? Esta acción no se puede deshacer.
                </p>
            </ConfirmModal>
        </div>
    );
};

export default Facturacion;