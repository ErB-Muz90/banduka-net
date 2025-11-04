import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Shift, Sale, Settings, Expense, SupplierPayment, BankDeposit } from '../../types';

interface ZReportViewProps {
    shift: Shift;
    sales: Sale[];
    expenses: Expense[];
    supplierPayments: SupplierPayment[];
    bankDeposits: BankDeposit[];
    onClose: () => void;
    settings: Settings;
    isHistoricalView?: boolean;
}

// Helper components for styling
const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <div className="my-3">
        <p className="font-bold tracking-wider uppercase" style={{ textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationThickness: '1px' }}>{title}</p>
    </div>
);

const ReportRow: React.FC<{ label: string; value: string | number; isBold?: boolean; className?: string }> = ({ label, value, isBold, className = '' }) => (
    <div className={`flex justify-between items-center ${isBold ? 'font-bold' : ''} ${className}`}>
        <span>{label}:</span>
        <span>{typeof value === 'number' ? formatCurrency(value, '') : value}</span>
    </div>
);

const DottedSeparator = () => <div className="border-t border-dashed border-black my-2"></div>;
const SolidSeparator = () => <div className="border-t border-solid border-black my-2"></div>;

const formatCurrency = (amount: number, currency: string = 'KES') => {
    const prefix = currency ? `${currency} ` : '';
    if (amount < 0) {
        return `-${prefix}${Math.abs(amount).toFixed(2)}`;
    }
    return `${prefix}${amount.toFixed(2)}`;
}

