

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SupplierInvoice, Supplier, PurchaseOrder, Settings } from '../types';
import SupplierInvoiceDocument from './SupplierInvoiceDocument';

interface InvoiceDetailViewProps {
    invoice: SupplierInvoice;
    supplier?: Supplier;
    purchaseOrder?: PurchaseOrder;
    settings: Settings;
    onBack: () => void;
}

// Helper function to wait for all images inside an element to load
const waitForImagesToLoad = (element: HTMLElement): Promise<void[]> => {
    const images = Array.from(element.getElementsByTagName('img'));
    const promises = images.map(img => {
        return new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
                resolve();
            } else {
                img.onload = () => resolve();
                img.onerror = () => {
                    console.warn(`Could not load image for PDF generation: ${img.src}`);
                    resolve(); // Resolve anyway to not block PDF generation
                };
            }
        });
    });
    return Promise.all(promises);
};


const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoice, supplier, purchaseOrder, settings, onBack }) => {
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!pdfRef.current || isDownloading) return;

        setIsDownloading(true);
        try {
            await waitForImagesToLoad(pdfRef.current!);
            const canvas = await html2canvas(pdfRef.current!, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Sorry, there was an error generating the PDF. The logo might be causing an issue.");
        } finally {
            setIsDownloading(false);
        }
    };

    const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

    return (
        <div className="bg-background dark:bg-dark-background">
            <div className="p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <button onClick={onBack} className="flex items-center text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Back to Accounts Payable
                    </button>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                         <button 
                            onClick={handleDownload}
                            whileTap={{ scale: 0.95 }}
                            disabled={isDownloading}
                            className="bg-primary text-primary-content font-bold px-3 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-sm flex items-center text-sm disabled:bg-slate-400"
                        >
                            <DownloadIcon/> {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
                
                <div id="pdf-content-wrapper">
                    <SupplierInvoiceDocument
                        ref={pdfRef}
                        invoice={invoice}
                        supplier={supplier}
                        purchaseOrder={purchaseOrder}
                        settings={settings}
                    />
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailView;