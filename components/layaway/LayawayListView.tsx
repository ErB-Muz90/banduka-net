

import React, { useMemo, ReactNode } from 'react';
import { Layaway } from '../types';
import { motion } from 'framer-motion';

interface LayawayListViewProps {
    layaways: Layaway[];
    onSelectLayaway: (layaway: Layaway) => void;
    onCreateRequest: () => void;
    onDeleteRequest: (layaway: Layaway) => void;
}

const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const StatCard: React.FC<{ title: string; value: string | number; icon: ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border flex items-center space-x-4">
        <div className="p-3 rounded-lg bg-muted dark:bg-dark-muted text-primary dark:text-dark-primary">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
            <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: Layaway['status'] }> = ({ status }) => {
    const baseClasses = "px-2 py-0.5 text-xs font-semibold rounded-full";
    switch (status) {
        case 'Active': return <span className={`${baseClasses} text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300`}>Active</span>;
        case 'Completed': return <span className={`${baseClasses} text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300`}>Completed</span>;
        case 'Defaulted': return <span className={`${baseClasses} text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300`}>Defaulted</span>;
        case 'Cancelled': return <span className={`${baseClasses} text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-300`}>Cancelled</span>;
        default: return <span className={`${baseClasses} text-slate-800 bg-slate-100`}>Unknown</span>;
    }
};

const LayawayListView: React.FC<LayawayListViewProps> = ({ layaways, onSelectLayaway, onCreateRequest, onDeleteRequest }) => {

    const { activePlans, totalOutstanding, completed } = useMemo(() => {
        const active = layaways.filter(l => l.status === 'Active');
        return {
            activePlans: active.length,
            totalOutstanding: active.reduce((sum, l) => sum + l.balance, 0),
            completed: layaways.filter(l => l.status === 'Completed').length,
        };
    }, [layaways]);

    const formatCurrency = (amount: number) => `KES ${amount.toFixed(2)}`;

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Layaway Plans</h1>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Manage customer payment plans (All prices include VAT)</p>
                </div>
                <button 
                    onClick={onCreateRequest}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-md flex items-center"
                >
                    + Create Layaway
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard title="Active Plans" value={activePlans} icon={<CalendarIcon />} />
                <StatCard title="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={<DollarIcon />} />
                <StatCard title="Completed" value={completed} icon={<CheckCircleIcon />} />
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-hidden">
                <h2 className="text-lg font-semibold p-4">All Layaways</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                        <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                            <tr>
                                <th scope="col" className="px-6 py-3">Layaway #</th>
                                <th scope="col" className="px-6 py-3">Customer</th>
                                <th scope="col" className="px-6 py-3">Total Amount</th>
                                <th scope="col" className="px-6 py-3">Paid</th>
                                <th scope="col" className="px-6 py-3">Balance</th>
                                <th scope="col" className="px-6 py-3">Due Date</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-dark-border">
                            {layaways.map(layaway => {
                                const paidAmount = layaway.total - layaway.balance;
                                const percentage = layaway.total > 0 ? (paidAmount / layaway.total) * 100 : 0;
                                return (
                                <tr key={layaway.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                                    <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">{layaway.id}</td>
                                    <td className="px-6 py-4">{layaway.customerName}</td>
                                    <td className="px-6 py-4 font-mono">{formatCurrency(layaway.total)}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono">{formatCurrency(paidAmount)}</div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-700 my-1">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <div className="text-right text-xs font-semibold text-green-500">{percentage.toFixed(0)}%</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-semibold text-danger">{formatCurrency(layaway.balance)}</td>
                                    <td className="px-6 py-4">{new Date(layaway.expiryDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><StatusBadge status={layaway.status} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => onSelectLayaway(layaway)} className="p-1 hover:bg-border rounded-full" title="View Details">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.064 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(layaway); }} className="p-1 hover:bg-border rounded-full" title="Delete Layaway">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                             {layaways.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-16 text-foreground-muted dark:text-dark-foreground-muted">
                                        <p className="font-semibold">No layaway plans found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LayawayListView;