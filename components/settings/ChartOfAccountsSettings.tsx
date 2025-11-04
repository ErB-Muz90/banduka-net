import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Account, AccountType } from '../../types';

interface ChartOfAccountsSettingsProps {
    chartOfAccounts: Account[];
    onAddAccount: (account: Omit<Account, 'id'>) => Promise<void>;
    onUpdateAccount: (account: Account) => Promise<void>;
    onDeleteAccount: (accountId: string) => Promise<void>;
}

const ChartOfAccountsSettings: React.FC<ChartOfAccountsSettingsProps> = ({ chartOfAccounts, onAddAccount, onUpdateAccount, onDeleteAccount }) => {
    const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'Expenses' as AccountType });
    
    const accountsByType = useMemo(() => {
        return chartOfAccounts.reduce((acc, account) => {
            if (!acc[account.type]) {
                acc[account.type] = [];
            }
            acc[account.type].push(account);
            return acc;
        }, {} as Record<AccountType, Account[]>);
    }, [chartOfAccounts]);

    const handleAddAccount = async () => {
        if (!newAccount.name || !newAccount.code) {
            alert('Account name and code are required.');
            return;
        }
        await onAddAccount({ ...newAccount, isEditable: true });
        setNewAccount({ code: '', name: '', type: 'Expenses' });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(Object.keys(accountsByType) as AccountType[]).map(type => (
                    <div key={type} className="bg-muted dark:bg-dark-muted p-4 rounded-lg">
                        <h3 className="font-bold text-lg text-foreground dark:text-dark-foreground mb-2">{type}</h3>
                        <ul className="space-y-1">
                            {accountsByType[type].map(acc => (
                                <li key={acc.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-card dark:hover:bg-dark-card">
                                    <span><span className="font-mono text-xs text-foreground-muted dark:text-dark-foreground-muted">{acc.code}</span> - {acc.name}</span>
                                    {!acc.isEditable && <span className="text-xs font-semibold text-foreground-muted dark:text-dark-foreground-muted">System</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-border dark:border-dark-border">
                <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground mb-4">Add New Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-muted dark:bg-dark-muted rounded-lg">
                    <input value={newAccount.code} onChange={e => setNewAccount({...newAccount, code: e.target.value})} placeholder="Code (e.g., 6500)" className="md:col-span-1 p-2 border rounded-md bg-card dark:bg-dark-card border-border dark:border-dark-border"/>
                    <input value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} placeholder="Account Name" className="md:col-span-1 p-2 border rounded-md bg-card dark:bg-dark-card border-border dark:border-dark-border"/>
                    <select value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value as AccountType})} className="md:col-span-1 p-2 border rounded-md bg-card dark:bg-dark-card border-border dark:border-dark-border">
                        <option value="Expenses">Expenses</option>
                        <option value="Assets">Assets</option>
                        <option value="Liabilities">Liabilities</option>
                        <option value="Revenue">Revenue</option>
                        <option value="Equity">Equity</option>
                    </select>
                    <button onClick={handleAddAccount} whileTap={{ scale: 0.95 }} className="md:col-span-1 bg-primary text-primary-content font-semibold p-2 rounded-lg">
                        Add Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChartOfAccountsSettings;
