

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SalesOrder, Settings, Sale, User, Payment, ToastData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SalesOrderDocument from './SalesOrderDocument';
import { SaleSuccessView } from '../pos/SaleSuccessView';

interface SalesOrderDetailViewProps {
    salesOrder: SalesOrder;
    onBack: () => void;
    onCreatePO: (salesOrder: SalesOrder) => void;
    onCancelRequest: (salesOrder: SalesOrder) => void;
    onUpdate: (salesOrder: SalesOrder) => void;
    settings: Settings;
    onDirectComplete: (salesOrder: SalesOrder, payments: Payment[]) => Promise<Sale>;
    sales: Sale[];
    currentUser: User;
    onWhatsAppReceiptRequest: (documentType: 'Receipt', saleId: string, customerId: string) => void;
    showToast: (message: string, type: ToastData['type']) => void;
}

const SOPaymentModal: React.FC<{
    balanceDue: number;
    onClose: () => void;
    onConfirm: (payments: Payment[]) => void;
}> = ({ balanceDue, onClose, onConfirm }) => {
    const [cashReceived, setCashReceived] = useState<string>(balanceDue.toString());
    const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('Cash');

    const amountToPay = balanceDue;
    const change = useMemo(() => {
        if (paymentMethod !== 'Cash' || cashReceived === '') return 0;
        const paid = Number(cashReceived);
        return Math.max(0, paid - amountToPay);
    }, [cashReceived, amountToPay, paymentMethod]);
    
    const canConfirm = useMemo(() => {
        if (paymentMethod === 'Cash') {
            return Number(cashReceived) >= amountToPay;
        }
        return true; // For Card/M-Pesa, we assume exact amount
    }, [cashReceived, amountToPay, paymentMethod]);

    const handleConfirmClick = () => {
        const payments: Payment[] = [];
        if (paymentMethod === 'Cash') {
            payments.push({ method: 'Cash', amount: Number(cashReceived) });
        } else {
            payments.push({ method: paymentMethod, amount: amountToPay });
        }
        onConfirm(payments);
    };

    return (
        <div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">Complete Payment</h3>
                <p className="text-2xl font-bold text-primary dark:text-dark-primary mt-2">Balance Due: Ksh {balanceDue.toFixed(2)}</p>
                
                <div className="my-4">
                    <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-2">Payment Method</label>
                    <div className="flex bg-muted dark:bg-dark-muted p-1 rounded-lg">
                        {(['Cash', 'M-Pesa', 'Card'] as const).map(method => (
                            <button key={method} onClick={() => setPaymentMethod(method)} className={`w-1/3 py-2 text-sm font-bold transition-colors rounded-md ${paymentMethod === method ? 'bg-card dark:bg-dark-card shadow text-primary dark:text-dark-primary' : 'text-foreground-muted dark:text-dark-foreground-muted'}`}>{method}</button>
                        ))}
                    </div>
                </div>

                {paymentMethod === 'Cash' && (
                     <div>
                        <label htmlFor="cash-received" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Cash Received</label>
                        <input
                            type="number"
                            id="cash-received"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm"
                            autoFocus
                        />
                        {change > 0 && <p className="mt-2 text-primary font-semibold">Change: Ksh {change.toFixed(2)}</p>}
                    </div>
                )}
                
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground rounded-md hover:bg-border dark:hover:bg-dark-border">Cancel</button>
                    <button onClick={handleConfirmClick} disabled={!canConfirm} className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary-focus disabled:bg-slate-400">
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
};


const getStatusIndex = (status: SalesOrder['status']): number => {
    switch (status) {
        case 'Pending': return 0;
        case 'Ordered': return 1;
        case 'Partially Received': return 2;
        case 'Received': return 3;
        case 'Completed': return 4;
        case 'Draft': return -1;
        case 'Cancelled': return -1; // Special case
        default: return 0;
    }
};

const ProgressBar: React.FC<{ currentStatus: SalesOrder['status'] }> = ({ currentStatus }) => {
    const statusSteps = ['Pending', 'Ordered', 'Receiving', 'Received', 'Completed'];
    const currentIndex = getStatusIndex(currentStatus);

    if (currentStatus === 'Cancelled' || currentStatus === 'Draft') {
        return (
            <div className="text-center p-4 bg-muted dark:bg-dark-muted/50 rounded-md">
                <p className={`font-bold ${currentStatus === 'Cancelled' ? 'text-danger' : 'text-foreground-muted dark:text-dark-foreground-muted'}`}>
                    Order {currentStatus}
                </p>
            </div>
        );
    }
    
    return (
        <div className="flex items-center w-full">
            {statusSteps.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;
                
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center text-center flex-shrink-0 w-24">
                            <div
                                animate={{ scale: isActive ? 1.1 : 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300
                                    ${isCompleted ? 'bg-success' : isActive ? 'bg-primary animate-pulse' : 'bg-muted dark:bg-dark-muted'}`}
                            >
                                {isCompleted ? '✓' : index + 1}
                            </div>
                            <p className={`mt-2 text-xs font-semibold transition-colors duration-300
                                ${isActive ? 'text-primary dark:text-dark-primary' : isCompleted ? 'text-foreground dark:text-dark-foreground' : 'text-foreground-muted dark:text-dark-foreground-muted'}`}>
                                {step}
                            </p>
                        </div>
                        {index < statusSteps.length - 1 && (
                            <div className={`flex-grow h-1 transition-colors duration-300 ${isCompleted ? 'bg-success' : 'bg-muted dark:bg-dark-muted'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// Helper function to wait for all images inside an element to load
const waitForImagesToLoad = (element: HTMLElement): Promise<void[]> => {
    const images = Array.from(element.getElementsByTagName('img'));
    const promises = images.map(img => {
        return new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
                resolve();
            } else {
                img.onload = () => resolve();
                img.onerror = () => {
                    console.warn(`Could not load image for PDF generation: ${img.src}`);
                    resolve(); // Resolve anyway to not block PDF generation
                };
            }
        });
    });
    return Promise.all(promises);
};


const SalesOrderDetailView: React.FC<SalesOrderDetailViewProps> = ({ salesOrder, onBack, onCreatePO, onCancelRequest, onUpdate, settings, onDirectComplete, sales, currentUser, onWhatsAppReceiptRequest, showToast }) => {
    const [isEditing, setIsEditing] = useState(salesOrder.status === 'Draft');
    const [editableSO, setEditableSO] = useState(salesOrder);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);

    const finalSaleForReprint = useMemo(() => {
        if (salesOrder.status !== 'Completed') return null;
        return sales.find(s => s.salesOrderId === salesOrder.id && !s.items.some(i => i.id.startsWith('SO_DEPOSIT')));
    }, [sales, salesOrder]);

    useEffect(() => {
        setEditableSO(salesOrder);
        if (salesOrder.status === 'Draft') {
            setIsEditing(true);
        }
    }, [salesOrder]);

    const handleConfirmPayment = async (payments: Payment[]) => {
        setIsPaymentModalOpen(false);
        try {
            const newSale = await onDirectComplete(salesOrder, payments);
            setCompletedSale(newSale); // This will trigger rendering of SaleSuccessView
        } catch (error) {
            console.error("Failed to complete sales order:", error);
            // A toast should be shown by App.tsx
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditableSO(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditableSO(prev => ({ ...prev, [name]: value ? new Date(value) : undefined }));
    };

    const handleSave = () => {
        onUpdate(editableSO);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditableSO(salesOrder);
        setIsEditing(false);
    };

    const handleDownloadPDF = async () => {
        if (!pdfRef.current || isDownloading) return;
        setIsDownloading(true);
        try {
            await waitForImagesToLoad(pdfRef.current);
            const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`SalesOrder_${salesOrder.id}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Sorry, there was an error generating the PDF. The logo might be causing an issue.");
        } finally {
            setIsDownloading(false);
        }
    };

    const canCreatePO = salesOrder.status === 'Pending' && salesOrder.items.some(i => i.status === 'Pending');
    const canCompleteSale = salesOrder.status === 'Received' && salesOrder.balance > 0;
    const canCancel = ['Draft', 'Pending', 'Ordered'].includes(salesOrder.status);
    const canFinalize = salesOrder.status === 'Draft';
    
    const handleFinalize = () => {
        onUpdate({ ...editableSO, status: 'Pending' });
        setIsEditing(false);
    };

    const formatISODate = (date?: Date): string => {
        if (!date) return '';
        try {
            return new Date(date).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    if (completedSale) {
        return <SaleSuccessView
            sale={completedSale}
            onNewSale={() => {
                setCompletedSale(null);
                if (!finalSaleForReprint) {
                    onBack();
                }
            }}
            currentUser={currentUser}
            settings={settings}
            onWhatsAppReceiptRequest={(id, custId) => onWhatsAppReceiptRequest('Receipt', id, custId)}
            shouldAutoPrint={true}
            showToast={showToast}
        />
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-muted dark:bg-dark-muted">
             <div className="hidden">
                 <div id="pdf-content-wrapper">
                    <SalesOrderDocument ref={pdfRef} salesOrder={salesOrder} settings={settings} />
                </div>
            </div>
             <AnimatePresence>
                {isPaymentModalOpen && (
                    <SOPaymentModal
                        balanceDue={salesOrder.balance}
                        onClose={() => setIsPaymentModalOpen(false)}
                        onConfirm={handleConfirmPayment}
                    />
                )}
            </AnimatePresence>
             <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Sales Order Details</h1>
                        <p className="font-mono text-foreground-muted dark:text-dark-foreground-muted">{salesOrder.id}</p>
                    </div>
                    <button onClick={onBack} className="text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">&larr; Back to List</button>
                </div>
                
                <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                    <h2 className="text-lg font-semibold mb-4 text-foreground dark:text-dark-foreground">Order Progress</h2>
                    <ProgressBar currentStatus={salesOrder.status} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                        <h2 className="text-lg font-semibold text-foreground dark:text-dark-foreground mb-4 border-b dark:border-dark-border pb-2">Ordered Items</h2>
                        <ul className="divide-y dark:divide-dark-border max-h-96 overflow-y-auto">
                            {salesOrder.items.map(item => (
                               <li key={item.id} className="p-3 flex justify-between items-center">
                                   <div>
                                       <p className="font-bold text-foreground dark:text-dark-foreground">{item.description}</p>
                                       <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">
                                            {item.quantity} x Ksh {item.unitPrice.toFixed(2)}
                                            {item.status !== 'Pending' && ` | Received: ${item.quantityReceived || 0}/${item.quantity}`} 
                                        </p>
                                   </div>
                                   <div>
                                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                           item.status === 'Received' ? 'bg-success/20 text-success' :
                                           item.status === 'Ordered' ? 'bg-indigo-500/20 text-indigo-500' :
                                           item.status === 'Partially Received' ? 'bg-sky-500/20 text-sky-500' :
                                           'bg-warning/20 text-warning'
                                       }`}>{item.status}</span>
                                   </div>
                               </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                             <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-foreground dark:text-dark-foreground">Order Information</h2>
                                {!isEditing && (salesOrder.status === 'Pending' || salesOrder.status === 'Draft') && (
                                    <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-primary dark:text-dark-primary hover:underline">Edit</button>
                                )}
                             </div>
                            {isEditing ? (
                                <div className="space-y-4 text-sm">
                                    <div><strong className="text-foreground-muted dark:text-dark-foreground-muted">Customer:</strong> <span className="font-semibold text-foreground dark:text-dark-foreground">{editableSO.customerName}</span></div>
                                    <div><strong className="text-foreground-muted dark:text-dark-foreground-muted">Date:</strong> <span className="font-semibold text-foreground dark:text-dark-foreground">{new Date(editableSO.createdDate).toLocaleDateString()}</span></div>
                                    <div>
                                        <label htmlFor="deliveryDate" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Delivery By:</label>
                                        <input type="date" id="deliveryDate" name="deliveryDate" value={formatISODate(editableSO.deliveryDate)} onChange={handleDateChange} className="mt-1 block w-full p-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"/>
                                    </div>
                                    <div className="mt-4">
                                        <label htmlFor="notes" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Notes/Address:</label>
                                        <textarea id="notes" name="notes" value={editableSO.notes || ''} onChange={handleFieldChange} rows={3} className="mt-1 block w-full p-2 border border-border dark:border-dark-border rounded-md bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm">
                                    <div><strong className="text-foreground-muted dark:text-dark-foreground-muted">Customer:</strong> <span className="font-semibold text-foreground dark:text-dark-foreground">{salesOrder.customerName}</span></div>
                                    <div><strong className="text-foreground-muted dark:text-dark-foreground-muted">Date:</strong> <span className="font-semibold text-foreground dark:text-dark-foreground">{new Date(salesOrder.createdDate).toLocaleDateString()}</span></div>
                                    <div><strong className="text-foreground-muted dark:text-dark-foreground-muted">Delivery By:</strong> <span className="font-semibold text-foreground dark:text-dark-foreground">{salesOrder.deliveryDate ? new Date(salesOrder.deliveryDate).toLocaleDateString() : 'N/A'}</span></div>
                                    <div className="mt-4 pt-4 border-t dark:border-dark-border">
                                        <strong className="text-foreground-muted dark:text-dark-foreground-muted text-sm">Notes/Address:</strong>
                                        <p className="text-sm p-2 bg-muted dark:bg-dark-muted/50 rounded mt-1 whitespace-pre-wrap">{salesOrder.notes || 'No notes provided.'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md space-y-2">
                             <div className="flex justify-between text-sm"><span className="text-foreground-muted dark:text-dark-foreground-muted">Total</span><span className="font-mono font-semibold">{`Ksh ${salesOrder.total.toFixed(2)}`}</span></div>
                             <div className="flex justify-between text-sm"><span className="text-foreground-muted dark:text-dark-foreground-muted">Deposit Paid</span><span className="font-mono font-semibold">{`Ksh ${salesOrder.deposit.toFixed(2)}`}</span></div>
                             <div className="flex justify-between font-bold text-lg text-danger pt-2 border-t dark:border-dark-border"><span>Balance Due</span><span className="font-mono">{`Ksh ${salesOrder.balance.toFixed(2)}`}</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md flex justify-end items-center gap-4">
                     <div className="flex-grow text-sm text-foreground-muted dark:text-dark-foreground-muted">
                        {canFinalize && <p>This is a draft. Finalize to make it a pending order.</p>}
                        {canCreatePO && <p>To be delivered. Create a Purchase Order for required items.</p>}
                        {canCompleteSale && <p>Ready for delivery. Complete sale to create an invoice and clear the balance.</p>}
                        {salesOrder.status === 'Completed' && <p>This order is complete.</p>}
                     </div>
                    {isEditing ? (
                        <>
                            <button onClick={handleCancelEdit} whileTap={{scale: 0.95}} className="bg-muted text-foreground dark:bg-dark-muted dark:text-dark-foreground font-bold py-2 px-4 rounded-lg hover:bg-border dark:hover:bg-dark-border text-sm">
                               Cancel
                            </button>
                            <button onClick={handleSave} whileTap={{scale: 0.95}} className="bg-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 text-sm">
                               Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleDownloadPDF} disabled={isDownloading} whileTap={{scale: 0.95}} className="bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 text-sm disabled:bg-slate-400">
                                {isDownloading ? 'Downloading...' : 'Download PDF'}
                            </button>
                            {canCancel && (
                                <button onClick={() => onCancelRequest(salesOrder)} whileTap={{scale: 0.95}} className="bg-danger text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 text-sm">
                                   Cancel Order
                               </button>
                            )}
                            {canFinalize && (
                                <button onClick={handleFinalize} whileTap={{scale: 0.95}} className="bg-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 text-sm">
                                   Finalize Order
                               </button>
                            )}
                            {canCreatePO && (
                                <button onClick={() => onCreatePO(salesOrder)} whileTap={{scale: 0.95}} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm">
                                    Create PO
                                </button>
                            )}
                            {canCompleteSale && (
                                <button onClick={() => setIsPaymentModalOpen(true)} whileTap={{scale: 0.95}} className="bg-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 text-sm">
                                   Complete Sale
                                </button>
                            )}
                            {finalSaleForReprint && (
                                <button onClick={() => setCompletedSale(finalSaleForReprint)} whileTap={{ scale: 0.95 }} className="bg-muted text-foreground dark:bg-dark-muted dark:text-dark-foreground font-bold py-2 px-4 rounded-lg hover:bg-border dark:hover:bg-dark-border text-sm">
                                    Reprint Receipt
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesOrderDetailView;