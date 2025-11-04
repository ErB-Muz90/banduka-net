import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';

interface StaffPasscodeViewProps {
    user: User;
    onLogin: (username: string, password: string) => Promise<boolean>;
    onBack: () => void;
}

const StaffPasscodeView: React.FC<StaffPasscodeViewProps> = ({ user, onLogin, onBack }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await onLogin(user.username, password);
        if (!success) {
            setError('Invalid passcode. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 auth-background flex flex-col items-center justify-center z-50 p-4"
        >
            <div
                className="w-full max-w-sm text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                 <div className="w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-5xl mx-auto mb-4 border-4 border-card dark:border-dark-card shadow-lg">
                     <span>{user.name.charAt(0)}</span>
                </div>

                <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Welcome, {user.name}</h1>
                <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2">Enter your passcode to sign in.</p>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className="sr-only">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={user.username}
                            readOnly
                            className="appearance-none block w-full px-3 py-2 border border-border dark:border-dark-border rounded-md shadow-sm bg-muted dark:bg-dark-muted text-foreground-muted dark:text-dark-foreground-muted sm:text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="password"className="sr-only">
                            Passcode
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="Enter your passcode"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                            className="appearance-none block w-full px-4 py-3 rounded-lg bg-background/50 dark:bg-dark-background/50 border border-border dark:border-dark-border"
                        />
                    </div>

                    {error && <p className="text-sm text-danger">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-primary-content bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400 dark:disabled:bg-slate-600"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
                
                <div className="mt-8">
                    <button onClick={onBack} className="text-sm font-medium text-primary hover:text-primary-focus">
                        &larr; Switch User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffPasscodeView;