import React, { useMemo } from 'react';
import { WorkOrder, User, Customer } from '../types';
import { motion } from 'framer-motion';

interface WorkOrderListViewProps {
    workOrders: WorkOrder[];
    users: User[];
    customers: Customer[];
    onViewWorkOrder: (workOrder: WorkOrder) => void;
    onCreateRequest: () => void;
}

const StatCard: React.FC<{ title: string; count: number, className?: string }> = ({ title, count, className }) => (
    <div className={`bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border ${className}`}>
        <p className="text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
        <p className="text-3xl font-bold text-foreground dark:text-dark-foreground">{count}</p>
    </div>
);

const StatusBadge: React.FC<{ status: WorkOrder['status'] }> = ({ status }) => {
    let colorClasses = 'text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-300';
    switch (status) {
        case 'Pending': colorClasses = 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300'; break;
        case 'In Progress': colorClasses = 'text-sky-800 bg-sky-100 dark:bg-sky-900/50 dark:text-sky-300'; break;
        case 'Awaiting Parts': colorClasses = 'text-indigo-800 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300'; break;
        case 'Ready for Pickup': colorClasses = 'text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300'; break;
        case 'Completed': colorClasses = 'text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300'; break;
        case 'Delivered': colorClasses = 'text-violet-800 bg-violet-100 dark:bg-violet-900/50 dark:text-violet-300'; break;
        case 'Cancelled': colorClasses = 'text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300'; break;
    }
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colorClasses}`}>{status.toLowerCase()}</span>;
};

const WorkOrderListView: React.FC<WorkOrderListViewProps> = ({ workOrders, onViewWorkOrder, onCreateRequest }) => {
    
    const sortedWorkOrders = useMemo(() => 
        [...workOrders].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()),
        [workOrders]
    );
    
    const summaryCards = useMemo(() => {
        const counts = { Pending: 0, 'In Progress': 0, Completed: 0, Delivered: 0 };
        workOrders.forEach(wo => {
            if(wo.status === 'Pending') counts.Pending++;
            if(wo.status === 'In Progress') counts['In Progress']++;
            if(wo.status === 'Completed') counts.Completed++;
            if(wo.status === 'Delivered') counts.Delivered++;
        });
        return counts;
    }, [workOrders]);

    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted min-h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Work Orders</h1>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Manage repair, service, and custom work orders</p>
                </div>
                <button 
                    onClick={onCreateRequest}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-sm flex items-center"
                >
                    + Create Work Order
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Pending" count={summaryCards.Pending} className="border-l-4 border-yellow-500" />
                <StatCard title="In Progress" count={summaryCards['In Progress']} className="border-l-4 border-sky-500" />
                <StatCard title="Completed" count={summaryCards.Completed} className="border-l-4 border-green-500" />
                <StatCard title="Delivered" count={summaryCards.Delivered} className="border-l-4 border-violet-500" />
            </div>
            
            <div className="bg-card dark:bg-dark-card rounded-lg shadow-sm overflow-hidden border border-border dark:border-dark-border">
                <div className="p-4 border-b border-border dark:border-dark-border">
                    <h2 className="text-lg font-semibold text-foreground dark:text-dark-foreground">All Work Orders</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                        <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                            <tr>
                                <th className="px-6 py-3">WO #</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Title</th>
                                <th className="px-6 py-3">Promised By</th>
                                <th className="px-6 py-3 text-right">Balance Due</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-dark-border">
                            {sortedWorkOrders.map(wo => (
                                <tr key={wo.id} className="hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => onViewWorkOrder(wo)}>
                                    <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">{wo.id}</td>
                                    <td className="px-6 py-4">{wo.customerName}</td>
                                    <td className="px-6 py-4">{wo.jobTitle}</td>
                                    <td className="px-6 py-4">{new Date(wo.promisedDate).toLocaleDateString() || '-'}</td>
                                    <td className="px-6 py-4 font-mono text-right font-semibold text-danger">{wo.balanceDue.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center"><StatusBadge status={wo.status} /></td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="font-medium text-primary dark:text-dark-primary hover:underline">View</button>
                                    </td>
                                </tr>
                            ))}
                            {sortedWorkOrders.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-10">No work orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderListView;