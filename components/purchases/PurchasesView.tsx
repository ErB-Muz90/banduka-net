

import React, { useState, useMemo, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PurchaseOrder, Supplier, Product, PurchaseOrderData, Permission, Settings, PurchaseOrderItem, SalesOrder, Supplier as TSupplier } from '../types';
// FIX: Changed to a default import to match the export from CreatePOForm.
import CreatePOForm from './CreatePOForm';
import PODetailView from './PODetailView';

interface PurchasesViewProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    permissions: Permission[];
    onReceivePORequest: (purchaseOrder: PurchaseOrder) => void;
    onAddPurchaseOrder: (poData: PurchaseOrderData) => Promise<PurchaseOrder>;
    onAddSupplier: (supplierData: Omit<TSupplier, 'id'>) => Promise<TSupplier | null>;
    onSendPO: (poId: string) => void;
    onWhatsAppPORequest: (poId: string, supplierId: string) => void;
    settings: Settings;
    salesOrderForPO: SalesOrder | null;
    onClearSalesOrderForPO: () => void;
}

type ViewMode = 'list' | 'create';

const StatusBadge = ({ status }: { status: PurchaseOrder['status'] }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case 'Received':
            return <span className={`${baseClasses} text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300`}>Received</span>;
        case 'Partially Received':
            return <span className={`${baseClasses} text-sky-800 bg-sky-100 dark:bg-sky-900/50 dark:text-sky-300`}>Partially Received</span>;
        case 'Sent':
            return <span className={`${baseClasses} text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300`}>Sent</span>;
        case 'Draft':
            return <span className={`${baseClasses} text-yellow-800 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300`}>Draft</span>;
        case 'Cancelled':
            return <span className={`${baseClasses} text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-300`}>Cancelled</span>;
        default:
            return <span className={`${baseClasses} text-slate-800 bg-slate-100 dark:bg-slate-700 dark:text-slate-300`}>Unknown</span>;
    }
};

