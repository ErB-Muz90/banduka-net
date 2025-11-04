import React from 'react';
import { Supplier, SupplierInvoice, SupplierPayment, Settings, PurchaseOrder } from '../types';

interface SupplierStatementDocumentProps {
    supplier: Supplier;
    invoices: SupplierInvoice[];
    payments: SupplierPayment[];
    settings: Settings;
    purchaseOrders: PurchaseOrder[];
}

const SupplierStatementDocument = React.forwardRef<HTMLDivElement, SupplierStatementDocumentProps>((props, ref) => {
    const { supplier, invoices, payments, settings, purchaseOrders } = props;

    const transactions = React.useMemo(() => {
        const combined = [
            ...invoices.map(inv => ({
                date: new Date(inv.invoiceDate),
                description: `Invoice #${inv.invoiceNumber}`,
                debit: inv.totalAmount,
                credit: 0,
            })),
            ...payments.map(p => ({
                date: new Date(p.paymentDate),
                description: `Payment via ${p.method}`,
                debit: 0,
                credit: p.amount,
            })),
        ];
        return combined.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [invoices, payments]);

    let runningBalance = 0;

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const closingBalance = totalInvoiced - totalPaid;

    return (
        <div ref={ref} className="bg-white p-8 font-sans text-sm text-black w-full max-w-4xl mx-auto shadow-lg border">
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
                    <h1 className="text-3xl font-bold uppercase text-slate-700 tracking-wide">Supplier Statement</h1>
                    <p className="text-xs mt-2"><span className="text-slate-500">Date Issued:</span> <span className="font-semibold">{new Date().toLocaleDateString('en-GB')}</span></p>
                </div>
            </header>

            <section className="mt-8">
                <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Statement For</h3>
                <p className="font-bold text-slate-800">{supplier.businessName || supplier.name}</p>
                <p className="text-slate-600">{supplier.contact}</p>
                <p className="text-slate-600">{supplier.email}</p>
            </section>
            
            <section className="mt-8">
                <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Purchase Orders</h3>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                            <th className="p-3 font-semibold">PO #</th>
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrders.length > 0 ? purchaseOrders.map(po => (
                            <tr key={po.id} className="border-b">
                                <td className="p-3 font-semibold">{po.poNumber}</td>
                                <td className="p-3">{new Date(po.createdDate).toLocaleDateString('en-GB')}</td>
                                <td className="p-3">{po.status}</td>
                                <td className="p-3 text-right font-mono">{po.totalCost.toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-3 text-center text-slate-500">No purchase orders found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <section className="mt-8">
                <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Financial Statement</h3>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold">Transaction Details</th>
                            <th className="p-3 font-semibold text-right">Debit (Invoiced)</th>
                            <th className="p-3 font-semibold text-right">Credit (Paid)</th>
                            <th className="p-3 font-semibold text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((t, index) => {
                            runningBalance += t.debit - t.credit;
                            return (
                                <tr key={index} className="border-b">
                                    <td className="p-3">{t.date.toLocaleDateString('en-GB')}</td>
                                    <td className="p-3">{t.description}</td>
                                    <td className="p-3 text-right font-mono">{t.debit > 0 ? t.debit.toFixed(2) : '-'}</td>
                                    <td className="p-3 text-right font-mono text-green-600">{t.credit > 0 ? t.credit.toFixed(2) : '-'}</td>
                                    <td className="p-3 text-right font-mono font-semibold">{runningBalance.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>
            
            <section className="flex justify-end mt-8">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Total Invoiced:</span> <span className="font-mono text-slate-800">{totalInvoiced.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Total Paid:</span> <span className="font-mono text-green-600">{totalPaid.toFixed(2)}</span></div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                        <span className="text-slate-800">Balance Due:</span>
                        <span className="font-mono text-red-600">Ksh {closingBalance.toFixed(2)}</span>
                    </div>
                </div>
            </section>
            
            <footer className="mt-16 pt-4 border-t text-xs text-slate-500 text-center">
                <p>This is a computer-generated statement and does not require a signature.</p>
            </footer>
        </div>
    );
});

export default SupplierStatementDocument;