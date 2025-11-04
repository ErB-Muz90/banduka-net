
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types';

interface ResetPasscodeModalProps {
    user: User;
    onClose: () => void;
    onSave: (userId: string, newPasscode: string) => void;
}

const ResetPasscodeModal: React.FC<ResetPasscodeModalProps> = ({ user, onClose, onSave }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('New passcode must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passcodes do not match.');
            return;
        }
        
        onSave(user.id, password);
    };

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
            <div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md p-6"
            >
                <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">Reset Passcode for <span className="text-primary dark:text-dark-primary">{user.name}</span></h2>
                <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mt-2">Enter a new passcode for the user. They will be required to use this new passcode to log in.</p>
                
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="new-passcode" className="block text-sm font-medium text-foreground dark:text-dark-foreground">New Passcode</label>
                        <input
                            type="password"
                            id="new-passcode"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                            className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-passcode" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Confirm New Passcode</label>
                        <input
                            type="password"
                            id="confirm-passcode"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm"
                        />
                    </div>
                    {error && <p className="text-sm text-danger">{error}</p>}
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
                            Save New Passcode
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasscodeModal;