export const PurchasesView = ({ purchaseOrders, suppliers, products, onReceivePORequest, onAddPurchaseOrder, onAddSupplier, permissions, onSendPO, onWhatsAppPORequest, settings, salesOrderForPO, onClearSalesOrderForPO }: PurchasesViewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [prefilledItems, setPrefilledItems] = useState<Omit<PurchaseOrderItem, 'quantityReceived'>[] | null>(null);
    const [prefilledSalesOrderId, setPrefilledSalesOrderId] = useState<string | undefined>(undefined);
    const [reorderQuantities, setReorderQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        if (salesOrderForPO) {
            const itemsToOrder: Omit<PurchaseOrderItem, 'quantityReceived'>[] = salesOrderForPO.items
                .filter(p => p.status === 'Pending')
                .map(p => ({
                    productId: p.productId!,
                    productName: p.description,
                    quantity: p.quantity,
                    cost: products.find(prod => prod.id === p.productId)?.costPrice || 0,
                    unitOfMeasure: products.find(prod => prod.id === p.productId)?.unitOfMeasure || 'pc(s)',
                    salesOrderItemId: p.id
                }));
            
            setPrefilledItems(itemsToOrder);
            setPrefilledSalesOrderId(salesOrderForPO.id);
            setViewMode('create');
            onClearSalesOrderForPO();
        }
    }, [salesOrderForPO, products, onClearSalesOrderForPO]);

    const supplierMap = useMemo(() => {
        return suppliers.reduce((acc, supplier) => {
            acc[supplier.id] = supplier.name;
            return acc;
        }, {} as Record<string, string>);
    }, [suppliers]);
    
    const canManage = permissions.includes('manage_purchases');
    
    const lowStockItems = useMemo(() => {
        const threshold = settings.inventory?.lowStockThreshold ?? 3;
        return products.filter(p => p.productType === 'Inventory' && p.stock <= threshold);
    }, [products, settings.inventory.lowStockThreshold]);

    const handleReorderQuantityChange = (productId: string, value: string) => {
        const quantity = parseInt(value, 10);
        setReorderQuantities(prev => ({
            ...prev,
            [productId]: isNaN(quantity) || quantity < 0 ? 0 : quantity,
        }));
    };

    const itemsToReorderCount = useMemo(() => {
        return Object.values(reorderQuantities).filter((qty: number) => qty > 0).length;
    }, [reorderQuantities]);

    const handleCreatePOForReorderItems = () => {
        const itemsToOrder: Omit<PurchaseOrderItem, 'quantityReceived'>[] = lowStockItems
            .filter(p => (reorderQuantities[p.id] || 0) > 0)
            .map(p => ({
                productId: p.id,
                productName: p.name,
                quantity: reorderQuantities[p.id],
                cost: p.costPrice || 0,
                unitOfMeasure: p.unitOfMeasure,
            }));

        if (itemsToOrder.length === 0) {
            alert("Please enter a quantity greater than 0 for at least one item.");
            return;
        }

        setPrefilledItems(itemsToOrder);
        setPrefilledSalesOrderId(undefined);
        setViewMode('create');
    };

    const handleCancelCreatePO = () => {
        setViewMode('list');
        setPrefilledItems(null);
        setPrefilledSalesOrderId(undefined);
    };

    const handleSavePO = async (poData: PurchaseOrderData) => {
        const newPO = await onAddPurchaseOrder(poData);
        setViewMode('list');
        setPrefilledItems(null);
        setPrefilledSalesOrderId(undefined);
        setReorderQuantities({});
        setSelectedPO(newPO);
    };

    if (viewMode === 'create') {
        return (
            <CreatePOForm 
                suppliers={suppliers}
                products={products}
                onSave={handleSavePO}
                onCancel={handleCancelCreatePO}
                onAddSupplier={onAddSupplier}
                prefilledItems={prefilledItems || undefined}
                salesOrderId={prefilledSalesOrderId}
            />
        );
    }
    
    if (selectedPO) {
        return (
            <PODetailView
                purchaseOrder={selectedPO}
                supplier={suppliers.find(s => s.id === selectedPO.supplierId)}
                onBack={() => setSelectedPO(null)}
                onWhatsAppRequest={onWhatsAppPORequest}
                products={products}
                settings={settings}
                onSendPO={onSendPO}
                onReceivePORequest={onReceivePORequest}
                canManage={canManage}
            />
        );
    }


    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-background dark:bg-dark-background">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Purchases</h1>
                 {canManage && (
                    <button 
                        onClick={() => { setPrefilledItems(null); setViewMode('create'); }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary text-primary-content font-bold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Purchase Order
                    </button>
                )}
            </div>
            
            {canManage && lowStockItems.length > 0 && (
                <div 
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-warning/10 dark:bg-dark-warning/10 p-4 rounded-xl border border-warning/20 dark:border-dark-warning/20"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-warning dark:text-dark-warning">Items to Reorder ({lowStockItems.length})</h2>
                        <button
                            onClick={handleCreatePOForReorderItems}
                            disabled={itemsToReorderCount === 0}
                            whileTap={{ scale: 0.95 }}
                            className="bg-warning text-white font-bold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center text-sm disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            Create PO for {itemsToReorderCount > 0 ? `${itemsToReorderCount} Item(s)` : 'Items'}
                        </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {lowStockItems.map(item => (
                            <div key={item.id} className="bg-card dark:bg-dark-card p-3 rounded-lg flex justify-between items-center shadow-sm">
                                <div className="flex-grow">
                                    <p className="font-bold text-foreground dark:text-dark-foreground">{item.name}</p>
                                    <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted font-mono">{item.inventoryCode}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-foreground-muted dark:text-dark-foreground-muted">Stock</p>
                                        <p className="font-bold text-danger">{item.stock}</p>
                                    </div>
                                    <div className="w-24">
                                        <label htmlFor={`reorder-qty-${item.id}`} className="block text-xs font-semibold text-center text-foreground-muted dark:text-dark-foreground-muted mb-1">
                                            Qty to Order
                                        </label>
                                        <input
                                            id={`reorder-qty-${item.id}`}
                                            type="number"
                                            value={reorderQuantities[item.id] || 0}
                                            onChange={(e) => handleReorderQuantityChange(item.id, e.target.value)}
                                            min="0"
                                            className="w-full p-1 border border-border dark:border-dark-border rounded-md text-center bg-background dark:bg-dark-background"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted font-bold">
                        <tr>
                            <th scope="col" className="px-6 py-3">PO Number</th>
                            <th scope="col" className="px-6 py-3">Supplier</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Expected Date</th>
                            <th scope="col" className="px-6 py-3">Total Cost (Ksh)</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrders.map(po => (
                            <tr key={po.id} className="bg-card dark:bg-dark-card border-b dark:border-dark-border hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => setSelectedPO(po)}>
                                <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">{po.poNumber}</td>
                                <td className="px-6 py-4">{supplierMap[po.supplierId] || 'Unknown'}</td>
                                <td className="px-6 py-4"><StatusBadge status={po.status} /></td>
                                <td className="px-6 py-4">{new Date(po.expectedDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                                <td className="px-6 py-4 font-mono">{po.totalCost.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                     {canManage && po.status === 'Draft' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onSendPO(po.id); }}
                                            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 px-3 py-1 rounded-md"
                                        >
                                            Send PO
                                        </button>
                                    )}
                                    {canManage && (po.status === 'Sent' || po.status === 'Partially Received') && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onReceivePORequest(po); }}
                                            className="font-medium text-primary dark:text-dark-primary hover:text-primary-focus bg-primary/10 dark:bg-dark-primary/20 hover:bg-primary/20 px-3 py-1 rounded-md"
                                        >
                                            Receive Stock
                                        </button>
                                    )}
                                    {(po.status === 'Received' || po.status === 'Cancelled') && (
                                         <span className="font-medium text-foreground-muted dark:text-dark-foreground-muted">
                                           View Details
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
