

import React, { useState, useMemo } from 'react';
import { Expense } from '../../types';
import { motion } from 'framer-motion';

interface PayoutsListViewProps {
    payouts: Expense[];
    onViewPayoutRequest: (payout: Expense) => void;
}

const ITEMS_PER_PAGE = 15;

export const PayoutsListView: React.FC<PayoutsListViewProps> = ({ payouts, onViewPayoutRequest }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filteredPayouts = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if(start) start.setHours(0,0,0,0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if(end) end.setHours(23,59,59,999);
        
        return payouts
            .filter(payout => {
                const payoutDate = new Date(payout.date);
                if (start && payoutDate < start) return false;
                if (end && payoutDate > end) return false;
                return true;
            })
            .filter(payout => {
                const searchTermLower = searchTerm.toLowerCase();
                return (
                    payout.id.toLowerCase().includes(searchTermLower) ||
                    payout.reason.toLowerCase().includes(searchTermLower) ||
                    (payout.payee && payout.payee.toLowerCase().includes(searchTermLower)) ||
                    payout.cashierName.toLowerCase().includes(searchTermLower)
                );
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payouts, searchTerm, dateFrom, dateTo]);

    const paginatedPayouts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPayouts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredPayouts, currentPage]);

    const totalPages = Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE);

    const totalPayoutAmount = useMemo(() => {
        return filteredPayouts.reduce((acc, p) => acc + p.amount, 0);
    }, [filteredPayouts]);

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-4xl font-bold text-foreground dark:text-dark-foreground">Payouts History (Expenses)</h1>
            
            <div className="my-6 p-4 bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <input
                        type="text"
                        placeholder="Search by ID, Reason, Payee..."
                        className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card" />
                </div>
                <div className="text-center pt-4 border-t border-border dark:border-dark-border">
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-bold">Total Payouts (Filtered)</p>
                    <p className="text-2xl font-bold text-danger">Ksh {totalPayoutAmount.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                     <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted font-semibold">
                        <tr>
                            <th scope="col" className="px-6 py-4">Payout ID</th>
                            <th scope="col" className="px-6 py-4">Date</th>
                            <th scope="col" className="px-6 py-4">Reason</th>
                            <th scope="col" className="px-6 py-4">Paid To</th>
                            <th scope="col" className="px-6 py-4">Cashier</th>
                            <th scope="col" className="px-6 py-4 text-right">Amount (Ksh)</th>
                            <th scope="col" className="px-6 py-4"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-dark-border">
                        {paginatedPayouts.map(payout => (
                            <tr key={payout.id} className="hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => onViewPayoutRequest(payout)}>
                                <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground font-mono text-xs">{payout.id}</td>
                                <td className="px-6 py-4">{new Date(payout.date).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4">{payout.reason}</td>
                                <td className="px-6 py-4">{payout.payee || 'N/A'}</td>
                                <td className="px-6 py-4">{payout.cashierName}</td>
                                <td className="px-6 py-4 text-right font-mono font-semibold text-danger">
                                    {payout.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                     <button className="font-medium text-primary dark:text-dark-primary hover:underline">View</button>
                                </td>
                            </tr>
                        ))}
                         {paginatedPayouts.length === 0 && (
                             <tr><td colSpan={7} className="text-center py-10">No payouts found.</td></tr>
                        )}
                    </tbody>
                </table>
                 {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 text-sm border-t border-border dark:border-dark-border">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50 border-border dark:border-dark-border">Previous</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-dark-border">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};