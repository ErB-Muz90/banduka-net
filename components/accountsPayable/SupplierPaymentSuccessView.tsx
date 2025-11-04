import React from 'react';
import { motion } from 'framer-motion';
import { SupplierPayment, SupplierInvoice, PurchaseOrder, Supplier, User, Settings } from '../types';
import PaymentReconciliation from './PaymentReconciliation';

interface SupplierPaymentSuccessViewProps {
    info: {
        payment: SupplierPayment;
        invoice: SupplierInvoice;
        po: PurchaseOrder;
        supplier: Supplier;
    };
    user: User;
    settings: Settings;
    onDone: () => void;
}

const SupplierPaymentSuccessView: React.FC<SupplierPaymentSuccessViewProps> = ({ info, user, settings, onDone }) => {
    const handlePrint = () => {
        window.print();
    };

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
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Payment Recorded!</h1>
                    <p className="text-foreground/70 dark:text-dark-foreground/70 mt-2">Payment of {settings.businessInfo.currency} {info.payment.amount.toFixed(2)} to {info.supplier.name} has been successfully recorded.</p>
                    
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <button
                            onClick={onDone}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary dark:bg-dark-primary text-primary-content dark:text-dark-primary-content font-bold py-3 px-8 rounded-xl"
                        >
                            Done
                        </button>
                         <button
                            onClick={handlePrint}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-foreground/80 dark:bg-dark-border text-white font-bold py-3 px-6 rounded-lg hover:bg-foreground dark:hover:bg-dark-border/80"
                        >
                            Print Reconciliation
                        </button>
                    </div>
                </div>
                <div className="flex-grow w-full md:w-auto md:flex-grow-0 flex-shrink-0 overflow-y-auto print-area">
                   <div id="receipt-container" style={{ width: '210mm' }}>
                     <div id="receipt-to-print">
                        <PaymentReconciliation {...info} user={user} settings={settings} />
                     </div>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierPaymentSuccessView;
