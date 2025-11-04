
import React, { useState, useMemo } from 'react';
import { Product, CartItem, Customer, Settings, Layaway, Shift, Payment } from '../../types';
import ProductGrid from '../pos/ProductGrid';
import { motion } from 'framer-motion';
import SearchableCustomerDropdown from '../common/SearchableCustomerDropdown';

interface NewLayawayViewProps {
    products: Product[];
    customers: Customer[];
    settings: Settings;
    onAddLayaway: (layawayData: Omit<Layaway, 'id' | 'balance' | 'cashierId' | 'cashierName' | 'shiftId' | 'payments'> & { initialPayment: { amount: number; method: 'Cash' | 'M-Pesa' | 'Card' | 'Points'; } }) => Promise<Layaway>;
    onBack: () => void;
    activeShift: Shift | null;
    initialCartItems?: CartItem[];
}

const NewLayawayView: React.FC<NewLayawayViewProps> = ({ products, customers, settings, onAddLayaway, onBack, activeShift, initialCartItems }) => {
    const fromPOS = !!initialCartItems && initialCartItems.length > 0;
    const [cart, setCart] = useState<CartItem[]>(initialCartItems || []);
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers.find(c => c.id !== 'cust001')?.id || customers[0]?.id);
    const [deposit, setDeposit] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('Cash');
    const [expiryDate, setExpiryDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + (settings.layaway?.maxDurationDays || 30));
        return date.toISOString().split('T')[0];
    });
    
    const [error, setError] = useState('');

    const addToCart = (product: Product) => {
        if (fromPOS) return; // Don't allow adding more items if coming from POS
        if (product.stock <= 0 && product.productType === 'Inventory') return;
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev;
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };
    
    const removeFromCart = (productId: string) => {
        if (fromPOS) return; // Don't allow removing items if coming from POS
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
    const minDepositPercentage = settings.layaway?.minDepositPercentage ?? 20;
    const minDeposit = total * (minDepositPercentage / 100);

    const handleCreateLayaway = async () => {
        setError('');
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer || customer.id === 'cust001') {
            setError('Please select a valid customer (not Walk-in).');
            return;
        }
         if (cart.length === 0) {
            setError('Please add items to the layaway plan.');
            return;
        }
        if (deposit === '' || Number(deposit) < minDeposit) {
            setError(`Deposit must be at least the minimum required of Ksh ${minDeposit.toFixed(2)}.`);
            return;
        }
        if (!expiryDate) {
            setError('Please set a valid expiry date.');
            return;
        }

        try {
            await onAddLayaway({
                customerId: customer.id,
                customerName: customer.name,
                items: cart,
                total: total,
                deposit: Number(deposit),
                initialPayment: {
                    amount: Number(deposit),
                    method: paymentMethod,
                },
                status: 'Active',
                createdDate: new Date(),
                expiryDate: new Date(expiryDate),
            });
        } catch (e) {
            // Error is handled/shown in App.tsx
        }
    };

    if (!activeShift) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Shift Not Active</h1>
                <p className="mt-2 text-foreground-muted dark:text-dark-foreground-muted">You must start a shift before you can create a layaway plan.</p>
                <button onClick={onBack} className="mt-6 bg-primary text-primary-content font-bold py-2 px-6 rounded-lg">Back to POS</button>
            </div>
        );
    }


    return (
        <div className={`h-full overflow-hidden ${fromPOS ? 'flex justify-center' : 'grid grid-cols-1 md:grid-cols-[1fr_auto]'}`}>
            {!fromPOS && (
                <div className="flex-1 p-4 overflow-y-auto">
                    <ProductGrid products={products} onAddToCart={addToCart} settings={settings} />
                </div>
            )}
            <div className={`w-full ${fromPOS ? 'max-w-xl' : 'md:w-96'} bg-card dark:bg-dark-card shadow-lg flex flex-col p-4 space-y-4 border-l border-border dark:border-dark-border`}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">New Layaway</h2>
                     <button onClick={onBack} className="text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">&larr; Back to POS</button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Customer</label>
                    <div className="mt-1">
                        <SearchableCustomerDropdown
                            customers={customers}
                            selectedCustomerId={selectedCustomerId}
                            onCustomerChange={setSelectedCustomerId}
                            filter={(c) => c.id !== 'cust001'}
                        />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto border-t border-b border-border dark:border-dark-border py-2 space-y-2">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center py-1 group">
                            <div className="text-sm">
                                <p className="font-semibold text-foreground dark:text-dark-foreground">{item.name}</p>
                                <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">{item.quantity} x {item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-foreground dark:text-dark-foreground">{(item.price * item.quantity).toFixed(2)}</span>
                                 {!fromPOS && <button onClick={() => removeFromCart(item.id)} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>}
                            </div>
                        </div>
                    ))}
                     {cart.length === 0 && <p className="text-center text-foreground-muted dark:text-dark-foreground-muted py-4">Add products to start</p>}
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="font-mono">Ksh {total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-foreground-muted dark:text-dark-foreground-muted"><span>Minimum Deposit ({minDepositPercentage}%)</span><span className="font-mono">Ksh {minDeposit.toFixed(2)}</span></div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Deposit Paid</label>
                    <input type="number" value={deposit} onChange={e => setDeposit(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-card" placeholder={minDeposit.toFixed(2)} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Payment Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as Payment['method'])} className="mt-1 w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-card">
                        <option>Cash</option>
                        <option>M-Pesa</option>
                        <option>Card</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Expiry Date</label>
                    <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1 w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-card" />
                </div>
                {error && <p className="text-danger text-sm text-center">{error}</p>}
                <div className="pt-2">
                    <button onClick={handleCreateLayaway} className="w-full bg-primary text-primary-content font-bold py-3 rounded-lg hover:bg-primary-focus disabled:bg-slate-400" disabled={cart.length === 0}>
                        Create Layaway
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewLayawayView;
