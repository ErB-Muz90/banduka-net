import React, { useState, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sale, User, Payment } from '../types';

type PaymentTransaction = Payment & {
    saleId: string;
    date: Date;
    cashierName: string;
};

const ITEMS_PER_PAGE = 20;

const StatCard: React.FC<{ title: string; value: string; onClick: () => void; isActive: boolean; children: ReactNode }> = ({ title, value, onClick, isActive, children }) => (
    <div 
        onClick={onClick}
        className={`p-4 rounded-xl shadow-sm border border-border dark:border-dark-border flex items-center space-x-3 cursor-pointer transition-all duration-200 ${isActive ? 'bg-primary dark:bg-dark-primary text-primary-content dark:text-dark-primary-content' : 'bg-card dark:bg-dark-card hover:bg-muted dark:hover:bg-dark-muted'}`}
        whileHover={{ y: -3, scale: 1.02 }}
    >
        <div className={`p-3 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary dark:bg-dark-primary/20 dark:text-dark-primary'}`}>
            {children}
        </div>
        <div>
            <p className={`text-sm font-semibold ${isActive ? 'text-white/80 dark:text-dark-primary-content/80' : 'text-foreground-muted dark:text-dark-foreground-muted'}`}>{title}</p>
            <p className={`text-2xl font-bold ${isActive ? 'text-white dark:text-dark-primary-content' : 'text-foreground dark:text-dark-foreground'}`}>{value}</p>
        </div>
    </div>
);

const exportToCSV = (data: PaymentTransaction[], filename: string) => {
    const headers = ['date', 'saleId', 'method', 'amount', 'cashierName'];
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header as keyof PaymentTransaction];
                if (header === 'date' && value instanceof Date) {
                    return value.toISOString();
                }
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(',')
        )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};


const PaymentSummaryView: React.FC<{ sales: Sale[]; users: User[] }> = ({ sales }) => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filter, setFilter] = useState<Payment['method'] | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    
    const transactions: PaymentTransaction[] = useMemo(() => {
        return sales.flatMap(sale => 
            sale.payments.map(payment => ({
                ...payment,
                saleId: sale.id,
                date: new Date(sale.date),
                cashierName: sale.cashierName
            }))
        ).sort((a,b) => b.date.getTime() - a.date.getTime());
    }, [sales]);

    const filteredByDate = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if (end) end.setHours(23, 59, 59, 999);
        
        return transactions.filter(t => {
            if (start && t.date < start) return false;
            if (end && t.date > end) return false;
            return true;
        });
    }, [transactions, dateFrom, dateTo]);

    const summary = useMemo(() => {
        return filteredByDate.reduce((acc, t) => {
            acc.All = (acc.All || 0) + t.amount;
            acc[t.method] = (acc[t.method] || 0) + t.amount;
            return acc;
        }, {} as Record<Payment['method'] | 'All', number>);
    }, [filteredByDate]);

    const filteredTransactions = useMemo(() => {
        setCurrentPage(1); // Reset page on filter change
        if (filter === 'All') return filteredByDate;
        return filteredByDate.filter(t => t.method === filter);
    }, [filteredByDate, filter]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount: number = 0) => `Ksh ${amount.toFixed(2)}`;

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-4xl font-bold text-foreground dark:text-dark-foreground">Payment Summary</h1>
            
            <div className="my-6 p-4 bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-background" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-background" />
                <button 
                    onClick={() => exportToCSV(filteredTransactions, `payment_summary_${dateFrom}_${dateTo}.csv`)}
                    className="bg-foreground/80 dark:bg-dark-border text-white font-bold px-4 py-2 rounded-lg hover:bg-foreground dark:hover:bg-dark-border/80 transition-colors shadow-md flex items-center justify-center text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export to CSV
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <StatCard title="Total Payments" value={formatCurrency(summary.All)} onClick={() => setFilter('All')} isActive={filter === 'All'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </StatCard>
                <StatCard title="Cash" value={formatCurrency(summary.Cash)} onClick={() => setFilter('Cash')} isActive={filter === 'Cash'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0 1.172 1.953 1.172 5.119 0 7.072z" /></svg>
                </StatCard>
                <StatCard title="M-Pesa" value={formatCurrency(summary['M-Pesa'])} onClick={() => setFilter('M-Pesa')} isActive={filter === 'M-Pesa'}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </StatCard>
                <StatCard title="Card" value={formatCurrency(summary.Card)} onClick={() => setFilter('Card')} isActive={filter === 'Card'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </StatCard>
                 <StatCard title="Points" value={formatCurrency(summary.Points)} onClick={() => setFilter('Points')} isActive={filter === 'Points'}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </StatCard>
            </div>
            
            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted font-bold">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Receipt ID</th>
                            <th scope="col" className="px-6 py-3">Method</th>
                            <th scope="col" className="px-6 py-3">Cashier</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTransactions.map((t, index) => (
                            <tr key={`${t.saleId}-${index}`} className="border-b dark:border-dark-border hover:bg-muted dark:hover:bg-dark-muted">
                                <td className="px-6 py-4">{t.date.toLocaleString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                <td className="px-6 py-4 font-mono text-xs">{t.saleId}</td>
                                <td className="px-6 py-4"><span className="font-semibold">{t.method}</span></td>
                                <td className="px-6 py-4">{t.cashierName}</td>
                                <td className="px-6 py-4 text-right font-mono font-semibold">{formatCurrency(t.amount)}</td>
                            </tr>
                        ))}
                         {filteredTransactions.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-10 text-foreground-muted dark:text-dark-foreground-muted">No transactions found for the selected criteria.</td></tr>
                        )}
                    </tbody>
                </table>
                 {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 text-sm border-t border-border dark:border-dark-border">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-dark-border">Previous</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-dark-border">Next</button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default PaymentSummaryView;
