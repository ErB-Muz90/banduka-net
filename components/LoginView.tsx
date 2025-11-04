import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginViewProps {
    onLogin: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
    onForgotPassword: () => void;
    onNavigateToSignUp: () => void;
    onBack?: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};


const LoginView: React.FC<LoginViewProps> = ({ onLogin, onForgotPassword, onNavigateToSignUp, onBack }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onLogin(username, password, rememberMe);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 auth-background">
            <div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="sm:mx-auto sm:w-full sm:max-w-md"
            >
                <div className="bg-card/60 dark:bg-dark-card/60 backdrop-blur-2xl border border-white/20 dark:border-dark-border/50 py-12 px-4 shadow-2xl rounded-2xl sm:px-10">
                    <div variants={containerVariants} initial="hidden" animate="visible">
                        <div variants={itemVariants} className="mb-6 text-center">
                            <h2 className="text-center text-3xl font-extrabold text-foreground dark:text-dark-foreground">Admin Sign In</h2>
                            <p className="mt-2 text-center text-sm text-foreground-muted dark:text-dark-foreground-muted">
                               Access the system with administrator privileges.
                            </p>
                        </div>

                        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                            <div variants={itemVariants}>
                                <label htmlFor="username" className="block text-sm font-medium text-foreground dark:text-dark-foreground">
                                    Admin Email
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        required
                                        placeholder="Enter your admin email"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 rounded-lg bg-background/50 dark:bg-dark-background/50 border border-border dark:border-dark-border"
                                    />
                                </div>
                            </div>

                            <div variants={itemVariants}>
                                <label htmlFor="password"className="block text-sm font-medium text-foreground dark:text-dark-foreground">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 rounded-lg bg-background/50 dark:bg-dark-background/50 border border-border dark:border-dark-border"
                                    />
                                </div>
                            </div>
                            
                            <div variants={itemVariants} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground dark:text-dark-foreground">
                                        Remember me
                                    </label>
                                </div>
                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={onForgotPassword}
                                        className="font-medium text-primary hover:text-primary-focus"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>

                            <div variants={itemVariants}>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex justify-center py-3 px-4 rounded-lg text-base font-bold text-primary-content bg-primary hover:bg-primary-focus transition-all shadow-md disabled:bg-slate-400 dark:disabled:bg-slate-600"
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </div>
                        </form>
                         {onBack && (
                            <div variants={itemVariants} className="mt-6 text-center">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="text-sm font-medium text-primary hover:text-primary-focus"
                                >
                                    &larr; Back to Staff Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;