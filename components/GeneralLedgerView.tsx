import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountingTransaction, Account } from '../types';

interface GeneralLedgerViewProps {
    transactions: AccountingTransaction[];
    accounts: Account[];
}

const TransactionRow: React.FC<{ transaction: AccountingTransaction, accountMap: Map<string, Account> }> = ({ transaction, accountMap }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const summary = useMemo(() => {
        return transaction.entries.reduce((acc, entry) => {
            acc.debit += entry.debit;
            acc.credit += entry.credit;
            return acc;
        }, { debit: 0, credit: 0 });
    }, [transaction.entries]);

    return (
        <>
            <tr onClick={() => setIsOpen(!isOpen)} className="cursor-pointer hover:bg-muted dark:hover:bg-dark-muted">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(transaction.date).toLocaleString()}</td>
                <td className="px-6 py-4">{transaction.description}</td>
                <td className="px-6 py-4 text-xs font-mono">{transaction.referenceType}: {transaction.referenceId}</td>
                <td className="px-6 py-4 text-right font-mono">{summary.debit.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-mono">{summary.credit.toFixed(2)}</td>
            </tr>
            <AnimatePresence>
                {isOpen && (
                    <tr>
                        <td colSpan={5} className="p-0 bg-background dark:bg-dark-background">
                            <div className="p-4 m-4 border-l-4 border-primary dark:border-dark-primary bg-muted dark:bg-dark-muted rounded-r-lg">
                                <h4 className="font-bold mb-2">Journal Entries</h4>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b dark:border-dark-border">
                                            <th className="text-left py-1">Account</th>
                                            <th className="text-right py-1">Debit</th>
                                            <th className="text-right py-1">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transaction.entries.map((entry, index) => (
                                            <tr key={index}>
                                                <td className="py-1">{accountMap.get(entry.accountId)?.name || 'Unknown Account'}</td>
                                                <td className="py-1 text-right font-mono">{entry.debit > 0 ? entry.debit.toFixed(2) : '-'}</td>
                                                <td className="py-1 text-right font-mono">{entry.credit > 0 ? entry.credit.toFixed(2) : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                )}
            </AnimatePresence>
        </>
    );
};

const GeneralLedgerView: React.FC<GeneralLedgerViewProps> = ({ transactions, accounts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);

    const filteredTransactions = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if(start) start.setHours(0,0,0,0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if(end) end.setHours(23,59,59,999);
        
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            if (start && transactionDate < start) return false;
            if (end && transactionDate > end) return false;
            if (searchTerm && !(t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.referenceId.toLowerCase().includes(searchTerm.toLowerCase()))) {
                return false;
            }
            return true;
        }).sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [transactions, searchTerm, dateFrom, dateTo]);

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground mb-6">General Ledger</h1>

            <div className="my-6 p-4 bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-background" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-background" />
                <input
                    type="text"
                    placeholder="Search description or reference..."
                    className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted font-bold">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Description</th>
                            <th scope="col" className="px-6 py-3">Reference</th>
                            <th scope="col" className="px-6 py-3 text-right">Total Debit</th>
                            <th scope="col" className="px-6 py-3 text-right">Total Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(t => (
                            <TransactionRow key={t.id} transaction={t} accountMap={accountMap} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GeneralLedgerView;
