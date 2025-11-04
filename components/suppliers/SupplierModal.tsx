
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Supplier } from '../types';

interface SupplierModalProps {
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<any>;
    supplier?: Supplier;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ onClose, onSave, supplier }) => {
    const [formData, setFormData] = useState({
        name: '',
        businessName: '',
        contact: '',
        email: '',
        creditTerms: 'Net 30',
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name,
                businessName: supplier.businessName || '',
                contact: supplier.contact,
                email: supplier.email,
                creditTerms: supplier.creditTerms,
            });
        }
    }, [supplier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (supplier) {
            await onSave({ ...supplier, ...formData });
        } else {
            await onSave(formData);
        }
    };
    
    const inputClasses = "mt-1 block w-full px-4 py-2 bg-white border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-slate-300";


    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-lg p-6"
                onClick={e => e.stopPropagation()}
            >
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                     <div>
                        <label htmlFor="businessName" className={labelClasses}>Business Name</label>
                        <input type="text" name="businessName" id="businessName" value={formData.businessName} onChange={handleChange} required autoFocus className={inputClasses} />
                    </div>
                     <div>
                        <label htmlFor="name" className={labelClasses}>Contact Person Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputClasses} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contact" className={labelClasses}>Contact Phone</label>
                            <input type="tel" name="contact" id="contact" value={formData.contact} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="email" className={labelClasses}>Contact Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClasses} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="creditTerms" className={labelClasses}>Credit Terms</label>
                        <select
                            name="creditTerms"
                            id="creditTerms"
                            value={formData.creditTerms}
                            onChange={handleChange}
                            className={inputClasses}
                        >
                            <option>On Delivery</option>
                            <option>Net 15</option>
                            <option>Net 30</option>
                            <option>Net 45</option>
                            <option>Net 60</option>
                        </select>
                    </div>
                     <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-5 py-2 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" whileTap={{ scale: 0.95 }} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-lg transition-colors">Save Supplier</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierModal;
