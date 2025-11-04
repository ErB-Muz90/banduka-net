import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ToastData } from '../../types';

interface WhatsAppSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    showToast: (message: string, type: ToastData['type']) => void;
}

const InputField: React.FC<{ label: string, name: string, value?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string }> = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => (
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

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ settings, onUpdateSettings, showToast }) => {
    const [formData, setFormData] = useState(settings.communication.whatsapp);
    const [testRecipient, setTestRecipient] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ 
            communication: {
                ...settings.communication,
                whatsapp: formData
            }
        });
    };

    const handleSendTest = () => {
        if (!testRecipient.trim() || !/^\+?[0-9]{10,14}$/.test(testRecipient)) {
            showToast('Please enter a valid phone number to send a test to.', 'error');
            return;
        }
        console.log("Simulating sending test WhatsApp to:", testRecipient, "with settings:", formData);
        showToast(`Test WhatsApp message has been sent to ${testRecipient}.`, 'success');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-clay-light dark:shadow-clay-dark">
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground mb-4">WhatsApp Provider Configuration</h3>
                <div>
                    <label htmlFor="provider" className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">Provider</label>
                    <select
                        name="provider"
                        id="provider"
                        value={formData.provider}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground"
                    >
                        <option value="none">None (Disabled)</option>
                        <option value="twilio">Twilio API for WhatsApp</option>
                        <option value="meta">Meta Cloud API</option>
                    </select>
                </div>

                <AnimatePresence>
                    {formData.provider !== 'none' && (
                        <div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-6 border-t border-border dark:border-dark-border space-y-4">
                                <InputField 
                                    label="Sender Phone Number" 
                                    name="senderPhoneNumber"
                                    value={formData.senderPhoneNumber} 
                                    onChange={handleChange} 
                                    placeholder="Your WhatsApp Business number"
                                />
                                <InputField 
                                    label="API Key / Account SID" 
                                    name="apiKey"
                                    value={formData.apiKey} 
                                    onChange={handleChange} 
                                    placeholder="Enter your API Key or SID"
                                />
                                <InputField 
                                    label="API Secret / Auth Token" 
                                    name="apiSecret" 
                                    type="password"
                                    value={formData.apiSecret} 
                                    onChange={handleChange} 
                                    placeholder="Enter your API Secret or Auth Token"
                                />
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-clay-light dark:shadow-clay-dark">
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground mb-2">Send a Test Message</h3>
                <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted mb-4">Note: This will use your configured provider and may incur charges.</p>
                <div className="flex items-center space-x-2">
                    <input
                        type="tel"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        placeholder="e.g., 254712345678"
                        className="flex-grow block w-full px-3 py-2 bg-card dark:bg-dark-background border-0 rounded-xl shadow-clay-light-inset dark:shadow-clay-dark-inset focus:outline-none sm:text-sm text-foreground dark:text-dark-foreground disabled:opacity-50"
                        disabled={formData.provider === 'none'}
                    />
                     <button 
                        type="button" 
                        onClick={handleSendTest}
                        whileTap={{ scale: 0.95 }} 
                        className="bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground font-semibold px-4 py-2 rounded-xl transition-shadow shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset whitespace-nowrap disabled:bg-muted dark:disabled:bg-dark-muted disabled:shadow-none disabled:cursor-not-allowed"
                        disabled={formData.provider === 'none'}
                    >
                        Send Test
                    </button>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-xl transition-shadow shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset">
                    Save WhatsApp Settings
                </button>
            </div>
        </form>
    );
};

export default WhatsAppSettings;
