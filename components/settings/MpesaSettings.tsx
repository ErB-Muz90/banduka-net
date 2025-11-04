import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ToastData } from '../../types';

interface MpesaSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    showToast: (message: string, type: ToastData['type']) => void;
}

const InputField: React.FC<{ label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string }> = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-foreground dark:text-dark-foreground">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 bg-background dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted"
        />
    </div>
);

const CustomToggle: React.FC<{ id: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ id, name, checked, onChange }) => (
    <label htmlFor={id} className="inline-flex relative items-center cursor-pointer">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} id={id} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 dark:bg-dark-muted rounded-full peer peer-checked:bg-primary dark:peer-checked:bg-dark-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
);

const CustomRadio: React.FC<{ name: string; value: string; label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ name, value, label, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-400 dark:border-dark-foreground-muted peer-checked:border-primary dark:peer-checked:border-dark-primary transition-colors">
            <div className="w-2.5 h-2.5 bg-primary dark:bg-dark-primary rounded-full scale-0 peer-checked:scale-100 transition-transform" />
        </div>
        <span className="text-sm font-medium text-foreground dark:text-dark-foreground">{label}</span>
    </label>
);


const MpesaSettings: React.FC<MpesaSettingsProps> = ({ settings, onUpdateSettings, showToast }) => {
    const [formData, setFormData] = useState(settings.communication.mpesa);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        if (name === 'environment') {
            setFormData(prev => ({ ...prev, [name]: value as 'sandbox' | 'production' }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ 
            communication: {
                ...settings.communication,
                mpesa: formData
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border border-warning/50 bg-warning/10 rounded-xl shadow-clay-light dark:shadow-clay-dark">
                <h4 className="font-semibold text-warning">Security Notice</h4>
                <p className="text-sm text-warning/80 mt-1">
                    This is a frontend-only application. Storing API credentials here is not secure and is for demonstration purposes only. In a production environment, these keys must be stored on a secure backend server.
                </p>
            </div>

            <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-clay-light dark:shadow-clay-dark flex justify-between items-center">
                <label htmlFor="mpesa-enabled-toggle" className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable M-Pesa Payments (STK Push)</label>
                <CustomToggle id="mpesa-enabled-toggle" name="enabled" checked={formData.enabled} onChange={handleChange} />
            </div>
            
            <AnimatePresence>
                {formData.enabled && (
                    <div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-clay-light dark:shadow-clay-dark space-y-4 overflow-hidden"
                    >
                        <div>
                            <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Environment</label>
                            <div className="mt-2 flex space-x-6">
                                <CustomRadio name="environment" value="sandbox" label="Sandbox (Testing)" checked={formData.environment === 'sandbox'} onChange={handleChange} />
                                <CustomRadio name="environment" value="production" label="Production (Live)" checked={formData.environment === 'production'} onChange={handleChange} />
                            </div>
                        </div>
                        <InputField label="Business Shortcode" name="shortcode" value={formData.shortcode} onChange={handleChange} />
                        <InputField label="Consumer Key" name="consumerKey" value={formData.consumerKey} onChange={handleChange} type="password" />
                        <InputField label="Consumer Secret" name="consumerSecret" value={formData.consumerSecret} onChange={handleChange} type="password" />
                        <InputField label="Passkey" name="passkey" value={formData.passkey} onChange={handleChange} type="password" />
                        <InputField label="Callback URL" name="callbackUrl" value={formData.callbackUrl} onChange={handleChange} placeholder="https://your-backend.com/mpesa/callback" />
                    </div>
                )}
            </AnimatePresence>

            <div className="flex justify-end pt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset">
                    Save M-Pesa Settings
                </button>
            </div>
        </form>
    );
};

export default MpesaSettings;
