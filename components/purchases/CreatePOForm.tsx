

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Supplier, Product, PurchaseOrderItem, PurchaseOrderData } from '../types';

interface CreatePOFormProps {
    suppliers: Supplier[];
    products: Product[];
    onSave: (poData: PurchaseOrderData) => Promise<void>;
    onClose: () => void;
    onAddSupplier: (supplierData: Omit<Supplier, 'id'>) => Promise<Supplier | null>;
    prefilledItems?: Omit<PurchaseOrderItem, 'quantityReceived'>[];
    salesOrderId?: string;
}

const CreatePOForm: React.FC<CreatePOFormProps> = ({
    suppliers,
    products,
    onSave,
    onClose,
    prefilledItems,
    salesOrderId
}) => {
    // Main form state
    const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    });
    const [items, setItems] = useState<Omit<PurchaseOrderItem, 'quantityReceived'>[]>(prefilledItems || []);

    // Add item form state
    const [itemSearch, setItemSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<number | ''>(1);
    const [unitCost, setUnitCost] = useState<number | ''>('');

    const searchResults = useMemo(() => {
        if (!itemSearch) return [];
        return products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 5);
    }, [itemSearch, products]);

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setItemSearch(product.name);
        setUnitCost(product.costPrice || '');
        // Clear search results
        setTimeout(() => setItemSearch(''), 100); 
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct && quantity && (unitCost !== '')) {
            setItems(prev => {
                const existing = prev.find(i => i.productId === selectedProduct.id);
                if (existing) {
                    return prev.map(i => i.productId === selectedProduct.id ? { ...i, quantity: i.quantity + Number(quantity) } : i);
                }
                return [...prev, {
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    quantity: Number(quantity),
                    cost: Number(unitCost),
                    unitOfMeasure: selectedProduct.unitOfMeasure,
                }];
            });
            // Reset form
            setSelectedProduct(null);
            setItemSearch('');
            setQuantity(1);
            setUnitCost('');
        }
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSavePO = async () => {
        if (!supplierId || items.length === 0) {
            alert("Please select a supplier and add at least one item.");
            return;
        }
        const poData: PurchaseOrderData = {
            supplierId,
            items,
            status: 'Draft',
            expectedDate: new Date(expectedDate),
            salesOrderId,
            orderDate,
        };
        await onSave(poData);
    };

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
            <div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: -20 }}
                className="bg-card dark:bg-dark-card w-full max-w-3xl rounded-lg shadow-xl overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b border-border dark:border-dark-border">
                    <h2 className="text-xl font-bold">Create Purchase Order</h2>
                    <button onClick={onClose} className="text-2xl">&times;</button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Supplier *</label>
                            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background">
                                <option value="">Select supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Order Date</label>
                            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Expected Delivery Date</label>
                            <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background" />
                        </div>
                    </div>

                    <div className="p-4 border border-border dark:border-dark-border rounded-lg">
                        <h3 className="font-semibold mb-2">Add Items (Prices include VAT)</h3>
                        <form onSubmit={handleAddItem} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 md:col-span-5 relative">
                                <label className="text-xs">Select product</label>
                                <input 
                                    type="text" 
                                    value={itemSearch} 
                                    onChange={e => setItemSearch(e.target.value)} 
                                    placeholder="Search product..."
                                    className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background"
                                />
                                {searchResults.length > 0 && itemSearch && (
                                    <ul className="absolute z-10 w-full bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                        {searchResults.map(p => (
                                            <li key={p.id} onClick={() => handleProductSelect(p)} className="px-3 py-2 hover:bg-muted dark:hover:bg-dark-muted cursor-pointer">{p.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="col-span-4 md:col-span-2">
                                <label className="text-xs">Quantity</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} min="1" className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background" />
                            </div>
                            <div className="col-span-4 md:col-span-3">
                                <label className="text-xs">Unit Cost (incl. VAT)</label>
                                <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))} step="0.01" min="0" className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-card dark:bg-dark-background" />
                            </div>
                            <div className="col-span-4 md:col-span-2">
                                <button type="submit" className="w-full bg-foreground dark:bg-dark-foreground text-background dark:text-dark-background font-bold py-2 px-4 rounded-md h-full">Add Item</button>
                            </div>
                        </form>
                    </div>
                    
                    {items.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-bold">Order Items</h4>
                            {items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-muted dark:bg-dark-muted p-2 rounded">
                                    <p>{item.productName} ({item.quantity} x {item.cost.toFixed(2)})</p>
                                    <div className="flex items-center gap-4">
                                        <p className="font-mono">{(item.quantity * item.cost).toFixed(2)}</p>
                                        <button onClick={() => handleRemoveItem(index)} className="text-danger">&times;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="flex justify-end items-center p-4 border-t border-border dark:border-dark-border bg-muted dark:bg-dark-muted/50">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md font-semibold mr-2">Cancel</button>
                    <button type="button" onClick={handleSavePO} className="px-6 py-2 bg-primary text-primary-content rounded-md font-semibold">Create Purchase Order</button>
                </div>
            </div>
        </div>
    );
};

export default CreatePOForm;