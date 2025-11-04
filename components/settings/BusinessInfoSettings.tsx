
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, ToastData } from '../../types';

interface BusinessInfoSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    showToast: (message: string, type: ToastData['type']) => void;
    isSetupWizard?: boolean;
    onWizardNext?: () => void;
}

const BusinessInfoSettings: React.FC<BusinessInfoSettingsProps> = ({ settings, onUpdateSettings, showToast, isSetupWizard = false, onWizardNext }) => {
    const [formData, setFormData] = useState(settings.businessInfo);
    const [logoPreview, setLogoPreview] = useState<string | null>(settings.businessInfo.logoUrl);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
                showToast("Logo preview updated. Save to persist.", 'info');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ businessInfo: { ...formData, logoUrl: logoPreview || '' } });
        if(onWizardNext) {
            onWizardNext();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground dark:text-white">Company Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted" />
                    </div>
                     <div>
                        <label htmlFor="location" className="block text-sm font-medium text-foreground dark:text-white">Business Location</label>
                        <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-foreground dark:text-white">Business Phone</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground dark:text-white">Business Email</label>
                        <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted" />
                    </div>
                    <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-foreground dark:text-white">Branch Name</label>
                        <input type="text" name="branch" id="branch" value={formData.branch || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted" />
                    </div>
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-foreground dark:text-white">Business Logo</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border dark:border-dark-border border-dashed rounded-xl">
                        <div className="space-y-1 text-center">
                             {logoPreview ? (
                                <img src={logoPreview} alt="Logo preview" className="mx-auto h-24 w-24 object-contain rounded-md" />
                            ) : (
                                <svg className="mx-auto h-12 w-12 text-foreground-muted dark:text-dark-foreground-muted" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            <div className="flex text-sm text-foreground-muted dark:text-dark-foreground-muted">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-card dark:bg-dark-card rounded-md font-medium text-primary dark:text-dark-primary hover:text-primary-focus focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/*" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`flex justify-end pt-6 ${!isSetupWizard && 'border-t border-border dark:border-dark-border mt-6'}`}>
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-gradient-to-br from-primary to-primary-focus text-primary-content font-semibold px-6 py-2 rounded-xl transition-all transform hover:-translate-y-0.5 shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset">
                    {isSetupWizard ? 'Save & Continue' : 'Save Business Info'}
                </button>
            </div>
        </form>
    );
};

export default BusinessInfoSettings;
