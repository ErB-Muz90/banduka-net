

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, User, AuditLog, ToastData, DriveUser, Account } from '../types';
import BusinessInfoSettings from './settings/BusinessInfoSettings';
import { TaxSettings } from './settings/TaxSettings';
import UsersPermissionsSettings from './settings/UsersPermissionsSettings';
import ReceiptSettings from './settings/ReceiptSettings';
import AuditLogSettings from './settings/AuditLogSettings';
import LoyaltySettings from './settings/LoyaltySettings';
import DiscountSettings from './settings/DiscountSettings';
import HardwareSettings from './settings/HardwareSettings';
import PaymentMethodsSettings from './settings/PaymentMethodsSettings';
import InventorySettings from './settings/InventorySettings';
import DataManagementSettings from './settings/DataManagementSettings';
import { ICONS } from '../constants';
import LayawaySettings from './settings/LayawaySettings';
import { CategorySettings } from './settings/CategorySettings';

interface SettingsViewProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    users: User[];
    auditLogs: AuditLog[];
    showToast: (message: string, type: ToastData['type']) => void;
    onBackup: () => void;
    onRestoreRequest: (file: File) => void;
    onFactoryResetRequest: () => void;
    openModalId?: string | null;
    onModalOpened?: () => void;
    onTestBarcodePrint: () => void;
    // Google Drive Props
    onInitDrive: () => void;
    isDriveReady: boolean;
    isDriveInitializing: boolean;
    isDriveAuthenticated: boolean;
    driveUser: DriveUser | null;
    onDriveSignIn: () => void;
    onDriveSignOut: () => void;
    onDriveBackup: () => void;
    onDriveRestore: () => void;
    onDriveBackupAuditLogs: () => void;
    isDriveConfigured: boolean;
}

const SettingsModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
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
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="bg-background dark:bg-dark-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center p-6 border-b border-border dark:border-dark-border bg-secondary dark:bg-dark-card text-primary-content dark:text-dark-foreground rounded-t-xl flex-shrink-0">
                <h2 className="text-xl font-bold">{title}</h2>
                <button onClick={onClose} className="hover:opacity-75">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-6 overflow-y-auto">
                {children}
            </div>
        </div>
    </div>
);

const SettingsCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <div
        onClick={onClick}
        className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-sm hover:shadow-lg border border-border dark:border-dark-border cursor-pointer flex flex-col justify-between h-full"
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
        <div>
            <div className="bg-muted text-primary dark:bg-dark-muted dark:text-dark-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">{title}</h3>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mt-1 flex-grow">{description}</p>
        </div>
        <div className="text-right mt-4 text-sm font-bold text-primary dark:text-dark-primary">
            Manage &rarr;
        </div>
    </div>
);

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const [activeModal, setActiveModal] = useState<string | null>(null);

    useEffect(() => {
        if (props.openModalId) {
            setActiveModal(props.openModalId);
        }
    }, [props.openModalId]);

    useEffect(() => {
        // Initialize the Google Drive client as soon as settings are viewed.
        if(props.onInitDrive) {
            props.onInitDrive();
        }
    }, [props.onInitDrive]);

    const handleCloseModal = () => {
        setActiveModal(null);
        if (props.onModalOpened) {
            props.onModalOpened();
        }
    };

    const handleUpdateAndClose = (newSettings: Partial<Settings>) => {
        props.onUpdateSettings(newSettings);
        handleCloseModal();
        props.showToast('Settings saved!', 'success');
    };
    
    const settingsConfig = {
        'business-info': {
            title: 'Business Information',
            description: 'Set your company name, KRA PIN, logo, and location.',
            icon: ICONS.business,
            component: <BusinessInfoSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} showToast={props.showToast} />,
        },
        'hardware-settings': {
            title: 'Hardware & Peripherals',
            description: 'Configure receipt printers, barcode scanners, and other hardware.',
            icon: ICONS.hardware,
            component: <HardwareSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} showToast={props.showToast} onTestBarcodePrint={props.onTestBarcodePrint} />,
        },
        'receipt-settings': {
            title: 'Receipt & Invoice',
            description: 'Customize receipt footers and document numbering.',
            icon: ICONS.receipt,
            component: <ReceiptSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'tax-config': {
            title: 'VAT & Tax',
            description: 'Configure VAT rates and default product pricing.',
            icon: ICONS.tax,
            component: <TaxSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'discount-settings': {
            title: 'Discounts',
            description: 'Enable and set limits for POS transaction discounts.',
            icon: ICONS.discount,
            component: <DiscountSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'loyalty-settings': {
            title: 'Loyalty Program',
            description: 'Manage how customers earn and redeem loyalty points.',
            icon: ICONS.loyalty,
            component: <LoyaltySettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'layaway-settings': {
            title: 'Layaway Program',
            description: 'Set minimum deposit percentages and maximum payment durations.',
            icon: ICONS.layaway,
            component: <LayawaySettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'payment-methods': {
            title: 'Payment Methods Display',
            description: 'Configure bank accounts, M-Pesa details, etc., to display on your invoices and quotes.',
            icon: ICONS.mpesa,
            component: <PaymentMethodsSettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} showToast={props.showToast} />,
        },
        'inventory-settings': {
            title: 'Inventory Settings',
            description: 'Manage stock alerts and other inventory settings.',
            icon: ICONS.inventory,
            component: <InventorySettings settings={props.settings} onUpdateSettings={handleUpdateAndClose} />,
        },
        'category-settings': {
            title: 'Product Categories & Units',
            description: 'Add, edit, and organize product categories and measurement units.',
            icon: ICONS.categories,
            component: <CategorySettings settings={props.settings} onUpdateSettings={props.onUpdateSettings} showToast={props.showToast} />,
        },
        'users-perms': {
            title: 'Users & Permissions',
            description: 'Manage access rights and permissions for each staff role.',
            icon: ICONS.users,
            component: <UsersPermissionsSettings settings={props.settings} onUpdateSettings={props.onUpdateSettings} />,
        },
        'audit-log': {
            title: 'Audit Log',
            description: 'View a log of all important actions taken in the system.',
            icon: ICONS.audit,
            component: <AuditLogSettings auditLogs={props.auditLogs} users={props.users} onDriveBackupAuditLogs={props.onDriveBackupAuditLogs} isDriveAuthenticated={props.isDriveAuthenticated} />,
        },
        'data-management': {
            title: 'Data Management',
            description: 'Backup, restore, or reset all application data.',
            icon: ICONS.data,
            component: <DataManagementSettings 
                onBackup={props.onBackup}
                onRestoreRequest={props.onRestoreRequest}
                onFactoryResetRequest={props.onFactoryResetRequest}
                onClose={handleCloseModal}
                isDriveInitializing={props.isDriveInitializing}
                isDriveReady={props.isDriveReady}
                isDriveAuthenticated={props.isDriveAuthenticated}
                driveUser={props.driveUser}
                onDriveSignIn={props.onDriveSignIn}
                onDriveSignOut={props.onDriveSignOut}
                onDriveBackup={props.onDriveBackup}
                onDriveRestore={props.onDriveRestore}
                isDriveConfigured={props.isDriveConfigured}
            />,
        },
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground mb-6">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(settingsConfig).map(([key, config]) => (
                    <SettingsCard
                        key={key}
                        title={config.title}
                        description={config.description}
                        icon={config.icon}
                        onClick={() => setActiveModal(key)}
                    />
                ))}
            </div>

            <AnimatePresence>
                {activeModal && settingsConfig[activeModal as keyof typeof settingsConfig] && (
                    <SettingsModal
                        title={settingsConfig[activeModal as keyof typeof settingsConfig].title}
                        onClose={handleCloseModal}
                    >
                        {settingsConfig[activeModal as keyof typeof settingsConfig].component}
                    </SettingsModal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsView;