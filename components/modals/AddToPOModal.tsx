import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Product, PurchaseOrder, Supplier } from '../../types';

interface AddToPOModalProps {
    product: Product;
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    onConfirm: (product: Product, quantity: number, poId: string | 'new', supplierId?: string) => void;
    onClose: () => void;
}

const AddToPOModal: React.FC<AddToPOModalProps> = ({ product, purchaseOrders, suppliers, onConfirm, onClose }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedPO, setSelectedPO] = useState<string | 'new'>('new');
    const [selectedSupplier, setSelectedSupplier] = useState<string>(suppliers[0]?.id || '');

    const draftPOs = useMemo(() => {
        return purchaseOrders.filter(po => po.status === 'Draft' || po.status === 'Sent');
    }, [purchaseOrders]);

    const canConfirm = useMemo(() => {
        if (quantity <= 0) return false;
        if (selectedPO === 'new' && !selectedSupplier) return false;
        return true;
    }, [quantity, selectedPO, selectedSupplier]);

    const handleConfirm = () => {
        if (!canConfirm) return;
        onConfirm(product, quantity, selectedPO, selectedPO === 'new' ? selectedSupplier : undefined);
    };

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-8"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Add to Purchase Order</h2>
                    <button onClick={onClose} className="text-foreground-muted dark:text-dark-foreground-muted hover:text-foreground dark:hover:text-dark-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="bg-muted dark:bg-dark-muted p-4 rounded-lg mb-6">
                    <p className="font-bold text-lg text-foreground dark:text-dark-foreground">{product.name}</p>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Current Stock: <span className="font-semibold text-danger">{product.stock}</span></p>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Unit Cost: <span className="font-semibold text-foreground dark:text-dark-foreground">Ksh {product.costPrice?.toFixed(2) || '0.00'}</span></p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Order Quantity</label>
                        <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-lg"
                        />
                    </div>
                    <div>
                        <label htmlFor="po-select" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Purchase Order</label>
                        <select
                            id="po-select"
                            value={selectedPO}
                            onChange={(e) => setSelectedPO(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border dark:border-dark-border bg-card dark:bg-dark-card focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm rounded-md"
                        >
                            <option value="new">-- Create New PO --</option>
                            {draftPOs.map(po => (
                                <option key={po.id} value={po.id}>
                                    {po.poNumber} ({suppliers.find(s => s.id === po.supplierId)?.name}) - {po.status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedPO === 'new' && (
                        <div>
                            <label htmlFor="supplier-select" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Supplier</label>
                            <select
                                id="supplier-select"
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border dark:border-dark-border bg-card dark:bg-dark-card focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm rounded-md"
                            >
                                <option value="" disabled>-- Select a Supplier --</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-semibold px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        whileTap={{ scale: 0.98 }}
                        className="bg-primary text-primary-content font-bold py-2 px-6 rounded-lg text-lg hover:bg-primary-focus transition-colors shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToPOModal;