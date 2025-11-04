

import React, { useState, useMemo } from 'react';
import { Customer, Settings, SalesOrder, Shift, SalesOrderItem, Product } from '../types';
import { motion } from 'framer-motion';
import SearchableCustomerDropdown from '../common/SearchableCustomerDropdown';

interface NewSalesOrderViewProps {
    products: Product[];
    customers: Customer[];
    settings: Settings;
    onAddSalesOrder: (salesOrderData: Omit<SalesOrder, 'id' | 'balance' | 'cashierId' | 'cashierName' | 'shiftId'>) => Promise<SalesOrder>;
    onBack: () => void;
    activeShift: Shift | null;
}

const NewSalesOrderView: React.FC<NewSalesOrderViewProps> = ({ products, customers, settings, onAddSalesOrder, onBack, activeShift }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers.find(c => c.id !== 'cust001')?.id || customers[0]?.id);
    const [items, setItems] = useState<SalesOrderItem[]>([]);
    const [deposit, setDeposit] = useState<number | ''>('');
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7); // Default 7 days
        return date.toISOString().split('T')[0];
    });
    const [shippingAddress, setShippingAddress] = useState('');
    const [notes, setNotes] = useState('');
    
    // For the new item form
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemQty, setNewItemQty] = useState<number | ''>(1);
    const [newItemPrice, setNewItemPrice] = useState<number | ''>('');
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const [error, setError] = useState('');

    const searchResults = useMemo(() => {
        if (!productSearchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).slice(0, 5);
    }, [productSearchTerm, products]);
    
    const total = useMemo(() => items.reduce((sum, item) => sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0), [items]);

    const handleAddProductFromSearch = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: (i.quantity || 0) + 1 } : i);
            }
            return [...prev, {
                id: crypto.randomUUID(),
                productId: product.id,
                description: product.name,
                quantity: 1,
                unitPrice: product.price,
                pricingType: product.pricingType,
                status: 'Pending',
                quantityReceived: 0,
            }];
        });
        setProductSearchTerm('');
    };

    const handleItemChange = (id: string, field: keyof SalesOrderItem, value: string) => {
        setItems(prevItems => {
            const newItems = prevItems.map(item => {
                if (item.id === id) {
                    let newValue: string | number = value;
                    if (field === 'quantity' || field === 'unitPrice') {
                        newValue = parseFloat(value);
                        if (isNaN(newValue)) newValue = 0;
                    }
                    return { ...item, [field]: newValue };
                }
                return item;
            });
            return newItems.filter(item => field !== 'quantity' || item.quantity > 0);
        });
    };
    
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemDesc && newItemQty && newItemPrice) {
            setItems(prev => [...prev, {
                id: crypto.randomUUID(),
                description: newItemDesc,
                quantity: Number(newItemQty),
                unitPrice: Number(newItemPrice),
                pricingType: 'inclusive',
                status: 'Pending',
                quantityReceived: 0,
            }]);
            setNewItemDesc('');
            setNewItemQty(1);
            setNewItemPrice('');
        }
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleCreateSalesOrder = async (status: 'Draft' | 'Pending') => {
        setError('');
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer || customer.id === 'cust001') {
            setError('Please select a valid customer (not Walk-in).');
            return;
        }
         if (items.length === 0) {
            setError('Please add at least one item to the sales order.');
            return;
        }

        try {
            await onAddSalesOrder({
                customerId: customer.id,
                customerName: customer.name,
                items: items,
                total: total,
                deposit: Number(deposit) || 0,
                status: status,
                createdDate: new Date(),
                deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
                shippingAddress,
                notes,
            });
        } catch (err) {
            console.error("Failed to save Sales Order from form:", err);
            // Error toast is shown in App.tsx
        }
    };

    if (!activeShift) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Shift Not Active</h1>
                <p className="mt-2 text-foreground-muted dark:text-dark-foreground-muted">You must start a shift before you can create a sales order.</p>
                <button onClick={onBack} className="mt-6 bg-primary text-primary-content font-bold py-2 px-6 rounded-lg">Back to POS</button>
            </div>
        );
    }


    return (
         <div className="p-4 md:p-8 h-full overflow-y-auto bg-background dark:bg-dark-background flex justify-center">
            <div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl bg-card dark:bg-dark-card p-8 rounded-xl shadow-xl space-y-6"
            >
                 <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">New Sales Order</h1>
                    <button type="button" onClick={onBack} className="text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">&larr; Back to POS</button>
                </div>
                
                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Expected Delivery Date</label>
                        <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="mt-1 w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background" />
                    </div>
                </div>

                {/* Items Section */}
                <div>
                    <h2 className="text-xl font-semibold text-foreground dark:text-dark-foreground border-b border-border dark:border-dark-border pb-2 mb-4">Items</h2>
                    
                    {/* Product Search */}
                    <div className="relative mb-4">
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Add Existing Product</label>
                        <input
                            type="text"
                            value={productSearchTerm}
                            onChange={e => setProductSearchTerm(e.target.value)}
                            placeholder="Type to search products..."
                            className="mt-1 block w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        />
                        {searchResults.length > 0 && (
                            <ul className="absolute z-10 w-full bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                {searchResults.map(p => (
                                    <li key={p.id} onClick={() => handleAddProductFromSearch(p)} className="px-4 py-2 hover:bg-muted dark:hover:bg-dark-muted cursor-pointer">
                                        {p.name} - Ksh {p.price.toFixed(2)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="space-y-2">
                         {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 p-2 bg-muted dark:bg-dark-muted rounded">
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                    className="flex-grow p-1 border rounded-md bg-background dark:bg-dark-background border-border dark:border-dark-border"
                                    readOnly={!!item.productId}
                                />
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                    className="w-20 text-center p-1 border rounded-md bg-background dark:bg-dark-background border-border dark:border-dark-border"
                                    min="1"
                                />
                                <input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                    className="w-24 text-right p-1 border rounded-md bg-background dark:bg-dark-background border-border dark:border-dark-border"
                                    min="0"
                                    step="0.01"
                                />
                                <p className="w-24 text-right font-mono">{(item.unitPrice * item.quantity).toFixed(2)}</p>
                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-danger hover:text-red-700 font-bold text-lg">&times;</button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleAddItem} className="mt-4 grid grid-cols-12 gap-2 p-3 border border-border dark:border-dark-border rounded-lg">
                        <input type="text" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Or Add Custom Item Description" className="col-span-6 p-2 border rounded-md bg-background dark:bg-dark-background border-border dark:border-dark-border" required />
                        <input type="number" value={newItemQty} onChange={e => setNewItemQty(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Qty" className="col-span-2 p-2 border rounded-md bg-background dark:bg-dark-background border-border dark:border-dark-border" required min="1" />
                        <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Unit Price" className="col-span-2 p-2 border rounded-md bg-background dark:bg-dark-background border-border dark:border-dark-border" required min="0" step="0.01"/>
                        <button type="submit" className="col-span-2 bg-foreground/80 dark:bg-dark-border text-white dark:text-dark-foreground font-bold rounded-lg hover:bg-foreground dark:hover:bg-dark-border/80">Add</button>
                    </form>
                </div>
                
                {/* Financials & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <div className="flex justify-between font-bold text-lg mb-4"><span>Total</span><span className="font-mono">Ksh {total.toFixed(2)}</span></div>
                         <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Deposit Paid (Optional)</label>
                        <input type="number" value={deposit} onChange={e => setDeposit(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full p-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background" placeholder="0.00" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Notes / Shipping Address</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="mt-1 w-full p-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background" />
                    </div>
                </div>

                {error && <p className="text-danger text-sm text-center">{error}</p>}
                <div className="pt-4 border-t border-border dark:border-dark-border flex justify-end space-x-3">
                    <button type="button" onClick={() => handleCreateSalesOrder('Draft')} disabled={items.length === 0} whileTap={{ scale: 0.95 }} className="bg-foreground/80 text-white font-semibold px-4 py-2 rounded-lg hover:bg-foreground dark:bg-dark-border dark:hover:bg-dark-border/80 disabled:bg-slate-400">
                        Save as Draft
                    </button>
                    <button type="button" onClick={() => handleCreateSalesOrder('Pending')} disabled={items.length === 0} whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-lg hover:bg-primary-focus shadow-md disabled:bg-slate-400">
                        Create Sales Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewSalesOrderView;