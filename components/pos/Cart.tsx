import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem, Customer, Settings, Shift, User } from '../../types';
import { calculateCartTotals } from '../../utils/vatCalculator';
import SearchableCustomerDropdown from '../common/SearchableCustomerDropdown';
import { ICONS } from '../../constants';

interface CartProps {
    cartItems: CartItem[];
    customers: Customer[];
    selectedCustomerId: string;
    onCustomerChange: (id: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    updateCartItemDiscount: (productId: string, discount: CartItem['discount'] | undefined) => void;
    removeItem: (productId:string) => void;
    onCharge: (discount: {type: 'percentage' | 'fixed', value: number}) => void;
    isOnline: boolean;
    settings: Settings;
    activeShift: Shift | null;
    onStartShift: (startingFloat: number) => void;
    onEndShiftRequest: () => void;
    onHoldRequest: () => void;
    onLayawayRequest: () => void;
    depositApplied?: number;
    currentUser: User;
}

const FRACTIONAL_UNITS = ['m', 'kg', 'g', 'ltr', 'sq ft'];

// NEW: Moved DiscountEditor outside of the Cart component to prevent re-creation on every render.
const DiscountEditor: React.FC<{
    item: CartItem;
    onApply: (discount: CartItem['discount'] | undefined) => void;
    onClose: () => void;
}> = ({ item, onApply, onClose }) => {
    const [type, setType] = useState(item.discount?.type || 'fixed');
    const [value, setValue] = useState(item.discount?.value || '');

    const handleApply = () => {
        if (Number(value) > 0) {
            onApply({ type: type as 'fixed' | 'percentage', value: Number(value) });
        } else {
            onApply(undefined); // Remove discount if value is 0 or empty
        }
        onClose();
    };

    return (
        <div className="absolute right-0 top-full mt-1 bg-white/50 dark:bg-dark-border/80 backdrop-blur-md p-2 rounded-lg shadow-xl z-20 w-48 border border-white/20 dark:border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex bg-muted dark:bg-dark-muted p-0.5 rounded-md mb-2">
                <button onClick={() => setType('fixed')} className={`w-1/2 text-xs py-1 rounded ${type === 'fixed' ? 'bg-white dark:bg-dark-card font-bold text-primary dark:text-dark-primary' : 'text-foreground-muted'}`}>Fixed</button>
                <button onClick={() => setType('percentage')} className={`w-1/2 text-xs py-1 rounded ${type === 'percentage' ? 'bg-white dark:bg-dark-card font-bold text-primary dark:text-dark-primary' : 'text-foreground-muted'}`}>%</button>
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full p-1 border rounded-md text-sm bg-background dark:bg-dark-background border-border dark:border-dark-border"
                placeholder={type === 'fixed' ? 'e.g. 100' : 'e.g. 10'}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
            />
            <button onClick={handleApply} className="w-full mt-2 bg-primary text-primary-content text-xs font-bold py-1.5 rounded">Apply</button>
        </div>
    );
};


const Cart = ({ 
    cartItems, 
    customers, 
    selectedCustomerId,
    onCustomerChange,
    updateQuantity, 
    updateCartItemDiscount,
    removeItem, 
    onCharge, 
    isOnline,
    settings,
    activeShift,
    onStartShift,
    onEndShiftRequest,
    onHoldRequest,
    onLayawayRequest,
    currentUser,
    depositApplied = 0,
}: CartProps) => {
    const [cartDiscountValue, setCartDiscountValue] = useState(0);
    const [isFloatPromptOpen, setIsFloatPromptOpen] = useState(false);
    const [startingFloat, setStartingFloat] = useState<number | ''>('');
    const [editingDiscountFor, setEditingDiscountFor] = useState<string | null>(null);

    const discountSettings = settings.discount;
    
    const cartDiscount = {
        type: discountSettings.type,
        value: cartDiscountValue
    };
    
    const { subtotal, lineItemsDiscountAmount, cartDiscountAmount, taxableAmount, tax, total: cartTotal } = useMemo(
        () => calculateCartTotals(cartItems, cartDiscount, settings.tax.vatRate / 100),
        [cartItems, cartDiscount, settings.tax.vatRate]
    );
    const total = cartTotal - depositApplied;

    const handleQuantityChange = (id: string, currentQuantity: number, change: number) => {
        const newQuantity = currentQuantity + change;
        updateQuantity(id, newQuantity);
    };

    const handleQuantityInputChange = (id: string, value: string) => {
        const newQuantity = parseFloat(value);
        if (!isNaN(newQuantity)) {
            updateQuantity(id, newQuantity);
        }
    };
    
    const handleCartDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseFloat(e.target.value) || 0;
        value = Math.max(0, Math.min(discountSettings.maxValue, value));
        setCartDiscountValue(value);
    };

    const handleToggleClick = () => {
        if (activeShift) {
            onEndShiftRequest();
        } else {
            setIsFloatPromptOpen(true);
        }
    };

    const handleConfirmStartShift = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof startingFloat === 'number' && startingFloat >= 0) {
            onStartShift(startingFloat);
            setIsFloatPromptOpen(false);
            setStartingFloat('');
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-transparent relative min-h-0">
            <AnimatePresence>
                {isFloatPromptOpen && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-dark-card/70 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="mx-auto bg-primary-soft text-primary dark:bg-dark-primary-soft dark:text-dark-primary w-16 h-16 rounded-full flex items-center justify-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h4 className="text-lg font-bold text-foreground dark:text-dark-foreground">Enter Starting Float</h4>
                         <form onSubmit={handleConfirmStartShift} className="w-full space-y-4">
                            <input 
                                type="number" 
                                value={startingFloat} 
                                onChange={e => setStartingFloat(e.target.value === '' ? '' : Number(e.target.value))} 
                                className="block w-full text-center text-xl font-bold p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="e.g., 5000"
                                autoFocus
                            />
                            <div className="flex space-x-2">
                                <button type="button" onClick={() => setIsFloatPromptOpen(false)} whileTap={{ scale: 0.95 }} className="flex-1 bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold py-2 rounded-xl transition-shadow shadow-clay-light active:shadow-clay-light-inset dark:shadow-clay-dark dark:active:shadow-clay-dark-inset">Cancel</button>
                                <button type="submit" whileTap={{ scale: 0.95 }} className="flex-1 bg-primary dark:bg-dark-primary text-primary-content dark:text-dark-primary-content font-bold py-2 rounded-xl transition-shadow shadow-clay-light active:shadow-clay-light-inset dark:shadow-clay-dark dark:active:shadow-clay-dark-inset">Confirm</button>
                            </div>
                         </form>
                    </div>
                )}
            </AnimatePresence>

            <div className="p-4 border-b border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-foreground dark:text-dark-foreground">Shift Status</h3>
                        <p className={`text-sm font-bold ${activeShift ? 'text-accent dark:text-dark-accent' : 'text-foreground-muted dark:text-dark-foreground-muted'}`}>
                            {activeShift ? `Active (${new Date(activeShift.startTime).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', timeZone: 'Africa/Nairobi'})})` : 'Inactive'}
                        </p>
                    </div>
                    <button 
                        onClick={handleToggleClick} 
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-clay-light-inset dark:shadow-clay-dark-inset ${activeShift ? 'bg-accent dark:bg-dark-accent' : 'bg-border dark:bg-dark-border'}`}
                        aria-label={activeShift ? "End Shift" : "Start Shift"}
                    >
                        <div span 
                            layout
                            transition={{type: "spring", stiffness: 700, damping: 30}}
                            className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform shadow-clay-light dark:shadow-clay-dark ${activeShift ? 'translate-x-6' : 'translate-x-1'}`} 
                        />
                    </button>
                </div>
            </div>

            <div className="p-4 border-b border-white/20 dark:border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">Current Sale</h2>
                    {cartItems.length > 0 && (
                        <span className="text-sm font-bold bg-muted/50 dark:bg-dark-muted/50 text-foreground-muted dark:text-dark-foreground-muted px-2.5 py-1 rounded-full">
                            {cartItems.reduce((total, item) => total + item.quantity, 0)} items
                        </span>
                    )}
                </div>
                <SearchableCustomerDropdown
                    customers={customers}
                    selectedCustomerId={selectedCustomerId}
                    onCustomerChange={onCustomerChange}
                    disabled={!activeShift}
                />
            </div>

            <div className="flex-grow overflow-y-auto">
                {cartItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-foreground-muted dark:text-dark-foreground-muted">
                        <p>Cart is empty. Add products to start.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-white/20 dark:divide-white/10">
                        <AnimatePresence>
                            {cartItems.map(item => {
                                const allowFractions = FRACTIONAL_UNITS.includes(item.unitOfMeasure);
                                return (
                                <div li 
                                    key={item.id} 
                                    layout
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 50 }}
                                    className="p-4 flex space-x-3"
                                >
                                    <div className="flex-grow">
                                        <p className="font-bold text-sm text-foreground dark:text-dark-foreground">{item.name}</p>
                                        <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">Ksh {item.price.toFixed(2)} / {item.unitOfMeasure}</p>
                                        {item.discount && (
                                            <p className="text-xs text-accent dark:text-dark-accent font-semibold">
                                                Discount: -{item.discount.type === 'fixed' ? `Ksh ${item.discount.value.toFixed(2)}` : `${item.discount.value}%`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        {allowFractions ? (
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                                                step="0.01"
                                                className="w-20 p-1 text-center font-bold bg-transparent border border-white/20 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                            />
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <button whileTap={{ scale: 0.9 }} onClick={() => handleQuantityChange(item.id, item.quantity, -1)} className="w-6 h-6 rounded-full bg-background/50 text-foreground hover:bg-border dark:bg-dark-border/50 dark:text-dark-foreground dark:hover:bg-dark-border">-</button>
                                                <span className="font-bold w-6 text-center text-foreground dark:text-dark-foreground">{item.quantity}</span>
                                                <button whileTap={{ scale: 0.9 }} onClick={() => handleQuantityChange(item.id, item.quantity, 1)} className="w-6 h-6 rounded-full bg-background/50 text-foreground hover:bg-border dark:bg-dark-border/50 dark:text-dark-foreground dark:hover:bg-dark-border">+</button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-bold w-20 text-right text-foreground dark:text-dark-foreground">Ksh {(item.price * item.quantity).toFixed(2)}</p>
                                    <div className="flex flex-col items-center justify-center space-y-1">
                                        <div className="relative">
                                            <button whileTap={{ scale: 0.9 }} onClick={() => setEditingDiscountFor(editingDiscountFor === item.id ? null : item.id)} className={`p-1 rounded-full ${item.discount ? 'text-accent dark:text-dark-accent' : 'text-foreground-muted dark:text-dark-foreground-muted hover:text-accent'}`}>
                                                {React.cloneElement(ICONS.discount, { className: 'h-5 w-5' })}
                                            </button>
                                            {editingDiscountFor === item.id && (
                                                <DiscountEditor
                                                    item={item}
                                                    onApply={(discount) => updateCartItemDiscount(item.id, discount)}
                                                    onClose={() => setEditingDiscountFor(null)}
                                                />
                                            )}
                                        </div>
                                        <button whileTap={{ scale: 0.9 }} onClick={() => removeItem(item.id)} className="text-danger/70 hover:text-danger">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </motion.li>
                            )})}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
            
            <div className="p-4 border-t border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted dark:text-dark-foreground-muted">Gross Subtotal</span>
                    <span className="font-bold text-foreground dark:text-dark-foreground">Ksh {subtotal.toFixed(2)}</span>
                </div>

                {lineItemsDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-danger">
                      <span>Item Discounts</span>
                      <span>- Ksh {lineItemsDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                {discountSettings.enabled && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground-muted dark:text-dark-foreground-muted">Cart Discount ({cartDiscount.type === 'percentage' ? '%' : 'KES'})</span>
                        <input 
                          type="number"
                          value={cartDiscountValue}
                          onChange={handleCartDiscountChange}
                          max={discountSettings.maxValue}
                          className="w-20 text-right font-bold text-foreground dark:text-dark-foreground bg-transparent border rounded-md px-2 py-1 dark:border-white/20"
                        />
                    </div>
                )}

                {cartDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-danger">
                      <span>Cart Discount Amount</span>
                      <span>- Ksh {cartDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                 <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted dark:text-dark-foreground-muted">Taxable Amount</span>
                    <span className="font-bold text-foreground dark:text-dark-foreground">Ksh {taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-foreground-muted dark:text-dark-foreground-muted">VAT ({settings.tax.vatRate}%)</span>
                    <span className="font-bold text-foreground dark:text-dark-foreground">Ksh {tax.toFixed(2)}</span>
                </div>
                 {depositApplied > 0 && (
                    <div className="flex justify-between text-sm text-accent dark:text-dark-accent">
                        <span>Deposit Paid</span>
                        <span>- Ksh {depositApplied.toFixed(2)}</span>
                    </div>
                )}
                <div className="rounded-xl p-4 bg-gradient-to-r from-primary to-secondary dark:from-dark-primary dark:to-dark-secondary text-primary-content dark:text-dark-primary-content animate-neural-pulse">
                    <div className="flex justify-between text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">Ksh {total.toFixed(2)}</span>
                    </div>
                </div>
                 <div className="flex gap-2 mt-4">
                     <button 
                        onClick={onHoldRequest}
                        disabled={cartItems.length === 0 || !activeShift}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-muted dark:bg-dark-background text-foreground dark:text-dark-foreground font-bold py-3 rounded-xl transition-shadow shadow-clay-light active:shadow-clay-light-inset dark:shadow-clay-dark-strong dark:active:shadow-clay-dark-inset disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:shadow-none flex items-center justify-center text-lg"
                     >
                        Hold
                     </button>
                     <button 
                        onClick={onLayawayRequest}
                        disabled={cartItems.length === 0 || !activeShift}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-muted dark:bg-dark-background text-foreground dark:text-dark-foreground font-bold py-3 rounded-xl transition-shadow shadow-clay-light active:shadow-clay-light-inset dark:shadow-clay-dark-strong dark:active:shadow-clay-dark-inset disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:shadow-none flex items-center justify-center text-lg"
                     >
                        Layaway
                     </button>
                     <button 
                        onClick={() => onCharge(cartDiscount)}
                        disabled={cartItems.length === 0 || !activeShift}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-primary dark:bg-dark-primary text-primary-content dark:text-dark-primary-content font-bold py-3 rounded-xl transition-shadow shadow-clay-light active:shadow-clay-light-inset dark:shadow-clay-dark-strong dark:active:shadow-clay-dark-inset disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:shadow-none flex items-center justify-center text-lg"
                     >
                         Charge
                         {!isOnline && <span className="text-xs ml-2">(Offline)</span>}
                     </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;