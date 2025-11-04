import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface ForgotPasswordViewProps {
    onFindUser: (email: string) => Promise<User | null>;
    onResetPassword: (password: string, user: User) => void;
    onBackToLogin: () => void;
}

const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
        {children}
    </div>
);


const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onFindUser, onResetPassword, onBackToLogin }) => {
    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [otp, setOtp] = useState('');
    const [mockOtp, setMockOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const user = await onFindUser(email);
        setIsLoading(false);
        if (user) {
            setUserToReset(user);
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setMockOtp(generatedOtp);
            alert(`DEMO: Your recovery code is ${generatedOtp}`);
            setStep('otp');
        } else {
            setError('No user found with that email address.');
        }
    };

    const handleOtpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (otp === mockOtp) {
            setStep('reset');
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };
    
    const handleResetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Passcode must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passcodes do not match.');
            return;
        }
        if (userToReset) {
            onResetPassword(password, userToReset);
        }
    };

    const inputClasses = "mt-1 block w-full px-4 py-3 rounded-lg bg-background/50 dark:bg-dark-background/50 border border-border dark:border-dark-border";
    const buttonClasses = "w-full flex justify-center py-3 px-4 rounded-lg text-base font-bold text-primary-content bg-primary hover:bg-primary-focus disabled:bg-slate-400 dark:disabled:bg-slate-600";

    const renderStepContent = () => {
        switch(step) {
            case 'email':
                return (
                    <Step key="email">
                        <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Reset Passcode</h1>
                        <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2">Enter your email to receive a recovery code.</p>
                        <form onSubmit={handleEmailSubmit} className="mt-8 space-y-6">
                            <div>
                                <label htmlFor="email-forgot" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Email Address</label>
                                <input id="email-forgot" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
                            </div>
                            <button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }} className={buttonClasses}>
                                {isLoading ? 'Searching...' : 'Send Code'}
                            </button>
                        </form>
                    </Step>
                );
            case 'otp':
                 return (
                    <Step key="otp">
                        <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Enter Code</h1>
                        <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2">A 6-digit recovery code has been sent to <span className="font-semibold text-foreground dark:text-dark-foreground">{email}</span>.</p>
                        <form onSubmit={handleOtpSubmit} className="mt-8 space-y-6">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-foreground dark:text-dark-foreground">One-Time Password</label>
                                <input id="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className={`${inputClasses} tracking-widest text-center text-lg`} />
                            </div>
                            <button type="submit" whileTap={{ scale: 0.98 }} className={buttonClasses}>Verify Code</button>
                        </form>
                    </Step>
                );
            case 'reset':
                 return (
                    <Step key="reset">
                        <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Create New Passcode</h1>
                        <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2">Please enter a new passcode for your account.</p>
                        <form onSubmit={handleResetSubmit} className="mt-8 space-y-4">
                            <div>
                                <label htmlFor="password-reset"className="block text-sm font-medium text-foreground dark:text-dark-foreground">New Passcode</label>
                                <input id="password-reset" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword-reset"className="block text-sm font-medium text-foreground dark:text-dark-foreground">Confirm New Passcode</label>
                                <input id="confirmPassword-reset" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses}/>
                            </div>
                            <button type="submit" whileTap={{ scale: 0.98 }} className={buttonClasses}>Set New Passcode</button>
                        </form>
                    </Step>
                );
            default: return null;
        }
    }

    return (
        <div className="h-screen w-screen auth-background flex items-center justify-center p-4">
            <div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm bg-card/60 dark:bg-dark-card/60 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-dark-border/50"
            >
                <div className="text-center">
                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>
                    {error && <p className="text-center text-sm text-danger mt-4">{error}</p>}
                </div>
                <div className="mt-6 text-center">
                    <button onClick={onBackToLogin} className="text-sm font-medium text-primary hover:text-primary-focus">
                        &larr; Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordView;