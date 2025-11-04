import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Expense, Settings } from '../../types';
import ExpenseVoucher from './ExpenseVoucher';

interface ExpenseDetailViewProps {
    expense: Expense;
    settings: Settings;
    onBack: () => void;
}

const ExpenseDetailView: React.FC<ExpenseDetailViewProps> = ({ expense, settings, onBack }) => {
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handlePrint = () => { window.print(); };

    const handleDownloadPDF = async () => {
        if (!pdfRef.current || isDownloading) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Expense_${expense.id}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div className="h-full bg-background dark:bg-dark-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 no-print">
                    <button onClick={onBack} className="flex items-center text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">
                        &larr; Back to Expenditures List
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="bg-foreground/80 dark:bg-dark-border text-white font-semibold px-4 py-2 rounded-lg hover:bg-foreground dark:hover:bg-dark-border/80 text-sm">Print Voucher</button>
                        <button onClick={handleDownloadPDF} disabled={isDownloading} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus text-sm disabled:bg-slate-400">
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                {expense.receiptImageUrl && (
                    <div className="mb-6 no-print">
                        <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground mb-2">Attached Receipt</h3>
                        <div className="bg-card dark:bg-dark-card p-4 rounded-lg border border-border dark:border-dark-border">
                            <img src={expense.receiptImageUrl} alt="Expense Receipt" className="max-w-full h-auto max-h-96 object-contain rounded-md" />
                        </div>
                    </div>
                )}
                
                <div id="pdf-content-wrapper">
                    <ExpenseVoucher ref={pdfRef} expense={expense} settings={settings} />
                </div>
            </div>
        </div>
    );
};

export default ExpenseDetailView;