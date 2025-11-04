import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SupplierInvoice, SupplierPayment, Shift, Sale, Expense, Payment, Settings, Account, AccountingTransaction } from '../types';

interface PaymentModalProps {
    onClose: () => void;
    onSave: (payment: Omit<SupplierPayment, 'id' | 'invoiceId' | 'processedById' | 'processedByName' | 'shiftId'>) => void;
    invoice: SupplierInvoice;
    supplierName: string;
    activeShift: Shift | null;
    sales: Sale[];
    payouts: Expense[];
    settings: Settings;
    accountingTransactions: AccountingTransaction[];
    chartOfAccounts: Account[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSave, invoice, supplierName, activeShift, sales, payouts, settings, accountingTransactions, chartOfAccounts }) => {
    const amountDue = Math.round((invoice.totalAmount - invoice.paidAmount) * 100) / 100;
    const [amount, setAmount] = useState<number | ''>(amountDue);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<SupplierPayment['method']>(activeShift ? 'Cash' : 'Bank Transfer');
    const [referenceNumber, setReferenceNumber] = useState('');

    const availableFunds = useMemo(() => {
        const getAccountBalance = (accountId: string): number => {
            if (!accountId) return 0;
            const account = chartOfAccounts.find(acc => acc.id === accountId);
            if (!account) return 0;
            const balance = accountingTransactions
                .flatMap(t => t.entries)
                .filter(e => e.accountId === accountId)
                .reduce((bal, entry) => bal + entry.debit - entry.credit, 0);
            return ['Assets', 'Expenses'].includes(account.type) ? balance : -balance;
        };
        
        const cash = getAccountBalance(settings.accounting.defaultCashAccountId);
        const mpesa = getAccountBalance(settings.accounting.defaultMpesaAccountId);
        const bank = getAccountBalance(settings.accounting.defaultBankAccountId);

        return { 'Cash': cash, 'M-Pesa': mpesa, 'Bank Transfer': bank };
    }, [accountingTransactions, chartOfAccounts, settings]);

    const isOverdraft = useMemo(() => {
        if (typeof amount !== 'number' || amount <= 0) return false;
        if (method === 'Cash' && !activeShift) return true; // Can't pay with cash if no shift is active
        return amount > (availableFunds[method] || 0);
    }, [amount, method, availableFunds, activeShift]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const maxPayable = Math.round((invoice.totalAmount - invoice.paidAmount) * 100) / 100;
        if (typeof amount !== 'number' || amount <= 0 || amount > maxPayable) {
            alert(`Payment amount must be between 0.01 and ${maxPayable.toFixed(2)}.`);
            return;
        }
        if (method === 'Cash' && !activeShift) {
            alert('An active shift is required to pay with cash from the drawer.');
            return;
        }
        if (isOverdraft) {
            alert('Payment amount exceeds available funds for the selected method.');
            return;
        }
        onSave({
            amount: amount,
            paymentDate: new Date(paymentDate),
            method,
            referenceNumber: referenceNumber || undefined,
        });
    };
    
    const labelClasses = "block text-sm font-medium text-foreground dark:text-dark-foreground";
    const inputClasses = `mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border rounded-md shadow-sm focus:outline-none sm:text-lg ${isOverdraft ? 'border-danger' : 'border-border dark:border-dark-border'}`;


    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
            <div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-8 border border-transparent dark:border-dark-border"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Record Payment</h2>
                    <button onClick={onClose} className="text-foreground-muted dark:text-dark-foreground-muted hover:text-foreground dark:hover:text-dark-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="bg-muted dark:bg-dark-muted p-4 rounded-lg mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground-muted dark:text-dark-foreground-muted">Invoice:</span>
                        <span className="font-semibold text-foreground dark:text-dark-foreground">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground-muted dark:text-dark-foreground-muted">Supplier:</span>
                        <span className="font-semibold text-foreground dark:text-dark-foreground">{supplierName}</span>
                    </div>
                    <div className="border-t border-border dark:border-dark-border !my-2"></div>
                     <div className="flex justify-between text-lg">
                        <span className="font-bold text-foreground dark:text-dark-foreground">Amount Due:</span>
                        <span className="font-bold text-danger">Ksh {amountDue.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="bg-dark-muted border border-dark-border p-4 rounded-lg mb-6 space-y-2 text-sm">
                    <h4 className="font-bold text-blue-400">Available Funds</h4>
                    <div className="flex justify-between">
                        <span className="font-medium text-dark-foreground-muted">Cash on Hand:</span>
                        <span className="font-semibold font-mono text-dark-foreground">Ksh {availableFunds.Cash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-dark-foreground-muted">M-Pesa Balance:</span>
                        <span className="font-semibold font-mono text-dark-foreground">Ksh {availableFunds['M-Pesa'].toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-dark-foreground-muted">Bank Balance:</span>
                        <span className="font-semibold font-mono text-dark-foreground">Ksh {availableFunds['Bank Transfer'].toFixed(2)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="method" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Payment Method</label>
                        <select
                            name="method"
                            id="method"
                            value={method}
                            onChange={(e) => setMethod(e.target.value as SupplierPayment['method'])}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-card dark:bg-dark-background border-border dark:border-dark-border focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm rounded-md"
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash" disabled={!activeShift}>Cash (from Drawer)</option>
                            <option value="M-Pesa">M-Pesa</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount" className={labelClasses}>Payment Amount (Ksh)</label>
                        <input
                            type="number"
                            name="amount"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            required
                            max={amountDue}
                            min="0.01"
                            step="0.01"
                            className={inputClasses}
                        />
                         {isOverdraft && (
                            <p className="text-xs text-danger mt-1">
                                {method === 'Cash' && !activeShift 
                                    ? 'An active shift is required to pay with cash.' 
                                    : `Payment amount exceeds available funds for the selected method.`
                                }
                            </p>
                        )}
                    </div>
                     <div>
                        <label htmlFor="paymentDate" className={labelClasses}>Payment Date</label>
                        <input
                            type="date"
                            name="paymentDate"
                            id="paymentDate"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="referenceNumber" className={labelClasses}>Reference Number (Optional)</label>
                        <input type="text" id="referenceNumber" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" placeholder="e.g. Cheque No, M-Pesa Code" />
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-dark-muted text-dark-foreground font-bold px-4 py-2 rounded-xl transition-shadow shadow-clay-dark active:shadow-clay-dark-inset">Cancel</button>
                        <button type="submit" disabled={isOverdraft} whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-xl transition-shadow shadow-clay-dark active:shadow-clay-dark-inset disabled:bg-slate-600 disabled:shadow-none disabled:cursor-not-allowed">Confirm Payment</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;