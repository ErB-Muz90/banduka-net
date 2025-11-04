

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PurchaseOrder, Supplier, Product, Settings } from '../types';
import PurchaseOrderDocument from './PurchaseOrderDocument';

interface PODetailViewProps {
    purchaseOrder: PurchaseOrder;
    supplier?: Supplier;
    products: Product[];
    onBack: () => void;
    onWhatsAppRequest: (poId: string, supplierId: string) => void;
    settings: Settings;
    onSendPO: (poId: string) => void;
    onReceivePORequest: (po: PurchaseOrder) => void;
    canManage: boolean;
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


const PODetailView: React.FC<PODetailViewProps> = ({ purchaseOrder, supplier, products, onBack, onWhatsAppRequest, settings, onSendPO, onReceivePORequest, canManage }) => {
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const { id, poNumber, status } = purchaseOrder;

    const canSend = canManage && status === 'Draft';
    const canReceive = canManage && (status === 'Sent' || status === 'Partially Received');

    const handleDownload = async () => {
        if (!pdfRef.current || isDownloading) return;

        setIsDownloading(true);
        try {
            await waitForImagesToLoad(pdfRef.current!);
            const canvas = await html2canvas(pdfRef.current!, {
                scale: 2,
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`PurchaseOrder_${poNumber}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Sorry, there was an error generating the PDF. The logo might be causing an issue.");
        } finally {
            setIsDownloading(false);
        }
    };
    
    const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

    return (
        <div className="h-full overflow-y-auto bg-background dark:bg-dark-background">
            <div className="p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <button onClick={onBack} className="flex items-center text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Back to All Purchases
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
                        {canSend && (
                            <button 
                                onClick={() => onSendPO(purchaseOrder.id)}
                                whileTap={{ scale: 0.95 }}
                                className="bg-blue-600 text-white font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center text-sm"
                            >
                                Mark as Sent
                            </button>
                        )}
                        {canReceive && (
                            <button 
                                onClick={() => onReceivePORequest(purchaseOrder)}
                                whileTap={{ scale: 0.95 }}
                                className="bg-green-600 text-white font-bold px-3 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center text-sm"
                            >
                                Receive Stock
                            </button>
                        )}
                    </div>
                </div>
                
                <div id="pdf-content-wrapper">
                    <PurchaseOrderDocument
                        ref={pdfRef}
                        purchaseOrder={purchaseOrder}
                        supplier={supplier}
                        products={products}
                        settings={settings}
                    />
                </div>
            </div>
        </div>
    );
};

export default PODetailView;