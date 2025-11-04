import React, { useMemo, useState } from 'react';
import { Sale, Expense, AccountingTransaction, Account, Settings, SupplierPayment, Supplier, Shift, User, Customer, BankDeposit, SupplierInvoice } from '../types';
import BankDepositModal from './BankDepositModal';
import RecordTransactionModal from './accounts/RecordTransactionModal';

interface AccountsViewProps {
    sales: Sale[];
    expenses: Expense[];
    accountingTransactions: AccountingTransaction[];
    chartOfAccounts: Account[];
    settings: Settings;
    activeShift: Shift | null;
    supplierPayments: SupplierPayment[];
    suppliers: Supplier[];
    bankDeposits: BankDeposit[];
    onAddBankDeposit: (depositData: Omit<BankDeposit, 'id' | 'depositedById' | 'depositedByName' | 'shiftId'>) => void;
    currentUser: User;
    customers: Customer[];
    supplierInvoices: SupplierInvoice[];
    onProcessExpense: (amount: number, reason: string, category: string, source: Expense['source'], payee?: string, receiptImageUrl?: string) => void;
}

// Icon components
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
const MpesaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>;
const BankIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const TotalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const UpArrowCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><circle cx="12" cy="12" r="10" /><polyline points="16 12 12 8 8 12" /><line x1="12" y1="16" x2="12" y2="8" /></svg>;
const DownArrowCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>;

