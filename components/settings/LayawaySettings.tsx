import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from '../../types';

interface LayawaySettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

const LayawaySettings: React.FC<LayawaySettingsProps> = ({ settings, onUpdateSettings }) => {
    const [formData, setFormData] = useState(settings.layaway || { minDepositPercentage: 20, maxDurationDays: 90 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ layaway: formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="minDepositPercentage" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Minimum Deposit Percentage (%)</label>
                <input
                    type="number"
                    name="minDepositPercentage"
                    id="minDepositPercentage"
                    value={formData.minDepositPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full max-w-xs px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm"
                />
                <p className="mt-2 text-xs text-foreground-muted dark:text-dark-foreground-muted">
                    The minimum percentage of the total value required as a deposit to start a layaway plan.
                </p>
            </div>
             <div>
                <label htmlFor="maxDurationDays" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Maximum Layaway Duration (Days)</label>
                <input
                    type="number"
                    name="maxDurationDays"
                    id="maxDurationDays"
                    value={formData.maxDurationDays}
                    onChange={handleChange}
                    min="1"
                    className="mt-1 block w-full max-w-xs px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm"
                />
                 <p className="mt-2 text-xs text-foreground-muted dark:text-dark-foreground-muted">
                    The default and maximum period a customer has to complete their payments.
                </p>
            </div>
            <div className="flex justify-end pt-6 border-t border-border dark:border-dark-border mt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset">
                    Save Layaway Settings
                </button>
            </div>
        </form>
    );
};

export default LayawaySettings;
