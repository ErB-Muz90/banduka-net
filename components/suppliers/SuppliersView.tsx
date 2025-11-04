

import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Supplier, PurchaseOrder, SupplierInvoice, Permission, SupplierPayment, Settings } from '../types';
import SupplierModal from '../purchases/SupplierModal';
import ConfirmationModal from '../common/ConfirmationModal';
import SupplierStatementView from './SupplierStatementView';
import { useTheme } from '../../hooks/useTheme';

interface SuppliersViewProps {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    supplierInvoices: SupplierInvoice[];
    supplierPayments: SupplierPayment[];
    onAddSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<any>;
    onUpdateSupplier: (supplier: Supplier) => Promise<void>;
    onDeleteSupplier: (supplierId: string) => Promise<void>;
    permissions: Permission[];
    settings: Settings;
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border">
        <p className="text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
        <p className="text-2xl font-bold text-foreground dark:text-dark-foreground mt-1">{value}</p>
    </div>
);

const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, purchaseOrders, supplierInvoices, supplierPayments, onAddSupplier, onUpdateSupplier, onDeleteSupplier, permissions, settings }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingStatementFor, setViewingStatementFor] = useState<Supplier | null>(null);
    const [theme] = useTheme();

    const canManage = permissions.includes('manage_suppliers');

    const handleOpenModal = (supplier?: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id'> | Supplier) => {
        await onAddSupplier(supplierData as Omit<Supplier, 'id'>);
        setIsModalOpen(false);
    };
    
    const handleUpdateAndSave = async (supplierData: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in supplierData) {
            await onUpdateSupplier(supplierData);
        } else {
            await onAddSupplier(supplierData);
        }
        setIsModalOpen(false);
    }


    const handleDelete = async () => {
        if(deletingSupplier) {
            await onDeleteSupplier(deletingSupplier.id);
            setDeletingSupplier(null);
        }
    };

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.businessName && s.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            s.contact.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [suppliers, searchTerm]);

    const { totalOwed, topSuppliersData } = useMemo(() => {
        const supplierBalances: { [id: string]: { name: string; value: number } } = {};

        suppliers.forEach(s => {
            supplierBalances[s.id] = { name: s.businessName || s.name, value: 0 };
        });

        supplierInvoices.forEach(inv => {
            if (supplierBalances[inv.supplierId] && inv.status !== 'Paid') {
                supplierBalances[inv.supplierId].value += inv.totalAmount - inv.paidAmount;
            }
        });

        const total = Object.values(supplierBalances).reduce((sum, s) => sum + s.value, 0);
        const top = Object.values(supplierBalances)
            .filter(s => s.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { totalOwed: total, topSuppliersData: top };
    }, [supplierInvoices, suppliers]);
    
    const lightColors = ['#10b981', '#3b82f6', '#facc15', '#a78bfa', '#f87171'];
    const darkColors = ['#34d399', '#60a5fa', '#fde047', '#c4b5fd', '#fca5a5'];
    const chartColors = theme === 'dark' ? darkColors : lightColors;

    if (viewingStatementFor) {
        return (
            <SupplierStatementView 
                supplier={viewingStatementFor}
                purchaseOrders={purchaseOrders.filter(p => p.supplierId === viewingStatementFor.id)}
                supplierInvoices={supplierInvoices.filter(i => i.supplierId === viewingStatementFor.id)}
                supplierPayments={supplierPayments.filter(p => supplierInvoices.some(i => i.id === p.invoiceId && i.supplierId === viewingStatementFor.id))}
                settings={settings}
                onBack={() => setViewingStatementFor(null)}
            />
        )
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
             <AnimatePresence>
                {isModalOpen && (
                    <SupplierModal
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleUpdateAndSave}
                        supplier={editingSupplier}
                    />
                )}
                 {deletingSupplier && (
                    <ConfirmationModal
                        title={`Delete ${deletingSupplier.name}?`}
                        message="Are you sure you want to permanently delete this supplier? This action cannot be undone."
                        confirmText="Delete"
                        onConfirm={handleDelete}
                        onClose={() => setDeletingSupplier(null)}
                        isDestructive
                    />
                )}
            </AnimatePresence>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Suppliers</h1>
                 {canManage && (
                    <button
                        onClick={() => handleOpenModal()}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary text-primary-content font-bold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center"
                    >
                        Add Supplier
                    </button>
                )}
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                 <div className="lg:col-span-1 space-y-4">
                     <StatCard title="Total Suppliers" value={String(suppliers.length)} />
                     <StatCard title="Total Amount Owed" value={`Ksh ${totalOwed.toFixed(2)}`} />
                 </div>
                 <div className="lg:col-span-2 bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border">
                     <h3 className="font-bold text-foreground dark:text-dark-foreground mb-2">Top 5 Suppliers by Amount Owed</h3>
                     {topSuppliersData.length > 0 ? (
                         <ResponsiveContainer width="100%" height={200}>
                             <PieChart>
                                 <Pie data={topSuppliersData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                     {topSuppliersData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                    ))}
                                 </Pie>
                                 <Tooltip formatter={(value) => `Ksh ${Number(value).toFixed(2)}`} />
                                 <Legend />
                             </PieChart>
                         </ResponsiveContainer>
                     ) : (
                        <div className="flex items-center justify-center h-full text-foreground-muted dark:text-dark-foreground-muted">No outstanding balances.</div>
                     )}
                 </div>
            </div>

            <div className="mb-4">
                 <input
                    type="text"
                    placeholder="Search by name, business, or contact..."
                    className="w-full max-w-sm px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                        <tr>
                            <th scope="col" className="px-6 py-3 font-bold">Business Name</th>
                            <th scope="col" className="px-6 py-3 font-bold">Contact Person</th>
                            <th scope="col" className="px-6 py-3 font-bold">Phone</th>
                            <th scope="col" className="px-6 py-3 font-bold">Amount Owed</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSuppliers.map(s => {
                            const amountOwed = topSuppliersData.find(ts => ts.name === (s.businessName || s.name))?.value || 0;
                            return (
                                <tr key={s.id} className="border-b dark:border-dark-border hover:bg-muted dark:hover:bg-dark-muted">
                                    <td className="px-6 py-4 font-semibold text-foreground dark:text-dark-foreground">{s.businessName || s.name}</td>
                                    <td className="px-6 py-4">{s.name}</td>
                                    <td className="px-6 py-4">{s.contact}</td>
                                    <td className={`px-6 py-4 font-mono font-semibold ${amountOwed > 0 ? 'text-danger' : ''}`}>{amountOwed.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right space-x-4">
                                        <button onClick={() => setViewingStatementFor(s)} className="font-medium text-secondary hover:underline">View Statement</button>
                                        {canManage && (
                                            <>
                                                <button onClick={() => handleOpenModal(s)} className="font-medium text-primary hover:underline">Edit</button>
                                                <button onClick={() => setDeletingSupplier(s)} className="font-medium text-danger hover:underline">Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuppliersView;