
import React from 'react';
import { HeldReceipt } from '../types';
import { motion } from 'framer-motion';

interface HeldReceiptsViewProps {
    heldReceipts: HeldReceipt[];
    onRecallReceipt: (receipt: HeldReceipt) => void;
    onDeleteReceiptRequest: (receipt: HeldReceipt) => void;
}

const HeldReceiptsView: React.FC<HeldReceiptsViewProps> = ({ heldReceipts, onRecallReceipt, onDeleteReceiptRequest }) => {

    const calculateTotal = (items: HeldReceipt['items']) => {
        return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-4xl font-bold text-foreground dark:text-dark-foreground mb-6">Held Receipts</h1>

            {heldReceipts.length === 0 ? (
                <div className="text-center py-10 text-foreground-muted dark:text-dark-foreground-muted">
                    <p>There are no held receipts.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {heldReceipts.map(receipt => (
                        <div
                            key={receipt.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card dark:bg-dark-card rounded-lg shadow-md flex flex-col border border-border dark:border-dark-border"
                        >
                            <div className="p-4 border-b border-border dark:border-dark-border">
                                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground truncate">{receipt.name}</h3>
                                <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">
                                    Held by {receipt.cashierName} at {new Date(receipt.heldAt).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="p-4 flex-grow">
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground-muted dark:text-dark-foreground-muted">Items</span>
                                    <span className="font-semibold text-foreground dark:text-dark-foreground">{receipt.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-foreground-muted dark:text-dark-foreground-muted">Total</span>
                                    <span className="font-semibold font-mono text-foreground dark:text-dark-foreground">Ksh {calculateTotal(receipt.items).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="p-2 bg-muted dark:bg-dark-muted/50 flex justify-end gap-2 rounded-b-lg">
                                <button
                                    onClick={() => onDeleteReceiptRequest(receipt)}
                                    className="px-3 py-1 text-sm font-semibold text-danger bg-danger/10 hover:bg-danger/20 rounded-md"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => onRecallReceipt(receipt)}
                                    className="px-3 py-1 text-sm font-semibold text-primary-content bg-primary hover:bg-primary-focus rounded-md"
                                >
                                    Recall
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HeldReceiptsView;
