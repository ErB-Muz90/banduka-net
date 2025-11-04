

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layaway, Payment, Sale } from '../types';
import ConfirmationModal from '../common/ConfirmationModal';

interface LayawayDetailViewProps {
    layaway: Layaway;
    sales: Sale[];
    onBack: () => void;
    onAddPayment: (layawayId: string, amount: number, method: Payment['method']) => void;
    onViewReceiptRequest: (sale: Sale, layaway: Layaway) => void;
    onUpdate: (layaway: Layaway) => void;
}

const StatusBadge: React.FC<{ status: Layaway['status'] }> = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-bold rounded-md";
    switch (status) {
        case 'Active': return <span className={`${baseClasses} text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300`}>Active</span>;
        case 'Completed': return <span className={`${baseClasses} text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300`}>Completed</span>;
        case 'Defaulted': return <span className={`${baseClasses} text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300`}>Defaulted</span>;
        case 'Cancelled': return <span className={`${baseClasses} text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-300`}>Cancelled</span>;
        default: return <span className={`${baseClasses} text-slate-800 bg-slate-100`}>Unknown</span>;
    }
};

const AddPaymentForm: React.FC<{ layaway: Layaway, onAddPayment: (layawayId: string, amount: number, method: Payment['method']) => void, onClose: () => void }> = ({ layaway, onAddPayment, onClose }) => {
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('Cash');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof paymentAmount === 'number' && paymentAmount > 0 && paymentAmount <= layaway.balance) {
            onAddPayment(layaway.id, paymentAmount, paymentMethod);
            setPaymentAmount('');
            onClose();
        }
    };

    return (
        <div form 
            onSubmit={handleSubmit} 
            className="mt-4 p-4 bg-muted dark:bg-dark-muted rounded-lg space-y-3"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        >
            <h4 className="font-semibold text-sm">Record New Payment</h4>
            <div>
                <label className="text-xs font-medium">Amount (Max: {layaway.balance.toFixed(2)})</label>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} max={layaway.balance} min="0.01" step="0.01" required className="w-full mt-1 p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background" />
            </div>
            <div>
                <label className="text-xs font-medium">Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as Payment['method'])} className="w-full mt-1 p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background">
                    <option>Cash</option>
                    <option>M-Pesa</option>
                    <option>Card</option>
                </select>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="text-xs font-bold px-3 py-1.5 rounded-md hover:bg-border dark:hover:bg-dark-border">Cancel</button>
                <button type="submit" className="text-xs font-bold px-3 py-1.5 bg-primary text-primary-content rounded-md">Confirm Payment</button>
            </div>
        </motion.form>
    );
};


