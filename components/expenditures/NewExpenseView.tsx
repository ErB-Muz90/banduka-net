import React, { useState, useMemo } from 'react';
import { Shift, Expense, Sale, AccountingTransaction, Account, Settings, User } from '../../types';
import { motion } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EXPENSE_CATEGORIES } from '../../constants';

interface NewExpenseViewProps {
    activeShift: Shift | null;
    onProcessExpense: (amount: number, reason: string, category: string, source: Expense['source'], payee?: string, receiptImageUrl?: string) => void;
    onBack: () => void;
    sales: Sale[];
    expenses: Expense[];
    accountingTransactions: AccountingTransaction[];
    chartOfAccounts: Account[];
    settings: Settings;
    currentUser: User;
}

const NewExpenseView: React.FC<NewExpenseViewProps> = ({ activeShift, onProcessExpense, onBack, sales, expenses, accountingTransactions, chartOfAccounts, settings, currentUser }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [payee, setPayee] = useState('');
    const [category, setCategory] = useState('Miscellaneous');
    const [source, setSource] = useState<Expense['source']>('Cash Drawer');
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState('');
    
    const ai = useMemo(() => new GoogleGenerativeAI(process.env.API_KEY as string), []);

    const balances = useMemo(() => {
        // Cash Drawer Balance Calculation
        const shiftSales = sales.filter(s => activeShift?.salesIds.includes(s.id));
        const cashSales = shiftSales.reduce((acc, sale) => acc + (sale.payments.find(p => p.method === 'Cash')?.amount || 0), 0);
        const cashChange = shiftSales.reduce((acc, sale) => acc + sale.change, 0);
        const cashExpenses = expenses.filter(p => activeShift?.expenseIds?.includes(p.id)).reduce((acc, p) => acc + p.amount, 0);
        const cashDrawer = (activeShift?.startingFloat || 0) + cashSales - cashChange - cashExpenses;

        const getAccountBalance = (accountId: string): number => {
            const account = chartOfAccounts.find(acc => acc.id === accountId);
            if (!account) return 0;
            const balance = accountingTransactions
                .flatMap(t => t.entries)
                .filter(e => e.accountId === accountId)
                .reduce((bal, entry) => bal + entry.debit - entry.credit, 0);
            
            return ['Assets', 'Expenses'].includes(account.type) ? balance : -balance;
        };
        
        const mpesa = getAccountBalance(settings.accounting.defaultMpesaAccountId);
        const bank = getAccountBalance(settings.accounting.defaultBankAccountId);

        return { 'Cash Drawer': cashDrawer, 'M-Pesa': mpesa, 'Bank': bank };
    }, [activeShift, sales, expenses, accountingTransactions, chartOfAccounts, settings]);

    const handleSuggestCategory = async () => {
        if (!reason.trim()) {
            setError('Please enter a description first to get a suggestion.');
            return;
        }
        setIsSuggesting(true);
        setError('');

        const prompt = `
            Given the following list of expense categories:
            ${EXPENSE_CATEGORIES.join(', ')}

            Based on the expense description provided below, which single category is the best fit? Respond with only the category name.

            Description: "${reason}"
        `;
        
        try {
            const model = ai.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const suggestedCategory = response.text().trim();
            if (EXPENSE_CATEGORIES.includes(suggestedCategory)) {
                setCategory(suggestedCategory);
            }
        } catch (err) {
            console.error("AI Suggestion Error:", err);
            setError('Could not get AI suggestion.');
        } finally {
            setIsSuggesting(false);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (typeof amount !== 'number' || amount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }
        if (!reason.trim()) {
            setError('A description for the expense is required.');
            return;
        }
        if (source === 'Cash Drawer' && !activeShift) {
            setError('An active shift is required to make an expense from the cash drawer.');
            return;
        }
        onProcessExpense(amount, reason, category, source, payee.trim() || undefined, receiptImage || undefined);
    };
    
    const isOverdraft = typeof amount === 'number' && amount > balances[source];

    const SourceButton: React.FC<{ name: Expense['source'], balance: number }> = ({ name, balance }) => (
         <button
            type="button"
            onClick={() => setSource(name)}
            className={`p-3 rounded-lg text-left transition-all w-full ${source === name ? 'bg-primary/20 border-primary border-2' : 'bg-background dark:bg-dark-muted border border-border dark:border-dark-border'}`}
            whileTap={{ scale: 0.98 }}
        >
            <p className="font-bold text-foreground dark:text-dark-foreground">{name}</p>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Available: <span className="font-mono">{balance.toFixed(2)}</span></p>
        </button>
    );

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-background dark:bg-dark-background flex items-center justify-center">
            <div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-card dark:bg-dark-card p-8 rounded-xl shadow-xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Record an Expense</h1>
                    <button onClick={onBack} className="text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">&larr; Cancel</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                           <SourceButton name="Cash Drawer" balance={balances['Cash Drawer']} />
                           <SourceButton name="M-Pesa" balance={balances['M-Pesa']} />
                           <SourceButton name="Bank" balance={balances['Bank']} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Amount (Ksh)</label>
                        <input
                            type="number" id="amount" value={amount}
                            onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            min="0.01" step="0.01" required autoFocus
                            className={`mt-1 w-full px-4 py-2 rounded-lg border text-xl font-bold bg-background dark:bg-dark-background ${isOverdraft ? 'border-danger' : 'border-border dark:border-dark-border'}`}
                        />
                         {isOverdraft && <p className="text-xs text-danger mt-1">Amount exceeds available balance in {source}.</p>}
                    </div>
                     <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Notes / Description</label>
                        <input
                            type="text" id="reason" value={reason} onChange={e => setReason(e.target.value)} required
                            className="mt-1 w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background"
                            placeholder="e.g., Office supplies, Lunch for staff"
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Category</label>
                        <div className="flex items-center gap-2 mt-1">
                            <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background">
                                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <button type="button" onClick={handleSuggestCategory} disabled={isSuggesting} whileTap={{scale: 0.95}} className="px-3 py-2 bg-secondary text-white rounded-lg text-sm whitespace-nowrap disabled:bg-slate-400">
                                {isSuggesting ? '...' : 'AI ✨'}
                            </button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="payee" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Payee / Vendor Name (Optional)</label>
                        <input
                            type="text" id="payee" value={payee} onChange={e => setPayee(e.target.value)}
                            className="mt-1 w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background"
                            placeholder="e.g., Naivas Supermarket"
                        />
                    </div>
                    <div>
                        <label htmlFor="receipt" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Upload Receipt (Optional)</label>
                        <input type="file" id="receipt" onChange={handleReceiptUpload} accept="image/*" className="mt-1 block w-full text-sm text-foreground-muted dark:text-dark-foreground-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-dark-primary/20 dark:file:text-dark-primary"/>
                        {receiptImage && <img src={receiptImage} alt="Receipt preview" className="mt-2 rounded-lg max-h-40 object-contain" />}
                    </div>
                    {error && <p className="text-danger text-sm text-center">{error}</p>}
                    <div className="pt-4">
                        <button type="submit" className="w-full bg-primary text-primary-content font-bold py-3 rounded-lg text-lg hover:bg-primary-focus">Record Expense</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewExpenseView;