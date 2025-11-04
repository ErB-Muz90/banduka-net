import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, BusinessType, ToastData } from '../../types';
import { BUSINESS_TYPES_CONFIG } from '../../constants';

interface WelcomeViewProps {
    onComplete: (setupData: {
        businessInfo: Partial<Settings['businessInfo']>;
        businessType: BusinessType;
        adminEmail: string;
        adminPass: string;
    }) => void;
}

const BusinessTypeCard: React.FC<{
    type: BusinessType;
    onSelect: () => void;
    isSelected: boolean;
}> = ({ type, onSelect, isSelected }) => {
    const config = BUSINESS_TYPES_CONFIG[type];
    return (
        <div
            onClick={onSelect}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
                isSelected 
                    ? 'bg-card shadow-inner border border-primary' 
                    : 'bg-muted/50 dark:bg-dark-muted/50 hover:bg-muted dark:hover:bg-dark-muted border border-transparent hover:border-border'
            }`}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-background dark:bg-dark-background text-foreground-muted'}`}>
                    {config.icon}
                </div>
                <div>
                    <h3 className="font-bold text-foreground dark:text-dark-foreground">{config.name}</h3>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">{config.description}</p>
                </div>
            </div>
        </div>
    );
};

const WelcomeView: React.FC<WelcomeViewProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [businessInfo, setBusinessInfo] = useState({ name: '', location: '', phone: '', logoUrl: '' });
    const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [error, setError] = useState('');
    
    const inputClasses = "w-full p-2 border rounded-md bg-background dark:bg-dark-background shadow-sm border-border dark:border-dark-border text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary";


    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBusinessInfo(prev => ({ ...prev, [name]: value }));
    };
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                 setBusinessInfo(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!businessInfo.name) { setError('Business Name is required.'); return; }
        if (!selectedType) { setError('Please select a business type.'); return; }
        if (!adminEmail || !adminPass) { setError('Admin email and password are required.'); return; }
        if (adminPass.length < 6) { setError('Password must be at least 6 characters long.'); return; }

        onComplete({
            businessInfo,
            businessType: selectedType,
            adminEmail,
            adminPass
        });
        setStep(2);
    };
    
    const welcomeMessage = 'Welcome to Banduka POS™';

    return (
        <div className="min-h-screen auth-background flex flex-col items-center justify-center p-4">
            <div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-4xl"
            >
                <div className="bg-card/80 dark:bg-dark-card/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-dark-border/50">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <div form 
                                key="step1"
                                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                onSubmit={handleSubmit}
                                className="p-8 space-y-8"
                            >
                                <div className="text-center">
                                    <h1 className="text-3xl font-extrabold text-foreground dark:text-dark-foreground font-neural">{welcomeMessage}</h1>
                                    <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2">Let's get your business set up. Built by Eruns Technologies.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h2 className="font-bold text-lg text-foreground dark:text-dark-foreground">1. Your Business</h2>
                                        <input name="name" value={businessInfo.name} onChange={handleInfoChange} placeholder="Business Name" required className={inputClasses} />
                                        <input name="location" value={businessInfo.location} onChange={handleInfoChange} placeholder="Location (e.g., Mombasa)" className={inputClasses} />
                                        <input name="phone" value={businessInfo.phone} onChange={handleInfoChange} placeholder="Phone Number" className={inputClasses} />
                                         <h2 className="font-bold text-lg text-foreground dark:text-dark-foreground pt-4">2. Administrator Account</h2>
                                        <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Admin Email" required className={inputClasses} />
                                        <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Admin Password (min. 6 chars)" required className={inputClasses} />
                                    </div>

                                    <div className="space-y-4">
                                         <h2 className="font-bold text-lg text-foreground dark:text-dark-foreground">3. Business Type</h2>
                                        <div className="space-y-2">
                                            {(Object.keys(BUSINESS_TYPES_CONFIG) as BusinessType[]).map(type => (
                                                <BusinessTypeCard key={type} type={type} onSelect={() => setSelectedType(type)} isSelected={selectedType === type} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                

                                {error && <p className="text-center text-sm text-danger">{error}</p>}

                                <div>
                                    <button type="submit" whileTap={{ scale: 0.98 }} className="w-full py-3 px-4 rounded-xl text-primary-content bg-primary font-bold text-lg transition-all shadow-md">
                                        Complete Setup & Launch
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                             <div
                                key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="p-12 text-center"
                            >
                                <div className="mx-auto bg-success/10 text-success w-24 h-24 rounded-full flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">All Set!</h1>
                                <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2 mb-8">
                                    Banduka POS™ is now configured for your <span className="font-semibold text-primary">{businessInfo.name}</span>.
                                </p>
                                <p className="font-semibold">The application will now load...</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default WelcomeView;