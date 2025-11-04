
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

type MappableField = 'name' | 'price' | 'stock' | 'costPrice' | 'inventoryCode' | 'upc' | 'category' | 'description' | 'unitOfMeasure';

const TARGET_FIELDS: { key: MappableField; label: string; required: boolean; aliases: string[] }[] = [
    { key: 'name', label: 'Product Name', required: true, aliases: ['name', 'productname', 'title', 'item'] },
    { key: 'price', label: 'Selling Price', required: true, aliases: ['price', 'sellingprice', 'saleprice', 'rate'] },
    { key: 'stock', label: 'Stock Quantity', required: true, aliases: ['stock', 'quantity', 'qty', 'onhand', 'stockonhand'] },
    { key: 'costPrice', label: 'Cost Price', required: false, aliases: ['cost', 'costprice', 'unitcost', 'purchaseprice'] },
    { key: 'inventoryCode', label: 'SKU / Inventory Code', required: false, aliases: ['sku', 'inventorycode', 'code', 'itemcode'] },
    { key: 'upc', label: 'UPC / Barcode', required: false, aliases: ['upc', 'barcode', 'ean'] },
    { key: 'category', label: 'Category', required: false, aliases: ['category', 'type', 'department'] },
    { key: 'description', label: 'Description', required: false, aliases: ['description', 'desc'] },
    { key: 'unitOfMeasure', label: 'Unit of Measure', required: false, aliases: ['unit', 'unitofmeasure', 'uom'] },
];

interface CsvImportModalProps {
    onClose: () => void;
    onImportConfirm: (mapping: { [key in MappableField]?: string }) => void;
    csvHeaders: string[];
    csvPreview: string[][];
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({ onClose, onImportConfirm, csvHeaders, csvPreview }) => {
    
    const initialMapping = useMemo(() => {
        const mapping: { [key in MappableField]?: string } = {};
        const lowerCaseHeaders = csvHeaders.map(h => h.toLowerCase().replace(/[\s_-]/g, ''));
        
        TARGET_FIELDS.forEach(field => {
            for (const alias of field.aliases) {
                const headerIndex = lowerCaseHeaders.indexOf(alias);
                if (headerIndex !== -1) {
                    mapping[field.key] = csvHeaders[headerIndex];
                    break;
                }
            }
        });
        return mapping;
    }, [csvHeaders]);

    const [mapping, setMapping] = useState(initialMapping);

    const handleMappingChange = (fieldKey: MappableField, csvHeader: string) => {
        setMapping(prev => ({ ...prev, [fieldKey]: csvHeader }));
    };

    const isMappingValid = useMemo(() => {
        return TARGET_FIELDS.every(field => {
            if (field.required) {
                return mapping[field.key] && mapping[field.key] !== '__do_not_import__';
            }
            return true;
        });
    }, [mapping]);
    
    return (
        <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-6 border-b border-border dark:border-dark-border">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Map CSV Columns to Product Fields</h2>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mt-1">Match the columns from your uploaded file to the required fields in the application.</p>
                </div>
                
                <div className="flex-grow p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Mapping Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Field Mapping</h3>
                        {TARGET_FIELDS.map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">
                                    {field.label} {field.required && <span className="text-danger">*</span>}
                                </label>
                                <select 
                                    value={mapping[field.key] || '__do_not_import__'}
                                    onChange={e => handleMappingChange(field.key, e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border dark:border-dark-border bg-background dark:bg-dark-background focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                >
                                    <option value="__do_not_import__">-- Do not import --</option>
                                    {csvHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Preview Section */}
                    <div className="overflow-x-auto">
                         <h3 className="font-semibold text-lg mb-4">Data Preview</h3>
                         <div className="border border-border dark:border-dark-border rounded-lg overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted dark:bg-dark-muted">
                                    <tr>
                                        {csvHeaders.map((header, index) => (
                                            <th key={index} className="p-2 font-semibold truncate">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border dark:divide-dark-border">
                                    {csvPreview.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {row.map((cell, cellIndex) => (
                                                <td key={cellIndex} className="p-2 truncate">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                         <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted mt-2">Showing first {csvPreview.length} rows of your file.</p>
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-between items-center p-6 border-t border-border dark:border-dark-border">
                    <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">* Required fields</p>
                    <div className="flex space-x-3">
                        <button type="button" onClick={onClose} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold px-4 py-2 rounded-lg">Cancel</button>
                        <button onClick={() => onImportConfirm(mapping as any)} disabled={!isMappingValid} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-lg disabled:bg-slate-400">
                            Confirm & Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsvImportModal;
