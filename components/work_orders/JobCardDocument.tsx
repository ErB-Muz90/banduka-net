

import React from 'react';
import { WorkOrder, User, Settings, WorkOrderMaterial } from '../types';

interface JobCardDocumentProps {
    workOrder: WorkOrder;
    materials: WorkOrderMaterial[];
    users: User[];
    settings: Settings;
}

const JobCardDocument = React.forwardRef<HTMLDivElement, JobCardDocumentProps>(({ workOrder, materials, users, settings }, ref) => {
    const assignedTechnician = users.find(u => u.id === workOrder.assignedTo);

    return (
        <div ref={ref} className="bg-white p-8 font-sans text-sm text-black w-full max-w-4xl mx-auto shadow-lg border">
            <header className="flex justify-between items-start pb-4 border-b border-black">
                <div>
                    {settings.businessInfo.logoUrl && (
                        <img src={settings.businessInfo.logoUrl} alt="Company Logo" className="h-16 max-w-xs object-contain mb-4"/>
                    )}
                    <h2 className="text-xl font-bold text-slate-800">{settings.businessInfo.name}</h2>
                    <p className="text-slate-600">{settings.businessInfo.location}</p>
                    <p className="text-slate-600">Tel: {settings.businessInfo.phone}</p>
                    {settings.tax.etimsEnabled && settings.businessInfo.kraPin && <p className="text-slate-600">PIN: {settings.businessInfo.kraPin}</p>}
                </div>
                <div className="text-right">
                    <h1 className="text-3xl font-bold uppercase text-slate-700 tracking-wide">Job Card</h1>
                    <div className="mt-2 text-xs">
                        <p className="flex justify-end gap-2"><span className="text-slate-500">Job Card #:</span> <span className="font-semibold">{workOrder.id}</span></p>
                        <p className="flex justify-end gap-2"><span className="text-slate-500">Date:</span> <span className="font-semibold">{new Date(workOrder.createdAt).toLocaleDateString('en-GB', {timeZone: 'Africa/Nairobi'})}</span></p>
                    </div>
                </div>
            </header>

            <section className="mt-8 grid grid-cols-2 gap-4">
                 <div>
                    <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Customer Details</h3>
                    <p className="font-bold text-slate-800">{workOrder.customerName}</p>
                 </div>
                 <div className="text-right">
                     <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Promised Date</h3>
                    <p className="font-bold text-slate-800">{workOrder.promisedDate ? new Date(workOrder.promisedDate).toLocaleDateString('en-GB') : 'N/A'}</p>
                 </div>
            </section>
            
            <section className="mt-8">
                 <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Service Details</h3>
                 <div className="p-3 border rounded-md">
                    <p><span className="font-semibold">Item to be Serviced:</span> {workOrder.jobTitle}</p>
                    <p className="mt-2"><span className="font-semibold">Customer Complaint / Description of Work:</span></p>
                    <p className="text-slate-600 whitespace-pre-wrap pl-2">{workOrder.description}</p>
                 </div>
            </section>

             <section className="mt-8">
                <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Materials & Labor</h3>
                 <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                            <th className="p-2 font-semibold">Description</th>
                            <th className="p-2 font-semibold text-center">Qty</th>
                            <th className="p-2 font-semibold text-right">Unit Price</th>
                            <th className="p-2 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="p-2">{item.name}</td>
                                <td className="p-2 text-center">{item.qty}</td>
                                <td className="p-2 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                                <td className="p-2 text-right font-mono font-semibold">{item.lineTotal.toFixed(2)}</td>
                            </tr>
                        ))}
                         <tr className="border-b">
                            <td className="p-2">Labor Charges</td>
                            <td className="p-2 text-center">1</td>
                            <td className="p-2 text-right font-mono">{workOrder.labourAmount.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono font-semibold">{workOrder.labourAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            
            <section className="flex justify-end mt-4">
                <div className="w-full max-w-xs space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal:</span>
                        <span className="font-mono text-slate-800">{(workOrder.materialsSubtotal + workOrder.labourAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">VAT ({settings.tax.vatRate}%):</span>
                        <span className="font-mono text-slate-800">{workOrder.vatAmount.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-base font-bold border-t pt-1 mt-1">
                        <span className="text-slate-800">Total Cost:</span>
                        <span className="font-mono text-slate-800">Ksh {workOrder.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Amount Paid:</span>
                        <span className="font-mono text-green-600">{workOrder.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-1 mt-1 text-red-600">
                        <span>Balance Due:</span>
                        <span className="font-mono">Ksh {workOrder.balanceDue.toFixed(2)}</span>
                    </div>
                </div>
            </section>

            <section className="mt-8">
                <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Technician's Report / Work Done</h3>
                <div className="h-32 border-2 border-dashed rounded-md p-2 text-slate-600">
                </div>
            </section>
            
            <footer className="mt-12 pt-4 border-t">
                <p className="text-xs text-center text-slate-600">I, the undersigned, confirm that the service described above has been completed to my satisfaction.</p>
                <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <div className="border-b border-black pb-1 mt-8"></div>
                        <p className="mt-1 font-semibold">Client Signature</p>
                    </div>
                     <div>
                        <div className="border-b border-black pb-1 mt-8">{assignedTechnician?.name || ''}</div>
                        <p className="mt-1 font-semibold">Technician Signature</p>
                    </div>
                </div>
            </footer>
        </div>
    );
});

export default JobCardDocument;