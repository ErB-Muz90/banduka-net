
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Role } from '../../types';

interface UserModalProps {
    onClose: () => void;
    onSave: (user: Omit<User, 'id'> | User) => void;
    user?: User;
}

const UserModal: React.FC<UserModalProps> = ({ onClose, onSave, user }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        role: 'Cashier' as Role,
        pin: '',
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const isEditMode = Boolean(user);
    const isRootAdmin = isEditMode && !!user?.email; // The signup account is the only one with an email

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                username: user.username,
                role: user.role,
                pin: user.pin || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'pin' && value.length > 4) return;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passcodes do not match.');
            return;
        }

        if (!isEditMode && !password) {
            setError('Passcode is required for new users.');
            return;
        }
        
        if (password && password.length < 6) {
            setError('Passcode must be at least 6 characters long.');
            return;
        }
        
        if(formData.pin && formData.pin.length !== 4) {
            setError('PIN must be exactly 4 digits.');
            return;
        }

        if(!formData.username.trim()) {
            setError('Username is required.');
            return;
        }
        
        const userData: Omit<User, 'id' | 'email'> & { id?: string } = { 
            ...formData, 
        };

        if(password) {
            (userData as User).password = password;
        }

        if (isEditMode && user) {
            onSave({ ...user, ...userData });
        } else {
            onSave(userData);
        }
    };
    
    const labelClasses = "block text-sm font-medium text-foreground dark:text-dark-foreground-muted";
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm disabled:bg-muted dark:disabled:bg-dark-muted";

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
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-8 border border-border dark:border-dark-border"
            >
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">{isEditMode ? 'Edit Staff Member' : 'Add New Staff'}</h2>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground dark:text-dark-foreground-muted dark:hover:text-dark-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                 {isRootAdmin && (
                    <div className="p-4 mb-4 bg-primary-soft border border-primary/20 text-primary rounded-lg text-sm dark:bg-dark-primary-soft dark:border-dark-primary/30 dark:text-dark-primary">
                        The primary business account holder's details cannot be modified from this screen. For changes, please contact support.
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="name" className={labelClasses}>Full Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required autoFocus disabled={isRootAdmin} className={inputClasses} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="username" className={labelClasses}>Username</label>
                            <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required disabled={isRootAdmin} className={inputClasses} />
                        </div>
                         <div>
                            <label htmlFor="role" className={labelClasses}>Role</label>
                             <select name="role" id="role" value={formData.role} onChange={handleChange} disabled={isRootAdmin} className={inputClasses}>
                                <option>Cashier</option>
                                <option>Supervisor</option>
                                <option>Accountant</option>
                                <option>Admin</option>
                             </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="pin" className={labelClasses}>4-Digit PIN Code (for screen lock)</label>
                            <input type="text" inputMode="numeric" pattern="\d{4}" name="pin" id="pin" value={formData.pin} onChange={handleChange} disabled={isRootAdmin} className={inputClasses} maxLength={4}/>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="password" className={labelClasses}>Passcode</label>
                            <input id="password" type="password" required={!isEditMode} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isRootAdmin} className={inputClasses} placeholder={isEditMode ? "Leave blank to keep same" : ""}/>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className={labelClasses}>Confirm Passcode</label>
                            <input id="confirmPassword" type="password" required={!isEditMode || password.length > 0} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isRootAdmin} className={inputClasses}/>
                        </div>
                    </div>

                    {error && <p className="text-sm text-danger text-center">{error}</p>}

                     <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset">Cancel</button>
                        <button type="submit" disabled={isRootAdmin} whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:shadow-none">Save Staff Member</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
