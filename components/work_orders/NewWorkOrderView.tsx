// This component is the implementation of "WorkOrderForm.tsx" from the user prompt.
// It is named NewWorkOrderView.tsx to match the existing import in App.tsx.

import React, { useState, useMemo, useEffect } from 'react';
import { Customer, User, Settings, WorkOrder, Shift, Product, WorkOrderMaterial } from '../types';
import { motion } from 'framer-motion';
import SearchableCustomerDropdown from '../common/SearchableCustomerDropdown';

interface NewWorkOrderViewProps {
    products: Product[];
    customers: Customer[];
    users: User[];
    settings: Settings;
    onAddWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'cashierId' | 'cashierName' | 'shiftId'>, materials: Omit<WorkOrderMaterial, 'id' | 'workOrderId'>[], deposit: number) => void;
    onBack: () => void;
    activeShift: Shift | null;
}

const NewWorkOrderView: React.FC<NewWorkOrderViewProps> = ({ products, customers, users, settings, onAddWorkOrder, onBack, activeShift }) => {
    const [customerId, setCustomerId] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [description, setDescription] = useState('');
    const [promisedDate, setPromisedDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    const [assignedTo, setAssignedTo] = useState('');
    const [labourAmount, setLabourAmount] = useState<number | ''>('');
    const [materials, setMaterials] = useState<(Omit<WorkOrderMaterial, 'id'|'workOrderId'>)[]>([]);
    const [vatMode, setVatMode] = useState<'inclusive' | 'exclusive'>('exclusive');
    const [depositRequired, setDepositRequired] = useState<number | ''>('');
    const [depositToPay, setDepositToPay] = useState<number | ''>('');
    const [materialSearch, setMaterialSearch] = useState('');

    const materialSearchResults = useMemo(() => {
        if (!materialSearch) return [];
        return products.filter(p => p.productType === 'Inventory' && p.name.toLowerCase().includes(materialSearch.toLowerCase()) && !materials.some(m => m.materialId === p.id));
    }, [materialSearch, products, materials]);

    const totals = useMemo(() => {
        const materialsSubtotal = materials.reduce((acc, item) => acc + item.lineTotal, 0);
        const labour = Number(labourAmount) || 0;
        let vatAmount = 0;
        let totalCost = 0;
        
        const taxableBase = labour + materialsSubtotal;

        if (vatMode === 'exclusive') {
            vatAmount = taxableBase * (settings.tax.vatRate / 100);
            totalCost = taxableBase + vatAmount;
        } else { // inclusive
            totalCost = taxableBase;
            vatAmount = totalCost - (totalCost / (1 + settings.tax.vatRate / 100));
        }
        
        return { materialsSubtotal, vatAmount, totalCost };
    }, [labourAmount, materials, vatMode, settings.tax.vatRate]);

    const handleRemoveMaterial = (materialId: string) => {
        setMaterials(prev => prev.filter(m => m.materialId !== materialId));
    };

    const handleAddMaterial = (product: Product) => {
        setMaterials(prev => [...prev, {
            materialId: product.id,
            name: product.name,
            qty: 1,
            unitPrice: product.price,
            lineTotal: product.price
        }]);
        setMaterialSearch('');
    };
    
    const handleMaterialQtyChange = (materialId: string, qtyString: string) => {
        const qty = parseFloat(qtyString);
        setMaterials(prev => 
            prev.map(m => {
                if (m.materialId === materialId) {
                    const newQty = isNaN(qty) || qty < 0 ? 0 : qty;
                    return { ...m, qty: newQty, lineTotal: newQty * m.unitPrice };
                }
                return m;
            })
        );
    };


    const handleSubmit = () => {
        if (!customerId || !jobTitle) {
            alert('Please select a customer and enter a job title.');
            return;
        }
        
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const workOrderData: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'cashierId' | 'cashierName' | 'shiftId'> = {
            customerId,
            customerName: customer.name,
            jobTitle,
            description,
            status: 'Pending',
            promisedDate: promisedDate ? new Date(promisedDate).toISOString() : undefined,
            assignedTo,
            labourAmount: Number(labourAmount) || 0,
            materialsSubtotal: totals.materialsSubtotal,
            vatAmount: totals.vatAmount,
            totalCost: totals.totalCost,
            depositRequired: Number(depositRequired) || undefined,
            amountPaid: 0,
            balanceDue: totals.totalCost,
            vatMode,
        };
        
        onAddWorkOrder(workOrderData, materials, Number(depositToPay) || 0);
    };

    if (!activeShift) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Shift Not Active</h2>
                <p>You must start a shift to create a work order.</p>
                <button onClick={onBack} className="mt-4 bg-primary text-white px-4 py-2 rounded">Back</button>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted min-h-full">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">New Work Order</h1>
                    <button onClick={onBack} className="text-sm font-semibold hover:underline">Cancel</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 bg-card dark:bg-dark-card p-6 rounded-lg shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Customer *</label>
                                <SearchableCustomerDropdown customers={customers} selectedCustomerId={customerId} onCustomerChange={setCustomerId} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Job Title *</label>
                                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 p-2 border rounded-md"></textarea>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Promised Date</label>
                                <input type="date" value={promisedDate} onChange={e => setPromisedDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Assign To</label>
                                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Materials */}
                        <div className="pt-4 border-t">
                             <h3 className="font-semibold mb-2">Materials</h3>
                             <div className="relative">
                                <input type="text" value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} placeholder="Search to add material..." className="w-full p-2 border rounded-md" />
                                {materialSearch && (
                                    <ul className="absolute z-10 w-full bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                        {materialSearchResults.map(p => (
                                            <li key={p.id} onClick={() => handleAddMaterial(p)} className="p-2 hover:bg-muted dark:hover:bg-dark-muted cursor-pointer flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{p.name}</p>
                                                    <p className="text-xs text-foreground-muted">SKU: {p.inventoryCode}</p>
                                                </div>
                                                <span className="font-mono text-sm text-primary dark:text-dark-primary">{`Ksh ${p.price.toFixed(2)}`}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                             <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2">
                                {materials.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-foreground-muted pr-8">
                                        <span className="flex-grow">Product</span>
                                        <span className="w-40 text-center">Quantity</span>
                                        <span className="w-24 text-right">Line Total</span>
                                    </div>
                                )}
                                {materials.map(m => (
                                    <div key={m.materialId} className="flex items-center gap-2 p-2 rounded bg-muted dark:bg-dark-muted/50">
                                        <span className="flex-grow font-semibold text-sm">{m.name}</span>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                value={m.qty} 
                                                onChange={e => handleMaterialQtyChange(m.materialId, e.target.value)} 
                                                className="w-20 p-1 border rounded text-center bg-card dark:bg-dark-background border-border dark:border-dark-border"
                                                min="0"
                                                step="0.1"
                                            />
                                            <span className="text-xs text-foreground-muted">x {m.unitPrice.toFixed(2)}</span>
                                        </div>
                                        <span className="w-24 text-right font-mono font-semibold">Ksh {(m.qty * m.unitPrice).toFixed(2)}</span>
                                        <button type="button" onClick={() => handleRemoveMaterial(m.materialId)} className="text-danger/70 p-1 rounded-full hover:bg-danger/10 hover:text-danger">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary & Actions */}
                    <div className="space-y-6">
                        <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow-sm space-y-4">
                             <h2 className="text-lg font-bold border-b pb-2">Summary</h2>
                             <div className="flex justify-center bg-muted dark:bg-dark-muted p-1 rounded-md">
                                <button onClick={() => setVatMode('exclusive')} className={`w-1/2 text-sm py-1 rounded ${vatMode === 'exclusive' ? 'bg-white font-bold' : ''}`}>VAT Exclusive</button>
                                <button onClick={() => setVatMode('inclusive')} className={`w-1/2 text-sm py-1 rounded ${vatMode === 'inclusive' ? 'bg-white font-bold' : ''}`}>VAT Inclusive</button>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Labour Amount</label>
                                <input type="number" value={labourAmount} onChange={e => setLabourAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                            <div className="space-y-1 text-sm border-t pt-2">
                                <div className="flex justify-between"><span className="text-foreground-muted">Labour:</span> <span className="font-mono">{`Ksh ${(Number(labourAmount) || 0).toFixed(2)}`}</span></div>
                                <div className="flex justify-between"><span className="text-foreground-muted">Materials:</span> <span className="font-mono">{`Ksh ${totals.materialsSubtotal.toFixed(2)}`}</span></div>
                                <div className="flex justify-between"><span className="text-foreground-muted">VAT ({settings.tax.vatRate}%):</span> <span className="font-mono">{`Ksh ${totals.vatAmount.toFixed(2)}`}</span></div>
                                <div className="flex justify-between text-xl font-bold pt-2 border-t mt-2"><span className="">Total:</span> <span className="font-mono text-primary">{`Ksh ${totals.totalCost.toFixed(2)}`}</span></div>
                            </div>
                        </div>
                         <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow-sm space-y-4">
                             <h2 className="text-lg font-bold border-b pb-2">Payments</h2>
                            <div>
                                <label className="block text-sm font-medium">Deposit Required (Optional)</label>
                                <input type="number" value={depositRequired} onChange={e => setDepositRequired(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Deposit to Pay Now</label>
                                <input type="number" value={depositToPay} onChange={e => setDepositToPay(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2 text-danger"><span>Balance Due:</span> <span className="font-mono">{`Ksh ${(totals.totalCost - (Number(depositToPay) || 0)).toFixed(2)}`}</span></div>
                        </div>
                         <button type="button" onClick={handleSubmit} whileTap={{ scale: 0.98 }} className="w-full bg-primary text-primary-content font-bold py-3 rounded-lg text-lg">
                            Create & Proceed to POS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewWorkOrderView;
