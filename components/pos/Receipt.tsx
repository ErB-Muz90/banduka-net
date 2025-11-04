import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Sale, Settings, Layaway } from '../../types';

interface ReceiptProps {
    sale: Sale;
    cashierName: string;
    settings: Settings;
    layaway?: Layaway;
}

const DottedSeparator = () => <div className="border-t border-dashed border-black my-2"></div>;

const Receipt = ({ sale, cashierName, settings, layaway }: ReceiptProps) => {
    
    const cashPayment = sale.payments.find(p => p.method === 'Cash');
    const amountTendered = cashPayment && sale.change > 0 ? cashPayment.amount : null;

    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const barcodeRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (qrCanvasRef.current && sale.kraQrCodeData) {
            QRCode.toCanvas(qrCanvasRef.current, sale.kraQrCodeData, { width: 128, margin: 1 }, (error) => {
                if (error) console.error("KRA QR Code Error:", error);
            });
        }
        if (barcodeRef.current && sale.id) {
            try {
                JsBarcode(barcodeRef.current, sale.id, {
                    format: "CODE128",
                    width: 1,
                    height: 40,
                    displayValue: false,
                    margin: 0,
                });
            } catch (e) {
                console.error("Barcode generation failed:", e);
            }
        }
    }, [sale.id, sale.kraQrCodeData]);

    const isLayawaySale = !!layaway;
    const isInstallmentSale = !isLayawaySale && sale.grandTotal && (sale.balanceDue !== undefined || sale.depositApplied !== undefined);

    const isDeposit = isLayawaySale && layaway.payments.length > 0 && layaway.payments[0].saleId === sale.id;
    // For deposit receipts, show all items. For subsequent payments, show only the payment line item.
    const itemsToDisplay = isLayawaySale && isDeposit ? layaway.items : sale.items;


    const isFinalPayment = isLayawaySale && layaway.balance <= 0;

    let receiptTitle = 'SALE RECEIPT';
    if (isLayawaySale) {
        if (isDeposit) receiptTitle = 'LAYAWAY DEPOSIT RECEIPT';
        else if (isFinalPayment) receiptTitle = 'LAYAWAY - PAID IN FULL';
        else receiptTitle = 'LAYAWAY INSTALLMENT';
    }

    return (
        <div className="bg-white p-4 font-mono text-xs text-black w-full max-w-xs mx-auto">
            
            {/* Header */}
            <div className="text-center mb-2">
                {settings.businessInfo.logoUrl && (
                    <img src={settings.businessInfo.logoUrl} alt="Business Logo" className="mx-auto h-16 w-auto object-contain mb-2" />
                )}
                <h2 className="text-base font-bold uppercase">{settings.businessInfo.name}</h2>
                {settings.businessInfo.branch && <p className="font-semibold">{settings.businessInfo.branch}</p>}
                <p>{settings.businessInfo.location}</p>
                <p>Tel: {settings.businessInfo.phone}</p>
                {settings.businessInfo.email && <p>Email: {settings.businessInfo.email}</p>}
                {settings.tax.etimsEnabled && settings.businessInfo.kraPin && <p>VAT PIN: {settings.businessInfo.kraPin}</p>}
            </div>

            <DottedSeparator />
            
             <div className="text-center font-bold text-base my-1">
                {receiptTitle}
            </div>
            {/* Info */}
             <table className="w-full">
                <tbody>
                    <tr>
                        <td className="text-left">Date: {new Date(sale.date).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                        <td className="text-right">Time: {new Date(sale.date).toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Africa/Nairobi' })}</td>
                    </tr>
                </tbody>
            </table>
            <p>Receipt No: {sale.id}</p>
            <p>Serial No: {sale.id}</p>
            <p>Cashier: {cashierName}</p>
            
            <DottedSeparator />

            {/* Items */}
            <table className="w-full">
                <thead>
                    <tr className="font-bold border-b border-dashed border-black">
                        <th className="text-left py-1" colSpan={3}>Item</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {(itemsToDisplay || []).map(item => {
                        const lineTotal = item.price * Math.abs(item.quantity);
                        let lineDiscountAmount = 0;
                        if (item.discount) {
                            if (item.discount.type === 'percentage') {
                                lineDiscountAmount = lineTotal * (item.discount.value / 100);
                            } else { // fixed
                                lineDiscountAmount = item.discount.value;
                            }
                            lineDiscountAmount = Math.min(lineTotal, lineDiscountAmount);
                        }

                        return (
                            <React.Fragment key={item.id}>
                                <tr>
                                    <td colSpan={4} className="pt-1 font-semibold">{item.name}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="pl-2 text-xs">{Math.abs(item.quantity)} x {item.price.toFixed(2)}</td>
                                    <td className="text-right">{lineTotal.toFixed(2)}</td>
                                </tr>
                                {lineDiscountAmount > 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-right text-xs italic text-gray-600">
                                            Discount: -{lineDiscountAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            
            <DottedSeparator />

            {/* Totals */}
            <table className="w-full">
                <tbody>
                    {isLayawaySale && layaway ? (
                        <>
                             <tr>
                                <td className="py-0.5">Layaway Total Value:</td>
                                <td className="text-right py-0.5 font-semibold">{layaway.total.toFixed(2)}</td>
                            </tr>
                             {!isDeposit && (
                                <tr>
                                    <td className="py-0.5">Previous Balance:</td>
                                    <td className="text-right py-0.5 font-semibold">{(layaway.balance + sale.total).toFixed(2)}</td>
                                </tr>
                            )}
                             <tr>
                                <td className="py-0.5">{isDeposit ? 'Deposit Paid' : 'Amount Paid Now'}:</td>
                                <td className="text-right py-0.5 font-semibold">{sale.total.toFixed(2)}</td>
                            </tr>
                            <tr className="font-bold">
                                <td className="py-0.5">Total Paid to Date:</td>
                                <td className="text-right py-0.5">{(layaway.total - layaway.balance).toFixed(2)}</td>
                            </tr>
                             <tr className="font-bold text-base border-y-2 border-double border-black my-1">
                                <td className="py-1">BALANCE DUE:</td>
                                <td className="text-right py-1">KSH {layaway.balance.toFixed(2)}</td>
                            </tr>
                             <tr>
                                <td colSpan={2} className="py-1 text-xs">
                                    Due By: {new Date(layaway.expiryDate).toLocaleDateString('en-GB')}
                                </td>
                            </tr>
                        </>
                    ) : isInstallmentSale ? (
                        <>
                             <tr>
                                <td className="py-0.5">Order Total:</td>
                                <td className="text-right py-0.5 font-semibold">{(sale.grandTotal || 0).toFixed(2)}</td>
                            </tr>
                            {sale.depositApplied && sale.depositApplied > 0 && (
                                <tr>
                                    <td className="py-0.5">Less Deposit Paid:</td>
                                    <td className="text-right py-0.5 font-semibold">-{(sale.depositApplied).toFixed(2)}</td>
                                </tr>
                            )}
                             <tr>
                                <td className="py-0.5">Amount Paid Now:</td>
                                <td className="text-right py-0.5 font-semibold">{sale.total.toFixed(2)}</td>
                            </tr>
                             <tr className="font-bold text-base border-y-2 border-double border-black my-1">
                                <td className="py-1">TOTAL PAID TO DATE:</td>
                                <td className="text-right py-1">KSH {((sale.depositApplied || 0) + sale.total).toFixed(2)}</td>
                            </tr>
                             <tr>
                                <td className="py-0.5">Balance Due:</td>
                                <td className="text-right py-0.5 font-semibold">{(sale.balanceDue ?? 0).toFixed(2)}</td>
                            </tr>
                        </>
                    ) : (
                        <>
                            <tr>
                                <td className="py-0.5">Gross Total:</td>
                                <td className="text-right py-0.5 font-semibold">{sale.subtotal.toFixed(2)}</td>
                            </tr>
                            {sale.discountAmount > 0 && (
                                <tr>
                                    <td className="py-0.5">Total Discounts:</td>
                                    <td className="text-right py-0.5 font-semibold">-{sale.discountAmount.toFixed(2)}</td>
                                </tr>
                            )}
                            <tr className="font-bold text-base border-y-2 border-double border-black my-1">
                                <td className="py-1">TOTAL PAID:</td>
                                <td className="text-right py-1">KSH {sale.total.toFixed(2)}</td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
            
            {settings.tax.vatEnabled && (
                <>
                <DottedSeparator />
                 <div className="space-y-1">
                    <p className="font-bold">VAT Breakdown:</p>
                     <table className="w-full">
                        <tbody>
                            <tr>
                                <td className="py-0.5">Taxable Amount:</td>
                                <td className="text-right py-0.5">{sale.taxableAmount.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="py-0.5">VAT ({settings.tax.vatRate}%):</td>
                                <td className="text-right py-0.5">{sale.tax.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                </>
            )}

            <DottedSeparator />
            
            <div>
                <p className="font-bold mb-1">Payment Details:</p>
                <table className="w-full">
                    <tbody>
                    {amountTendered !== null && (
                         <tr>
                            <td className="py-0.5">Amount Tendered (Cash):</td>
                            <td className="text-right py-0.5">{amountTendered.toFixed(2)}</td>
                        </tr>
                    )}
                    {sale.payments.map((p, i) => {
                        // Don't show the base cash payment if we are already showing "Tendered"
                        if(p.method === 'Cash' && amountTendered !== null) return null;
                        return (
                             <tr key={i}>
                                <td className="py-0.5">{p.method === 'Points' ? 'Loyalty Points' : p.method}:</td>
                                <td className="text-right py-0.5">{p.method === 'Points' ? `-${p.amount.toFixed(2)}` : p.amount.toFixed(2)}</td>
                            </tr>
                        )
                    })}
                    {sale.change > 0 && (
                        <tr className="font-bold">
                            <td className="py-0.5">Change:</td>
                            <td className="text-right py-0.5">{sale.change.toFixed(2)}</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            
            {settings.tax.etimsEnabled && sale.kraIcn && (
                <>
                    <DottedSeparator />
                    <div className="text-center my-2">
                        <p className="font-bold">KRA eTIMS INVOICE</p>
                        <p className="text-xs">ICN: <span className="font-mono">{sale.kraIcn}</span></p>
                        <div className="flex justify-center my-2">
                            <canvas ref={qrCanvasRef}></canvas>
                        </div>
                        <p className="text-[10px]">This is an official KRA receipt.</p>
                    </div>
                </>
            )}
            
            <div className="flex flex-col items-center my-4">
                <canvas ref={barcodeRef}></canvas>
            </div>
            
            <div className="text-center space-y-1">
                 {settings.receipt.footer.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
        </div>
    );
};

export default Receipt;