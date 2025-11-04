import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SalesOrder } from '../types';

interface SalesOrderListViewProps {
    salesOrders: SalesOrder[];
    onViewSalesOrder: (salesOrder: SalesOrder) => void;
    onCancelRequest: (salesOrder: SalesOrder) => void;
    onCreatePORequest: (salesOrder: SalesOrder) => void;
    onPushToPOSRequest: (salesOrder: SalesOrder) => void;
    onCreateRequest: () => void;
}

const StatusBadge: React.FC<{ status: SalesOrder['status'] }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case 'Draft': return <span className={`${baseClasses} text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300`}>Draft</span>;
        case 'Pending': return <span className={`${baseClasses} text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300`}>Pending</span>;
        case 'Ordered': return <span className={`${baseClasses} text-indigo-800 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300`}>Ordered</span>;
        case 'Partially Received': return <span className={`${baseClasses} text-sky-800 bg-sky-100 dark:bg-sky-900/50 dark:text-sky-300`}>Partially Received</span>;
        case 'Received': return <span className={`${baseClasses} text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300`}>Received</span>;
        case 'Completed': return <span className={`${baseClasses} text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300`}>Completed</span>;
        case 'Cancelled': return <span className={`${baseClasses} text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300`}>Cancelled</span>;
        default: return <span className={`${baseClasses} text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-300`}>Unknown</span>;
    }
};

const ActionsDropdown: React.FC<{ salesOrder: SalesOrder; onCancel: () => void; onCreatePO: () => void; onPushToPOS: () => void; onView: () => void; }> = ({ salesOrder, onCancel, onCreatePO, onPushToPOS, onView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const canCreatePO = salesOrder.status === 'Pending' && salesOrder.items.some(i => i.status === 'Pending');
    const canPushToPOS = salesOrder.status === 'Received';
    const canCancel = salesOrder.status === 'Pending' || salesOrder.status === 'Ordered';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="px-2 py-1 rounded-md hover:bg-muted dark:hover:bg-dark-muted">
                •••
            </button>
            <AnimatePresence>
            {isOpen && (
                <div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-48 bg-card dark:bg-dark-card rounded-md shadow-lg z-10 border border-border dark:border-dark-border"
                >
                    <ul className="py-1 text-sm text-foreground dark:text-dark-foreground">
                        <li><button onClick={() => { onView(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-dark-muted">View Details</button></li>
                        {canCreatePO && <li><button onClick={() => { onCreatePO(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-dark-muted">Create Purchase Order</button></li>}
                        {canPushToPOS && <li><button onClick={() => { onPushToPOS(); setIsOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-muted dark:hover:bg-dark-muted">Push to POS</button></li>}
                        {canCancel && <>
                            <div className="my-1 border-t border-border dark:border-dark-border"></div>
                            <li><button onClick={() => { onCancel(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-danger hover:bg-danger/10">Cancel Order</button></li>
                        </>}
                    </ul>
                </div>
            )}
            </AnimatePresence>
        </div>
    );
};


const SalesOrderListView: React.FC<SalesOrderListViewProps> = ({ salesOrders, onViewSalesOrder, onCancelRequest, onCreatePORequest, onPushToPOSRequest, onCreateRequest }) => {
    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Sales Order List</h1>
                <button 
                    onClick={onCreateRequest}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-primary-content font-bold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Sales Order
                </button>
            </div>
            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                        <tr>
                            <th scope="col" className="px-6 py-3">Order #</th>
                            <th scope="col" className="px-6 py-3">Customer</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Date Created</th>
                            <th scope="col" className="px-6 py-3 text-right">Balance Due</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-16 text-foreground-muted dark:text-dark-foreground-muted">
                                    <div className="flex flex-col items-center">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-foreground-muted dark:text-dark-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                        <p className="mt-2 font-semibold">No sales orders found.</p>
                                        <p className="text-sm">Create a new sales order to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            salesOrders.map(so => (
                                <tr key={so.id} className="bg-card dark:bg-dark-card border-b dark:border-dark-border hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => onViewSalesOrder(so)}>
                                    <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">{so.id}</td>
                                    <td className="px-6 py-4">{so.customerName}</td>
                                    <td className="px-6 py-4"><StatusBadge status={so.status} /></td>
                                    <td className="px-6 py-4">{new Date(so.createdDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right font-mono font-semibold text-danger">{so.balance.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionsDropdown 
                                            salesOrder={so}
                                            onView={() => onViewSalesOrder(so)}
                                            onCancel={() => onCancelRequest(so)}
                                            onCreatePO={() => onCreatePORequest(so)}
                                            onPushToPOS={() => onPushToPOSRequest(so)}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesOrderListView;
