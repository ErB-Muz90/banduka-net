
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from '../../types';

interface EmailSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

const InputField: React.FC<{ label: string, name: string, value?: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string }> = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-foreground dark:text-dark-foreground">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted"
        />
    </div>
);

const EmailSettings: React.FC<EmailSettingsProps> = ({ settings, onUpdateSettings }) => {
    const [formData, setFormData] = useState(settings.communication.email);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'port' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ communication: { ...settings.communication, email: formData } });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-clay-light dark:shadow-clay-dark">
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground mb-4">Email Configuration</h3>
                <div>
                    <label htmlFor="mailer" className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">Email Service</label>
                    <select name="mailer" id="mailer" value={formData.mailer} onChange={handleChange} className="w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground">
                        <option value="smtp">SMTP</option>
                        <option value="sendgrid">SendGrid</option>
                        <option value="mailgun">Mailgun</option>
                    </select>
                </div>

                <div className="pt-4 mt-4 border-t border-border dark:border-dark-border space-y-4">
                    <InputField label="From Address" name="fromAddress" value={formData.fromAddress} onChange={handleChange} placeholder="e.g., no-reply@yourshop.com" />
                    <InputField label="From Name" name="fromName" value={formData.fromName} onChange={handleChange} placeholder="e.g., Your Shop Name" />
                    
                    {formData.mailer === 'smtp' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border dark:border-dark-border">
                            <InputField label="SMTP Host" name="host" value={formData.host} onChange={handleChange} />
                            <InputField label="SMTP Port" name="port" value={String(formData.port || '')} onChange={handleChange} type="number" />
                            <InputField label="SMTP Username" name="username" value={formData.username} onChange={handleChange} />
                            <InputField label="SMTP Password" name="password" value={formData.password} onChange={handleChange} type="password" />
                            <div>
                                <label htmlFor="encryption" className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">Encryption</label>
                                <select name="encryption" id="encryption" value={formData.encryption} onChange={handleChange} className="w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground">
                                    <option value="none">None</option>
                                    <option value="tls">TLS</option>
                                    <option value="ssl">SSL</option>
                                </select>
                            </div>
                        </div>
                    )}
                    {(formData.mailer === 'sendgrid' || formData.mailer === 'mailgun') && (
                        <div className="pt-4 border-t border-border dark:border-dark-border">
                            <InputField label="API Key" name="password" value={formData.password} onChange={handleChange} type="password" placeholder={`Enter your ${formData.mailer} API Key`} />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset">
                    Save Email Settings
                </button>
            </div>
        </form>
    );
};

export default EmailSettings;
