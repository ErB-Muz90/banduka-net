import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface UserPinViewProps {
    user: User;
    onPinSubmit: (pin: string) => Promise<boolean>;
    onBack: () => void;
}

const UserPinView: React.FC<UserPinViewProps> = ({ user, onPinSubmit, onBack }) => {
    const [enteredPin, setEnteredPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(0);

    useEffect(() => {
        if (enteredPin.length === 4) {
            checkPin();
        }
    }, [enteredPin]);

    const checkPin = async () => {
        const success = await onPinSubmit(enteredPin);
        if (!success) {
            setError('Incorrect PIN. Please try again.');
            setShake(s => s + 1); // Trigger shake animation
            setTimeout(() => {
                setEnteredPin('');
                setError('');
            }, 1000);
        }
    };

    const handleKeyPress = (key: string) => {
        if (enteredPin.length < 4) {
            setEnteredPin(prev => prev + key);
        }
    };
    
    const handleBackspace = () => {
        setEnteredPin(prev => prev.slice(0, -1));
    };

    const PinDots = () => (
        <div className="flex justify-center space-x-4">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="w-4 h-4 rounded-full border-2"
                    animate={{ 
                        backgroundColor: i < enteredPin.length ? 'hsl(var(--success))' : 'transparent',
                        borderColor: i < enteredPin.length ? 'hsl(var(--success))' : 'hsl(var(--border))',
                        scale: i === enteredPin.length - 1 ? [1, 1.2, 1] : 1
                    }}
                    transition={{ duration: 0.2 }}
                />
            ))}
        </div>
    );

    const Keypad = () => {
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
        return (
            <div className="grid grid-cols-3 gap-4">
                {keys.map((key, i) => (
                    <button
                        key={i}
                        onClick={() => key === '⌫' ? handleBackspace() : key ? handleKeyPress(key) : null}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 bg-card/80 dark:bg-dark-card/80 text-foreground dark:text-dark-foreground rounded-2xl text-2xl font-bold enabled:hover:bg-muted dark:enabled:hover:bg-dark-muted disabled:opacity-0 transition-colors shadow-sm border border-border dark:border-dark-border"
                        disabled={!key}
                    >
                        {key}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 auth-background flex flex-col items-center justify-center z-50 p-4"
        >
            <div
                className="w-full max-w-sm text-center"
            >
                <div className="w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-5xl mx-auto mb-4 border-4 border-card dark:border-dark-card shadow-lg">
                     <span>{user.name.charAt(0)}</span>
                </div>

                <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Welcome, {user.name}</h1>
                <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2">Enter your 4-digit PIN to sign in.</p>
                
                <div className="my-8">
                    <PinDots />
                </div>
                
                 <AnimatePresence>
                    {error && (
                         <div p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-danger font-semibold mb-4 h-5">{error}</motion.p>
                    )}
                     {!error && <div className="h-5 mb-4"></div>}
                </AnimatePresence>
                
                <div className="max-w-xs mx-auto">
                    <Keypad />
                </div>
                
                <div className="mt-8">
                    <button onClick={onBack} className="text-sm font-medium text-primary hover:text-primary-focus">
                        &larr; Switch User
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UserPinView;