import React, { useState, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sale, SupplierInvoice, Settings } from '../types';

interface TaxReportViewProps {
    sales: Sale[];
    supplierInvoices: SupplierInvoice[];
    settings: Settings;
}

type Tab = 'SalesVAT' | 'InputVAT';


const ArrowDownCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>;
const ArrowUpCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><circle cx="12" cy="12" r="10" /><polyline points="16 12 12 8 8 12" /><line x1="12" y1="16" x2="12" y2="8" /></svg>;
const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

const StatCard: React.FC<{ title: string; value: string; icon: ReactNode; isWarning?: boolean }> = ({ title, value, icon, isWarning }) => (
    <div className={`bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm flex items-center space-x-4 border ${isWarning ? 'border-red-300 dark:border-red-500/50' : 'border-border dark:border-dark-border'}`}>
        <div className={`p-3 rounded-lg ${isWarning ? 'text-red-500 bg-red-100 dark:bg-red-900/50' : 'text-primary dark:text-dark-primary bg-muted dark:bg-dark-muted'}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-semibold">{title}</p>
            <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);


const aggregateDataByMonth = (items: any[], dateField: string, valueFields: { key: string, label: string }[]) => {
    const monthlyData: { [key: string]: { month: string, [key: string]: any } } = {};

    items.forEach(item => {
        const date = new Date(item[dateField]);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { 
                month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
            };
            valueFields.forEach(field => monthlyData[monthKey][field.key] = 0);
        }

        valueFields.forEach(field => {
            monthlyData[monthKey][field.key] += item[field.key] || 0;
        });
    });

    return Object.values(monthlyData).sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
};

const escapeForXml = (field: any): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    return str.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return '';
        }
    });
};

const exportToXLS = (data: any[], headers: { key: string, label: string }[], filename: string) => {
    const tableRows = data.map(row => {
        const cells = headers.map(header => {
            const value = row[header.key];
            let cellValue = value;
            if (header.key === 'date' && value instanceof Date) {
                cellValue = value.toLocaleString();
            } else if (typeof value === 'number' && !['quantity', 'itemsSold'].includes(header.key)) {
                cellValue = value.toFixed(2);
            }
            return `<td>${escapeForXml(cellValue)}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Tax Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body><table><thead><tr>${headers.map(h => `<th>${h.label}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    
    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};


const TaxReportView = ({ sales, supplierInvoices, settings }: TaxReportViewProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('SalesVAT');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filteredSales = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if(start) start.setHours(0,0,0,0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if(end) end.setHours(23,59,59,999);
        
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            if (start && saleDate < start) return false;
            if (end && saleDate > end) return false;
            return true;
        });
    }, [sales, dateFrom, dateTo]);

    const filteredInvoices = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if(start) start.setHours(0,0,0,0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if(end) end.setHours(23,59,59,999);

        return supplierInvoices.filter(invoice => {
            const invoiceDate = new Date(invoice.invoiceDate);
            if (start && invoiceDate < start) return false;
            if (end && invoiceDate > end) return false;
            return true;
        });
    }, [supplierInvoices, dateFrom, dateTo]);


    const salesVatHeaders = [
        { key: 'month', label: 'Month' },
        { key: 'taxableAmount', label: `Taxable Sales (${settings.businessInfo.currency})` },
        { key: 'tax', label: `VAT Payable (${settings.tax.vatRate}%) (${settings.businessInfo.currency})` },
        { key: 'total', label: `Gross Sales (${settings.businessInfo.currency})` },
    ];
    
    const inputVatHeaders = [
        { key: 'month', label: 'Month' },
        { key: 'subtotal', label: `Net Purchases (${settings.businessInfo.currency})` },
        { key: 'taxAmount', label: `VAT Input (${settings.tax.vatRate}%) (${settings.businessInfo.currency})` },
        { key: 'totalAmount', label: `Gross Purchases (${settings.businessInfo.currency})` },
    ];

    const salesVatData = useMemo(() => aggregateDataByMonth(filteredSales, 'date', [
        { key: 'taxableAmount', label: '' },
        { key: 'tax', label: '' },
        { key: 'total', label: '' }
    ]), [filteredSales]);

    const inputVatData = useMemo(() => aggregateDataByMonth(filteredInvoices, 'invoiceDate', [
        { key: 'subtotal', label: '' },
        { key: 'taxAmount', label: '' },
        { key: 'totalAmount', label: '' }
    ]), [filteredInvoices]);
    
    const formatCurrency = (amount: number) => `${settings.businessInfo.currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const summary = useMemo(() => {
        const totalSalesVat = filteredSales.reduce((acc, sale) => acc + sale.tax, 0);
        const totalInputVat = filteredInvoices.reduce((acc, inv) => acc + inv.taxAmount, 0);
        const netVatPosition = totalSalesVat - totalInputVat;
        return { totalSalesVat, totalInputVat, netVatPosition };
    }, [filteredSales, filteredInvoices]);
    
    const TabButton = ({ tab, label }: { tab: Tab, label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm ${
                activeTab === tab 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-foreground-muted'
            }`}
        >
            {label}
        </button>
    );

    const handleExport = () => {
        const dataToExport = activeTab === 'SalesVAT' ? salesVatData : inputVatData;
        const headers = activeTab === 'SalesVAT' ? salesVatHeaders : inputVatHeaders;
        const filename = activeTab === 'SalesVAT' ? 'vat_on_sales.xls' : 'vat_on_purchases.xls';

        if (dataToExport.length === 0) {
            alert('No data to export for the selected filters.');
            return;
        }

        exportToXLS(dataToExport, headers, filename);
    };

    const renderContent = () => {
        const headers = activeTab === 'SalesVAT' ? salesVatHeaders : inputVatHeaders;
        const data = activeTab === 'SalesVAT' ? salesVatData : inputVatData;
        
        return (
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase">
                    <tr>
                        {headers.map(h => <th key={h.key} scope="col" className="px-4 py-3">{h.label}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                    {data.length > 0 ? (
                        data.map(row => (
                            <tr key={row.month} className="hover:bg-muted dark:hover:bg-dark-muted">
                                {headers.map(h => (
                                    <td key={h.key} className={`px-4 py-3 ${h.key !== 'month' ? 'font-mono' : 'font-bold text-foreground dark:text-dark-foreground'}`}>
                                        {typeof row[h.key] === 'number' ? formatCurrency(row[h.key]) : row[h.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={headers.length} className="text-center py-10 text-foreground-muted">
                                No data available for the selected period.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    };

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                 <div>
                    <h1 className="text-3xl font-bold">Tax Report</h1>
                    <p className="text-foreground-muted dark:text-dark-foreground-muted mt-1">View and export VAT information for tax filing</p>
                </div>
                 <div className="flex items-center space-x-2 mt-4 md:mt-0">
                     <button 
                        onClick={handleExport}
                        whileTap={{ scale: 0.95 }}
                        className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Export to XLS</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard title="Total VAT Payable (Output)" value={formatCurrency(summary.totalSalesVat)} icon={<ArrowDownCircleIcon />} />
                <StatCard title="Total VAT Claimable (Input)" value={formatCurrency(summary.totalInputVat)} icon={<ArrowUpCircleIcon />} />
                <StatCard title="Net VAT Position" value={formatCurrency(summary.netVatPosition)} icon={<ScaleIcon />} isWarning={summary.netVatPosition > 0} />
            </div>
            
            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="dateFrom" className="text-sm font-medium text-foreground-muted">From</label>
                        <input type="date" id="dateFrom" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background" />
                    </div>
                     <div>
                        <label htmlFor="dateTo" className="text-sm font-medium text-foreground-muted">To</label>
                        <input type="date" id="dateTo" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background" />
                    </div>
                </div>

                <div className="flex border-b border-border dark:border-dark-border mb-4">
                    <TabButton tab="SalesVAT" label="VAT on Sales (Payable)" />
                    <TabButton tab="InputVAT" label="VAT on Purchases (Input)" />
                </div>
                 
                 <div className="overflow-x-auto">
                   <AnimatePresence mode="wait">
                        <div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderContent()}
                        </div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default TaxReportView;
