import React from 'react';
import { SupplierPayment, SupplierInvoice, PurchaseOrder, Supplier, User, Settings } from '../types';

interface PaymentReconciliationProps {
    payment: SupplierPayment;
    invoice: SupplierInvoice;
    po: PurchaseOrder;
    supplier: Supplier;
    user: User;
    settings: Settings;
}

const ReconciliationRow: React.FC<{ label: string; value: string | number; valueClassName?: string; isBold?: boolean }> = ({ label, value, valueClassName, isBold }) => (
    <div className={`flex justify-between items-center py-2 border-b border-gray-200 ${isBold ? 'font-bold' : ''}`}>
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-sm text-gray-800 ${valueClassName || ''}`}>{value}</span>
    </div>
);


const PaymentReconciliation: React.FC<PaymentReconciliationProps> = ({ payment, invoice, po, supplier, user, settings }) => {
    
    const previousPayments = invoice.paidAmount - payment.amount;
    const newBalanceDue = invoice.totalAmount - invoice.paidAmount;
    
    const brandColor = '#2EAF7D';

    return (
        <div className="bg-white p-8 font-sans text-gray-800 w-full max-w-2xl mx-auto my-4 border border-gray-200 shadow-md">
            {/* Header */}
            <header className="text-center mb-8">
                <h1 className="text-2xl font-bold uppercase" style={{ color: brandColor }}>{settings.businessInfo.name || 'CRENEN LOGISTICS'}</h1>
                <p className="text-xs text-gray-500">{settings.businessInfo.location || 'MTWAPA - KILIFI'}</p>
                <p className="text-xs text-gray-500">Tel: {settings.businessInfo.phone} | Email: {settings.businessInfo.email}</p>
                <h2 className="text-lg font-semibold mt-4 tracking-wider border-b-2 pb-2" style={{ borderColor: brandColor }}>SUPPLIER PAYMENT RECONCILIATION</h2>
            </header>

            {/* Payment Details */}
            <section className="mb-6 p-4 border rounded-md border-gray-300">
                <h3 className="text-md font-semibold mb-2" style={{ color: brandColor, borderBottom: `2px solid ${brandColor}`, paddingBottom: '0.5rem' }}>Payment Details</h3>
                <div className="space-y-1">
                    <ReconciliationRow label="Transaction Number:" value={payment.id} />
                    <ReconciliationRow label="Payment Date:" value={new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <ReconciliationRow label="Purchase Order:" value={po.poNumber} />
                    <ReconciliationRow label="Supplier:" value={supplier.businessName || supplier.name} />
                    <ReconciliationRow label="Payment Method:" value={payment.method} />
                    <ReconciliationRow label="Reference Number:" value={payment.referenceNumber || 'N/A'} />
                    <ReconciliationRow label="Processed By:" value={payment.processedByName} />
                </div>
            </section>
            
            {/* Amount Paid */}
            <section className="mb-6 p-4 border rounded-md" style={{ borderColor: brandColor, backgroundColor: 'rgba(46, 175, 125, 0.1)' }}>
                <p className="text-sm font-semibold uppercase text-center" style={{ color: brandColor }}>Amount Paid</p>
                <p className="text-3xl font-bold text-center mt-1" style={{ color: brandColor }}>
                    {settings.businessInfo.currency} {payment.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 text-center mt-2">This payment has been recorded and applied to the account</p>
            </section>
            
            {/* Account Balance Summary */}
            <section className="p-4 border-2 rounded-md" style={{ borderColor: '#E95E4D', backgroundColor: 'rgba(233, 94, 77, 0.05)' }}>
                <h3 className="text-md font-semibold mb-2" style={{ color: brandColor, borderBottom: `2px solid ${brandColor}`, paddingBottom: '0.5rem' }}>Account Balance Summary</h3>
                 <div className="space-y-1">
                    <ReconciliationRow label="Original PO Total:" value={`${settings.businessInfo.currency} ${po.totalCost.toFixed(2)}`} />
                    <ReconciliationRow label="Previous Payments:" value={`${settings.businessInfo.currency} ${previousPayments.toFixed(2)}`} valueClassName="text-red-500"/>
                    <ReconciliationRow label="This Payment:" value={`${settings.businessInfo.currency} ${payment.amount.toFixed(2)}`} />
                    <div className="border-t border-gray-600 my-2"></div>
                    <ReconciliationRow 
                        label="New Balance Due:" 
                        value={`${settings.businessInfo.currency} ${newBalanceDue.toFixed(2)}`}
                        isBold={true}
                        valueClassName="text-xl"
                    />
                </div>
                 {newBalanceDue <= 0 && (
                    <div className="mt-4 p-3 text-center rounded-md font-bold text-white" style={{ backgroundColor: brandColor }}>
                        ✓ ACCOUNT FULLY PAID
                    </div>
                )}
            </section>

            {/* Signature */}
            <section className="mt-16 flex justify-end">
                <div className="w-1/2 text-center">
                    <div className="border-b border-gray-400"></div>
                    <p className="text-sm font-semibold mt-2">Authorized Signature</p>
                    <p className="text-xs text-gray-500">{settings.businessInfo.name} - Accounts Department</p>
                </div>
            </section>

             {/* Footer */}
            <footer className="text-center mt-16 text-xs text-gray-500">
                <p className="font-bold">{settings.businessInfo.name}</p>
                <p>{settings.businessInfo.location}</p>
                <div className="my-4 border-t border-gray-200"></div>
                <p>This is an official payment reconciliation document</p>
                <p>Generated on {new Date().toLocaleString()}</p>
                <p className="mt-2">This document serves as proof of payment and account reconciliation.</p>
                <p className="mt-1 font-semibold">Powered by Banduka POS™</p>
            </footer>
        </div>
    );
};

export default PaymentReconciliation;