import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Quotation, Permission, Sale } from '../types';

interface QuotationsViewProps {
    quotations: Quotation[];
    sales: Sale[];
    onSelectQuotation: (quotation: Quotation) => void;
    onCreateQuoteRequest: () => void;
    permissions: Permission[];
}

type DisplayStatus = Quotation['status'] | 'Paid';

const StatusBadge: React.FC<{ status: DisplayStatus }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case 'Paid':
            return <span className={`${baseClasses} text-purple-800 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300`}>Paid</span>;
        case 'Sent':
            return <span className={`${baseClasses} text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300`}>Sent</span>;
        case 'Draft':
            return <span className={`${baseClasses} text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300`}>Draft</span>;
        case 'Invoiced':
            return <span className={`${baseClasses} text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300`}>Invoiced</span>;
        case 'Expired':
            return <span className={`${baseClasses} text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300`}>Expired</span>;
        default:
            return <span className={`${baseClasses} text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-300`}>Unknown</span>;
    }
};

const QuotationsView: React.FC<QuotationsViewProps> = ({ quotations, sales, onSelectQuotation, onCreateQuoteRequest, permissions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const canManage = permissions.includes('manage_quotations');

    const salesByQuotationId = useMemo(() => {
        const map = new Map<string, Sale>();
        sales.forEach(s => {
            if (s.quotationId) {
                map.set(s.quotationId, s);
            }
        });
        return map;
    }, [sales]);

    const filteredQuotations = useMemo(() => {
        return quotations.filter(q => 
            q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [quotations, searchTerm]);

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Quotations</h1>
                {canManage && (
                    <button 
                        onClick={onCreateQuoteRequest}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary text-primary-content font-bold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Create New Quote
                    </button>
                )}
            </div>

            <div className="mb-4">
                 <input
                    type="text"
                    placeholder="Search quotations by number or customer..."
                    className="w-full max-w-sm px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted font-bold">
                        <tr>
                            <th scope="col" className="px-6 py-3">Quote #</th>
                            <th scope="col" className="px-6 py-3">Customer</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Expires</th>
                            <th scope="col" className="px-6 py-3 text-right">Total (Ksh)</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQuotations.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10">
                                    No quotations found.
                                </td>
                            </tr>
                        ) : (
                            filteredQuotations.map(quote => {
                                const displayedStatus: DisplayStatus = salesByQuotationId.has(quote.id) ? 'Paid' : quote.status;
                                return (
                                    <tr key={quote.id} className="bg-card dark:bg-dark-card border-b dark:border-dark-border hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => onSelectQuotation(quote)}>
                                        <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">{quote.quoteNumber}</td>
                                        <td className="px-6 py-4">{quote.customerName}</td>
                                        <td className="px-6 py-4"><StatusBadge status={displayedStatus} /></td>
                                        <td className="px-6 py-4">{new Date(quote.createdDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                        <td className="px-6 py-4">{new Date(quote.expiryDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                        <td className="px-6 py-4 text-right font-mono">{quote.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onSelectQuotation(quote); }}
                                                className="font-medium text-primary dark:text-dark-primary hover:underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuotationsView;