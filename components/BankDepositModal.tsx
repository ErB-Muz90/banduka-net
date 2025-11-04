import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User } from '../types';

interface BankDepositModalProps {
    onClose: () => void;
    onSave: (depositData: { date: Date, amount: number; bankAccountId: string; bankName: string; receiptNumber: string; notes?: string; breakdown: { cash: number; mpesa: number; cheques: number; } }) => void;
    settings: Settings;
    cashInHand: number;
    mpesaBalance: number;
}

const BankDepositModal: React.FC<BankDepositModalProps> = ({ onClose, onSave, settings, cashInHand, mpesaBalance }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [bankAccountId, setBankAccountId] = useState(settings.paymentMethods.bank[0]?.id || '');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
    const [breakdown, setBreakdown] = useState({ cash: 0, mpesa: 0, cheques: 0 });
    const [error, setError] = useState('');

    const handleTotalAmountChange = (value: string) => {
        const newAmount = value === '' ? '' : parseFloat(value);
        setAmount(newAmount);
        // When total amount is changed directly, default the entire amount to the cash breakdown
        setBreakdown({ cash: typeof newAmount === 'number' ? newAmount : 0, mpesa: 0, cheques: 0 });
    };

    const handleBreakdownChange = (field: 'cash' | 'mpesa' | 'cheques', value: string) => {
        const numValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numValue) || numValue < 0) return;
        
        const newBreakdown = { ...breakdown, [field]: numValue };
        setBreakdown(newBreakdown);

        // Auto-update total amount from breakdown fields
        const newTotal = newBreakdown.cash + newBreakdown.mpesa + newBreakdown.cheques;
        setAmount(newTotal);
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const totalAmount = typeof amount === 'number' ? amount : 0;
        if (totalAmount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }

        const breakdownTotal = breakdown.cash + breakdown.mpesa + breakdown.cheques;
        if (Math.abs(breakdownTotal - totalAmount) > 0.01) {
            setError('Breakdown total must equal the total deposit amount.');
            return;
        }

        if (breakdown.cash > cashInHand) {
             setError(`Cash amount exceeds available cash in hand (Ksh ${cashInHand.toFixed(2)}).`);
            return;
        }
        if (breakdown.mpesa > mpesaBalance) {
             setError(`M-Pesa amount exceeds available balance (Ksh ${mpesaBalance.toFixed(2)}).`);
            return;
        }

        if (!bankAccountId) {
            setError('Please select a bank account.');
            return;
        }
        if (!receiptNumber) {
            setError('A receipt or reference number is required.');
            return;
        }

        const selectedBank = settings.paymentMethods.bank.find(b => b.id === bankAccountId);
        if (!selectedBank) {
            setError('Invalid bank account selected.');
            return;
        }

        onSave({ 
            date: new Date(depositDate),
            amount: totalAmount, 
            bankAccountId, 
            bankName: `${selectedBank.bankName} - ${selectedBank.accountNumber}`, 
            receiptNumber, 
            notes,
            breakdown,
        });
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm";
    const labelClasses = "block text-sm font-medium text-foreground dark:text-dark-foreground";

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}
        >
            <div
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">Record Bank Deposit</h2>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="depositDate" className={labelClasses}>Deposit Date</label>
                            <input type="date" id="depositDate" value={depositDate} onChange={e => setDepositDate(e.target.value)} required className={inputClasses} />
                        </div>
                         <div>
                            <label htmlFor="bankAccountId" className={labelClasses}>Bank Account *</label>
                            <select id="bankAccountId" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} required className={inputClasses}>
                                <option value="" disabled>-- Select a Bank --</option>
                                {settings.paymentMethods.bank.map(b => (
                                    <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="receiptNumber" className={labelClasses}>Receipt Number</label>
                            <input type="text" id="receiptNumber" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="amount" className={labelClasses}>Total Amount *</label>
                            <input type="number" id="amount" value={amount} onChange={e => handleTotalAmountChange(e.target.value)} required min="0.01" step="0.01" className={inputClasses} />
                        </div>
                    </div>
                    
                    <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg space-y-3">
                        <h4 className="text-sm font-bold text-foreground dark:text-dark-foreground">Breakdown (Optional)</h4>
                        <div className="grid grid-cols-3 gap-3 items-end">
                             <div>
                                <label htmlFor="cash" className="block text-xs font-medium text-foreground-muted">Cash</label>
                                <input type="number" id="cash" value={breakdown.cash || ''} onChange={e => handleBreakdownChange('cash', e.target.value)} min="0" step="0.01" className={inputClasses + " text-sm"} />
                                <span className="text-xs text-foreground-muted">Av: {cashInHand.toFixed(2)}</span>
                            </div>
                            <div>
                                <label htmlFor="mpesa" className="block text-xs font-medium text-foreground-muted">M-Pesa</label>
                                <input type="number" id="mpesa" value={breakdown.mpesa || ''} onChange={e => handleBreakdownChange('mpesa', e.target.value)} min="0" step="0.01" className={inputClasses + " text-sm"} />
                                <span className="text-xs text-foreground-muted">Av: {mpesaBalance.toFixed(2)}</span>
                            </div>
                            <div>
                                <label htmlFor="cheques" className="block text-xs font-medium text-foreground-muted">Cheques</label>
                                <input type="number" id="cheques" value={breakdown.cheques || ''} onChange={e => handleBreakdownChange('cheques', e.target.value)} min="0" step="0.01" className={inputClasses + " text-sm"} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="notes" className={labelClasses}>Notes (Optional)</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputClasses}></textarea>
                    </div>
                    
                    {error && <p className="text-sm text-center text-danger">{error}</p>}
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-muted dark:bg-dark-muted rounded-md font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-content rounded-md font-semibold">Confirm Deposit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BankDepositModal;