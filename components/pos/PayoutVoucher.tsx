import React from 'react';
import { Expense, Settings } from '../../types';

interface PayoutVoucherProps {
    payout: Expense;
    settings: Settings;
}

const PayoutVoucher = React.forwardRef<HTMLDivElement, PayoutVoucherProps>(({ payout, settings }, ref) => {
    return (
        <div ref={ref} className="bg-white p-6 font-sans text-sm text-black w-full max-w-lg mx-auto border border-black">
            {/* Header */}
            <header className="text-center pb-4 border-b border-black">
                <h1 className="text-xl font-bold uppercase">{settings.businessInfo.name}</h1>
                <h2 className="text-lg font-semibold uppercase">Cash Payout Voucher</h2>
            </header>
            
            {/* Details */}
            <section className="my-4 space-y-2 text-base">
                <div className="flex justify-between"><span>Date:</span> <span className="font-semibold">{new Date(payout.date).toLocaleString('en-GB')}</span></div>
                <div className="flex justify-between"><span>Voucher No:</span> <span className="font-mono">{payout.id}</span></div>
            </section>
            
            {/* Body */}
            <section className="my-4 border-y border-black py-4">
                <div className="flex justify-between">
                    <span>Paid to:</span>
                    <span className="font-bold border-b border-dotted border-black w-3/4 text-left px-2">{payout.payee || '____________________'}</span>
                </div>
                 <div className="flex justify-between mt-4">
                    <span>For the purpose of:</span>
                    <span className="font-bold border-b border-dotted border-black w-3/4 text-left px-2">{payout.reason}</span>
                </div>
                <div className="flex justify-between mt-4">
                    <span>Amount in words:</span>
                    <span className="font-bold border-b border-dotted border-black w-3/4 text-left px-2">{/* TODO: Number to words converter */}</span>
                </div>
            </section>
            
            {/* Amount Box */}
            <section className="flex justify-end my-4">
                <div className="border-2 border-black p-2 text-center">
                    <p className="text-xs font-semibold">Amount</p>
                    <p className="text-lg font-bold">Ksh {payout.amount.toFixed(2)}</p>
                </div>
            </section>

            {/* Signatures */}
            <footer className="mt-12 grid grid-cols-2 gap-8 text-sm">
                <div>
                    <div className="border-t border-black pt-1">Prepared by: <span className="font-semibold">{payout.cashierName}</span></div>
                </div>
                <div>
                    <div className="border-t border-black pt-1">Received by:</div>
                </div>
                <div>
                    <div className="border-t border-black pt-1">Authorized by:</div>
                </div>
                 <div>
                    <div className="border-t border-black pt-1">Signature &amp; Stamp</div>
                </div>
            </footer>
        </div>
    );
});

export default PayoutVoucher;