const formatCurrency = (amount: number, currency: string = 'KES') => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, isWarning?: boolean }> = ({ title, value, icon, isWarning }) => (
    <div className={`bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm flex items-center space-x-4 border ${isWarning ? 'border-red-300 dark:border-red-500/50' : 'border-border dark:border-dark-border'}`}>
        <div className={`p-3 rounded-lg ${isWarning ? 'text-red-500 bg-red-100 dark:bg-red-900/50' : 'text-primary dark:text-dark-primary bg-muted dark:bg-dark-muted'}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-semibold">{title}</p>
            <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
            {isWarning && <p className="text-xs text-red-500 font-semibold">Insufficient balance</p>}
        </div>
    </div>
);

type DisplayTransaction = {
    date: Date;
    type: string;
    description: string;
    method: string;
    amount: number;
    staff: string;
    isCredit: boolean;
};

const AccountsView: React.FC<AccountsViewProps> = ({ sales, expenses, accountingTransactions, chartOfAccounts, settings, activeShift, supplierPayments, suppliers, bankDeposits, onAddBankDeposit, currentUser, customers, supplierInvoices, onProcessExpense }) => {
    const [activeTab, setActiveTab] = useState('all');
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isRecordTxModalOpen, setIsRecordTxModalOpen] = useState(false);

    const getAccountBalance = useMemo(() => (accountId: string): number => {
        const account = chartOfAccounts.find(acc => acc.id === accountId);
        if (!account) return 0;
        const balance = accountingTransactions
            .flatMap(t => t.entries)
            .filter(e => e.accountId === accountId)
            .reduce((bal, entry) => bal + entry.debit - entry.credit, 0);
        return ['Assets', 'Expenses'].includes(account.type) ? balance : -balance;
    }, [accountingTransactions, chartOfAccounts]);

    const cashInHand = getAccountBalance(settings.accounting.defaultCashAccountId);
    const mpesaBalance = getAccountBalance(settings.accounting.defaultMpesaAccountId);
    const bankBalance = getAccountBalance(settings.accounting.defaultBankAccountId);
    const totalBalance = cashInHand + mpesaBalance + bankBalance;

    const allTransactions = useMemo((): DisplayTransaction[] => {
        const transactions: DisplayTransaction[] = [];
        sales.forEach(sale => transactions.push({ date: new Date(sale.date), type: 'Sale', description: `Sale to ${customers.find(c => c.id === sale.customerId)?.name || 'N/A'}`, method: sale.payments.map(p => p.method).join(', '), amount: sale.total, staff: sale.cashierName, isCredit: true }));
        expenses.forEach(expense => transactions.push({ date: new Date(expense.date), type: 'Expense', description: expense.reason, method: expense.source, amount: expense.amount, staff: expense.cashierName, isCredit: false }));
        bankDeposits.forEach(deposit => transactions.push({ date: new Date(deposit.date), type: 'Bank Deposit', description: `Deposit to ${deposit.bankName}`, method: 'Bank Transfer', amount: deposit.amount, staff: deposit.depositedByName, isCredit: true, }));
        supplierPayments.forEach(payment => {
            const invoice = supplierInvoices.find(i => i.id === payment.invoiceId);
            const supplier = suppliers.find(s => s.id === invoice?.supplierId);
            transactions.push({ date: new Date(payment.paymentDate), type: 'Supplier Payment', description: `Payment to ${supplier?.name || 'N/A'}`, method: payment.method, amount: payment.amount, staff: currentUser.name, isCredit: false, });
        });
        return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [sales, expenses, bankDeposits, supplierPayments, customers, suppliers, currentUser.name, supplierInvoices]);

    const displayTransactions = useMemo(() => {
        if (activeTab === 'deposits') {
            return allTransactions.filter(t => t.type === 'Bank Deposit');
        }
        return allTransactions;
    }, [allTransactions, activeTab]);
    
    const handleSaveDeposit = (data: Omit<BankDeposit, 'id' | 'depositedById' | 'depositedByName' | 'shiftId'>) => {
        onAddBankDeposit(data);
        setIsDepositModalOpen(false);
    };

    const handleSaveTransaction = (data: any) => {
        if (data.type === 'Expense') {
            onProcessExpense(
                data.amount,
                data.description, // reason
                data.category,
                data.paymentMethod, // source
                data.payee,
                data.receiptImageUrl
            );
            setIsRecordTxModalOpen(false); // Close modal on save
        }
    };

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground">
            {isDepositModalOpen && (
                <BankDepositModal 
                    onClose={() => setIsDepositModalOpen(false)}
                    onSave={handleSaveDeposit}
                    settings={settings}
                    cashInHand={cashInHand}
                    mpesaBalance={mpesaBalance}
                />
            )}
            {isRecordTxModalOpen && (
                <RecordTransactionModal
                    onClose={() => setIsRecordTxModalOpen(false)}
                    onSave={handleSaveTransaction}
                    balances={{ 'Cash Drawer': cashInHand, 'M-Pesa': mpesaBalance, 'Bank': bankBalance }}
                    settings={settings}
                    expenseCategories={settings.inventory.expenseCategories}
                />
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Accounts & Finance</h1>
                    <p className="text-foreground-muted dark:text-dark-foreground-muted mt-1">Track all payments, balances, and bank deposits</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <button onClick={() => setIsDepositModalOpen(true)} className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                        <span>Bank Deposit</span>
                    </button>
                    <button onClick={() => setIsRecordTxModalOpen(true)} className="bg-orange-500 text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                        <span>Record Transaction</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Cash on Hand" value={formatCurrency(cashInHand, settings.businessInfo.currency)} icon={<CashIcon />} isWarning={cashInHand < 0} />
                <StatCard title="M-Pesa Balance" value={formatCurrency(mpesaBalance, settings.businessInfo.currency)} icon={<MpesaIcon />} isWarning={mpesaBalance < 0} />
                <StatCard title="Bank Balance" value={formatCurrency(bankBalance, settings.businessInfo.currency)} icon={<BankIcon />} isWarning={bankBalance < 0} />
                <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm flex items-center space-x-4 border border-border dark:border-dark-border">
                    <div className="p-3 rounded-lg text-purple-500 bg-purple-100 dark:bg-purple-900/50">
                        <TotalIcon />
                    </div>
                    <div>
                        <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-semibold">Total Balance</p>
                        <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{formatCurrency(totalBalance, settings.businessInfo.currency)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border p-6">
                <div className="flex border-b border-border dark:border-dark-border mb-4">
                    <button onClick={() => setActiveTab('all')} className={`px-4 py-2 font-semibold text-sm ${activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-foreground-muted'}`}>All Transactions</button>
                    <button onClick={() => setActiveTab('deposits')} className={`px-4 py-2 font-semibold text-sm ${activeTab === 'deposits' ? 'border-b-2 border-primary text-primary' : 'text-foreground-muted'}`}>Bank Deposits</button>
                </div>

                <h3 className="text-lg font-bold mb-4">Transaction History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase">
                            <tr>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4">Method</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Staff</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayTransactions.map((tx, index) => (
                                <tr key={index} className="border-b border-border dark:border-dark-border last:border-b-0">
                                    <td className="py-3 px-4 whitespace-nowrap">{tx.date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                    <td className="py-3 px-4">
                                        <span className="flex items-center space-x-2">
                                            {tx.isCredit ? <UpArrowCircle /> : <DownArrowCircle />}
                                            <span>{tx.type}</span>
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{tx.description}</td>
                                    <td className="py-3 px-4">{tx.method}</td>
                                    <td className={`py-3 px-4 font-semibold ${tx.isCredit ? 'text-green-500' : 'text-red-500'}`}>
                                        {tx.isCredit ? '+' : '-'}{formatCurrency(tx.amount, settings.businessInfo.currency)}
                                    </td>
                                    <td className="py-3 px-4">{tx.staff}</td>
                                </tr>
                            ))}
                             {displayTransactions.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-8 text-foreground-muted">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountsView;