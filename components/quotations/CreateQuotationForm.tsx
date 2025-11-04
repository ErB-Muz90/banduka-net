import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, Product, Settings, QuotationItem, QuotationData } from '../types';
import { calculateCartTotals } from '../../utils/vatCalculator';
import SearchableCustomerDropdown from '../common/SearchableCustomerDropdown';

interface CreateQuotationFormProps {
    customers: Customer[];
    products: Product[];
    settings: Settings;
    onSave: (quotationData: QuotationData, status: 'Draft' | 'Sent') => void;
    onCancel: () => void;
}

const CreateQuotationForm: React.FC<CreateQuotationFormProps> = ({ customers, products, settings, onSave, onCancel }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers.find(c => c.id !== 'cust001')?.id || '');
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
    }, [searchTerm, products]);
    
    const productsByCategory = useMemo(() => {
        const categoryMap = new Map<string, Product[]>();
        products.forEach(product => {
            const category = product.category || 'Uncategorized';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category)!.push(product);
        });
        for (const key of categoryMap.keys()) {
            categoryMap.get(key)!.sort((a, b) => a.name.localeCompare(b.name));
        }
        return Array.from(categoryMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [products]);

    const { subtotal, tax, total, discountAmount } = useMemo(() => {
        const { subtotal, tax, total, totalDiscountAmount } = calculateCartTotals(
            items,
            { type: 'percentage', value: 0 }, // No cart discount on quotes
            settings.tax.vatRate / 100
        );
        return { subtotal, tax, total, discountAmount: totalDiscountAmount };
    }, [items, settings.tax.vatRate]);

    const handleAddProduct = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                price: product.price,
                pricingType: product.pricingType
            }];
        });
        setSearchTerm('');
    };

    const handleUpdateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setItems(prev => prev.filter(i => i.productId !== productId));
        } else {
            setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: newQuantity } : i));
        }
    };

    const handleSave = (status: 'Draft' | 'Sent') => {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer || items.length === 0) {
            alert('Please select a customer and add at least one item.');
            return;
        }
        
        const quoteData: QuotationData = {
            customerId: selectedCustomerId,
            items,
            status,
        };
        onSave(quoteData, status);
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-background dark:bg-dark-background">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Create Quotation</h1>
                <div className="flex space-x-3">
                    <button onClick={onCancel} whileTap={{ scale: 0.95 }} className="bg-muted text-foreground dark:bg-dark-muted dark:text-dark-foreground font-semibold px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border">Cancel</button>
                    <button onClick={() => handleSave('Draft')} whileTap={{ scale: 0.95 }} className="bg-foreground/80 text-white font-semibold px-4 py-2 rounded-lg hover:bg-foreground dark:bg-dark-border dark:hover:bg-dark-border/80">Save as Draft</button>
                    <button onClick={() => handleSave('Sent')} whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-lg hover:bg-primary-focus shadow-md">Create Quotation</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer & Product Search */}
                    <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label htmlFor="customer" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Customer</label>
                            <div className="mt-1 max-w-sm">
                                <SearchableCustomerDropdown
                                    customers={customers}
                                    selectedCustomerId={selectedCustomerId}
                                    onCustomerChange={setSelectedCustomerId}
                                    filter={(c) => c.id !== 'cust001'}
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label htmlFor="product-search" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Add Product via Search</label>
                            <input
                                id="product-search" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Type to search products..."
                                className="mt-1 block w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md"
                            />
                            {searchResults.length > 0 && (
                                <ul className="absolute z-10 w-full bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                    {searchResults.map(p => (
                                        <li key={p.id} onClick={() => handleAddProduct(p)} className="px-4 py-2 hover:bg-muted dark:hover:bg-dark-muted cursor-pointer">
                                            {p.name} - Ksh {p.price.toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    
                    {/* NEW: Category Browser Section */}
                    <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground mb-2">Or Browse Products by Category</h3>
                        <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
                            {productsByCategory.map(([category, categoryProducts]) => (
                                <div key={category} className="border-b border-border dark:border-dark-border last:border-b-0">
                                    <button 
                                        onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                                        className="w-full flex justify-between items-center py-3 text-left font-semibold text-foreground dark:text-dark-foreground"
                                        aria-expanded={expandedCategory === category}
                                    >
                                        <span>{category} ({categoryProducts.length})</span>
                                        <div animate={{ rotate: expandedCategory === category ? 180 : 0 }}>
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedCategory === category && (
                                            <div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <ul className="pb-3 pl-4 space-y-1">
                                                    {categoryProducts.map(product => (
                                                        <li 
                                                            key={product.id}
                                                            onClick={() => handleAddProduct(product)}
                                                            className="flex justify-between items-center py-1.5 cursor-pointer hover:bg-muted dark:hover:bg-dark-muted rounded px-2"
                                                        >
                                                            <span className="text-sm text-foreground dark:text-dark-foreground">{product.name}</span>
                                                            <span className="text-sm font-mono text-primary dark:text-dark-primary">Ksh {product.price.toFixed(2)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm overflow-x-auto">
                         <table className="w-full text-sm">
                            <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left">Product</th>
                                    <th className="px-6 py-3 text-center">Quantity</th>
                                    <th className="px-6 py-3 text-right">Unit Price</th>
                                    <th className="px-6 py-3 text-right">Line Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-dark-border">
                                {items.map(item => (
                                    <tr key={item.productId}>
                                        <td className="px-6 py-4 font-semibold">{item.productName}</td>
                                        <td className="px-6 py-4"><input type="number" value={item.quantity} onChange={e => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)} className="w-16 text-center bg-background dark:bg-dark-background border rounded-md p-1" /></td>
                                        <td className="px-6 py-4 text-right font-mono">{item.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-mono font-semibold">{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-8 text-foreground-muted dark:text-dark-foreground-muted">No items added to quote.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm p-6 space-y-3 sticky top-6">
                        <h3 className="text-xl font-bold text-foreground dark:text-dark-foreground mb-4">Summary</h3>
                        <div className="flex justify-between text-sm"><span className="text-foreground-muted dark:text-dark-foreground-muted">Gross Subtotal</span><span className="font-semibold font-mono">Ksh {subtotal.toFixed(2)}</span></div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-danger"><span >Discounts</span><span className="font-semibold font-mono">- Ksh {discountAmount.toFixed(2)}</span></div>
                        )}
                        <div className="flex justify-between text-sm"><span className="text-foreground-muted dark:text-dark-foreground-muted">VAT ({settings.tax.vatRate}%)</span><span className="font-semibold font-mono">Ksh {tax.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xl font-bold border-t border-border dark:border-dark-border pt-3 mt-3"><span className="text-foreground dark:text-dark-foreground">Total</span><span className="text-primary dark:text-dark-primary font-mono">Ksh {total.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateQuotationForm;