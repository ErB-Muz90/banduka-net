import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    isDestructive?: boolean;
    requiresConfirmationText?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    title,
    message,
    onConfirm,
    onClose,
    confirmText = "Confirm",
    isDestructive = false,
    requiresConfirmationText = false
}) => {
    const [inputValue, setInputValue] = useState('');
    const isConfirmed = !requiresConfirmationText || inputValue === confirmText;

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md p-6 border border-border dark:border-dark-border"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground">{title}</h3>
                <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mt-2 whitespace-pre-line">{message}</p>
                
                {requiresConfirmationText && (
                    <div className="mt-4">
                        <label htmlFor="confirm-input" className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                            To confirm, type "<span className="font-bold">{confirmText}</span>" in the box below.
                        </label>
                        <input
                            id="confirm-input"
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-lg shadow-sm"
                            autoFocus
                        />
                    </div>
                )}
                
                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        whileTap={{ scale: 0.95 }} 
                        className="px-4 py-2 text-sm font-bold bg-muted text-foreground hover:bg-border dark:bg-dark-muted dark:text-dark-foreground dark:hover:bg-dark-border transition-colors rounded-lg"
                    >
                        Cancel
                    </button>
                     <button 
                        onClick={onConfirm}
                        disabled={!isConfirmed}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed ${
                            isDestructive 
                            ? 'bg-danger text-white hover:bg-red-700' 
                            : 'bg-primary text-primary-content hover:bg-primary-focus'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;