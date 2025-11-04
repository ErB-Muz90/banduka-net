import React from 'react';
import { motion } from 'framer-motion';
import { ICONS } from '../../constants';

interface OpenCashDrawerViewProps {
    onBack: () => void;
    onOpenDrawer: () => void;
}

const OpenCashDrawerView: React.FC<OpenCashDrawerViewProps> = ({ onBack, onOpenDrawer }) => {
    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50 dark:bg-dark-background flex items-center justify-center">
            <div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card dark:bg-dark-card p-8 rounded-xl shadow-xl text-center"
            >
                <div className="mx-auto bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 border-card dark:border-dark-card">
                    <div className="w-12 h-12">
                        {ICONS.openDrawer}
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Open Cash Drawer</h1>
                <p className="text-foreground-muted dark:text-dark-foreground-muted mt-4 mb-8">
                    Click the button below to send a signal to the connected receipt printer to open the cash drawer.
                </p>

                <button
                    onClick={onOpenDrawer}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-primary dark:bg-dark-primary text-primary-content font-bold py-4 rounded-lg text-lg hover:bg-primary-focus dark:hover:bg-dark-primary-focus transition-colors shadow-lg"
                >
                    Open Drawer
                </button>

                <div className="mt-6 p-3 bg-amber-50 dark:bg-dark-warning/10 border border-amber-200 dark:border-dark-warning/20 rounded-lg text-xs text-amber-800 dark:text-dark-warning">
                    <p><strong>Security Notice:</strong> This action will be recorded in the system's audit log for security and accountability purposes.</p>
                </div>

                <button onClick={onBack} className="mt-8 text-sm font-bold text-primary dark:text-dark-primary hover:underline">
                    &larr; Back to Point of Sale
                </button>
            </div>
        </div>
    );
};

export default OpenCashDrawerView;
