import React from 'react';
import { motion } from 'framer-motion';

interface ProgressModalProps {
    message: string;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ message }) => {
    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            style={{ zIndex: 9999 }} // Ensure it's on top of everything
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md p-6 text-center"
            >
                <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground mb-4">Processing...</h3>
                <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mb-6">{message}</p>
                <div className="w-full bg-muted dark:bg-dark-muted rounded-full h-4 overflow-hidden border border-border dark:border-dark-border">
                    <div
                        className="bg-primary h-4 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.5, ease: 'easeInOut' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProgressModal;