const LayawayDetailView: React.FC<LayawayDetailViewProps> = ({ layaway, sales, onBack, onAddPayment, onViewReceiptRequest, onUpdate }) => {
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'default' | 'cancel' | null>(null);

    const formatCurrency = (amount: number) => `KES ${amount.toFixed(2)}`;

    const paidAmount = layaway.total - layaway.balance;
    const percentage = layaway.total > 0 ? (paidAmount / layaway.total) * 100 : 0;

    const handleConfirm = () => {
        if (confirmAction === 'cancel') {
            onUpdate({ ...layaway, status: 'Cancelled' });
        } else if (confirmAction === 'default') {
            onUpdate({ ...layaway, status: 'Defaulted' });
        }
        setConfirmAction(null);
    };

    return (
        <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4" onClick={onBack}>
             <AnimatePresence>
                {confirmAction && (
                    <ConfirmationModal
                        title={`${confirmAction === 'cancel' ? 'Cancel' : 'Mark as Defaulted'}?`}
                        message={`Are you sure you want to ${confirmAction} this layaway plan? This action cannot be undone.`}
                        onConfirm={handleConfirm}
                        onClose={() => setConfirmAction(null)}
                        confirmText={confirmAction === 'cancel' ? 'Cancel Plan' : 'Mark as Defaulted'}
                        isDestructive
                    />
                )}
            </AnimatePresence>
            <div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card dark:bg-dark-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-lg flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-border dark:border-dark-border flex-shrink-0">
                    <h2 className="text-lg font-bold">Layaway Details</h2>
                    <button onClick={onBack} className="text-2xl">&times;</button>
                </header>

                <main className="p-6 overflow-y-auto space-y-6">
                    <section className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div><strong className="text-foreground-muted">Layaway Number:</strong><br/>{layaway.id}</div>
                        <div><strong className="text-foreground-muted">Customer:</strong><br/>{layaway.customerName}</div>
                        <div><strong className="text-foreground-muted">Start Date:</strong><br/>{new Date(layaway.createdDate).toLocaleDateString()}</div>
                        <div><strong className="text-foreground-muted">Due Date:</strong><br/>{new Date(layaway.expiryDate).toLocaleDateString()}</div>
                        <div className="col-span-2"><strong className="text-foreground-muted">Status:</strong> <StatusBadge status={layaway.status} /></div>
                    </section>

                    <section>
                        <h3 className="font-semibold text-sm mb-2">Payment Progress</h3>
                        <div className="bg-muted dark:bg-dark-muted p-4 rounded-lg space-y-2">
                             <div className="flex justify-between text-sm">
                                <span className="font-semibold text-green-600">Amount Paid: {formatCurrency(paidAmount)}</span>
                                <span className="font-semibold text-danger">Balance Due: {formatCurrency(layaway.balance)}</span>
                            </div>
                             <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <div className="text-right text-xs font-bold">{percentage.toFixed(0)}% Paid</div>
                        </div>
                    </section>

                    <section>
                         <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-foreground-muted">
                                <tr>
                                    <th className="text-left font-semibold pb-2">Product</th>
                                    <th className="text-center font-semibold pb-2">Qty</th>
                                    <th className="text-right font-semibold pb-2">Unit Price</th>
                                    <th className="text-right font-semibold pb-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {layaway.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-1">{item.name}</td>
                                        <td className="text-center py-1">{item.quantity}</td>
                                        <td className="text-right py-1 font-mono">{item.price.toFixed(2)}</td>
                                        <td className="text-right py-1 font-mono">{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-border dark:border-dark-border">
                                <tr>
                                    <td colSpan={4} className="text-right pt-2 font-bold text-base">
                                        Total Amount: <span className="text-orange-500 font-mono">{formatCurrency(layaway.total)}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>

                    <section>
                        <h3 className="font-semibold text-sm mb-2">Payment History</h3>
                         <div className="border border-border dark:border-dark-border rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-muted dark:bg-dark-muted">
                                    <tr>
                                        <th className="p-2 text-left font-semibold">Date</th>
                                        <th className="p-2 text-right font-semibold">Amount</th>
                                        <th className="p-2 text-left font-semibold">Method</th>
                                        <th className="p-2 text-left font-semibold">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {layaway.payments.map((p, i) => {
                                        const saleForPayment = sales.find(s => s.id === p.saleId);
                                        const note = i === 0 ? 'Initial deposit' : `Installment`;
                                        return (
                                        <tr key={p.saleId} className="border-t dark:border-dark-border">
                                            <td className="p-2">{new Date(p.date).toLocaleString()}</td>
                                            <td className="p-2 text-right font-mono">{p.amount.toFixed(2)}</td>
                                            <td className="p-2">{p.method}</td>
                                            <td className="p-2 italic">{note}</td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                         <AnimatePresence>
                             {showPaymentForm && <AddPaymentForm layaway={layaway} onAddPayment={onAddPayment} onClose={() => setShowPaymentForm(false)} />}
                        </AnimatePresence>
                    </section>
                </main>

                <footer className="flex justify-end items-center p-4 border-t border-border dark:border-dark-border gap-2 flex-shrink-0">
                    {layaway.status === 'Active' && (
                        <>
                            <button onClick={() => setShowPaymentForm(true)} whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 004.5 0V7.15c.22.071.412.164.567.267C15.346 8.046 16 9.233 16 10.5A2.5 2.5 0 0113.5 13h-7A2.5 2.5 0 014 10.5c0-1.267.654-2.454 1.567-3.082z" /><path d="M10 4a3.5 3.5 0 00-3.5 3.5v.568c0 .416.22.8.568.983A3.504 3.504 0 0010 12a3.5 3.5 0 003.5-3.5V7.5A3.5 3.5 0 0010 4z" /></svg>
                                Add Payment
                            </button>
                            <button onClick={() => setConfirmAction('default')} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted font-semibold px-4 py-2 rounded-lg text-sm">Mark as Defaulted</button>
                            <button onClick={() => setConfirmAction('cancel')} whileTap={{ scale: 0.95 }} className="bg-danger/80 text-white font-semibold px-4 py-2 rounded-lg text-sm">Cancel Layaway</button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default LayawayDetailView;