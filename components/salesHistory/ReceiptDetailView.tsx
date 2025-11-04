

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Sale, User, Settings, Layaway, ToastData } from '../../types';
import Receipt from '../pos/Receipt';
import { ICONS } from '../../constants';
import * as escpos from '../../utils/escpos';

interface ReceiptDetailViewProps {
    sale: Sale;
    layaway?: Layaway;
    onBack: () => void;
    currentUser: User;
    settings: Settings;
    onWhatsAppReceiptRequest: (documentType: 'Receipt', saleId: string, customerId: string) => void;
    showToast: (message: string, type: ToastData['type']) => void;
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


const ReceiptDetailView: React.FC<ReceiptDetailViewProps> = ({ sale, layaway, onBack, currentUser, settings, onWhatsAppReceiptRequest, showToast }) => {
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handlePrint = async () => {
        const { type, vendorId, productId } = settings.hardware.printer;
        if (type === 'ESC/POS') {
            if (!vendorId || !productId) {
                showToast("ESC/POS printer not configured. Please connect one in Settings > Hardware.", 'warning');
                // Fallback to browser print
                setTimeout(() => window.print(), 500);
                return;
            }
            try {
                await escpos.printDirect(sale, settings, sale.cashierName);
            } catch (error: any) {
                console.error("Direct print failed:", error);
                if (error.message?.includes("driver may be blocking access")) {
                    showToast("Direct print failed. Falling back to Browser Print.", 'warning');
                    // Fallback to browser print after a short delay to allow toast to appear
                    setTimeout(() => window.print(), 500); 
                } else {
                    showToast(error.message || 'Direct print failed. Please check printer connection.', 'error');
                }
            }
        } else {
            window.print();
        }
    };

    const handleDownloadPDF = async () => {
        if (!pdfRef.current || isDownloading) return;

        setIsDownloading(true);
        // Small delay to ensure canvas elements (barcode/QR) are rendered before capture
        setTimeout(async () => {
            try {
                if (!pdfRef.current) throw new Error("PDF reference is not available.");
                await waitForImagesToLoad(pdfRef.current);
                const canvas = await html2canvas(pdfRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', [80, 297]); // Standard receipt paper width
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Receipt_${sale.id}.pdf`);
            } catch (error) {
                console.error("Failed to generate PDF:", error);
                alert("Sorry, there was an error generating the PDF. The logo, barcode, or QR code might be causing an issue.");
            } finally {
                setIsDownloading(false);
            }
        }, 100);
    };

    return (
        <div className="h-full flex flex-col bg-background dark:bg-dark-background p-4 md:p-8 md:items-center md:justify-center">
            <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 h-full md:h-auto">
                <div className="flex-shrink-0 md:flex-grow bg-card dark:bg-dark-card p-8 rounded-xl shadow-sm border border-border dark:border-dark-border flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Receipt Details</h1>
                    <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2 font-mono text-sm">ID: {sale.id}</p>
                    
                     <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <button
                            onClick={onBack}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold py-3 px-6 rounded-lg hover:bg-border dark:hover:bg-dark-border transition-colors shadow-sm text-lg"
                        >
                            &larr; Back to List
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isDownloading}
                            className="bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-600 transition-colors shadow-md text-lg flex items-center disabled:bg-slate-400"
                        >
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={() => onWhatsAppReceiptRequest('Receipt', sale.id, sale.customerId)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-[#25D366] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1EAE53] transition-colors shadow-md text-lg flex items-center"
                        >
                            <div className="w-5 h-5 mr-2">{ICONS.whatsapp}</div>
                            WhatsApp
                        </button>
                        <button
                            onClick={handlePrint}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-foreground/80 dark:bg-dark-border text-white font-bold py-3 px-6 rounded-lg hover:bg-foreground dark:hover:bg-dark-border/80 transition-colors shadow-md text-lg flex items-center"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h1v-4a1 1 0 011-1h10a1 1 0 011 1v4h1a2 2 0 002-2v-6a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                            Print
                        </button>
                    </div>
                </div>
                <div className="flex-grow w-full md:w-96 md:flex-grow-0 flex-shrink-0 overflow-y-auto">
                   <div id="receipt-container">
                     <div ref={pdfRef}>
                        <Receipt sale={sale} cashierName={sale.cashierName} settings={settings} layaway={layaway} />
                     </div>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptDetailView;