import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';

interface LowStockNotificationPopoverProps {
    lowStockProducts: Product[];
    onClose: () => void;
}

const LowStockNotificationPopover: React.FC<LowStockNotificationPopoverProps> = ({
    lowStockProducts,
    onClose
}) => {
    return (
        <>
            {/* Backdrop to close on clicking outside */}
            <div className="fixed inset-0 z-10" onClick={onClose} />
            <div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white/50 dark:bg-dark-card/70 backdrop-blur-2xl rounded-lg shadow-xl py-1 z-20 border border-white/20 dark:border-white/10"
            >
                <div className="px-4 py-3 border-b border-white/20 dark:border-white/10">
                    <h4 className="font-bold text-foreground dark:text-dark-foreground">Low Stock Alerts</h4>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">The following items are running low on stock.</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {lowStockProducts.length > 0 ? (
                        <ul className="divide-y divide-white/20 dark:divide-white/10">
                            {lowStockProducts.map(product => (
                                <li key={product.id} className="p-3 hover:bg-white/20 dark:hover:bg-white/10">
                                    <div>
                                        <p className="font-semibold text-sm text-foreground dark:text-dark-foreground">{product.name}</p>
                                        <p className="text-xs text-warning font-bold">LOW STOCK ({product.stock} left)</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-foreground-muted dark:text-dark-foreground-muted">
                            No low stock alerts. Good job!
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default LowStockNotificationPopover;