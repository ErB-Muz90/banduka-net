import React, { useState, useMemo } from 'react';
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

const StatCard = ({ title, value, color }: { title: string; value: string; color: string }) => (
    <div 
        className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-clay-dark border border-transparent dark:border-dark-border"
        whileHover={{ y: -3, scale: 1.02 }}
    >
        <p className={`text-sm font-bold ${color}`}>{title}</p>
        <p className="text-2xl font-bold text-foreground dark:text-dark-foreground mt-1">{value}</p>
    </div>
);

const StatusBadge = ({ status }: { status: SupplierInvoice['status'] }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-bold rounded-md text-white/90";
    switch (status) {
        case 'Paid':
            return <span className={`${baseClasses} bg-primary`}>Paid</span>;
        case 'Partially Paid':
            return <span className={`${baseClasses} bg-blue-500`}>Partially Paid</span>;
        case 'Unpaid':
            return <span className={`${baseClasses} bg-warning`}>Unpaid</span>;
        default:
            return <span className={`${baseClasses} bg-slate-500`}>Unknown</span>;
    }
};

const AccountsPayableView = ({ invoices, suppliers, onRecordPayment, onViewInvoice, activeShift, sales, payouts, accountingTransactions, chartOfAccounts, settings }: AccountsPayableViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

    const supplierMap = useMemo(() => {
        return suppliers.reduce((acc, supplier) => {
            acc[supplier.id] = supplier.name;
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

    const formatCurrency = (amount: number) => `Ksh ${amount.toFixed(2)}`;

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground mb-6">Accounts Payable</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Current" value={formatCurrency(agingData.current)} color="text-primary dark:text-dark-primary" />
                <StatCard title="Overdue 1-30 Days" value={formatCurrency(agingData.due1_30)} color="text-yellow-400" />
                <StatCard title="Overdue 31-60 Days" value={formatCurrency(agingData.due31_60)} color="text-warning dark:text-dark-warning" />
                <StatCard title="Overdue 60+ Days" value={formatCurrency(agingData.due60_plus)} color="text-danger dark:text-dark-danger" />
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-clay-dark overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3 font-semibold">Invoice #</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Supplier</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Due Date</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Total</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Amount Due</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Status</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {unpaidInvoices.map(invoice => {
                            const amountDue = invoice.totalAmount - invoice.paidAmount;
                            return (
                                <tr key={invoice.id} onClick={() => onViewInvoice(invoice)} className="border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted dark:hover:bg-dark-muted cursor-pointer">
                                    <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-foreground dark:text-dark-foreground">{supplierMap[invoice.supplierId] || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-foreground dark:text-dark-foreground">{new Date(invoice.dueDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                    <td className="px-6 py-4 font-mono">{formatCurrency(invoice.totalAmount)}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-foreground dark:text-dark-foreground">{formatCurrency(amountDue)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={invoice.status} /></td>
                                    <td className="px-6 py-4 text-right space-x-2">
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
                                <td colSpan={7} className="text-center py-10 text-foreground-muted dark:text-dark-foreground-muted">
                                    <p className="font-semibold">All caught up!</p>
                                    <p>There are no outstanding supplier invoices.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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