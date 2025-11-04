import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';

interface SignUpViewProps {
    onSignUp: (userData: { businessName: string; email: string; password: string; }) => Promise<boolean>;
    onNavigateToLogin: () => void;
}

const EyeIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
);

const SignUpView: React.FC<SignUpViewProps> = ({ onSignUp, onNavigateToLogin }) => {
    const [businessName, setBusinessName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const getPasswordStrength = (password: string) => {
        let score = 0;
        if (!password) return 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        return score;
    };

    const passwordStrength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
        const score = getPasswordStrength(password);
        switch (score) {
            case 0:
            case 1:
                return { score, label: 'Weak', color: 'bg-danger' };
            case 2:
                return { score, label: 'Medium', color: 'bg-warning' };
            case 3:
                return { score, label: 'Strong', color: 'bg-green-400' };
            case 4:
                return { score, label: 'Very Strong', color: 'bg-primary' };
            default:
                return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
        }
    }, [password]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passcodes do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Passcode must be at least 6 characters long.');
            return;
        }
        
        await onSignUp({ 
            businessName, 
            email,
            password 
        });
    };

    return (
        <div className="min-h-screen auth-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="sm:mx-auto sm:w-full sm:max-w-md"
            >
                <div className="bg-card dark:bg-dark-card py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-border dark:border-dark-border">
                    <div className="mb-6 text-center">
                        <h2 className="text-center text-3xl font-extrabold text-foreground dark:text-dark-foreground">Banduka POS™</h2>
                        <p className="mt-2 text-center text-sm text-foreground-muted dark:text-dark-foreground-muted">
                           Create your Business Account
                        </p>
                    </div>

                    <div className="relative flex bg-muted dark:bg-dark-muted p-1 rounded-xl">
                         <div layoutId="auth-toggle" className="absolute h-full w-1/2 bg-card dark:bg-dark-card rounded-lg shadow-sm" style={{right: 0}} transition={{type: "spring", stiffness: 300, damping: 30}}/>
                        <button onClick={onNavigateToLogin} className="relative w-1/2 py-2 text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted rounded-lg z-10">
                            Sign In
                        </button>
                         <button className="relative w-1/2 py-2 text-sm font-semibold text-primary dark:text-dark-primary rounded-lg z-10">
                            Sign Up
                        </button>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="businessName" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Business Name</label>
                            <input id="businessName" type="text" placeholder="Your Company Name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-border dark:border-dark-border rounded-xl shadow-sm placeholder-foreground-muted dark:placeholder-dark-foreground-muted focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm bg-card dark:bg-dark-background"/>
                        </div>
                        
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Email</label>
                            <input id="email" type="email" placeholder="Enter your email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-border dark:border-dark-border rounded-xl shadow-sm placeholder-foreground-muted dark:placeholder-dark-foreground-muted focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm bg-card dark:bg-dark-background"/>
                        </div>
                        
                        <div>
                            <label htmlFor="password-signup"className="block text-sm font-medium text-foreground dark:text-dark-foreground">Passcode</label>
                            <div className="mt-1 relative">
                                <input id="password-signup" type={showPassword ? 'text' : 'password'} placeholder="Enter your passcode" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-border dark:border-dark-border rounded-xl shadow-sm placeholder-foreground-muted dark:placeholder-dark-foreground-muted focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm bg-card dark:bg-dark-background"/>
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground-muted hover:text-foreground">
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-foreground-muted dark:text-dark-foreground-muted">Passcode Strength</span>
                                <span className={`font-semibold transition-colors ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                            <div className="w-full bg-muted dark:bg-dark-muted rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${passwordStrength.color}`}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${passwordStrength.score * 25}%` }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword"className="block text-sm font-medium text-foreground dark:text-dark-foreground">Confirm Passcode</label>
                             <div className="mt-1 relative">
                                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your passcode" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-border dark:border-dark-border rounded-xl shadow-sm placeholder-foreground-muted dark:placeholder-dark-foreground-muted focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm bg-card dark:bg-dark-background"/>
                                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground-muted hover:text-foreground">
                                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        
                        {error && (
                            <p className="text-center text-sm text-danger">{error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex justify-center mt-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-primary-content bg-primary hover:bg-primary-focus transition-all shadow-clay-dark active:shadow-clay-dark-inset"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>
                    <div className="mt-6 text-center text-xs text-foreground-muted dark:text-dark-foreground-muted">
                        <p>Built by Eruns Technologies</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUpView;
