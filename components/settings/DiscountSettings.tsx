import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from '../../types';

interface DiscountSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

const CustomRadio: React.FC<{ name: string; value: string; label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ name, value, label, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-400 dark:border-dark-foreground-muted peer-checked:border-primary dark:peer-checked:border-dark-primary transition-colors">
            <div className="w-2.5 h-2.5 bg-primary dark:bg-dark-primary rounded-full scale-0 peer-checked:scale-100 transition-transform" />
        </div>
        <span className="text-sm font-medium text-foreground dark:text-dark-foreground">{label}</span>
    </label>
);

const CustomToggle: React.FC<{ id: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ id, name, checked, onChange }) => (
    <label htmlFor={id} className="inline-flex relative items-center cursor-pointer">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} id={id} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 dark:bg-dark-muted rounded-full peer peer-checked:bg-primary dark:peer-checked:bg-dark-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
);

const DiscountSettings: React.FC<DiscountSettingsProps> = ({ settings, onUpdateSettings }) => {
    const [formData, setFormData] = useState(settings.discount);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as 'percentage' | 'fixed' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ discount: formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-clay-light dark:shadow-clay-dark flex justify-between items-center">
                <label htmlFor="discount-toggle" className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable Discounts</label>
                <CustomToggle id="discount-toggle" name="enabled" checked={formData.enabled} onChange={handleChange} />
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
                             <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-3">Discount Type</label>
                                <div className="space-y-3">
                                    <CustomRadio name="type" value="percentage" label="Percentage (%)" checked={formData.type === 'percentage'} onChange={handleRadioChange} />
                                    <CustomRadio name="type" value="fixed" label="Fixed Amount (KES)" checked={formData.type === 'fixed'} onChange={handleRadioChange} />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="maxValue" className="block text-sm font-medium text-foreground dark:text-dark-foreground">
                                    Maximum Discount Value ({formData.type === 'percentage' ? '%' : 'KES'})
                                </label>
                                <input
                                    type="number"
                                    name="maxValue"
                                    id="maxValue"
                                    value={formData.maxValue}
                                    onChange={handleChange}
                                    min="0"
                                    className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted"
                                />
                                <p className="mt-2 text-xs text-foreground-muted dark:text-dark-foreground-muted">Set the maximum discount a cashier can apply.</p>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex justify-end pt-6">
                 <button type="submit" whileTap={{ scale: 0.98 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset">
                    Save Discount Settings
                </button>
            </div>
        </form>
    );
};

export default DiscountSettings;