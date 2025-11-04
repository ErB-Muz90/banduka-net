import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Product, Settings, CategoryInfo } from '../types';

interface ProductModalProps {
    onClose: () => void;
    onSave: (product: Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'> | Product) => void;
    product?: Product;
    settings: Settings;
    products: Product[];
}

export const ProductModal: React.FC<ProductModalProps> = ({ onClose, onSave, product, settings, products }) => {
    const isEditMode = Boolean(product);
    
    const [formData, setFormData] = useState({
        name: '',
        upc: '',
        description: '',
        category: 'Uncategorized',
        price: 0,
        pricingType: settings.tax.pricingType,
        productType: 'Inventory' as 'Inventory' | 'Service',
        costPrice: 0,
        unitOfMeasure: 'pc(s)',
        imageUrl: '',
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                upc: product.upc || '',
                description: product.description || '',
                category: product.category,
                price: product.price,
                pricingType: product.pricingType,
                productType: product.productType,
                costPrice: product.costPrice || 0,
                unitOfMeasure: product.unitOfMeasure || 'pc(s)',
                imageUrl: product.imageUrl || '',
            });
        }
    }, [product]);

    const { profitMargin, grossProfit } = useMemo(() => {
        const { price, costPrice } = formData;
        if (costPrice <= 0 || price <= 0) {
            return { profitMargin: 0, grossProfit: 0 };
        }
        const vatRate = settings.tax.vatRate / 100;
        const taxablePrice = price / (1 + vatRate);
        const profit = taxablePrice - costPrice;
        const margin = (profit / costPrice) * 100;
        return { profitMargin: margin, grossProfit: profit };
    }, [formData.price, formData.costPrice, settings.tax.vatRate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['price', 'costPrice'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditMode && product) {
            onSave({ ...product, ...formData });
        } else {
            onSave(formData);
        }
    };
    
    const definedCategories = settings.inventory?.definedCategories || [];

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
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
                 <div className="flex justify-between items-center p-6 border-b border-border dark:border-dark-border">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                     <div>
                        <label className="block text-sm font-medium">Product Name *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">Product Type</label>
                            <select name="productType" value={formData.productType} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md">
                                <option value="Inventory">Inventory (Track Stock)</option>
                                <option value="Service">Service (No Stock)</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Category</label>
                             <input 
                                type="text" 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                list="category-suggestions"
                                className="mt-1 w-full p-2 border rounded-md" 
                            />
                            <datalist id="category-suggestions">
                                {definedCategories.map(cat => <option key={cat.path} value={cat.path} />)}
                            </datalist>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Selling Price (incl. VAT) *</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        {formData.productType === 'Inventory' && (
                             <div>
                                <label className="block text-sm font-medium">Cost Price (excl. VAT)</label>
                                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} min="0" step="0.01" className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                        )}
                    </div>

                    {formData.productType === 'Inventory' && formData.costPrice > 0 && formData.price > 0 && (
                        <div className="p-3 bg-muted dark:bg-dark-muted rounded-md text-sm border border-border dark:border-dark-border">
                            <div className="flex justify-between">
                                <span className="text-foreground-muted">Gross Profit (per item):</span>
                                <span className="font-semibold font-mono text-green-600 dark:text-green-400">Ksh {grossProfit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-muted">Profit Margin:</span>
                                <span className="font-semibold font-mono text-green-600 dark:text-green-400">{profitMargin.toFixed(2)}%</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">SKU / Inventory Code</label>
                            <input type="text" value={product?.inventoryCode || 'Auto-generated'} readOnly className="mt-1 w-full p-2 border rounded-md bg-muted dark:bg-dark-muted" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">UPC / Barcode</label>
                            <input type="text" name="upc" value={formData.upc} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                    </div>
                     {formData.productType === 'Inventory' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium">Unit of Measure</label>
                                 <input
                                    type="text"
                                    name="unitOfMeasure"
                                    value={formData.unitOfMeasure}
                                    onChange={handleChange}
                                    list="unit-suggestions"
                                    className="mt-1 w-full p-2 border rounded-md"
                                />
                                <datalist id="unit-suggestions">
                                    {settings.measurements?.units.map(unit => <option key={unit} value={unit} />)}
                                </datalist>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Current Stock</label>
                                <input type="number" value={product?.stock || 0} readOnly className="mt-1 w-full p-2 border rounded-md bg-muted dark:bg-dark-muted" />
                            </div>
                        </div>
                    )}
                     <div>
                        <label className="block text-sm font-medium">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border rounded-md"></textarea>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted font-bold px-4 py-2 rounded-lg">Cancel</button>
                        <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-lg">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;