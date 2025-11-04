

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ICONS } from '../../constants';
import { DriveUser } from '../../types';

interface DataManagementSettingsProps {
    onBackup: () => void;
    onRestoreRequest: (file: File) => void;
    onFactoryResetRequest: () => void;
    onClose: () => void;
    isDriveInitializing: boolean;
    isDriveReady: boolean;
    isDriveAuthenticated: boolean;
    driveUser: DriveUser | null;
    onDriveSignIn: () => void;
    onDriveSignOut: () => void;
    onDriveBackup: () => void;
    onDriveRestore: () => void;
    isDriveConfigured: boolean;
}

const DataManagementSettings: React.FC<DataManagementSettingsProps> = ({ 
    onBackup, 
    onRestoreRequest, 
    onFactoryResetRequest, 
    onClose,
    isDriveInitializing,
    isDriveReady,
    isDriveAuthenticated,
    driveUser,
    onDriveSignIn,
    onDriveSignOut,
    onDriveBackup,
    onDriveRestore,
    isDriveConfigured
}) => {
    const restoreInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onRestoreRequest(file);
            onClose(); 
        }
        if (event.target) event.target.value = '';
    };
    
    const handleFactoryReset = () => {
        onFactoryResetRequest();
        onClose();
    }

    const handleBackupAndClose = () => {
        onBackup();
        onClose();
    }

    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={restoreInputRef}
                onChange={handleFileSelect}
                accept=".json,application/json"
                className="hidden"
            />

            {/* Application Data */}
            <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg border border-border dark:border-dark-border">
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground mb-2">Local Backup</h3>
                <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mb-4">
                    Export all application data to a JSON file on your computer. Keep this file in a safe place.
                </p>
                <div className="flex gap-4">
                    <button onClick={handleBackupAndClose} whileTap={{ scale: 0.95 }} className="flex-1 bg-primary text-primary-content font-semibold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center justify-center">
                        <div className="w-5 h-5 mr-2">{ICONS.data}</div>
                        Export All Data (JSON)
                    </button>
                    <button onClick={() => restoreInputRef.current?.click()} whileTap={{ scale: 0.95 }} className="flex-1 bg-card text-foreground dark:bg-dark-card dark:text-dark-foreground font-semibold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center justify-center">
                         <div className="w-5 h-5 mr-2">{ICONS.data}</div>
                        Import from Backup (JSON)
                    </button>
                </div>
            </div>

             {/* Cloud Backup */}
            <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg border border-border dark:border-dark-border">
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground mb-2">Cloud Backup (Google Drive)</h3>
                 {isDriveAuthenticated && driveUser ? (
                    <div className="space-y-4">
                         <div className="flex items-center gap-3 p-2 bg-card dark:bg-dark-card rounded-lg">
                            <img src={driveUser.picture} alt="User" className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-semibold text-foreground dark:text-dark-foreground">{driveUser.name}</p>
                                <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">{driveUser.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onDriveBackup} whileTap={{ scale: 0.95 }} className="flex-1 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center justify-center">
                                Backup to Drive
                            </button>
                            <button onClick={onDriveRestore} whileTap={{ scale: 0.95 }} className="flex-1 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center justify-center">
                                Restore from Drive
                            </button>
                        </div>
                         <button onClick={onDriveSignOut} className="w-full text-center text-xs text-foreground-muted dark:text-dark-foreground-muted hover:underline mt-2">
                            Disconnect Google Account
                        </button>
                    </div>
                ) : (
                    <div>
                         <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted mb-4">
                            Securely back up and restore your data using your Google Drive account.
                        </p>
                        {!isDriveConfigured ? (
                            <div className="text-center p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning dark:text-dark-warning">
                                <p className="font-bold">Feature Not Configured</p>
                                <p>Google Drive integration is disabled because API keys are not provided in the application configuration.</p>
                            </div>
                        ) : (
                            <button 
                                onClick={onDriveSignIn} 
                                disabled={isDriveInitializing || !isDriveReady}
                                whileTap={{ scale: 0.95 }} 
                                className="w-full bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground font-semibold px-4 py-2 rounded-xl transition-shadow shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                                {isDriveInitializing ? 'Initializing...' : 'Connect to Google Drive'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Factory Reset */}
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
                 <h3 className="text-lg font-bold text-danger mb-2">Factory Reset</h3>
                 <p className="text-sm text-danger/80 mb-4">
                    Permanently delete all data in this application, including sales, inventory, and settings. This action cannot be undone.
                </p>
                 <button onClick={handleFactoryReset} whileTap={{ scale: 0.95 }} className="w-full bg-danger text-white font-semibold px-4 py-2 rounded-xl transition-shadow shadow-clay-dark active:shadow-clay-dark-inset flex items-center justify-center">
                     <div className="w-5 h-5 mr-2">{ICONS.reset}</div>
                    Initiate Factory Reset
                </button>
            </div>
        </div>
    );
};

export default DataManagementSettings;