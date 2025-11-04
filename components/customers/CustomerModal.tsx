import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Customer } from '../../types';

interface CustomerModalProps {
    onClose: () => void;
    onSave: (customer: Omit<Customer, 'id' | 'dateAdded' | 'loyaltyPoints'> | Customer) => void;
    customer?: Customer;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ onClose, onSave, customer }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: ''
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                address: customer.address,
                city: customer.city,
            });
        }
    }, [customer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customer) {
            onSave({ ...customer, ...formData });
        } else {
            onSave(formData);
        }
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
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-8"
            >
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                    <button onClick={onClose} className="text-foreground-muted dark:text-dark-foreground-muted hover:text-foreground dark:hover:text-dark-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Full Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Phone Number</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Email Address</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Address</label>
                        <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="city" className="block text-sm font-medium text-foreground dark:text-dark-foreground">City</label>
                        <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    </div>
                     <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border transition-colors">Cancel</button>
                        <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-md">Save Customer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;
