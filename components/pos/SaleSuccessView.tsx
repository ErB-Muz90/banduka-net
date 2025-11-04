

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sale, User, Settings, Layaway, ToastData } from '../../types';
import Receipt from './Receipt';
import { ICONS } from '../../constants';
import * as escpos from '../../utils/escpos';

interface SaleSuccessViewProps {
    sale: Sale;
    layaway?: Layaway;
    onNewSale: () => void;
    currentUser: User;
    settings: Settings;
    onWhatsAppReceiptRequest: (saleId: string, customerId: string) => void;
    shouldAutoPrint?: boolean;
    onAutoPrintDone?: () => void;
    showToast: (message: string, type: ToastData['type']) => void;
}

// FIX: Changed to a named export to resolve module resolution issues in other components.
export const SaleSuccessView: React.FC<SaleSuccessViewProps> = ({ sale, layaway, onNewSale, currentUser, settings, onWhatsAppReceiptRequest, shouldAutoPrint, onAutoPrintDone, showToast }) => {
    
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

    useEffect(() => {
        if (shouldAutoPrint) {
            const timer = setTimeout(() => {
                handlePrint();
                if (onAutoPrintDone) onAutoPrintDone();
            }, 500); // Small delay for component to render and for API state to be certain
            return () => clearTimeout(timer);
        }
    }, [shouldAutoPrint, onAutoPrintDone, settings.hardware.printer.type]);


    return (
        <div className="h-full flex flex-col bg-background dark:bg-dark-background p-4 md:p-8 md:items-center md:justify-center">
            <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 h-full md:h-auto">
                <div className="flex-shrink-0 md:flex-grow bg-card dark:bg-dark-card p-8 rounded-2xl shadow-lg text-center flex flex-col items-center justify-center no-print">
                    <div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                        className="bg-success/10 dark:bg-dark-success/10 rounded-full p-4 mb-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-success dark:text-dark-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Sale Complete!</h1>
                    <p className="text-foreground/70 dark:text-dark-foreground/70 mt-2">Transaction ID: {sale.id}</p>
                    {settings.tax.etimsEnabled && (
                        <div className="mt-4">
                            {sale.kraIcn ? (
                                <div initial={{opacity:0}} animate={{opacity:1}} className="bg-success/10 dark:bg-dark-success/10 text-success dark:text-dark-success text-sm font-semibold px-4 py-2 rounded-full inline-block">
                                    eTIMS Submission Successful
                                </div>
                            ) : (
                                <div initial={{opacity:0}} animate={{opacity:1}} className="bg-amber-100 dark:bg-dark-warning/10 text-amber-800 dark:text-dark-warning text-sm font-semibold px-4 py-2 rounded-full inline-block">
                                    eTIMS submission pending, will retry automatically.
                                </div>
                            )}
                        </div>
                    )}
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <button
                            onClick={onNewSale}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary dark:bg-dark-primary text-primary-content dark:text-dark-primary-content font-bold py-3 px-8 rounded-xl hover:bg-primary-focus dark:hover:bg-dark-primary-focus transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset text-lg"
                        >
                            {layaway ? 'Close' : 'New Sale'}
                        </button>
                        <button
                            onClick={() => onWhatsAppReceiptRequest(sale.id, sale.customerId)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-[#25D366] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#1EAE53] transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset text-lg flex items-center"
                        >
                            <div className="w-5 h-5 mr-2">{ICONS.whatsapp}</div>
                            WhatsApp
                        </button>
                        <button
                            onClick={handlePrint}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-foreground/80 dark:bg-dark-border text-white font-bold py-3 px-6 rounded-lg hover:bg-foreground dark:hover:bg-dark-border/80 transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset text-lg flex items-center"
                        >
                            Print
                        </button>
                    </div>
                </div>
                <div className="flex-grow w-full md:w-96 md:flex-grow-0 flex-shrink-0 overflow-y-auto print-area">
                   <div id="receipt-container">
                     <div id="receipt-to-print">
                        <Receipt sale={sale} cashierName={sale.cashierName} settings={settings} layaway={layaway} />
                     </div>
                   </div>
                </div>
            </div>
        </div>
    );
};