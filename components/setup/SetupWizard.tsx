
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, BusinessType, ToastData } from '../../types';
import { BUSINESS_TYPES_CONFIG } from '../../constants';
import BusinessInfoSettings from '../settings/BusinessInfoSettings';

interface SetupWizardProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    showToast: (message: string, type: ToastData['type']) => void;
    onSetupComplete: () => void;
}

const BusinessTypeCard: React.FC<{
    type: BusinessType;
    onSelect: (type: BusinessType) => void;
}> = ({ type, onSelect }) => {
    const config = BUSINESS_TYPES_CONFIG[type];
    return (
        <div
            onClick={() => onSelect(type)}
            className="p-6 bg-card dark:bg-dark-card rounded-xl cursor-pointer shadow-clay-light dark:shadow-clay-dark border border-border dark:border-dark-border hover:border-primary dark:hover:border-dark-primary transition-all"
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-center space-x-4">
                <div className="bg-primary-soft dark:bg-dark-primary-soft text-primary dark:text-dark-primary p-3 rounded-lg">
                    {config.icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground dark:text-white">{config.name}</h3>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">{config.description}</p>
                </div>
            </div>
        </div>
    );
};

const SetupWizard: React.FC<SetupWizardProps> = ({ settings, onUpdateSettings, onSetupComplete, showToast }) => {
    const [step, setStep] = useState(1);

    const handleSelectBusinessType = (type: BusinessType) => {
        onUpdateSettings({ businessType: type });
        setStep(2);
    };

    const handleBusinessInfoNext = () => {
        setStep(3);
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
    };
    
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="p-8">
                        <h1 className="text-3xl font-bold text-foreground dark:text-white text-center">Welcome to Banduka POS™</h1>
                        <p className="text-foreground-muted dark:text-dark-foreground-muted text-center mt-2 mb-8">Let's get your business set up. First, tell us what kind of business you run.</p>
                        <div className="space-y-4">
                            {(Object.keys(BUSINESS_TYPES_CONFIG) as BusinessType[]).map(type => (
                                <BusinessTypeCard key={type} type={type} onSelect={handleSelectBusinessType} />
                            ))}
                        </div>
                    </div>
                );
            case 2:
                 return (
                    <div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="p-8">
                        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-1">Tell us about your business</h2>
                        <p className="text-foreground-muted dark:text-dark-foreground-muted mb-6">This information will appear on your receipts and official documents.</p>
                        <BusinessInfoSettings 
                            settings={settings} 
                            onUpdateSettings={onUpdateSettings} 
                            showToast={showToast}
                            isSetupWizard={true}
                            onWizardNext={handleBusinessInfoNext}
                        />
                    </div>
                );
            case 3:
                return (
                    <div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="p-8 text-center">
                         <div className="mx-auto bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground dark:text-white">All Set!</h1>
                        <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2 mb-8">Banduka POS™ is now configured for your <span className="font-semibold text-primary dark:text-dark-primary">{settings.businessType}</span> business. You can change these settings anytime.</p>
                        <button 
                            onClick={onSetupComplete} 
                            whileTap={{ scale: 0.95 }} 
                            className="bg-primary text-primary-content font-bold px-8 py-3 rounded-lg hover:bg-primary-focus transition-colors shadow-lg text-lg"
                        >
                            Finish & Go to Dashboard
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-screen w-screen auth-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-card dark:bg-dark-card rounded-2xl shadow-clay-dark overflow-hidden border border-dark-border/20">
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SetupWizard;