const ZReportView: React.FC<ZReportViewProps> = ({ shift, sales: allSales, expenses: allExpenses, supplierPayments, bankDeposits, onClose, settings, isHistoricalView = false }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Calculations
    const shiftSales = allSales.filter(s => shift.salesIds.includes(s.id));
    
    const itemsSold = shiftSales.reduce((acc, sale) => acc + sale.items.reduce((iAcc, i) => iAcc + i.quantity, 0), 0);
    const grossSales = shiftSales.reduce((acc, s) => acc + s.subtotal, 0);
    const totalDiscounts = shiftSales.reduce((acc, s) => acc + s.discountAmount, 0);
    const totalVat = shiftSales.reduce((acc, s) => acc + s.tax, 0);
    const netSales = shift.totalSales || 0;
    
    const cashSales = shift.paymentBreakdown?.Cash || 0;
    const cashChange = shiftSales.reduce((acc, sale) => acc + sale.change, 0);
    const shiftCashExpenses = allExpenses.filter(p => shift.expenseIds?.includes(p.id) && p.source === 'Cash Drawer');
    const totalCashExpenses = shiftCashExpenses.reduce((acc, p) => acc + p.amount, 0);
    const shiftCashSupplierPayments = supplierPayments.filter(p => p.shiftId === shift.id && p.method === 'Cash');
    const totalCashSupplierPayments = shiftCashSupplierPayments.reduce((acc, p) => acc + p.amount, 0);
    const cashBanked = bankDeposits.filter(d => d.shiftId === shift.id).reduce((acc, d) => acc + d.breakdown.cash, 0);


    const totalPayments = Object.values(shift.paymentBreakdown || {}).reduce<number>((sum, amount) => sum + (Number(amount) || 0), 0);

    const durationMs = shift.endTime ? new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime() : 0;
    const durationHours = Math.floor(durationMs / 3600000);
    const durationString = `${durationHours} hours`;

    const variance = shift.cashVariance || 0;

    const handlePrint = () => window.print();
    
    const handleDownloadPDF = async () => {
        if (!reportRef.current || isDownloading) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`ZReport_${shift.id}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-100 dark:bg-slate-900/80 z-40 p-4 md:p-8 overflow-y-auto no-print"
        >
            <div className="max-w-md mx-auto">
                {/* Printable/PDF content */}
                <div id="shift-report-container" ref={reportRef} className="bg-white text-black font-mono text-xs w-full p-4 print:shadow-none print:border-none">
                    <div className="flex justify-between items-start text-[10px] mb-2">
                        <span>{new Date().toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi' })}, {new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Nairobi' })}</span>
                        <span>Z-Report - Shift {shift.id.substring(0, 10)}</span>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold uppercase">{settings.businessInfo.name}</h2>
                        <p className="text-lg font-bold">Z-REPORT</p>
                        <p className="text-[10px]">Shift Closure Report</p>
                        <p className="text-[10px]">{shift.endTime ? new Date(shift.endTime).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' }) : 'N/A'}</p>
                    </div>

                    <SolidSeparator />
                    
                    <SectionTitle title="SHIFT INFORMATION" />
                    <ReportRow label="Shift ID" value={shift.id.substring(0, 8)} />
                    <ReportRow label="Staff Member" value={shift.userName} />
                    <ReportRow label="Shift Start" value={new Date(shift.startTime).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} />
                    <ReportRow label="Shift End" value={shift.endTime ? new Date(shift.endTime).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' }) : 'N/A'} />
                    <ReportRow label="Duration" value={durationString} />

                    <DottedSeparator />
                    
                    <SectionTitle title="SALES SUMMARY" />
                    <ReportRow label="Total Transactions" value={shift.salesIds.length} />
                    <ReportRow label="Items Sold" value={itemsSold} />
                    <ReportRow label="Gross Sales" value={formatCurrency(grossSales)} />
                    <ReportRow label="Total Discounts" value={formatCurrency(-totalDiscounts)} />
                    <ReportRow label={`VAT (${settings.tax.vatRate}%)`} value={formatCurrency(totalVat)} />
                    <div className="border-t border-black my-1 font-bold">
                        <ReportRow label="NET SALES" value={formatCurrency(netSales)} isBold />
                    </div>
                    
                    <DottedSeparator />
                    
                    <SectionTitle title="PAYMENT BREAKDOWN" />
                    <ReportRow label="Cash Sales" value={formatCurrency(shift.paymentBreakdown?.Cash || 0)} />
                    <ReportRow label="M-Pesa Sales" value={formatCurrency(shift.paymentBreakdown?.['M-Pesa'] || 0)} />
                    <ReportRow label="Card Sales" value={formatCurrency(shift.paymentBreakdown?.Card || 0)} />
                    <ReportRow label="Loyalty Points" value={formatCurrency(shift.paymentBreakdown?.Points || 0)} />
                    <ReportRow label="Total Payments" value={formatCurrency(totalPayments)} isBold />

                    <DottedSeparator />
                    
                    <SectionTitle title="CASH PAYOUTS" />
                    {shiftCashExpenses.length === 0 && shiftCashSupplierPayments.length === 0 ? (
                        <p className="text-center text-gray-500 text-[10px]">No cash payouts recorded this shift.</p>
                    ) : (
                        <>
                            {shiftCashExpenses.map(p => <ReportRow key={p.id} label={p.reason} value={formatCurrency(p.amount)} />)}
                            {shiftCashSupplierPayments.map(p => <ReportRow key={p.id} label={`Supplier Pymt: ${p.invoiceId.slice(-6)}`} value={formatCurrency(p.amount)} />)}
                        </>
                    )}

                    <DottedSeparator />
                    
                    <SectionTitle title="CASH RECONCILIATION" />
                    <ReportRow label="Starting Float" value={formatCurrency(shift.startingFloat)} />
                    <ReportRow label="Cash Sales" value={'+' + formatCurrency(cashSales)} />
                    {cashChange > 0 && <ReportRow label="Change Given" value={'-' + formatCurrency(cashChange)} />}
                    {totalCashExpenses > 0 && <ReportRow label="Cash Expenses" value={'-' + formatCurrency(totalCashExpenses)} />}
                    {totalCashSupplierPayments > 0 && <ReportRow label="Supplier Payments" value={'-' + formatCurrency(totalCashSupplierPayments)} />}
                    {cashBanked > 0 && <ReportRow label="Cash Banked" value={'-' + formatCurrency(cashBanked)} />}
                    <DottedSeparator />
                    <ReportRow label="Expected Cash" value={formatCurrency(shift.expectedCashInDrawer || 0)} isBold />
                    <ReportRow label="Actual Cash Count" value={formatCurrency(shift.actualCashInDrawer || 0)} isBold />
                    <div className={`flex justify-between items-center font-bold text-base my-1 ${variance === 0 ? 'text-green-600' : ''}`}>
                        <span>Variance:</span>
                        <span>{ (variance >= 0 ? '+' : '') + formatCurrency(variance) }</span>
                    </div>

                    <DottedSeparator />

                    <div className={`my-3 p-2 text-center border font-bold ${variance === 0 ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'}`}>
                        {variance === 0 ? "✓ PERFECT BALANCE - NO VARIANCE" : variance > 0 ? `OVERAGE OF ${formatCurrency(variance)}` : `SHORTAGE OF ${formatCurrency(Math.abs(variance))}`}
                    </div>

                    <SolidSeparator />

                    <div className="text-center text-[10px] space-y-1 mt-4">
                        <p>This is an official Z-Report</p>
                        <p className="font-bold">{settings.businessInfo.name}</p>
                    </div>

                    <div className="text-right text-[9px] mt-4">
                        1/2
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-6">
                    <button onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">
                        Close
                    </button>
                     <div className="flex space-x-3">
                        <button onClick={handlePrint} whileTap={{ scale: 0.95 }} className="bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h1v-4a1 1 0 011-1h10a1 1 0 011 1v4h1a2 2 0 002-2v-6a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                             Print
                        </button>
                        <button onClick={handleDownloadPDF} disabled={isDownloading} whileTap={{ scale: 0.95 }} className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors flex items-center gap-2 disabled:bg-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ZReportView;