import React, { useState, useMemo, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// FIX: Replaced 'Payout' with 'Expense' as 'Payout' is not an exported member of types.
import { SupplierInvoice, Supplier, SupplierPayment, Shift, Sale, Expense, AccountingTransaction, Account, Settings } from '../types';
import PaymentModal from './accountsPayable/PaymentModal';

interface AccountsPayableViewProps {
    invoices: SupplierInvoice[];
    suppliers: Supplier[];
    onRecordPayment: (invoiceId: string, payment: Omit<SupplierPayment, 'id' | 'invoiceId' | 'processedById' | 'processedByName' | 'shiftId'>) => void;
    onViewInvoice: (invoice: SupplierInvoice) => void;
    activeShift: Shift | null;
    sales: Sale[];
    // FIX: Replaced 'Payout' with 'Expense' to match the imported type.
    payouts: Expense[];
    accountingTransactions: AccountingTransaction[];
    chartOfAccounts: Account[];
    settings: Settings;
}

// Icons for Stat Cards
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const AlertCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


const StatCard: React.FC<{ title: string; value: string; icon: ReactNode; colorClass?: string }> = ({ title, value, icon, colorClass = 'text-primary dark:text-dark-primary' }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm flex items-center space-x-4 border border-border dark:border-dark-border">
        <div className={`p-3 rounded-lg bg-muted dark:bg-dark-muted ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-semibold">{title}</p>
            <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: SupplierInvoice['status'] }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-bold rounded-full";
    switch (status) {
        case 'Paid':
            return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}>Paid</span>;
        case 'Partially Paid':
            return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`}>Partially Paid</span>;
        case 'Unpaid':
            return <span className={`${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300`}>Unpaid</span>;
        default:
            return <span className={`${baseClasses} bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300`}>Unknown</span>;
    }
};

const AccountsPayableView = ({ invoices, suppliers, onRecordPayment, onViewInvoice, activeShift, sales, payouts, accountingTransactions, chartOfAccounts, settings }: AccountsPayableViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

    const supplierMap = useMemo(() => {
        return suppliers.reduce((acc, supplier) => {
            acc[supplier.id] = supplier.businessName || supplier.name;
            return acc;
        }, {} as Record<string, string>);
    }, [suppliers]);

    const agingData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const buckets = {
            current: 0,
            due1_30: 0,
            due31_60: 0,
            due60_plus: 0,
        };

        invoices.forEach(inv => {
            if (inv.status === 'Paid') return;
            
            const amountDue = inv.totalAmount - inv.paidAmount;
            const dueDate = new Date(inv.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate < today) {
                const diffTime = today.getTime() - dueDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) buckets.due1_30 += amountDue;
                else if (diffDays <= 60) buckets.due31_60 += amountDue;
                else buckets.due60_plus += amountDue;
            } else {
                buckets.current += amountDue;
            }
        });
        return buckets;
    }, [invoices]);

    const unpaidInvoices = useMemo(() => {
        return invoices
            .filter(inv => inv.status === 'Unpaid' || inv.status === 'Partially Paid')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [invoices]);

    const handleRecordPaymentClick = (invoice: SupplierInvoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleSavePayment = (payment: Omit<SupplierPayment, 'id'|'invoiceId' | 'processedById' | 'processedByName' | 'shiftId'>) => {
        if(selectedInvoice) {
            onRecordPayment(selectedInvoice.id, payment);
        }
        setIsModalOpen(false);
        setSelectedInvoice(null);
    };

    const formatCurrency = (amount: number) => `Ksh ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto bg-background dark:bg-dark-background">
            <div>
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Accounts Payable</h1>
                <p className="text-foreground-muted dark:text-dark-foreground-muted mt-1">Manage outstanding invoices and payments to suppliers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-6">
                <StatCard title="Current" value={formatCurrency(agingData.current)} icon={<CalendarIcon />} colorClass="text-green-500" />
                <StatCard title="Overdue 1-30 Days" value={formatCurrency(agingData.due1_30)} icon={<ClockIcon />} colorClass="text-yellow-500" />
                <StatCard title="Overdue 31-60 Days" value={formatCurrency(agingData.due31_60)} icon={<AlertTriangleIcon />} colorClass="text-orange-500" />
                <StatCard title="Overdue 60+ Days" value={formatCurrency(agingData.due60_plus)} icon={<AlertCircleIcon />} colorClass="text-red-500" />
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border p-6">
                <h3 className="text-lg font-bold mb-4">Outstanding Supplier Invoices</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase">
                            <tr>
                                <th className="py-3 px-4">Invoice #</th>
                                <th className="py-3 px-4">Supplier</th>
                                <th className="py-3 px-4">Due Date</th>
                                <th className="py-3 px-4">Total</th>
                                <th className="py-3 px-4">Amount Due</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {unpaidInvoices.map(invoice => {
                                const amountDue = invoice.totalAmount - invoice.paidAmount;
                                return (
                                    <tr key={invoice.id} onClick={() => onViewInvoice(invoice)} className="border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted dark:hover:bg-dark-muted cursor-pointer">
                                        <td className="py-3 px-4 font-bold text-foreground dark:text-dark-foreground">{invoice.invoiceNumber}</td>
                                        <td className="py-3 px-4 text-foreground dark:text-dark-foreground">{supplierMap[invoice.supplierId] || 'Unknown'}</td>
                                        <td className="py-3 px-4 text-foreground dark:text-dark-foreground">{new Date(invoice.dueDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                        <td className="py-3 px-4 font-mono">{formatCurrency(invoice.totalAmount)}</td>
                                        <td className="py-3 px-4 font-mono font-bold text-foreground dark:text-dark-foreground">{formatCurrency(amountDue)}</td>
                                        <td className="py-3 px-4"><StatusBadge status={invoice.status} /></td>
                                        <td className="py-3 px-4 text-right space-x-2">
                                            {invoice.status !== 'Paid' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRecordPaymentClick(invoice); }}
                                                    className="font-medium text-primary dark:text-dark-primary hover:underline"
                                                >
                                                    Record Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {unpaidInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="text-center py-16 text-foreground-muted dark:text-dark-foreground-muted">
                                            <CheckCircleIcon />
                                            <p className="mt-4 font-semibold">All caught up!</p>
                                            <p>There are no outstanding supplier invoices.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <AnimatePresence>
                {isModalOpen && selectedInvoice && (
                    <PaymentModal
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSavePayment}
                        invoice={selectedInvoice}
                        supplierName={supplierMap[selectedInvoice.supplierId]}
                        activeShift={activeShift}
                        sales={sales}
                        payouts={payouts}
                        accountingTransactions={accountingTransactions}
                        chartOfAccounts={chartOfAccounts}
                        settings={settings}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountsPayableView;