

import React from 'react';
import { SalesOrder, Settings } from '../types';

interface SalesOrderDocumentProps {
    salesOrder: SalesOrder;
    settings: Settings;
}

const getWatermarkText = (status: SalesOrder['status']): string | null => {
    switch (status) {
        case 'Ordered':
        case 'Partially Received':
        case 'Received':
            return 'ORDERED';
        case 'Completed':
            return 'COMPLETED';
        case 'Cancelled':
            return 'CANCELLED';
        default:
            return null;
    }
};

const Watermark: React.FC<{ text: string }> = ({ text }) => (
    <div 
        style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            color: 'rgba(0, 0, 0, 0.08)',
            fontSize: '8rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            zIndex: 0,
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
        }}
    >
        {text}
    </div>
);

const SalesOrderDocument = React.forwardRef<HTMLDivElement, SalesOrderDocumentProps>(({ salesOrder, settings }, ref) => {
    const watermarkText = getWatermarkText(salesOrder.status);

    return (
        <div ref={ref} className="relative bg-white p-8 font-sans text-sm text-black w-full max-w-4xl mx-auto shadow-lg border">
            {watermarkText && <Watermark text={watermarkText} />}
            <div className="relative z-10">
                <header className="flex justify-between items-start pb-4 border-b">
                    <div>
                        {settings.businessInfo.logoUrl && (
                            <img src={settings.businessInfo.logoUrl} alt="Company Logo" className="h-16 max-w-xs object-contain mb-4"/>
                        )}
                        <h2 className="text-xl font-bold text-slate-800">{settings.businessInfo.name}</h2>
                        <p className="text-slate-600">{settings.businessInfo.location}</p>
                        <p className="text-slate-600">Tel: {settings.businessInfo.phone}</p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold uppercase text-slate-700 tracking-wide">Sales Order</h1>
                        <div className="mt-2 text-xs">
                            <p className="flex justify-end gap-2"><span className="text-slate-500">Order #:</span> <span className="font-semibold">{salesOrder.id}</span></p>
                            <p className="flex justify-end gap-2"><span className="text-slate-500">Date:</span> <span className="font-semibold">{new Date(salesOrder.createdDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</span></p>
                            <p className="flex justify-end gap-2"><span className="text-slate-500">Delivery By:</span> <span className="font-semibold">{salesOrder.deliveryDate ? new Date(salesOrder.deliveryDate).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'}) : 'N/A'}</span></p>
                        </div>
                    </div>
                </header>

                <section className="mt-8">
                    <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Customer</h3>
                    <p className="font-bold text-slate-800">{salesOrder.customerName}</p>
                </section>

                <section className="mt-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                                <th className="p-3 font-semibold">Item Description</th>
                                <th className="p-3 font-semibold text-center">Qty</th>
                                <th className="p-3 font-semibold text-right">Unit Price</th>
                                <th className="p-3 font-semibold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesOrder.items.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3 text-center">{item.quantity}</td>
                                    <td className="p-3 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                                    <td className="p-3 text-right font-mono font-semibold">{(item.unitPrice * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="flex justify-end mt-8">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-lg font-bold">
                            <span className="text-slate-800">Total</span>
                            <span className="font-mono text-slate-800">Ksh {salesOrder.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Deposit Paid</span>
                            <span className="font-mono text-slate-800">{salesOrder.deposit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2 text-red-600">
                            <span>Balance Due</span>
                            <span className="font-mono">Ksh {salesOrder.balance.toFixed(2)}</span>
                        </div>
                    </div>
                </section>
                
                <footer className="mt-16 pt-4 border-t text-xs text-slate-500 text-center">
                    <p>Thank you for your order!</p>
                </footer>
            </div>
        </div>
    );
});

export default SalesOrderDocument;