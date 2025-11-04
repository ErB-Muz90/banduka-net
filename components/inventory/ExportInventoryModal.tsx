
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';

export type ExportableField = 'name' | 'upc' | 'costPrice' | 'price' | 'description' | 'inventoryCode' | 'stock' | 'category' | 'unitOfMeasure';

const ALL_EXPORT_FIELDS: { key: ExportableField; label: string }[] = [
    { key: 'name', label: 'Product Name' },
    { key: 'upc', label: 'Barcode' },
    { key: 'costPrice', label: 'Unit Cost' },
    { key: 'price', label: 'Selling Price' },
    { key: 'description', label: 'Description' },
    { key: 'inventoryCode', label: 'SKU / Barcode' },
    { key: 'stock', label: 'Stock Quantity' },
    { key: 'category', label: 'Category' },
    { key: 'unitOfMeasure', label: 'Unit of Measure' },
];

interface ExportInventoryModalProps {
    onClose: () => void;
    onExport: (selectedFields: ExportableField[], format: 'csv' | 'xls') => void;
}

const ExportInventoryModal: React.FC<ExportInventoryModalProps> = ({ onClose, onExport }) => {
    const [selectedFields, setSelectedFields] = useState<ExportableField[]>(ALL_EXPORT_FIELDS.map(f => f.key));

    const handleFieldToggle = (fieldKey: ExportableField) => {
        setSelectedFields(prev => 
            prev.includes(fieldKey) ? prev.filter(f => f !== fieldKey) : [...prev, fieldKey]
        );
    };

    const handleSelectAll = () => setSelectedFields(ALL_EXPORT_FIELDS.map(f => f.key));
    const handleDeselectAll = () => setSelectedFields([]);

    const handleExportClick = (format: 'csv' | 'xls') => {
        if (selectedFields.length === 0) {
            alert("Please select at least one field to export.");
            return;
        }
        onExport(selectedFields, format);
    };

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-border dark:border-dark-border">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Export Inventory</h2>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground dark:text-dark-foreground-muted dark:hover:text-dark-foreground">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Select Fields to Export</label>
                            <div className="space-x-2">
                                <button onClick={handleSelectAll} className="text-xs font-semibold text-primary dark:text-dark-primary">Select All</button>
                                <button onClick={handleDeselectAll} className="text-xs font-semibold text-primary dark:text-dark-primary">Deselect All</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 border border-border dark:border-dark-border rounded-lg bg-background dark:bg-dark-background">
                            {ALL_EXPORT_FIELDS.map(field => (
                                <label key={field.key} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedFields.includes(field.key)}
                                        onChange={() => handleFieldToggle(field.key)}
                                        className="h-4 w-4 rounded text-primary border-border focus:ring-primary"
                                    />
                                    <span className="text-sm text-foreground dark:text-dark-foreground">{field.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-2">Export Format</label>
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={() => handleExportClick('xls')} className="flex flex-col items-center justify-center p-4 border-2 border-border dark:border-dark-border rounded-lg hover:border-primary dark:hover:border-dark-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                <span className="font-semibold text-foreground dark:text-dark-foreground">Excel (.xls)</span>
                           </button>
                           <button onClick={() => handleExportClick('csv')} className="flex flex-col items-center justify-center p-4 border-2 border-border dark:border-dark-border rounded-lg hover:border-primary dark:hover:border-dark-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                <span className="font-semibold text-foreground dark:text-dark-foreground">CSV (.csv)</span>
                           </button>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 mt-auto flex justify-end p-6 border-t border-border dark:border-dark-border">
                    <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ExportInventoryModal;
