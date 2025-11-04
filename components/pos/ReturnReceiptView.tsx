import React, { useState, useMemo } from 'react';
import { Sale, CartItem, Shift } from '../../types';
import { motion } from 'framer-motion';

interface ReturnReceiptViewProps {
    sales: Sale[];
    activeShift: Shift | null;
    onProcessReturn: (originalSale: Sale, returnedItems: CartItem[], reason: string, refundMethod: 'Cash' | 'Card' | 'M-Pesa') => void;
    onBack: () => void;
}

const ReturnReceiptView: React.FC<ReturnReceiptViewProps> = ({ sales, activeShift, onProcessReturn, onBack }) => {
    const [receiptId, setReceiptId] = useState('');
    const [foundSale, setFoundSale] = useState<Sale | null>(null);
    const [returnedQuantities, setReturnedQuantities] = useState<{ [key: string]: number }>({});
    const [returnReason, setReturnReason] = useState('');
    const [refundMethod, setRefundMethod] = useState<'Cash' | 'Card' | 'M-Pesa'>('Cash');
    const [error, setError] = useState('');

    const handleFindReceipt = () => {
        setError('');
        const sale = sales.find(s => s.id.toLowerCase() === receiptId.toLowerCase().trim() && s.type !== 'Return');
        if (sale) {
            setFoundSale(sale);
            const initialQuantities = sale.items.reduce((acc, item) => {
                acc[item.id] = 0;
                return acc;
            }, {} as { [key: string]: number });
            setReturnedQuantities(initialQuantities);
        } else {
            setError('Sale receipt not found or it is already a return.');
            setFoundSale(null);
        }
    };

    const handleQuantityChange = (itemId: string, originalQuantity: number, change: number) => {
        const currentReturnQty = returnedQuantities[itemId] || 0;
        const newReturnQty = Math.max(0, Math.min(originalQuantity, currentReturnQty + change));
        setReturnedQuantities(prev => ({ ...prev, [itemId]: newReturnQty }));
    };

    const returnedItemsForProcessing = useMemo((): CartItem[] => {
        if (!foundSale) return [];
        return foundSale.items
            .filter(item => returnedQuantities[item.id] > 0)
            .map(item => ({ ...item, quantity: returnedQuantities[item.id] }));
    }, [foundSale, returnedQuantities]);

    const refundTotal = useMemo(() => {
        return returnedItemsForProcessing.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }, [returnedItemsForProcessing]);

    const handleProcessReturn = () => {
        if (!foundSale) return;
        if (returnedItemsForProcessing.length === 0) {
            setError('Please select at least one item to return.');
            return;
        }
        if (!returnReason.trim()) {
            setError('A reason for the return is required.');
            return;
        }
        onProcessReturn(foundSale, returnedItemsForProcessing, returnReason, refundMethod);
    };

    if (!activeShift) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Shift Not Active</h1>
                <p className="mt-2 text-foreground-muted dark:text-dark-foreground-muted">You must start a shift before you can process a return.</p>
                <button onClick={onBack} className="mt-6 bg-primary text-primary-content font-bold py-2 px-6 rounded-lg">Back to POS</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-background dark:bg-dark-background">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Process a Return</h1>
                    <button onClick={onBack} className="text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">&larr; Back to POS</button>
                </div>

                {!foundSale ? (
                    <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Find Original Receipt</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={receiptId}
                                onChange={e => setReceiptId(e.target.value)}
                                placeholder="Enter Receipt ID to find sale..."
                                className="flex-grow w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button onClick={handleFindReceipt} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-lg hover:bg-primary-focus">Find</button>
                        </div>
                        {error && <p className="text-danger text-sm mt-2">{error}</p>}
                    </div>
                ) : (
                    <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold">Original Sale: <span className="font-mono text-primary dark:text-dark-primary">{foundSale.id}</span></h3>
                            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Date: {new Date(foundSale.date).toLocaleString()}</p>
                            <button onClick={() => setFoundSale(null)} className="text-sm text-secondary hover:underline mt-2">Find a different receipt</button>
                        </div>

                        <div className="bg-card dark:bg-dark-card rounded-xl shadow-md">
                            <h3 className="text-lg font-semibold p-4 border-b border-border dark:border-dark-border">Select Items to Return</h3>
                            <div className="max-h-80 overflow-y-auto">
                                <ul className="divide-y divide-border dark:divide-dark-border">
                                    {foundSale.items.map(item => (
                                        <li key={item.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold">{item.name}</p>
                                                <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Purchased: {item.quantity} @ Ksh {item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button onClick={() => handleQuantityChange(item.id, item.quantity, -1)} className="w-8 h-8 rounded-full bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground">-</button>
                                                <span className="font-bold w-8 text-center">{returnedQuantities[item.id] || 0}</span>
                                                <button onClick={() => handleQuantityChange(item.id, item.quantity, 1)} className="w-8 h-8 rounded-full bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground">+</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md space-y-4">
                             <div>
                                <label htmlFor="returnReason" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Reason for Return</label>
                                <input
                                    type="text"
                                    id="returnReason"
                                    value={returnReason}
                                    onChange={e => setReturnReason(e.target.value)}
                                    className="mt-1 w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background"
                                    placeholder="e.g., Damaged item"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-2">Refund Method</label>
                                <div className="flex gap-4">
                                    {(['Cash', 'Card', 'M-Pesa'] as const).map(method => (
                                        <label key={method} className="flex items-center">
                                            <input type="radio" name="refundMethod" value={method} checked={refundMethod === method} onChange={() => setRefundMethod(method)} className="focus:ring-primary h-4 w-4 text-primary"/>
                                            <span className="ml-2 text-sm">{method}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right border-t border-border dark:border-dark-border pt-4 mt-4">
                                <p className="text-foreground-muted dark:text-dark-foreground-muted">Total Refund Amount</p>
                                <p className="text-3xl font-bold text-danger">- Ksh {refundTotal.toFixed(2)}</p>
                            </div>
                             {error && <p className="text-danger text-sm text-center">{error}</p>}
                            <button onClick={handleProcessReturn} className="w-full mt-4 bg-danger text-white font-bold py-3 rounded-lg text-lg hover:bg-red-700">Process Refund</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReturnReceiptView;