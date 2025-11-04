

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Customer, Settings, SalesOrder, Shift, SalesOrderItem } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface WhatsAppOrdersViewProps {
    products: Product[];
    customers: Customer[];
    settings: Settings;
    activeShift: Shift | null;
    onAddSalesOrder: (salesOrderData: Omit<SalesOrder, 'id' | 'cashierId' | 'cashierName' | 'shiftId' | 'balance'>) => Promise<SalesOrder>;
    onBack: () => void;
}

interface ParsedOrderItem {
    productName: string;
    inventoryCode: string;
    quantity: number;
}

interface ParsedOrder {
    customerPhoneNumber: string;
    customerName: string;
    items: ParsedOrderItem[];
    unmatchedItems: string[];
}

// Sub-component for displaying the final success state
const SuccessView: React.FC<{ salesOrder: SalesOrder, customerPhone: string, onStartNew: () => void }> = ({ salesOrder, customerPhone, onStartNew }) => {
    const confirmationMessage = `Hello ${salesOrder.customerName}, your order *#${salesOrder.id}* has been confirmed! Total is Ksh ${salesOrder.total.toFixed(2)}. We will notify you when it's ready for collection/delivery. Thank you!`;
    const whatsappLink = `https://wa.me/${customerPhone}?text=${encodeURIComponent(confirmationMessage)}`;

    return (
        <div className="text-center">
            <div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="mx-auto bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 w-24 h-24 rounded-full flex items-center justify-center mb-6"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Sales Order Created!</h2>
            <p className="text-foreground-muted dark:text-dark-foreground-muted mt-2">Sales Order <span className="font-bold text-foreground dark:text-dark-foreground">{salesOrder.id}</span> has been successfully created for {salesOrder.customerName}.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1EAE53] transition-colors shadow-md flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.296-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                    Send Confirmation
                </a>
                <button onClick={onStartNew} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold py-3 px-6 rounded-lg hover:bg-border dark:hover:bg-dark-border">
                    Process New Order
                </button>
            </div>
        </div>
    );
};


const WhatsAppOrdersView: React.FC<WhatsAppOrdersViewProps> = ({ products, customers, settings, activeShift, onAddSalesOrder, onBack }) => {
    const [conversation, setConversation] = useState('');
    const [parsedOrder, setParsedOrder] = useState<ParsedOrder | null>(null);
    const [matchedItems, setMatchedItems] = useState<SalesOrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdSalesOrder, setCreatedSalesOrder] = useState<SalesOrder | null>(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            customerPhoneNumber: { type: Type.STRING, description: "The customer's phone number in E.164 format (e.g., +254712345678). Infer from message if possible." },
            customerName: { type: Type.STRING, description: "The customer's name, if mentioned." },
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        productName: { type: Type.STRING, description: "The name of the product requested by the customer." },
                        inventoryCode: { type: Type.STRING, description: "The inventoryCode of the matched product from the provided list. If no exact match, leave empty." },
                        quantity: { type: Type.INTEGER, description: "The quantity of the product requested." }
                    }
                }
            },
            unmatchedItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of item descriptions mentioned by the customer that could not be confidently matched to any product in the provided list."
            }
        }
    };

    const handleParse = async () => {
        if (!conversation.trim()) return;
        setIsLoading(true);
        setError('');
        setParsedOrder(null);
        setMatchedItems([]);

        const productList = products.map(p => ({ inventoryCode: p.inventoryCode, name: p.name, price: p.price }));
        const prompt = `
            Here is a list of available products with their inventoryCode, name, and price:
            ${JSON.stringify(productList)}

            Here is a WhatsApp conversation from a customer:
            ---
            ${conversation}
            ---

            Please parse the conversation and extract the order details. The customer's phone number should be in E.164 format, assuming it's a Kenyan number if no country code is provided (prefix with +254 and remove leading 0).
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema
                },
            });
            
            const parsedJson: ParsedOrder = JSON.parse(response.text);
            setParsedOrder(parsedJson);

            // Match parsed items with local product data
            const newMatchedItems: SalesOrderItem[] = [];
            for (const item of parsedJson.items) {
                const product = products.find(p => p.inventoryCode === item.inventoryCode || p.name.toLowerCase() === item.productName.toLowerCase());
                if (product) {
                    newMatchedItems.push({
                        id: crypto.randomUUID(),
                        productId: product.id,
                        description: product.name,
                        quantity: item.quantity,
                        unitPrice: product.price,
                        pricingType: product.pricingType,
                        status: 'Pending',
                        quantityReceived: 0,
                    });
                } else {
                    // Add to unmatched if Gemini found it but we can't locally
                    parsedJson.unmatchedItems.push(`${item.quantity} x ${item.productName}`);
                }
            }
            setMatchedItems(newMatchedItems);

        } catch (err: any) {
            console.error("Gemini API Error:", err);
            setError("Failed to parse conversation with AI. Please check the text or try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        if (!parsedOrder || matchedItems.length === 0) {
            setError('No valid items to create an order.');
            return;
        }

        const total = matchedItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
        
        let customer = customers.find(c => c.phone.replace(/\s/g, '') === parsedOrder.customerPhoneNumber.replace(/\s/g, ''));
        if (!customer) {
            // In a real app, you might want to auto-create the customer.
            // For now, we'll assign to walk-in and put details in notes.
            customer = customers.find(c => c.id === 'cust001');
        }

        const salesOrderData: Omit<SalesOrder, 'id' | 'cashierId' | 'cashierName' | 'shiftId' | 'balance'> = {
            customerId: customer!.id,
            customerName: parsedOrder.customerName || customer!.name,
            items: matchedItems,
            total,
            deposit: 0,
            status: 'Pending',
            createdDate: new Date(),
            notes: `Order received via WhatsApp from ${parsedOrder.customerName} (${parsedOrder.customerPhoneNumber}). Unmatched items: ${parsedOrder.unmatchedItems.join(', ') || 'None'}`,
        };

        try {
            const newSO = await onAddSalesOrder(salesOrderData);
            setCreatedSalesOrder(newSO);
        } catch(err) {
            setError('Failed to create sales order.');
        }
    };
    
    const handleStartNew = () => {
        setConversation('');
        setParsedOrder(null);
        setMatchedItems([]);
        setError('');
        setCreatedSalesOrder(null);
    };

    if (!activeShift) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Shift Not Active</h1>
                <p className="mt-2 text-foreground-muted dark:text-dark-foreground-muted">You must start a shift before processing WhatsApp orders.</p>
                <button onClick={onBack} className="mt-6 bg-primary text-primary-content font-bold py-2 px-6 rounded-lg">Back to POS</button>
            </div>
        );
    }
    
     if (createdSalesOrder && parsedOrder) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <SuccessView salesOrder={createdSalesOrder} customerPhone={parsedOrder.customerPhoneNumber} onStartNew={handleStartNew} />
            </div>
        );
    }


    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-background dark:bg-dark-background">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Process WhatsApp Order</h1>
                    <button onClick={onBack} className="text-sm font-bold text-primary dark:text-dark-primary hover:text-primary-focus">&larr; Back to POS</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Column */}
                    <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md space-y-4">
                        <h2 className="text-lg font-semibold text-foreground dark:text-dark-foreground">1. Paste Conversation</h2>
                        <textarea
                            value={conversation}
                            onChange={e => setConversation(e.target.value)}
                            rows={15}
                            placeholder="Paste the customer's WhatsApp chat here..."
                            className="w-full p-3 border border-border dark:border-dark-border rounded-md focus:ring-primary focus:border-primary bg-background dark:bg-dark-background"
                        />
                        <button
                            onClick={handleParse}
                            disabled={isLoading}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-primary text-primary-content font-bold py-3 rounded-lg text-lg hover:bg-primary-focus disabled:bg-slate-400 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Parsing...
                                </>
                            ) : "Parse with AI"}
                        </button>
                        {error && <p className="text-danger text-sm text-center">{error}</p>}
                    </div>

                    {/* Preview Column */}
                    <div className="bg-card dark:bg-dark-card p-6 rounded-xl shadow-md">
                        <h2 className="text-lg font-semibold text-foreground dark:text-dark-foreground">2. Review & Create Order</h2>
                        <AnimatePresence mode="wait">
                            {!parsedOrder ? (
                                <div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full text-foreground-muted dark:text-dark-foreground-muted">
                                    <p>AI-parsed order details will appear here.</p>
                                </div>
                            ) : (
                                <div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-4">
                                    <div>
                                        <h3 className="font-bold text-foreground-muted dark:text-dark-foreground-muted">Customer Details</h3>
                                        <p><strong>Name:</strong> {parsedOrder.customerName || 'N/A'}</p>
                                        <p><strong>Phone:</strong> {parsedOrder.customerPhoneNumber}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground-muted dark:text-dark-foreground-muted">Matched Items</h3>
                                        {matchedItems.length > 0 ? (
                                            <ul className="divide-y divide-border dark:divide-dark-border">
                                                {matchedItems.map(item => (
                                                    <li key={item.id} className="py-2 flex justify-between">
                                                        <span>{item.quantity} x {item.description}</span>
                                                        <span className="font-mono">Ksh {(item.unitPrice * item.quantity).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">No items were matched to your products.</p>}
                                    </div>
                                    {parsedOrder.unmatchedItems.length > 0 && (
                                         <div className="p-3 bg-amber-50 dark:bg-dark-warning/10 border border-amber-200 dark:border-dark-warning/20 rounded-md">
                                            <h3 className="font-bold text-amber-800 dark:text-dark-warning">Unmatched Items</h3>
                                            <ul className="text-sm text-amber-700 dark:text-dark-warning/80 list-disc list-inside">
                                                {parsedOrder.unmatchedItems.map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="border-t dark:border-dark-border pt-2 flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="font-mono">Ksh {matchedItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0).toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={matchedItems.length === 0}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-primary text-primary-content font-bold py-3 rounded-lg text-lg hover:bg-primary-focus disabled:bg-slate-400"
                                    >
                                        Create Sales Order
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WhatsAppOrdersView;