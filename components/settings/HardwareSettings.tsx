import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ToastData } from '../../types';
import * as escpos from '../../utils/escpos';

interface HardwareSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    showToast: (message: string, type: ToastData['type']) => void;
    onTestBarcodePrint: () => void;
}

const CustomRadio: React.FC<{ name: string; value: string; label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ name, value, label, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-400 dark:border-dark-foreground-muted peer-checked:border-primary dark:peer-checked:border-dark-primary transition-colors">
            <div className="w-2.5 h-2.5 bg-primary dark:bg-dark-primary rounded-full scale-0 peer-checked:scale-100 transition-transform" />
        </div>
        <span className="text-sm font-medium text-foreground dark:text-dark-foreground">{label}</span>
    </label>
);

const CustomToggle: React.FC<{ id: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ id, name, checked, onChange }) => (
    <label htmlFor={id} className="inline-flex relative items-center cursor-pointer">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} id={id} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 dark:bg-dark-muted rounded-full peer peer-checked:bg-primary dark:peer-checked:bg-dark-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
);


const HardwareSettings: React.FC<HardwareSettingsProps> = ({ settings, onUpdateSettings, showToast, onTestBarcodePrint }) => {
    const [formData, setFormData] = useState(settings.hardware);
    const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);

    useEffect(() => {
        const { vendorId, productId } = formData.printer;
        if (vendorId && productId) {
            escpos.getPermittedDevice(vendorId, productId).then(device => {
                if (device) {
                    setConnectedDeviceName(`${device.productName} (Permission granted)`);
                }
            });
        }
    }, [formData.printer]);

    const handlePrinterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const parsedValue = name === 'vendorId' || name === 'productId' ? parseInt(value) || undefined : value;
        setFormData(prev => ({
            ...prev,
            printer: { ...prev.printer, [name]: parsedValue }
        }));
    };
    
    const handleScannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            barcodeScanner: { ...prev.barcodeScanner, [name]: checked }
        }));
    };

    const handleBarcodePrinterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;

         setFormData(prev => ({
            ...prev,
            barcodePrinter: { 
                ...prev.barcodePrinter, 
                [name]: isCheckbox ? checked : value
            }
        }));
    };
    
    const handleConnectPrinter = async () => {
        try {
            const device = await escpos.requestAndConnectDevice();
            const newPrinterSettings = {
                ...formData.printer,
                vendorId: device.vendorId,
                productId: device.productId,
                name: device.productName
            };
            setFormData(prev => ({
                ...prev,
                printer: newPrinterSettings
            }));
            setConnectedDeviceName(device.productName || 'Unnamed Device');
            showToast(`Connected to ${device.productName}!`, 'success');
             onUpdateSettings({ hardware: { ...formData, printer: newPrinterSettings } });

        } catch (error: any) {
            if (error.name === 'NotFoundError') {
                return;
            }
            if (error.message?.includes("driver may be blocking access")) {
                const newPrinterSettings = { ...formData.printer, type: 'Browser' as const };
                const newHardwareData = { ...formData, printer: newPrinterSettings };
                setFormData(newHardwareData);
                onUpdateSettings({ hardware: newHardwareData });
                showToast("Direct connection failed. Switched to 'Browser Print' mode for compatibility.", 'warning');
            } else {
                showToast(error.message || 'Failed to connect.', 'error');
            }
            console.error("Printer connection error:", error);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ hardware: formData });
    };

    const handleTest = async (deviceType: 'Receipt Printer' | 'Label Printer' | 'Cash Drawer') => {
        if (deviceType === 'Receipt Printer') {
            if (formData.printer.type !== 'ESC/POS') {
                showToast('Test print is only available for ESC/POS direct printers.', 'info');
                return;
            }
            if (!formData.printer.vendorId || !formData.printer.productId) {
                showToast("Printer not configured. Please connect one using the 'Connect Printer' button before testing.", 'error');
                return;
            }
            try {
                showToast('Sending test print...', 'info');
                await escpos.printTest(formData.printer);
                showToast('Test print sent successfully!', 'success');
            } catch (error: any) {
                if (error.name === 'NotFoundError') { return; }
                if (error.message?.includes("driver may be blocking access")) {
                    const newPrinterSettings = { ...formData.printer, type: 'Browser' as const };
                    const newHardwareData = { ...formData, printer: newPrinterSettings };
                    setFormData(newHardwareData);
                    onUpdateSettings({ hardware: newHardwareData });
                    showToast("Test print failed. Switched to 'Browser Print' for compatibility.", 'warning');
                } else {
                    showToast(error.message || 'Test print failed.', 'error');
                }
                console.error("Test print error:", error);
            }
        } else if (deviceType === 'Cash Drawer') {
            if (formData.printer.type !== 'ESC/POS') {
                showToast('Cash drawer test is only available for ESC/POS direct printers.', 'info');
                return;
            }
            if (!formData.printer.vendorId || !formData.printer.productId) {
                showToast("Printer not configured. Please connect one to test the cash drawer.", 'error');
                return;
            }
            try {
                showToast('Sending open drawer signal...', 'info');
                await escpos.kickCashDrawer(formData.printer);
                showToast('Open drawer signal sent!', 'success');
            } catch (error: any) {
                if (error.name === 'NotFoundError') { return; }
                if (error.message?.includes("driver may be blocking access")) {
                    const newPrinterSettings = { ...formData.printer, type: 'Browser' as const };
                    const newHardwareData = { ...formData, printer: newPrinterSettings };
                    setFormData(newHardwareData);
                    onUpdateSettings({ hardware: newHardwareData });
                    showToast("Cash drawer test failed. Switched to 'Browser Print' for compatibility.", 'warning');
                } else {
                    showToast(error.message || 'Failed to open drawer.', 'error');
                }
                console.error("Cash drawer test error:", error);
            }
        } else { // Label Printer
             if (formData.barcodePrinter.type === 'ZPL') {
                showToast('Direct ZPL printing requires a backend or browser bridge application, which is not available in this version.', 'info');
                return;
             }
             onTestBarcodePrint();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Receipt Printer */}
            <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-clay-light dark:shadow-clay-dark">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">Receipt Printer & Cash Drawer</h3>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                        <button type="button" onClick={() => handleTest('Cash Drawer')} whileTap={{ scale: 0.95 }} className="bg-card dark:bg-dark-card text-primary dark:text-dark-primary text-sm font-semibold px-4 py-2 rounded-xl hover:bg-muted dark:hover:bg-dark-muted transition-shadow border border-primary dark:border-dark-primary shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset">
                            Test Drawer
                        </button>
                        <button type="button" onClick={() => handleTest('Receipt Printer')} whileTap={{ scale: 0.95 }} className="bg-card dark:bg-dark-card text-primary dark:text-dark-primary text-sm font-semibold px-4 py-2 rounded-xl hover:bg-muted dark:hover:bg-dark-muted transition-shadow border border-primary dark:border-dark-primary shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset">
                            Test Print
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-foreground dark:text-dark-foreground">Printer Type</p>
                        <div className="mt-2 flex space-x-6">
                            <CustomRadio name="type" value="Browser" label="Browser Print" checked={formData.printer.type === 'Browser'} onChange={handlePrinterChange} />
                            <CustomRadio name="type" value="ESC/POS" label="ESC/POS Direct" checked={formData.printer.type === 'ESC/POS'} onChange={handlePrinterChange} />
                        </div>
                        <p className="mt-2 text-xs text-foreground-muted dark:text-dark-foreground-muted">
                            Browser Print uses the standard browser print dialog. ESC/POS attempts to communicate directly with compatible receipt printers.
                        </p>
                    </div>
                    <AnimatePresence>
                        {formData.printer.type === 'ESC/POS' && (
                            <div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-4 border-t border-border dark:border-dark-border overflow-hidden">
                                <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">
                                   Direct USB printing via WebUSB requires user permission for each device.
                                </p>
                                <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg border border-border dark:border-dark-border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground dark:text-dark-foreground">USB Connection</p>
                                            <p className={`text-xs font-semibold ${connectedDeviceName?.includes('Permission') ? 'text-warning' : connectedDeviceName ? 'text-primary' : 'text-foreground-muted'}`}>
                                                {connectedDeviceName || 'Not Connected'}
                                            </p>
                                        </div>
                                        <button type="button" onClick={handleConnectPrinter} whileTap={{scale: 0.95}} className="bg-primary text-primary-content font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-focus transition-colors text-sm shadow-clay-dark active:shadow-clay-dark-inset">
                                            Connect Printer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Barcode Scanner */}
            <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-clay-light dark:shadow-clay-dark">
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground mb-4">Barcode Scanner</h3>
                <div className="flex justify-between items-center">
                    <label htmlFor="scanner-enabled-toggle" className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable Barcode Scanning</label>
                    <CustomToggle id="scanner-enabled-toggle" name="enabled" checked={formData.barcodeScanner.enabled} onChange={handleScannerChange} />
                </div>
                <p className="mt-4 text-xs text-foreground-muted dark:text-dark-foreground-muted">
                    Most USB scanners work by emulating a keyboard and should function automatically on the POS screen. This setting confirms the feature is active.
                </p>
            </div>

            {/* Barcode Label Printer */}
             <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-clay-light dark:shadow-clay-dark">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">Barcode Label Printer</h3>
                     <button type="button" onClick={() => handleTest('Label Printer')} disabled={!formData.barcodePrinter.enabled} whileTap={{ scale: 0.95 }} className="bg-card dark:bg-dark-card text-primary dark:text-dark-primary text-sm font-semibold px-4 py-2 rounded-xl hover:bg-muted dark:hover:bg-dark-muted transition-shadow border border-primary dark:border-dark-primary shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset disabled:opacity-50 disabled:cursor-not-allowed">
                        Test Label
                    </button>
                </div>
                <div className="flex justify-between items-center">
                     <label htmlFor="barcode-printer-enabled-toggle" className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable Label Printing</label>
                     <CustomToggle id="barcode-printer-enabled-toggle" name="enabled" checked={formData.barcodePrinter.enabled} onChange={handleBarcodePrinterChange} />
                </div>
                <p className="mt-4 text-xs text-foreground-muted dark:text-dark-foreground-muted">
                    Configure a printer for barcode labels from the inventory section. "Image" format is recommended for standard printers.
                </p>
            </div>

            <div className="flex justify-end pt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-xl transition-shadow shadow-clay-light dark:shadow-clay-dark active:shadow-clay-light-inset dark:active:shadow-clay-dark-inset">
                    Save Hardware Settings
                </button>
            </div>
        </form>
    );
};

export default HardwareSettings;
