import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from '../../types';

interface ReceiptSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

const ReceiptSettings: React.FC<ReceiptSettingsProps> = ({ settings, onUpdateSettings }) => {
    const [formData, setFormData] = useState(settings.receipt);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ receipt: formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="footer" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Receipt Footer Text</label>
                <textarea name="footer" id="footer" value={formData.footer} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm"></textarea>
                <p className="mt-2 text-xs text-foreground-muted dark:text-dark-foreground-muted">This text will appear at the bottom of all receipts and invoices.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Number Prefixes</label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="invoicePrefix" className="block text-xs font-medium text-foreground-muted dark:text-dark-foreground-muted">Invoice Prefix</label>
                        <input type="text" name="invoicePrefix" id="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="quotePrefix" className="block text-xs font-medium text-foreground-muted dark:text-dark-foreground-muted">Quotation Prefix</label>
                        <input type="text" name="quotePrefix" id="quotePrefix" value={formData.quotePrefix} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="poNumberPrefix" className="block text-xs font-medium text-foreground-muted dark:text-dark-foreground-muted">Purchase Order Prefix</label>
                        <input type="text" name="poNumberPrefix" id="poNumberPrefix" value={formData.poNumberPrefix} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="layawayPrefix" className="block text-xs font-medium text-foreground-muted dark:text-dark-foreground-muted">Layaway Prefix</label>
                        <input type="text" name="layawayPrefix" id="layawayPrefix" value={formData.layawayPrefix} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="workOrderPrefix" className="block text-xs font-medium text-foreground-muted dark:text-dark-foreground-muted">Work Order Prefix</label>
                        <input type="text" name="workOrderPrefix" id="workOrderPrefix" value={formData.workOrderPrefix} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="salesOrderPrefix" className="block text-xs font-medium text-foreground-muted dark:text-dark-foreground-muted">Sales Order Prefix</label>
                        <input type="text" name="salesOrderPrefix" id="salesOrderPrefix" value={formData.salesOrderPrefix} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-border dark:border-dark-border mt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset">
                    Save Receipt Settings
                </button>
            </div>
        </form>
    );
};

export default ReceiptSettings;