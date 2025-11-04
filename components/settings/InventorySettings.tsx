import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from '../../types';

interface InventorySettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

const InventorySettings: React.FC<InventorySettingsProps> = ({ settings, onUpdateSettings }) => {
    const [lowStockThreshold, setLowStockThreshold] = useState(settings.inventory?.lowStockThreshold ?? 3);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({
            inventory: {
                ...settings.inventory,
                lowStockThreshold: Number(lowStockThreshold)
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Low Stock Threshold</label>
                <input
                    type="number"
                    name="lowStockThreshold"
                    id="lowStockThreshold"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    min="0"
                    className="mt-1 block w-full max-w-xs px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm"
                />
                <p className="mt-2 text-xs text-foreground-muted dark:text-dark-foreground-muted">
                    Products with stock quantity less than this number will be flagged as "Low Stock".
                </p>
            </div>

            <div className="flex justify-end pt-6 border-t border-border dark:border-dark-border mt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-md">
                    Save Inventory Settings
                </button>
            </div>
        </form>
    );
};

export default InventorySettings;
