
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import JsBarcode from 'jsbarcode';
import { Product } from '../types';

interface BarcodePrintModalProps {
    product: Product;
    onClose: () => void;
}

const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({ product, onClose }) => {
    const [barcodeType, setBarcodeType] = useState<'inventoryCode' | 'upc'>(product.upc ? 'upc' : 'inventoryCode');
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(12);
    const [labelWidth, setLabelWidth] = useState(40);
    const [labelHeight, setLabelHeight] = useState(30);
    const [columns, setColumns] = useState(2);
    const [fontSize, setFontSize] = useState(8);

    const codeToPrint = useMemo(() => (barcodeType === 'upc' && product.upc) ? product.upc : product.inventoryCode, [barcodeType, product]);

    useEffect(() => {
        // This effect will run after the component renders with the new quantity of SVGs
        setError(null);
        if (codeToPrint) {
            try {
                JsBarcode('.barcode-svg', codeToPrint, {
                    format: barcodeType === 'upc' && product.upc ? "UPCA" : "CODE128",
                    displayValue: true,
                    fontSize: 14,
                    margin: 2,
                    height: 30,
                    width: 1.5,
                    valid: (valid) => {
                        if (!valid) {
                            setError(`The provided ${barcodeType.toUpperCase()} is not valid for this barcode type.`);
                        }
                    }
                });
            } catch (e: any) {
                console.error("Barcode generation failed:", e);
                setError(e.message || `Failed to generate ${barcodeType.toUpperCase()} barcode.`);
            }
        } else {
             setError(`No ${barcodeType === 'upc' ? 'UPC' : 'Inventory Code'} code available for this product.`);
        }
    }, [codeToPrint, barcodeType, quantity, columns, labelWidth, labelHeight, product.upc]);
    
    const handlePrint = () => {
        window.print();
    };

    return (
         <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-border dark:border-dark-border">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Print Barcode Labels</h2>
                    <button onClick={onClose} className="text-foreground-muted hover:text-foreground dark:text-dark-foreground-muted dark:hover:text-dark-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-80 flex-shrink-0 p-6 space-y-4 border-r border-border dark:border-dark-border overflow-y-auto">
                        <h3 className="font-bold text-foreground dark:text-dark-foreground">Print Settings</h3>
                        {product.upc && (
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground">Barcode Type</label>
                                <div className="mt-1 flex justify-center bg-muted dark:bg-dark-muted p-1 rounded-lg">
                                    <button onClick={() => setBarcodeType('inventoryCode')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors w-1/2 ${barcodeType === 'inventoryCode' ? 'bg-card dark:bg-dark-card shadow text-primary dark:text-dark-primary' : 'text-foreground-muted dark:text-dark-foreground-muted'}`}>Inv. Code</button>
                                    <button onClick={() => setBarcodeType('upc')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors w-1/2 ${barcodeType === 'upc' ? 'bg-card dark:bg-dark-card shadow text-primary dark:text-dark-primary' : 'text-foreground-muted dark:text-dark-foreground-muted'}`}>UPC</button>
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Quantity to Print</label>
                            <input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="columns" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Columns per Row</label>
                            <input id="columns" type="number" value={columns} onChange={e => setColumns(Number(e.target.value))} min="1" className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="labelWidth" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Label Width (mm)</label>
                            <input id="labelWidth" type="number" value={labelWidth} onChange={e => setLabelWidth(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md" />
                        </div>
                         <div>
                            <label htmlFor="labelHeight" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Label Height (mm)</label>
                            <input id="labelHeight" type="number" value={labelHeight} onChange={e => setLabelHeight(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="fontSize" className="block text-sm font-medium text-foreground dark:text-dark-foreground">Font Size (pt)</label>
                            <input id="fontSize" type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md" />
                        </div>
                    </div>
                    <div className="flex-grow p-4 overflow-auto bg-background dark:bg-dark-background">
                        {error ? (
                            <div className="h-full flex items-center justify-center text-danger font-semibold text-sm p-4 text-center">
                               {error}
                            </div>
                        ) : (
                             <div id="barcode-to-print" style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                gap: '1mm',
                                justifyItems: 'center'
                            }}>
                                {Array.from({ length: quantity }).map((_, index) => (
                                    <div key={index} style={{
                                        width: `${labelWidth}mm`,
                                        height: `${labelHeight}mm`,
                                        padding: '1mm',
                                        border: '1px dashed #ccc',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        pageBreakInside: 'avoid',
                                        backgroundColor: 'white',
                                        overflow: 'hidden'
                                    }}>
                                        <p className="text-black font-bold text-center" style={{ fontSize: `${fontSize}pt`, lineHeight: 1.1, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{product.name}</p>
                                        <p className="text-black font-semibold text-center" style={{ fontSize: `${fontSize - 1}pt`, lineHeight: 1.1, margin: 0 }}>Ksh {product.price.toFixed(2)}</p>
                                        <svg className="barcode-svg" style={{maxWidth: '100%', height: 'auto'}}></svg>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 mt-auto flex justify-end space-x-3 p-6 border-t border-border dark:border-dark-border">
                    <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button onClick={handlePrint} disabled={!!error} whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-md flex items-center disabled:bg-slate-400 disabled:cursor-not-allowed">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h1v-4a1 1 0 011-1h10a1 1 0 011 1v4h1a2 2 0 002-2v-6a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                        Print Labels
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BarcodePrintModal;