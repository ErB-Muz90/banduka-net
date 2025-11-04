


import React, { useState } from 'react';
// FIX: Added missing import for `AnimatePresence` from `framer-motion`.
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ToastData } from '../../types';

interface PaymentMethodsSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    showToast: (message: string, type: ToastData['type']) => void;
}

const InputField: React.FC<{ label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string }> = ({ label, name, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-foreground dark:text-dark-foreground-muted">{label}</label>
        <input
            type="text"
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
    </div>
);

const CustomToggle: React.FC<{ id: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ id, name, checked, onChange }) => (
    <label htmlFor={id} className="inline-flex relative items-center cursor-pointer">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} id={id} className="sr-only peer" />
        <div className="w-11 h-6 bg-muted dark:bg-dark-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
);


const PaymentMethodsSettings: React.FC<PaymentMethodsSettingsProps> = ({ settings, onUpdateSettings, showToast }) => {
    const [formData, setFormData] = useState({
        enabled: settings.paymentMethods?.enabled ?? false,
        displayOnDocuments: settings.paymentMethods?.displayOnDocuments ?? [],
        bank: settings.paymentMethods?.bank ?? [],
        mpesaPaybill: settings.paymentMethods?.mpesaPaybill ?? { paybillNumber: '', accountNumber: '' },
        mpesaTill: settings.paymentMethods?.mpesaTill ?? { tillNumber: '' },
    });

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, enabled: e.target.checked }));
    };

    const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const docType = value as 'Invoice' | 'Quotation' | 'Proforma-Invoice' | 'Receipt';
        
        setFormData(prev => {
            const currentDocs = prev.displayOnDocuments;
            if (checked) {
                return { ...prev, displayOnDocuments: [...currentDocs, docType] };
            } else {
                return { ...prev, displayOnDocuments: currentDocs.filter(d => d !== docType) };
            }
        });
    };

    const handleBankChange = (id: string, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            bank: prev.bank.map(b => b.id === id ? { ...b, [field]: value } : b)
        }));
    };

    const handleAddBank = () => {
        setFormData(prev => ({
            ...prev,
            bank: [...prev.bank, { id: crypto.randomUUID(), bankName: '', accountName: '', accountNumber: '', branch: '' }]
        }));
    };

    const handleRemoveBank = (id: string) => {
        setFormData(prev => ({ ...prev, bank: prev.bank.filter(b => b.id !== id) }));
    };

    const handleMpesaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'mpesaPaybill' | 'mpesaTill') => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [type]: { ...prev[type], [name]: value }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ paymentMethods: formData });
        showToast('Payment methods saved successfully!', 'success');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-clay-light dark:shadow-clay-dark flex justify-between items-center">
                 <span className="text-sm font-medium text-foreground dark:text-dark-foreground">Display Payment Methods on Documents</span>
                <CustomToggle id="payment-methods-toggle" name="enabled" checked={formData.enabled} onChange={handleToggle} />
            </div>
            
            <AnimatePresence>
                {formData.enabled && (
                    <div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden"
                    >
                        <div className="p-4 bg-muted dark:bg-dark-muted rounded-xl">
                            <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-2">Display On:</label>
                            <div className="flex flex-wrap gap-4">
                                {(['Receipt', 'Quotation', 'Proforma-Invoice'] as const).map(doc => (
                                    <label key={doc} className="flex items-center">
                                        <input type="checkbox" value={doc} checked={formData.displayOnDocuments.includes(doc)} onChange={handleDisplayChange} className="focus:ring-primary h-4 w-4 text-primary border-border rounded" />
                                        <span className="ml-2 text-sm text-foreground dark:text-dark-foreground">{doc.replace('-', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* M-PESA */}
                        <div className="pt-4 border-t dark:border-dark-border">
                            <h4 className="font-semibold text-foreground dark:text-dark-foreground mb-2">M-Pesa Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border dark:border-dark-border rounded-lg space-y-2">
                                    <p className="font-medium text-foreground-muted dark:text-dark-foreground-muted">Paybill</p>
                                    <InputField label="Paybill Number" name="paybillNumber" value={formData.mpesaPaybill.paybillNumber} onChange={e => handleMpesaChange(e, 'mpesaPaybill')} />
                                    <InputField label="Account Number / Instructions" name="accountNumber" value={formData.mpesaPaybill.accountNumber} onChange={e => handleMpesaChange(e, 'mpesaPaybill')} placeholder="e.g. Your Name"/>
                                </div>
                                <div className="p-4 border dark:border-dark-border rounded-lg space-y-2">
                                    <p className="font-medium text-foreground-muted dark:text-dark-foreground-muted">Buy Goods (Till)</p>
                                    <InputField label="Till Number" name="tillNumber" value={formData.mpesaTill.tillNumber} onChange={e => handleMpesaChange(e, 'mpesaTill')} />
                                </div>
                            </div>
                        </div>

                        {/* BANK */}
                        <div className="pt-4 border-t dark:border-dark-border">
                             <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">Your Business Bank Accounts</h3>
                            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mb-4">Add and manage the bank accounts your business uses. These will be available when recording bank deposits.</p>
                            <div className="space-y-4">
                                {formData.bank.map((b, index) => (
                                    <div key={b.id} className="p-4 bg-muted dark:bg-dark-muted rounded-lg border dark:border-dark-border relative">
                                        <button type="button" onClick={() => handleRemoveBank(b.id)} className="absolute top-2 right-2 text-danger/50 hover:text-danger">&times;</button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputField label="Bank Name" name={`bankName-${index}`} value={b.bankName} onChange={e => handleBankChange(b.id, 'bankName', e.target.value)} />
                                            <InputField label="Account Name" name={`accountName-${index}`} value={b.accountName} onChange={e => handleBankChange(b.id, 'accountName', e.target.value)} />
                                            <InputField label="Account Number" name={`accountNumber-${index}`} value={b.accountNumber} onChange={e => handleBankChange(b.id, 'accountNumber', e.target.value)} />
                                            <InputField label="Branch" name={`branch-${index}`} value={b.branch} onChange={e => handleBankChange(b.id, 'branch', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <button type="button" onClick={handleAddBank} whileTap={{ scale: 0.95 }} className="mt-4 bg-card dark:bg-dark-card border border-border dark:border-dark-border text-foreground dark:text-dark-foreground font-semibold px-4 py-2 rounded-lg hover:bg-muted dark:hover:bg-dark-muted transition-colors text-sm">
                                Add Bank Account
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex justify-end pt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset">
                    Save Payment Settings
                </button>
            </div>
        </form>
    );
};

export default PaymentMethodsSettings;