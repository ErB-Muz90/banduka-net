import React, { useState, useMemo } from 'react';
import { Expense, View } from '../../types';
import { motion } from 'framer-motion';

interface ExpendituresViewProps {
    expenses: Expense[];
    onViewExpenseRequest: (expense: Expense) => void;
    setCurrentView: (view: View) => void;
}

const ITEMS_PER_PAGE = 15;

export const ExpendituresView: React.FC<ExpendituresViewProps> = ({ expenses, onViewExpenseRequest, setCurrentView }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filteredExpenses = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if(start) start.setHours(0,0,0,0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if(end) end.setHours(23,59,59,999);
        
        return expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                if (start && expenseDate < start) return false;
                if (end && expenseDate > end) return false;
                return true;
            })
            .filter(expense => {
                const searchTermLower = searchTerm.toLowerCase();
                return (
                    expense.id.toLowerCase().includes(searchTermLower) ||
                    expense.reason.toLowerCase().includes(searchTermLower) ||
                    (expense.payee && expense.payee.toLowerCase().includes(searchTermLower)) ||
                    expense.cashierName.toLowerCase().includes(searchTermLower)
                );
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, searchTerm, dateFrom, dateTo]);

    const paginatedExpenses = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredExpenses, currentPage]);

    const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);

    const totalExpenseAmount = useMemo(() => {
        return filteredExpenses.reduce((acc, p) => acc + p.amount, 0);
    }, [filteredExpenses]);

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-foreground dark:text-dark-foreground">Expenditure Management</h1>
                <button 
                    onClick={() => setCurrentView(View.NewExpense)}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-primary-content font-bold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Expense
                </button>
            </div>
            
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
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-bold">Total Expenses (Filtered)</p>
                    <p className="text-2xl font-bold text-danger">Ksh {totalExpenseAmount.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                     <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted font-semibold">
                        <tr>
                            <th scope="col" className="px-6 py-4">Expense ID</th>
                            <th scope="col" className="px-6 py-4">Date</th>
                            <th scope="col" className="px-6 py-4">Reason</th>
                            <th scope="col" className="px-6 py-4">Paid To</th>
                            <th scope="col" className="px-6 py-4">Cashier</th>
                            <th scope="col" className="px-6 py-4 text-right">Amount (Ksh)</th>
                            <th scope="col" className="px-6 py-4"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-dark-border">
                        {paginatedExpenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => onViewExpenseRequest(expense)}>
                                <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground font-mono text-xs">{expense.id}</td>
                                <td className="px-6 py-4">{new Date(expense.date).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4">{expense.reason}</td>
                                <td className="px-6 py-4">{expense.payee || 'N/A'}</td>
                                <td className="px-6 py-4">{expense.cashierName}</td>
                                <td className="px-6 py-4 text-right font-mono font-semibold text-danger">
                                    {expense.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                     <button className="font-medium text-primary dark:text-dark-primary hover:underline">View</button>
                                </td>
                            </tr>
                        ))}
                         {paginatedExpenses.length === 0 && (
                             <tr><td colSpan={7} className="text-center py-10">No expenses found.</td></tr>
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