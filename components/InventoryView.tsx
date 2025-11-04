

import React, { useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Product, Permission, Settings, PurchaseOrder, Supplier } from '../types';
import ProductModal from './inventory/ProductModal';
import ExportInventoryModal, { ExportableField } from './inventory/ExportInventoryModal';
import { ICONS } from '../constants';

interface InventoryViewProps {
    products: Product[];
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    onAddProduct: (product: Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'>) => Promise<Product>;
    onUpdateProduct: (product: Product) => void;
    onDeleteProductRequest: (product: Product) => void;
    permissions: Permission[];
    onImportProducts: (file: File) => void;
    onPrintBarcodeRequest: (product: Product) => void;
    onAddToPORequest: (product: Product) => void;
    settings: Settings;
}

const StatCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ReactNode; iconBgColor: string; }> = ({ title, value, subtitle, icon, iconBgColor }) => (
    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${iconBgColor}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
            <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
            <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">{subtitle}</p>
        </div>
    </div>
);

const InventoryView = ({ products, onAddProduct, onUpdateProduct, onDeleteProductRequest, permissions, onImportProducts, onPrintBarcodeRequest, onAddToPORequest, settings }: InventoryViewProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const importInputRef = useRef<HTMLInputElement>(null);

    const canEdit = permissions.includes('edit_inventory');
    const canDelete = permissions.includes('delete_inventory');

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchTermLower = searchTerm.toLowerCase();
            return p.name.toLowerCase().includes(searchTermLower) ||
            p.inventoryCode.toLowerCase().includes(searchTermLower) ||
            (p.upc && p.upc.toLowerCase().includes(searchTermLower))
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [products, searchTerm]);

    const handleNewClick = () => {
        setEditingProduct(undefined);
        setIsModalOpen(true);
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    
    const handleSaveProduct = async (productData: Product | Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'>) => {
        if ('id' in productData) {
            onUpdateProduct(productData as Product);
        } else {
            await onAddProduct(productData as Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'>);
        }
        setIsModalOpen(false);
        setEditingProduct(undefined);
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportProducts(file);
        }
    };
    
    const handleExport = (selectedFields: ExportableField[], format: 'csv' | 'xls') => {
        const headers = selectedFields;
        const data = products.map(product => {
            return selectedFields.map(field => {
                const value = product[field as keyof Product];
                if (value === undefined || value === null) return '';
                // Basic CSV escaping for quotes
                return String(value).replace(/"/g, '""');
            });
        });

        const triggerDownload = (content: string, contentType: string, fileName: string) => {
            const blob = new Blob([content], { type: contentType });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        if (format === 'csv') {
            const csvContent = [
                headers.join(','),
                ...data.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');
            triggerDownload(csvContent, 'text/csv;charset=utf-8;', 'inventory.csv');
        } else { // xls
            const template = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Inventory</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
                <body><table>
                    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                    <tbody>${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
                </table></body></html>`;
            triggerDownload(template, 'application/vnd.ms-excel', 'inventory.xls');
        }
        setIsExportModalOpen(false);
    };
    
    const lowStockThreshold = settings.inventory?.lowStockThreshold ?? 10;
    const lowStockItemsCount = products.filter(p => p.productType === 'Inventory' && p.stock <= lowStockThreshold).length;
    const totalStockValue = products.reduce((total, p) => total + ((p.costPrice || 0) * p.stock), 0);
    const potentialRetailValue = products.reduce((total, p) => total + (p.price * p.stock), 0);

    const formatCurrency = (amount: number) => {
        return `${settings.businessInfo.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    
    const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
    const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;


    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted min-h-full">
            <AnimatePresence>
                {isModalOpen && (
                    <ProductModal
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveProduct}
                        product={editingProduct}
                        settings={settings}
                        products={products}
                    />
                )}
                 {isExportModalOpen && (
                    <ExportInventoryModal
                        onClose={() => setIsExportModalOpen(false)}
                        onExport={handleExport}
                    />
                )}
            </AnimatePresence>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Inventory Management</h1>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Manage your products and stock levels</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <input type="file" ref={importInputRef} className="hidden" accept=".csv" onChange={handleFileSelected} />
                    <button onClick={handleImportClick} whileTap={{ scale: 0.95 }} className="bg-white text-gray-700 font-bold px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Import
                    </button>
                     <button onClick={() => setIsExportModalOpen(true)} whileTap={{ scale: 0.95 }} className="bg-white text-gray-700 font-bold px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export
                    </button>
                    {canEdit && (
                        <button 
                            onClick={handleNewClick}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-sm flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Product
                        </button>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Products" value={String(products.length)} subtitle="Active products" icon={React.cloneElement(ICONS.inventory, {className: "w-6 h-6"})} iconBgColor="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" />
                <StatCard title="Low Stock Items" value={String(lowStockItemsCount)} subtitle="Need reordering" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} iconBgColor="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300" />
                <StatCard title="Total Stock Value" value={formatCurrency(totalStockValue)} subtitle="At cost price" icon={React.cloneElement(ICONS.profitReport, {className: "w-6 h-6"})} iconBgColor="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300" />
                <StatCard title="Potential Retail Value" value={formatCurrency(potentialRetailValue)} subtitle="At selling price" icon={React.cloneElement(ICONS.revenue, {className: "w-6 h-6"})} iconBgColor="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" />
            </div>

            <div className="mb-4">
                 <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground-muted dark:text-dark-foreground-muted absolute top-1/2 left-4 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-0 bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm">
                 <div className="p-4 border-b border-border dark:border-dark-border">
                    <h2 className="text-lg font-semibold text-foreground dark:text-dark-foreground">Products</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                        <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                            <tr>
                                <th scope="col" className="px-6 py-3">Product</th>
                                <th scope="col" className="px-6 py-3">SKU</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Price</th>
                                <th scope="col" className="px-6 py-3">Stock</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-dark-border">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                                    <td scope="row" className="px-6 py-4 font-semibold text-foreground dark:text-dark-foreground whitespace-nowrap">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 font-mono">{product.inventoryCode}</td>
                                    <td className="px-6 py-4">{product.category}</td>
                                    <td className="px-6 py-4 font-mono">{formatCurrency(product.price)}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold text-white bg-gray-800 rounded-full">
                                            {product.stock} {product.unitOfMeasure === 'pc(s)' ? `piece${product.stock === 1 ? '' : 's'}` : product.unitOfMeasure}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold text-white bg-gray-800 rounded-full">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-4 whitespace-nowrap">
                                         {canEdit && <button onClick={() => handleEditClick(product)} className="text-foreground-muted hover:text-primary"><EditIcon /></button>}
                                         {canDelete && <button onClick={() => onDeleteProductRequest(product)} className="text-foreground-muted hover:text-danger"><DeleteIcon /></button>}
                                    </td>
                                </tr>
                            ))}
                             {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-10">
                                        <p className="font-semibold">No products found.</p>
                                        <p className="text-sm">Add a new product to get started.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryView;