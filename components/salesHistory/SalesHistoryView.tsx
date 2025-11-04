
import React, { useState, useMemo } from 'react';
import { Sale, Customer, User } from '../../types';

interface SalesHistoryViewProps {
    sales: Sale[];
    customers: Customer[];
    users: User[];
    onViewSaleRequest: (sale: Sale) => void;
}

const ITEMS_PER_PAGE = 15;

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ sales, customers, users, onViewSaleRequest }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

    const filteredSales = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if(start) start.setHours(0,0,0,0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if(end) end.setHours(23,59,59,999);
        
        return sales
            .filter(sale => {
                const saleDate = new Date(sale.date);
                if (start && saleDate < start) return false;
                if (end && saleDate > end) return false;
                return true;
            })
            .filter(sale => {
                const customerName = customerMap.get(sale.customerId) || '';
                const searchTermLower = searchTerm.toLowerCase();
                return (
                    sale.id.toLowerCase().includes(searchTermLower) ||
                    customerName.toLowerCase().includes(searchTermLower) ||
                    sale.cashierName.toLowerCase().includes(searchTermLower)
                );
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, searchTerm, dateFrom, dateTo, customerMap]);
    
    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSales, currentPage]);

    const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
    
    const summary = useMemo(() => {
        const totalRevenue = filteredSales.reduce((acc, s) => {
            const revenue = s.depositApplied ? (s.total + s.depositApplied) : s.total;
            return acc + revenue;
        }, 0);
        
        return {
            totalRevenue: totalRevenue,
            transactionCount: filteredSales.length,
        };
    }, [filteredSales]);

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-4xl font-bold text-foreground dark:text-dark-foreground">Sales History</h1>
            
            <div className="my-6 p-4 bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <input
                        type="text"
                        placeholder="Search by ID, Customer, Cashier..."
                        className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border dark:border-dark-border">
                    <div className="text-center">
                        <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-bold">Total Revenue</p>
                        <p className="text-2xl font-bold text-primary dark:text-dark-primary">Ksh {summary.totalRevenue.toFixed(2)}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-bold">Transactions</p>
                        <p className="text-2xl font-bold text-primary dark:text-dark-primary">{summary.transactionCount}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                     <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted font-semibold">
                        <tr>
                            <th scope="col" className="px-6 py-4">Receipt ID</th>
                            <th scope="col" className="px-6 py-4">Date</th>
                            <th scope="col" className="px-6 py-4">Customer</th>
                            <th scope="col" className="px-6 py-4">Cashier</th>
                            <th scope="col" className="px-6 py-4 text-right">Total (Ksh)</th>
                            <th scope="col" className="px-6 py-4"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-dark-border">
                        {paginatedSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => onViewSaleRequest(sale)}>
                                <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground font-mono text-xs">
                                    {sale.id}
                                </td>
                                <td className="px-6 py-4">{new Date(sale.date).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4">{customerMap.get(sale.customerId) || 'Unknown'}</td>
                                <td className="px-6 py-4">{sale.cashierName}</td>
                                <td className="px-6 py-4 text-right font-mono font-semibold">
                                    {(sale.total + (sale.depositApplied || 0)).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                     <button className="font-medium text-primary dark:text-dark-primary hover:underline">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 text-sm border-t border-border dark:border-dark-border">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50 border-border dark:border-dark-border">Previous</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50 border-border dark:border-dark-border">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesHistoryView;
