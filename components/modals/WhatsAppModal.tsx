import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Customer, Supplier } from '../../types';
import { ICONS } from '../../constants';

interface WhatsAppModalProps {
    mode: 'receipt' | 'bulk' | 'po';
    recipient?: Customer | Supplier;
    customers?: Customer[];
    documentId?: string;
    onClose: () => void;
    onSend: (recipients: (Customer | Supplier)[], message: string) => void;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ mode, recipient, customers = [], documentId, onClose, onSend }) => {
    const [message, setMessage] = useState('');
    const [phone, setPhone] = useState((recipient && 'contact' in recipient) ? recipient.contact : (recipient as Customer)?.phone || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (mode === 'receipt' && documentId && recipient) {
            const customerName = recipient.name === 'Walk-in Customer' ? 'Customer' : recipient.name;
            setMessage(`Dear ${customerName},\n\nThank you for your business. Here is your receipt ID: ${documentId}.\n\nWe appreciate your patronage.`);
        } else if (mode === 'po' && documentId && recipient) {
            setMessage(`Dear ${recipient.name},\n\nPlease find our Purchase Order #${documentId} attached to this message. We look forward to your confirmation.\n\nThank you.`);
        }
    }, [mode, documentId, recipient]);
    
    const validBulkRecipients = useMemo(() => {
        return customers.filter(c => c.id !== 'cust001' && c.phone && c.phone !== 'N/A' && /^(0[17]|254[17])\d{8}$/.test(c.phone));
    }, [customers]);

    const handleSend = () => {
        setError('');
        if (mode === 'receipt' && recipient) {
            if (!/^(0[17]|254[17])\d{8}$/.test(phone)) {
                setError('Please enter a valid Kenyan phone number (e.g., 0712345678).');
                return;
            }
            const finalRecipient: Customer = { ...(recipient as Customer), phone };
            onSend([finalRecipient], message);
        } else if (mode === 'po' && recipient) {
             if (!/^(0[17]|254[17])\d{8}$/.test(phone)) {
                setError('Please enter a valid Kenyan phone number (e.g., 0712345678).');
                return;
            }
            const finalRecipient: Supplier = { ...(recipient as Supplier), contact: phone };
            onSend([finalRecipient], message);
        }
        else if (mode === 'bulk') {
             if (!message.trim()) {
                setError('Message cannot be empty.');
                return;
            }
            if(validBulkRecipients.length === 0) {
                 setError('No customers with valid phone numbers to send to.');
                return;
            }
            onSend(validBulkRecipients, message);
        }
    };
    
    const title = mode === 'receipt' ? 'Send WhatsApp Receipt' : mode === 'po' ? 'Send PO via WhatsApp' : 'Send Bulk WhatsApp';
    
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
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-8"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">{title}</h2>
                    <button onClick={onClose} className="text-foreground-muted dark:text-dark-foreground-muted hover:text-foreground dark:hover:text-dark-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                 <div className="space-y-4">
                    {mode === 'receipt' || mode === 'po' ? (
                        <>
                            <div className="bg-muted dark:bg-dark-muted p-4 rounded-lg">
                                <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Sending to: <span className="font-bold text-foreground dark:text-dark-foreground">{recipient?.name}</span></p>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Recipient Phone Number</label>
                                <input type="tel" name="phone" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required autoFocus className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-lg" />
                            </div>
                        </>
                    ) : (
                         <div className="bg-muted dark:bg-dark-muted p-4 rounded-lg text-center">
                            <p className="font-bold text-foreground dark:text-dark-foreground">This message will be sent to <span className="text-primary dark:text-dark-primary">{validBulkRecipients.length}</span> customers.</p>
                             <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">Only customers with valid phone numbers (excluding Walk-in) will be targeted.</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Message</label>
                        <textarea
                            id="message"
                            name="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={mode === 'bulk' ? 6 : 4}
                            placeholder={mode === 'bulk' ? 'Type your promotional message here...' : ''}
                            className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm"
                        />
                    </div>
                     {error && <p className="text-sm text-danger">{error}</p>}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button
                        onClick={handleSend}
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#25D366] text-white font-bold px-6 py-2 rounded-lg hover:bg-[#1EAE53] transition-colors shadow-md flex items-center"
                    >
                        <div className="w-5 h-5 mr-2">{ICONS.whatsapp}</div>
                        Send Message
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppModal;