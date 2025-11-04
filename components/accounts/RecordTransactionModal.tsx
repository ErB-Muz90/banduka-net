
import React, { useState } from 'react';
// FIX: Add missing import for `AnimatePresence` from `framer-motion`.
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User } from '../types';

type TransactionType = 'Expense' | 'Cash In' | 'Cash Out' | 'M-Pesa In' | 'M-Pesa Out' | 'Supplier Payment' | 'Customer Refund';
type PaymentMethod = 'Cash Drawer' | 'M-Pesa' | 'Bank';

interface RecordTransactionModalProps {
    onClose: () => void;
    onSave: (data: any) => void;
    balances: { [key in PaymentMethod]: number };
    settings: Settings;
    expenseCategories: string[];
}

const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({ onClose, onSave, balances, settings, expenseCategories }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TransactionType>('Expense');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash Drawer');
    const [amount, setAmount] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(expenseCategories[0] || 'Miscellaneous');
    const [payee, setPayee] = useState('');
    const [notes, setNotes] = useState('');
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (typeof amount !== 'number' || amount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (type === 'Expense') {
            onSave({
                type,
                date,
                amount,
                paymentMethod,
                description,
                payee,
                category,
                notes,
                receiptImageUrl: receiptImage,
            });
        } else {
            setError(`Transaction type "${type}" is not yet implemented.`);
        }
    };

    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const isOverdraft = typeof amount === 'number' && amount > (balances[paymentMethod] || 0);
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary text-foreground dark:text-dark-foreground";
    const labelClasses = "block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted";

    return (
        <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-border dark:border-dark-border">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">Record Transaction</h2>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className={labelClasses}>Date</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="type" className={labelClasses}>Type *</label>
                            <select id="type" value={type} onChange={e => setType(e.target.value as TransactionType)} required className={inputClasses}>
                                <option>Expense</option>
                                <option disabled>Cash In</option>
                                <option disabled>Cash Out</option>
                                <option disabled>M-Pesa In</option>
                                <option disabled>M-Pesa Out</option>
                                <option disabled>Supplier Payment</option>
                                <option disabled>Customer Refund</option>
                            </select>
                        </div>
                    </div>

                    <AnimatePresence>
                        {type === 'Expense' && (
                            <div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="paymentMethod" className={labelClasses}>Payment Method *</label>
                                        <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} required className={inputClasses}>
                                            <option value="Cash Drawer">Cash (Ksh {balances['Cash Drawer'].toFixed(2)})</option>
                                            <option value="M-Pesa">M-Pesa (Ksh {balances['M-Pesa'].toFixed(2)})</option>
                                            <option value="Bank">Bank (Ksh {balances['Bank'].toFixed(2)})</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="amount" className={labelClasses}>Amount *</label>
                                        <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required min="0.01" step="0.01" className={`${inputClasses} ${isOverdraft ? 'border-danger' : ''}`} />
                                        {isOverdraft && <p className="text-xs text-danger mt-1">Amount exceeds available balance.</p>}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="description" className={labelClasses}>Description *</label>
                                    <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required placeholder="e.g., Office supplies" className={inputClasses} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="payee" className={labelClasses}>Payee (Optional)</label>
                                        <input type="text" id="payee" value={payee} onChange={e => setPayee(e.target.value)} placeholder="e.g., Naivas" className={inputClasses} />
                                    </div>
                                    <div>
                                        <label htmlFor="category" className={labelClasses}>Category *</label>
                                        <select id="category" value={category} onChange={e => setCategory(e.target.value)} required className={inputClasses}>
                                            {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="notes" className={labelClasses}>Notes (Optional)</label>
                                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputClasses} />
                                </div>
                                <div>
                                    <label htmlFor="receipt" className={labelClasses}>Upload Receipt (Optional)</label>
                                    <input type="file" id="receipt" onChange={handleReceiptUpload} accept="image/*" className={`${inputClasses} p-0 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-muted dark:file:bg-dark-muted`} />
                                    {receiptImage && <img src={receiptImage} alt="Receipt preview" className="mt-2 rounded-lg max-h-40 object-contain border p-1" />}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                    {error && <p className="text-sm text-center text-danger">{error}</p>}
                </form>

                <div className="flex-shrink-0 flex justify-end gap-2 p-4 border-t border-border dark:border-dark-border">
                    <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-muted dark:bg-dark-muted rounded-md font-semibold">Cancel</button>
                    <button type="submit" form="transaction-form" onClick={handleSubmit} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-primary text-primary-content rounded-md font-semibold disabled:bg-slate-400" disabled={isOverdraft}>Record Transaction</button>
                </div>
            </div>
        </div>
    );
};

export default RecordTransactionModal;
