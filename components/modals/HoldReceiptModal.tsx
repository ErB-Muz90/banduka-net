import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface HoldReceiptModalProps {
    onConfirm: (name: string) => void;
    onClose: () => void;
}

const HoldReceiptModal: React.FC<HoldReceiptModalProps> = ({ onConfirm, onClose }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(name);
    };

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md p-6"
            >
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">Hold Current Sale</h3>
                <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mt-2">Enter an optional name to easily identify this sale later.</p>
                
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="hold-name" className="sr-only">Hold Name</label>
                        <input
                            type="text"
                            id="hold-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={`e.g., Held at ${new Date().toLocaleTimeString()}`}
                            className="block w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm"
                            autoFocus
                        />
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                        <button 
                            type="button"
                            onClick={onClose} 
                            whileTap={{ scale: 0.95 }} 
                            className="px-4 py-2 text-sm font-bold bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground rounded-md hover:bg-border dark:hover:bg-dark-border"
                        >
                            Cancel
                        </button>
                         <button 
                            type="submit"
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary-focus"
                        >
                            Hold Sale
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HoldReceiptModal;