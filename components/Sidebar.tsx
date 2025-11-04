

import React, { ReactNode, ReactElement, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, User, Permission, Settings } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentUser: User;
    onLogout: () => void;
    permissions: Permission[];
    settings: Settings;
}

interface NavButtonProps {
    view: View;
    label: string;
    currentView: View;
    onClick: (view: View) => void;
    children: ReactNode;
}

const MotionButton = motion.button;

const NavButton: React.FC<NavButtonProps> = ({ view, label, currentView, onClick, children }) => {
    const isActive = currentView === view;
    return (
        <button
            onClick={() => onClick(view)}
            className={`flex items-center w-full text-left p-3 rounded-lg transition-colors duration-200 group ${
                isActive
                    ? 'bg-primary text-primary-content shadow-md hover:bg-primary-focus'
                    : 'text-gray-400 hover:bg-primary hover:text-primary-content'
            }`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
        >
            <div className="flex-shrink-0 mr-3 w-5 h-5">
                {children}
            </div>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
};

// FIX: Extracted the Logo into a reusable, exported component to be used in both the Sidebar and Header. This resolves the import error in Header.tsx.
const StoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L12 2L6 6" />
        <path d="M2 6v14a2 2 0 002 2h16a2 2 0 002-2V6" />
        <path d="M12 22V12" />
    </svg>
);

export const Logo: React.FC<{ layout?: 'horizontal' | 'vertical' }> = ({ layout = 'vertical' }) => {
    if (layout === 'horizontal') {
        // This layout is used in the Header component
        return (
            <div className="flex items-center space-x-3">
                <div className="bg-orange-500 p-2 rounded-lg text-white">
                    <StoreIcon />
                </div>
                <div>
                    <h1 className="font-bold text-base leading-tight text-foreground dark:text-dark-foreground">Banduka POS™</h1>
                    <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">Point of Sale System</p>
                </div>
            </div>
        );
    }
    
    // Default vertical layout for sidebar
    return (
        <div className="flex items-center p-4 border-b border-gray-700 flex-shrink-0">
            <div className="bg-orange-500 p-2 rounded-lg mr-3">
                <StoreIcon />
            </div>
            <div>
                <h1 className="font-bold text-base leading-tight">Banduka POS™</h1>
                <p className="text-xs text-gray-400">Point of Sale System</p>
            </div>
        </div>
    );
};


const ALL_MENU_ITEMS: { view: View; label: string; icon: ReactElement; permission: Permission }[] = [
    { view: View.Dashboard, label: 'Dashboard', icon: ICONS.dashboard, permission: 'view_dashboard' },
    { view: View.POS, label: 'Point of Sale', icon: ICONS.pos, permission: 'view_pos' },
    { view: View.Inventory, label: 'Inventory', icon: ICONS.inventory, permission: 'view_inventory' },
    { view: View.Customers, label: 'Customers', icon: ICONS.customers, permission: 'view_customers' },
    // FIX: Used the correct icon for Suppliers.
    { view: View.Suppliers, label: 'Suppliers', icon: ICONS.suppliers, permission: 'view_suppliers' },
    { view: View.AccountsPayable, label: 'Accounts Payable', icon: ICONS.ap, permission: 'view_ap' },
    { view: View.Purchases, label: 'Purchase Orders', icon: ICONS.clipboardList, permission: 'view_purchases' },
    { view: View.SalesOrderList, label: 'Sales Orders', icon: ICONS.clipboardList, permission: 'manage_sales_orders' },
    { view: View.Quotations, label: 'Quotations', icon: ICONS.quotations, permission: 'view_quotations' },
    { view: View.WorkOrderList, label: 'Work Orders', icon: ICONS.workOrder, permission: 'manage_work_orders' },
    { view: View.LayawayList, label: 'Layaways', icon: ICONS.layaway, permission: 'manage_layaways' },
    { view: View.HeldReceipts, label: 'Held Receipts', icon: ICONS.heldReceipts, permission: 'view_held_receipts' },
    { view: View.SalesHistory, label: 'Sales History', icon: ICONS.salesHistory, permission: 'view_sales_history' },
    { view: View.Staff, label: 'Staff', icon: ICONS.staff, permission: 'view_staff' },
    { view: View.TimeSheets, label: 'Shifts', icon: ICONS.timeSheets, permission: 'view_timesheets' },
    { view: View.Accounts, label: 'Accounts & Finance', icon: ICONS.accounts, permission: 'view_general_ledger' },
    { view: View.ProfitReport, label: 'Reports & Analytics', icon: ICONS.profitReport, permission: 'view_profit_report' },
    { view: View.FiscalPeriodReport, label: 'Fiscal Period Report', icon: ICONS.generalLedger, permission: 'view_profit_report' },
    { view: View.TaxReport, label: 'Tax Report', icon: ICONS.tax, permission: 'view_profit_report' },
    { view: View.Settings, label: 'Settings', icon: ICONS.settings, permission: 'view_settings' },
];

const SidebarContent: React.FC<Omit<SidebarProps, 'isOpen' | 'setIsOpen'>> = ({ currentView, setCurrentView, permissions, currentUser, onLogout }) => {
    
    const menuItems = useMemo(() => {
        return ALL_MENU_ITEMS.filter(item => permissions.includes(item.permission));
    }, [permissions]);

    const userInitials = useMemo(() => {
        if (!currentUser || !currentUser.name) return '';
        const nameParts = currentUser.name.split(' ').filter(Boolean);
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return nameParts[0] ? nameParts[0][0].toUpperCase() : '';
    }, [currentUser]);

    return (
        <div className="w-full md:w-64 bg-gray-800 text-white flex flex-col h-full shadow-lg">
            {/* Header */}
            <Logo />
            
            {/* Navigation */}
            <nav className="flex-grow p-4 overflow-y-auto">
                <h2 className="text-xs font-bold uppercase text-gray-500 mb-2">Main Menu</h2>
                <div className="space-y-1">
                    {menuItems.map(item => (
                        <NavButton key={item.view} view={item.view} label={item.label} currentView={currentView} onClick={setCurrentView}>
                            {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                        </NavButton>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-gray-700 flex-shrink-0">
                <div className="flex items-center mb-4">
                    <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm mr-3">
                        {userInitials}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{currentUser.name}</p>
                        <p className="text-xs text-gray-400">{currentUser.role}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center p-2 text-sm font-medium text-orange-400 border border-orange-400 rounded-lg hover:bg-orange-400 hover:text-gray-800 transition-colors"
                >
                    <div className="w-5 h-5 mr-2">
                        {ICONS.logout}
                    </div>
                    Logout
                </button>
            </div>
        </div>
    );
};


const Sidebar = ({ currentView, setCurrentView, isOpen, setIsOpen, currentUser, onLogout, permissions, settings }: SidebarProps) => {
    
    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:block flex-shrink-0 no-print">
                 <SidebarContent 
                    currentView={currentView} 
                    setCurrentView={setCurrentView} 
                    permissions={permissions} 
                    settings={settings}
                    currentUser={currentUser}
                    onLogout={onLogout}
                />
            </div>
            
            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <div className="md:hidden no-print">
                        <div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black bg-opacity-50 z-30"
                            onClick={() => setIsOpen(false)}
                        />
                        <div
                             initial={{ x: '-100%' }}
                             animate={{ x: 0 }}
                             exit={{ x: '-100%' }}
                             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                             className="fixed top-0 left-0 h-full z-40 w-64"
                        >
                            <SidebarContent 
                                currentView={currentView} 
                                setCurrentView={(v) => { setCurrentView(v); setIsOpen(false); }} 
                                permissions={permissions} 
                                settings={settings}
                                currentUser={currentUser}
                                onLogout={onLogout}
                            />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;