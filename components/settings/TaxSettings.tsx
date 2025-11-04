import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from '../../types';

interface TaxSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

export const TaxSettings: React.FC<TaxSettingsProps> = ({ settings, onUpdateSettings }) => {
    const [taxFormData, setTaxFormData] = useState(settings.tax);
    const [kraPin, setKraPin] = useState(settings.businessInfo.kraPin);

    const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setTaxFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setTaxFormData(prev => ({ ...prev, [name]: name === 'vatRate' ? parseFloat(value) : value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ 
            tax: taxFormData,
            businessInfo: {
                ...settings.businessInfo,
                kraPin: kraPin,
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted dark:bg-dark-muted rounded-xl">
                <span className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable VAT Calculations</span>
                <label htmlFor="vat-toggle" className="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" name="vatEnabled" checked={taxFormData.vatEnabled} onChange={handleTaxChange} id="vat-toggle" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-primary dark:peer-focus:ring-dark-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>

            <AnimatePresence>
                {taxFormData.vatEnabled && (
                    <div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden"
                    >
                        <div>
                            <label htmlFor="vatRate" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Default VAT Rate (%)</label>
                            <input type="number" name="vatRate" id="vatRate" value={taxFormData.vatRate} onChange={handleTaxChange} className="mt-1 block w-full max-w-xs px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-xl shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Default Pricing Model</label>
                            <div className="mt-2 flex space-x-4">
                                <label className="flex items-center">
                                    <input type="radio" name="pricingType" value="inclusive" checked={taxFormData.pricingType === 'inclusive'} onChange={handleTaxChange} className="focus:ring-primary h-4 w-4 text-primary border-border"/> 
                                    <span className="ml-2 text-sm">VAT Inclusive (Prices include VAT)</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="pricingType" value="exclusive" checked={taxFormData.pricingType === 'exclusive'} onChange={handleTaxChange} className="focus:ring-primary h-4 w-4 text-primary border-border"/> 
                                    <span className="ml-2 text-sm">VAT Exclusive (VAT is added on top)</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-4 bg-muted dark:bg-dark-muted rounded-xl space-y-4">
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable eTIMS Compliance</span>
                                <label htmlFor="etims-toggle" className="inline-flex relative items-center cursor-pointer">
                                    <input type="checkbox" name="etimsEnabled" checked={taxFormData.etimsEnabled} onChange={handleTaxChange} id="etims-toggle" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-primary dark:peer-focus:ring-dark-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            {taxFormData.etimsEnabled && (
                                <div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                                     <div>
                                        <label htmlFor="kraPin" className="block text-sm font-medium text-foreground dark:text-dark-foreground">KRA PIN</label>
                                        <input type="text" name="kraPin" id="kraPin" value={kraPin} onChange={(e) => setKraPin(e.target.value)} className="mt-1 block w-full max-w-xs px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-xl shadow-sm" />
                                    </div>
                                    <div className="p-2 bg-warning/10 border border-warning/20 rounded-md text-xs text-warning">
                                        Note: eTIMS integration requires a backend service to communicate with the KRA API. This toggle is for UI demonstration purposes.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>
            
            <div className="flex justify-end pt-6 border-t border-border dark:border-dark-border mt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset">
                    Save Tax Settings
                </button>
            </div>
        </form>
    );
};