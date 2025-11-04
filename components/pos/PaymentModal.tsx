import React, { useState, useMemo, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem, SaleData, Payment, Customer, Settings } from '../../types';
import { calculateCartTotals } from '../../utils/vatCalculator';

interface PaymentModalProps {
    cartItems: CartItem[];
    discount: { type: 'percentage' | 'fixed', value: number };
    onClose: () => void;
    onCompleteSale: (sale: SaleData, options?: { autoPrint?: boolean }) => void;
    customer: Customer;
    settings: Settings;
    depositApplied?: number;
}

type PaymentType = 'M-Pesa' | 'Cash' | 'Card' | 'Split';
type StkState = 'prompting' | 'sending' | 'waiting' | 'success' | 'failure';

const PaymentModal = ({ cartItems, discount, onClose, onCompleteSale, customer, settings, depositApplied = 0 }: PaymentModalProps) => {
    const [paymentType, setPaymentType] = useState<PaymentType>('Cash');
    const [cashReceived, setCashReceived] = useState<string>('');
    
    // M-Pesa STK Push State
    const [stkState, setStkState] = useState<StkState>('prompting');
    const [phoneNumber, setPhoneNumber] = useState(customer.phone !== 'N/A' ? customer.phone : '');
    const [transactionCode, setTransactionCode] = useState<string | null>(null);
    const [stkError, setStkError] = useState<string | null>(null);

    // Loyalty Points State
    const [pointsToRedeem, setPointsToRedeem] = useState<number | ''>('');
    const [autoPrint, setAutoPrint] = useState(true);

    // Cash Input Mode State
    const [cashInputMode, setCashInputMode] = useState<'keypad' | 'notes'>('keypad');

    const { total: totalBeforeDeposit } = useMemo(() => calculateCartTotals(cartItems, discount, settings.tax.vatRate / 100), [cartItems, discount, settings.tax.vatRate]);
    const balanceDue = totalBeforeDeposit - depositApplied;
    const totalCostBeforeDeposit = totalBeforeDeposit;
    
    const maxRedeemableValue = useMemo(() => {
        if (!settings.loyalty.enabled || !customer || customer.id === 'cust001') return 0;

        const maxFromPercentage = balanceDue * (settings.loyalty.maxRedemptionPercentage / 100);
        const maxFromPoints = customer.loyaltyPoints * settings.loyalty.redemptionRate;
        
        return Math.min(maxFromPercentage, maxFromPoints);
    }, [customer, balanceDue, settings.loyalty]);

    const pointsValue = useMemo(() => {
        if (!settings.loyalty.enabled || pointsToRedeem === '') return 0;
        const value = Number(pointsToRedeem) * settings.loyalty.redemptionRate;
        return Math.min(value, maxRedeemableValue);
    }, [pointsToRedeem, maxRedeemableValue, settings.loyalty]);
    
    const totalAfterPoints = balanceDue - pointsValue;

    const change = useMemo(() => {
        if (cashReceived === '') return 0;
        const paid = Number(cashReceived);
        if (isNaN(paid)) return 0;
        return Math.max(0, paid - totalAfterPoints);
    }, [cashReceived, totalAfterPoints]);

    const cashSuggestions = useMemo(() => {
        const total = totalAfterPoints;
        if (total <= 0) return [];
        
        const suggestions: number[] = [];
        const exactAmount = Math.ceil(total);
        suggestions.push(exactAmount);

        const denominations = [100, 200, 500, 1000, 2000, 5000];
        for (const denom of denominations) {
            if (denom > exactAmount) {
                suggestions.push(denom);
            }
        }

        if (exactAmount > 100) {
            const nextHundred = Math.ceil(exactAmount / 100) * 100;
            if(nextHundred > exactAmount) suggestions.push(nextHundred);
        }
         if (exactAmount > 1000) {
            const nextThousand = Math.ceil(exactAmount / 1000) * 1000;
            if(nextThousand > exactAmount) suggestions.push(nextThousand);
        }

        return [...new Set(suggestions)].sort((a,b) => a - b).slice(0, 4);
    }, [totalAfterPoints]);

    const handleComplete = () => {
        const { subtotal, totalDiscountAmount: discountAmount, lineItemsDiscountAmount, cartDiscountAmount, taxableAmount, tax } = calculateCartTotals(cartItems, discount, settings.tax.vatRate / 100);

        let payments: Payment[] = [];
        if (paymentType === 'Cash') {
            payments.push({ method: 'Cash', amount: Number(cashReceived) || totalAfterPoints });
        } else if (paymentType === 'M-Pesa') {
            payments.push({ 
                method: 'M-Pesa', 
                amount: totalAfterPoints,
                details: { transactionCode: transactionCode || 'N/A_MANUAL', phoneNumber }
            });
        } else if (paymentType === 'Card') {
            payments.push({ method: 'Card', amount: totalAfterPoints });
        }
        
        if (pointsValue > 0) {
            payments.push({ method: 'Points', amount: pointsValue });
        }

        const saleData: SaleData = {
            items: cartItems,
            subtotal,
            lineItemsDiscountAmount,
            cartDiscountAmount,
            cartDiscount: discount,
            discountAmount,
            taxableAmount,
            tax,
            total: totalAfterPoints, // The total for this transaction is the balance paid
            payments,
            change,
            customerId: customer.id,
            date: new Date(),
            pointsUsed: Number(pointsToRedeem) || 0,
            pointsValue: pointsValue || 0,
            depositApplied: depositApplied,
        };
        onCompleteSale(saleData, { autoPrint });
    };

    const handleStkPush = async () => {
        setStkState('sending');
        setStkError(null);
        
        // In a real app, this would be an API call to your backend
        // to initiate the STK Push via Daraja API.
        console.log('Initiating STK Push to', phoneNumber, 'for', totalAfterPoints);
        
        setTimeout(() => {
             // Simulate waiting for user to enter PIN
            setStkState('waiting');
            
            // Simulate a response from M-Pesa
            setTimeout(() => {
                 const isSuccess = Math.random() > 0.2; // 80% success rate for simulation
                 if(isSuccess) {
                    setStkState('success');
                    const mockCode = `R${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
                    setTransactionCode(mockCode);
                 } else {
                    setStkState('failure');
                    setStkError('The transaction was cancelled by the user.');
                 }
            }, 5000);
        }, 1000);
    };

    const paymentButtons: { type: PaymentType, name: string }[] = [
        { type: 'Cash', name: 'Cash' },
        { type: 'M-Pesa', name: 'M-Pesa' },
        { type: 'Card', name: 'Card' },
    ];

    const Keypad = ({ onKeyPress }: { onKeyPress: (key: string) => void }) => {
        const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'];
        return (
            <div className="grid grid-cols-3 gap-2">
                {keys.map(key => (
                    <button key={key} type="button" whileTap={{ scale: 0.95 }} onClick={() => onKeyPress(key)} className="bg-muted/50 dark:bg-dark-muted/50 text-foreground dark:text-dark-foreground font-bold py-4 rounded-xl text-xl hover:bg-border dark:hover:bg-dark-border transition-colors shadow-clay active:shadow-clay-inset">
                        {key}
                    </button>
                ))}
            </div>
        );
    };

    const handleKeypadPress = (key: string) => {
        if (key === '⌫') {
            setCashReceived(prev => prev.slice(0, -1));
        } else if (key === '.' && cashReceived.includes('.')) {
            return;
        } else {
            setCashReceived(prev => `${prev}${key}`);
        }
    };

    const Denominations = ({ onAdd }: { onAdd: (amount: number) => void }) => {
        const notes = [1000, 500, 200, 100, 50, 20, 10, 5];
        return (
            <div className="grid grid-cols-4 gap-2">
                {notes.map(note => (
                    <button key={note} type="button" whileTap={{ scale: 0.95 }} onClick={() => onAdd(note)} className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold py-3 rounded-xl text-sm hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors shadow-clay active:shadow-clay-inset">
                        Ksh {note}
                    </button>
                ))}
            </div>
        );
    };

    const handleAddDenomination = (amount: number) => {
        setCashReceived(prev => String((Number(prev) || 0) + amount));
    };
    
    const renderPaymentContent = () => {
        switch (paymentType) {
            case 'Cash':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2 text-center">
                             <label htmlFor="cashReceived" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Cash Received</label>
                            <input
                                id="cashReceived"
                                type="text"
                                inputMode="decimal"
                                value={cashReceived}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^$|^\d*\.?\d*$/.test(value)) {
                                        setCashReceived(value);
                                    }
                                }}
                                className="block w-full text-center text-4xl font-bold p-2 bg-transparent border-0 border-b-2 border-border dark:border-dark-border focus:outline-none focus:ring-0 focus:border-primary dark:focus:border-dark-primary transition-colors"
                                placeholder={totalAfterPoints.toFixed(2)}
                                autoFocus
                            />
                             <div className="flex flex-wrap gap-2 justify-center pt-2">
                                {cashSuggestions.map(amount => (
                                    <button key={amount} type="button" whileTap={{ scale: 0.95 }} onClick={() => setCashReceived(String(amount))} className="bg-muted/50 dark:bg-dark-muted/50 text-foreground dark:text-dark-foreground font-bold py-1 px-4 rounded-xl text-sm hover:bg-border dark:hover:bg-dark-border shadow-clay active:shadow-clay-inset">
                                        {amount}
                                    </button>
                                ))}
                            </div>
                            {change > 0 && <div className="text-center font-bold text-xl text-primary dark:text-dark-primary pt-2">Change Due: Ksh {change.toFixed(2)}</div>}
                        </div>
                        <div className="w-full max-w-xs mx-auto pt-2">
                            <div className="flex justify-center bg-background/50 dark:bg-dark-background/50 p-1 rounded-xl mb-2">
                                <button type="button" onClick={() => setCashInputMode('keypad')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors w-1/2 ${cashInputMode === 'keypad' ? 'bg-card dark:bg-dark-card shadow text-primary dark:text-dark-primary' : 'text-foreground/70 dark:text-dark-foreground/70'}`}>Keypad</button>
                                <button type="button" onClick={() => setCashInputMode('notes')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors w-1/2 ${cashInputMode === 'notes' ? 'bg-card dark:bg-dark-card shadow text-primary dark:text-dark-primary' : 'text-foreground/70 dark:text-dark-foreground/70'}`}>Notes</button>
                            </div>
                            <AnimatePresence mode="wait">
                                <div key={cashInputMode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                    {cashInputMode === 'keypad' ? <Keypad onKeyPress={handleKeypadPress} /> : <Denominations onAdd={handleAddDenomination} />}
                                </div>
                            </AnimatePresence>
                        </div>
                    </div>
                );
            case 'M-Pesa':
                 return (
                    <div className="space-y-4 text-center">
                        {stkState === 'prompting' && (
                            <>
                                <p className="text-sm text-foreground/70 dark:text-dark-foreground/70">Enter customer's phone number to trigger STK push.</p>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="block w-full text-center text-lg font-bold p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-xl shadow-sm"
                                    placeholder="0712345678"
                                />
                                <button whileTap={{scale:0.95}} onClick={handleStkPush} className="w-full bg-accent dark:bg-dark-accent text-white font-bold py-2 rounded-xl shadow-clay active:shadow-clay-inset">Send STK Push</button>
                            </>
                        )}
                         {(stkState === 'sending' || stkState === 'waiting') && (
                             <div className="flex flex-col items-center p-4 space-y-2">
                                 <div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-4 border-accent dark:border-dark-accent border-t-transparent rounded-full" />
                                 <p className="font-semibold">{stkState === 'sending' ? 'Sending request to phone...' : 'Waiting for customer to enter M-Pesa PIN...'}</p>
                             </div>
                         )}
                         {stkState === 'success' && (
                             <div className="p-4 bg-accent/10 text-accent dark:text-dark-accent rounded-xl space-y-1">
                                 <h4 className="font-bold">Payment Successful!</h4>
                                 <p className="text-sm">Ref: {transactionCode}</p>
                             </div>
                         )}
                         {stkState === 'failure' && (
                             <div className="p-4 bg-danger/10 text-danger rounded-xl space-y-1">
                                 <h4 className="font-bold">Payment Failed</h4>
                                 <p className="text-sm">{stkError}</p>
                                 <button onClick={() => setStkState('prompting')} className="text-sm font-bold underline">Try Again</button>
                             </div>
                         )}
                    </div>
                );
            case 'Card':
                return <div className="text-center p-4 bg-accent/10 dark:bg-dark-accent/20 text-accent dark:text-dark-accent rounded-xl font-semibold">Please use your card terminal to process Ksh {totalAfterPoints.toFixed(2)}.</div>;
            default:
                return null;
        }
    };

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-white/50 dark:bg-dark-card/50 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-white/20 dark:border-white/10">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Finalize Payment</h2>
                    <button onClick={onClose} className="text-foreground/60 hover:text-foreground dark:text-dark-foreground/60 dark:hover:text-dark-foreground text-2xl">&times;</button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Left Side: Summary */}
                    <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/20 dark:border-white/10 p-6 space-y-4 overflow-y-auto">
                        <h3 className="font-bold text-lg">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-foreground/70 dark:text-dark-foreground/70">Total (Pre-deposit)</span> <span className="font-mono">{totalCostBeforeDeposit.toFixed(2)}</span></div>
                            {depositApplied > 0 && <div className="flex justify-between text-accent dark:text-dark-accent"><span>Deposit Paid</span> <span className="font-mono">- {depositApplied.toFixed(2)}</span></div>}
                            <div className="flex justify-between"><span className="text-foreground/70 dark:text-dark-foreground/70">Balance Due</span> <span className="font-mono">{balanceDue.toFixed(2)}</span></div>
                            
                            {settings.loyalty.enabled && customer.id !== 'cust001' && (
                                <>
                                    <div className="pt-2 border-t border-white/20 dark:border-white/10"></div>
                                    <label className="block font-medium">Use Loyalty Points</label>
                                    <p className="text-xs text-foreground/60 dark:text-dark-foreground/60">Balance: {customer.loyaltyPoints} pts (Max Value: Ksh {maxRedeemableValue.toFixed(2)})</p>
                                    <input type="number" value={pointsToRedeem} onChange={(e) => setPointsToRedeem(e.target.value === '' ? '' : Math.max(0, Math.min(Number(e.target.value), customer.loyaltyPoints)))} className="w-full p-2 border rounded-lg bg-white/20 dark:bg-dark-background/50 border-white/20 dark:border-dark-border" />
                                    {pointsValue > 0 && <div className="flex justify-between text-accent dark:text-dark-accent"><span>Points Value</span> <span className="font-mono">- {pointsValue.toFixed(2)}</span></div>}
                                </>
                            )}
                        </div>
                        <div className="pt-4 border-t border-white/20 dark:border-white/10 text-2xl font-bold text-primary dark:text-dark-primary flex justify-between">
                            <span>To Pay</span>
                            <span className="font-mono">Ksh {totalAfterPoints.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Right Side: Payment Method */}
                    <div className="w-full md:w-2/3 p-6 flex flex-col overflow-y-auto">
                        <div className="flex bg-background/50 dark:bg-dark-background/50 p-1 rounded-xl mb-4">
                            {paymentButtons.map(btn => (
                                <button key={btn.type} onClick={() => setPaymentType(btn.type)} className={`w-1/3 py-2 text-sm font-bold transition-colors rounded-lg ${paymentType === btn.type ? 'bg-card dark:bg-dark-card shadow text-primary dark:text-dark-primary' : 'text-foreground/70 dark:text-dark-foreground/70'}`}>{btn.name}</button>
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            <div key={paymentType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                {renderPaymentContent()}
                            </div>
                        </AnimatePresence>
                    </div>
                </div>
                
                <div className="flex-shrink-0 flex justify-between items-center p-4 border-t border-white/20 dark:border-white/10">
                     <div className="flex items-center">
                        <input type="checkbox" id="autoPrint" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} className="h-4 w-4 text-primary rounded border-border focus:ring-primary"/>
                        <label htmlFor="autoPrint" className="ml-2 text-sm font-medium text-foreground dark:text-dark-foreground">Print receipt after sale</label>
                    </div>
                    <button 
                        onClick={handleComplete} 
                        disabled={(paymentType === 'M-Pesa' && stkState !== 'success') || (paymentType === 'Cash' && Number(cashReceived) < totalAfterPoints)}
                        className="bg-primary text-primary-content font-bold py-3 px-8 rounded-xl text-lg transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset disabled:bg-slate-400 dark:disabled:bg-slate-600"
                        whileTap={{ scale: 0.98 }}
                    >
                        Complete Sale
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;