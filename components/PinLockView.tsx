

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface PinLockViewProps {
    currentUser: User;
    onUnlock: () => void;
    onForceLogout: () => void;
}

const PinLockView: React.FC<PinLockViewProps> = ({ currentUser, onUnlock, onForceLogout }) => {
    const [enteredPin, setEnteredPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(0);

    useEffect(() => {
        if (enteredPin.length === 4) {
            checkPin();
        }
    }, [enteredPin]);

    const checkPin = () => {
        if (enteredPin === currentUser.pin) {
            onUnlock();
        } else {
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
                    className={`w-4 h-4 rounded-full border-2 ${i < enteredPin.length ? 'bg-green-400 border-green-400' : 'bg-transparent border-slate-400'}`}
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
                        className="p-4 bg-white/10 backdrop-blur-sm text-white rounded-full text-2xl font-bold enabled:hover:bg-white/20 disabled:opacity-0 transition-colors"
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
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
        >
            <div
                className="w-full max-w-sm text-center"
            >
                <div className="w-20 h-20 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-3xl mx-auto mb-4 border-4 border-white/20">
                     <span>{currentUser.name.charAt(0)}</span>
                </div>

                <h1 className="text-2xl font-bold text-white">Welcome Back, {currentUser.name}</h1>
                <p className="text-slate-300 mt-2">Enter your 4-digit PIN to unlock.</p>
                
                <div className="my-8">
                    <PinDots />
                </div>
                
                 <AnimatePresence>
                    {error && (
                         <p className="text-red-400 font-semibold mb-4 h-5">{error}</p>
                    )}
                     {!error && <div className="h-5 mb-4"></div>}
                </AnimatePresence>
                
                <div className="max-w-xs mx-auto">
                    <Keypad />
                </div>
                
                <div className="mt-8">
                    <button onClick={onForceLogout} className="text-sm font-medium text-primary hover:text-dark-primary-focus">
                        Not you? Logout
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PinLockView;