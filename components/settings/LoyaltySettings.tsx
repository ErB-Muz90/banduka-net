import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from '../../types';

interface LoyaltySettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

const CustomToggle: React.FC<{ id: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ id, name, checked, onChange }) => (
    <label htmlFor={id} className="inline-flex relative items-center cursor-pointer">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} id={id} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 dark:bg-dark-muted rounded-full peer peer-checked:bg-primary dark:peer-checked:bg-dark-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
);


const LoyaltySettings: React.FC<LoyaltySettingsProps> = ({ settings, onUpdateSettings }) => {
    const [formData, setFormData] = useState(settings.loyalty);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : parseFloat(value) || 0
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ loyalty: formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-clay-light dark:shadow-clay-dark flex justify-between items-center">
                <label htmlFor="loyalty-toggle" className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable Loyalty Program</label>
                <CustomToggle id="loyalty-toggle" name="enabled" checked={formData.enabled} onChange={handleChange} />
            </div>
            
            <AnimatePresence>
                {formData.enabled && (
                     <div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 pt-6 border-t border-border dark:border-dark-border overflow-hidden"
                     >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Points Accumulation */}
                            <div>
                                <label htmlFor="pointsPerKsh" className="block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">Points Earning Rule</label>
                                <div className="mt-1 flex items-center space-x-2 text-foreground dark:text-dark-foreground">
                                    <span>1 point per every</span>
                                    <input type="number" name="pointsPerKsh" id="pointsPerKsh" value={formData.pointsPerKsh} onChange={handleChange} min="1" className="w-24 px-2 py-1 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none" />
                                    <span>Ksh spent</span>
                                </div>
                            </div>

                            {/* Points Redemption */}
                            <div>
                                <label htmlFor="redemptionRate" className="block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">Points Redemption Rule</label>
                                 <div className="mt-1 flex items-center space-x-2 text-foreground dark:text-dark-foreground">
                                    <span>1 point is worth</span>
                                    <input type="number" name="redemptionRate" id="redemptionRate" value={formData.redemptionRate} onChange={handleChange} min="0" step="0.01" className="w-24 px-2 py-1 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none" />
                                    <span>Ksh</span>
                                </div>
                            </div>

                            {/* Redemption Limits */}
                             <div>
                                <label htmlFor="minRedeemablePoints" className="block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">Minimum Points to Redeem</label>
                                <input
                                    type="number"
                                    name="minRedeemablePoints"
                                    id="minRedeemablePoints"
                                    value={formData.minRedeemablePoints}
                                    onChange={handleChange}
                                    min="0"
                                    className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none"
                                />
                                 <p className="mt-1 text-xs text-foreground-muted dark:text-dark-foreground-muted">Customer must have at least this many points to start redeeming.</p>
                            </div>

                            <div>
                                <label htmlFor="maxRedemptionPercentage" className="block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">Max Redemption per Sale (%)</label>
                                <input
                                    type="number"
                                    name="maxRedemptionPercentage"
                                    id="maxRedemptionPercentage"
                                    value={formData.maxRedemptionPercentage}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none"
                                />
                                 <p className="mt-1 text-xs text-foreground-muted dark:text-dark-foreground-muted">Maximum percentage of a sale's total that can be paid with points.</p>
                            </div>

                        </div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex justify-end pt-6">
                 <button type="submit" whileTap={{ scale: 0.98 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset">
                    Save Loyalty Settings
                </button>
            </div>
        </form>
    );
};

export default LoyaltySettings;
