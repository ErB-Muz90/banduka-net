

import React, { useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Product, CartItem, Customer, Sale, View, Supplier, PurchaseOrder, SupplierInvoice, SupplierPayment, Role, User, SaleData, Settings, ToastData, AuditLog, Permission, Quotation, PurchaseOrderData, Shift, Payment, PurchaseOrderItem, ReceivedPOItem, TimeClockEvent, Expense, Layaway, WorkOrder, SalesOrder, HeldReceipt, SalesOrderItem, QuotationItem, QuotationData, LayawayPayment, DriveUser, Account, AccountingTransaction, JournalEntry, BankDeposit } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { useTheme } from './hooks/useTheme';
import * as db from './utils/offlineDb';
import * as escpos from './utils/escpos';
import * as drive from './utils/googleDrive';
import { calculateCartTotals } from './utils/vatCalculator';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
// FIX: Changed named import to default import for PosView.
import PosView from './components/pos/PosView';
import { DashboardView } from './components/DashboardView';
import InventoryView from './components/InventoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import AccountsPayableView from './components/AccountsPayableView';
import ShiftReportView from './components/ShiftReportView';
import SalesHistoryView from './components/salesHistory/SalesHistoryView';
import ReceiptDetailView from './components/salesHistory/ReceiptDetailView';
import SettingsView from './components/SettingsView';
import Toast from './components/common/Toast';
import CustomersView from './components/CustomersView';
import SuppliersView from './components/suppliers/SuppliersView';
import QuotationsView from './components/QuotationsView';
import StaffView from './components/StaffView';
import ConfirmationModal from './components/common/ConfirmationModal';
import ReceivePOModal from './components/purchases/ReceivePOModal';
import AddToPOModal from './components/modals/AddToPOModal';
import BarcodePrintModal from './components/inventory/BarcodePrintModal';
import CreateQuotationForm from './components/quotations/CreateQuotationForm';
import QuotationDetailView from './components/quotations/QuotationDetailView';
import InvoiceDetailView from './components/accountsPayable/InvoiceDetailView';
import EmailModal from './components/modals/EmailModal';
import WhatsAppModal from './components/modals/WhatsAppModal';
import SetupWizard from './components/setup/SetupWizard';
import UpdateNotification from './components/common/UpdateNotification';
import TimeSheetsView from './components/timesheets/TimeSheetsView';
import TimeClockModal from './components/timesheets/TimeClockModal';
import ReturnReceiptView from './components/pos/ReturnReceiptView';
import NewExpenseView from './components/expenditures/NewExpenseView';
import { ExpendituresView } from './components/expenditures/ExpendituresView';
import ExpenseDetailView from './components/expenditures/ExpenseDetailView';
import NewLayawayView from './components/layaway/NewLayawayView';
import LayawayListView from './components/layaway/LayawayListView';
import LayawayDetailView from './components/layaway/LayawayDetailView';
import NewWorkOrderView from './components/work_orders/NewWorkOrderView';
import WorkOrderListView from './components/work_orders/WorkOrderListView';
import WorkOrderDetailView from './components/work_orders/WorkOrderDetailView';
import NewSalesOrderView from './components/sales_orders/NewSalesOrderView';
import SalesOrderListView from './components/sales_orders/SalesOrderListView';
import SalesOrderDetailView from './components/sales_orders/SalesOrderDetailView';
import HoldReceiptModal from './components/modals/HoldReceiptModal';
import HeldReceiptsView from './components/HeldReceiptsView';
import PaymentSummaryView from './components/PaymentSummaryView';
import PinLockView from './components/PinLockView';
import WhatsAppOrdersView from './components/whatsapp/WhatsAppOrdersView';
import OpenCashDrawerView from './components/pos/OpenCashDrawerView';
import TaxReportView from './components/TaxReportView';
import ProfitReportView from './components/ProfitReportView';
import { SaleSuccessView } from './components/pos/SaleSuccessView';
import GeneralLedgerView from './components/GeneralLedgerView';
import AccountsView from './components/AccountsView';


const MotionDiv = motion.div;

// Helper function for robust CSV line parsing
const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                // Check for escaped quote ("")
                if (i + 1 < line.length && line[i + 1] === '"') {
                    currentField += '"';
                    i++; // Skip the next quote
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }
    result.push(currentField); // Add the last field
    return result;
};


interface AppProps {
    currentUser: User;
    onLogout: () => void;
    allUsers: User[];
    onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
    onUpdateUser: (user: User) => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;
}

const App = ({ currentUser, onLogout, allUsers, onAddUser, onUpdateUser, onDeleteUser }: AppProps) => {
    // --- Theming Hooks ---
    const [theme] = useTheme();

    // --- App State ---
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [updateAvailable, setUpdateAvailable] = useState<ServiceWorkerRegistration | null>(null);
    const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isSyncingEtims, setIsSyncingEtims] = useState(false);


    // --- Data State ---
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
    const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [users, setUsers] = useState<User[]>(allUsers);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [timeClockEvents, setTimeClockEvents] = useState<TimeClockEvent[]>([]);
    const [layaways, setLayaways] = useState<Layaway[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [heldReceipts, setHeldReceipts] = useState<HeldReceipt[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>([]);
    const [accountingTransactions, setAccountingTransactions] = useState<AccountingTransaction[]>([]);
    const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>([]);
    
    // --- Component-specific state ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [activeTimeClockEvent, setActiveTimeClockEvent] = useState<TimeClockEvent | null>(null);
    const [isEndingShift, setIsEndingShift] = useState(false);
    const [shiftReportToShow, setShiftReportToShow] = useState<Shift | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [saleToView, setSaleToView] = useState<Sale | null>(null);
    const [quoteToView, setQuoteToView] = useState<Quotation | null>(null);
    const [invoiceToView, setInvoiceToView] = useState<SupplierInvoice | null>(null);
    const [expenseToView, setExpenseToView] = useState<Expense | null>(null);
    const [poToReceive, setPoToReceive] = useState<PurchaseOrder | null>(null);
    const [productForPO, setProductForPO] = useState<Product | null>(null);
    const [productForBarcode, setProductForBarcode] = useState<Product | null>(null);
    const [modalEmail, setModalEmail] = useState<{ type: 'Receipt' | 'Quotation' | 'Proforma-Invoice' | 'SupplierInvoice' | 'PurchaseOrder', id: string, customerId: string } | null>(null);
    const [modalWhatsApp, setModalWhatsApp] = useState<{ type: 'Receipt' | 'Quotation' | 'Proforma-Invoice' | 'SupplierInvoice' | 'PurchaseOrder', id: string, customerId: string } | null>(null);
    const [isTimeClockModalOpen, setIsTimeClockModalOpen] = useState(false);
    const [timeClockEventToEdit, setTimeClockEventToEdit] = useState<TimeClockEvent | null>(null);
    const [layawayToView, setLayawayToView] = useState<Layaway | null>(null);
    const [layawayForReceipt, setLayawayForReceipt] = useState<Layaway | null>(null);
    const [workOrderToView, setWorkOrderToView] = useState<WorkOrder | null>(null);
    const [salesOrderToView, setSalesOrderToView] = useState<SalesOrder | null>(null);
    const [salesOrderToCancel, setSalesOrderToCancel] = useState<SalesOrder | null>(null);
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [heldReceiptToDelete, setHeldReceiptToDelete] = useState<HeldReceipt | null>(null);
    const [originatingWorkOrderId, setOriginatingWorkOrderId] = useState<string | null>(null);
    const [modalToOpenInSettings, setModalToOpenInSettings] = useState<string | null>(null);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [salesOrderForPO, setSalesOrderForPO] = useState<SalesOrder | null>(null);
    const [originatingSalesOrderId, setOriginatingSalesOrderId] = useState<string | null>(null);
    const [originatingQuotationId, setOriginatingQuotationId] = useState<string | null>(null);
    const [saleSuccessInfo, setSaleSuccessInfo] = useState<{ sale: Sale; layaway?: Layaway } | null>(null);
    const [isDriveReady, setIsDriveReady] = useState(false);
    const [isDriveInitializing, setIsDriveInitializing] = useState(false);
    const [isDriveAuthenticated, setIsDriveAuthenticated] = useState(false);
    const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
    const isDriveConfigured = false;
    
    // --- Inactivity Lock Timer ---
    useEffect(() => {
        if (!currentUser?.pin) {
            setIsLocked(false); 
            return;
        }

        let inactivityTimer: ReturnType<typeof setTimeout>;
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => setIsLocked(true), 1000 * 60 * 5); // 5 minutes
        };

        const events = ['mousemove', 'mousedown', 'keypress', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [currentUser]);

    // Sync local users state with the master list from AuthView
    useEffect(() => {
        setUsers(allUsers);
    }, [allUsers]);

    const showToast = useCallback((message: string, type: ToastData['type'] = 'info') => {
        const newToast: ToastData = { id: Date.now(), message, type };
        setToasts(prev => [newToast]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 3000);
    }, []);

    // --- PWA & Service Worker Logic ---
    useEffect(() => {
        // Service Worker Update Listener
        const handleUpdate = (e: Event) => {
            const registration = (e as CustomEvent).detail;
            setUpdateAvailable(registration);
        };
        window.addEventListener('new-sw-update', handleUpdate);

        // PWA Install Prompt Listener
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('new-sw-update', handleUpdate);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (installPromptEvent) {
            (installPromptEvent as any).prompt();
            (installPromptEvent as any).userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
                if (choiceResult.outcome === 'accepted') {
                    showToast('Banduka POS installed successfully!', 'success');
                } else {
                    showToast('Installation cancelled.', 'info');
                }
                setInstallPromptEvent(null);
            });
        }
    };

    const handleUpdateAndReload = () => {
        if (updateAvailable && updateAvailable.waiting) {
            updateAvailable.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        setUpdateAvailable(null);
    };

    // --- Data Loading Effect ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    dbProducts, initialDbCustomers, dbSales, dbSuppliers, dbPurchaseOrders,
                    dbSupplierInvoices, dbSupplierPayments, dbQuotations, dbSettings, dbAuditLogs,
                    dbShifts, dbTimeClockEvents, dbExpenses, dbLayaways, dbWorkOrders, dbSalesOrders, dbHeldReceipts,
                    dbChartOfAccounts, dbAccountingTransactions, dbBankDeposits
                ] = await Promise.all([
                    db.getAllItems<Product>('products'),
                    db.getAllItems<Customer>('customers'),
                    db.getAllItems<Sale>('sales'),
                    db.getAllItems<Supplier>('suppliers'),
                    db.getAllItems<PurchaseOrder>('purchaseOrders'),
                    db.getAllItems<SupplierInvoice>('supplierInvoices'),
                    db.getAllItems<SupplierPayment>('supplierPayments'),
                    db.getAllItems<Quotation>('quotations'),
                    db.getItem<Settings>('settings', DEFAULT_SETTINGS.id),
                    db.getAllItems<AuditLog>('auditLogs'),
                    db.getAllItems<Shift>('shifts'),
                    db.getAllItems<TimeClockEvent>('timeClockEvents'),
                    db.getAllItems<Expense>('payouts'),
                    db.getAllItems<Layaway>('layaways'),
                    db.getAllItems<WorkOrder>('workOrders'),
                    db.getAllItems<SalesOrder>('salesOrders'),
                    db.getAllItems<HeldReceipt>('heldReceipts'),
                    db.getAllItems<Account>('chartOfAccounts'),
                    db.getAllItems<AccountingTransaction>('accountingTransactions'),
                    db.getAllItems<BankDeposit>('bankDeposits'),
                ]);
                
                let dbCustomers = initialDbCustomers;
                // Ensure 'Walk-in Customer' exists. This is a critical system entity.
                let walkinCustomer = dbCustomers.find(c => c.id === 'cust001');
                if (!walkinCustomer) {
                    walkinCustomer = {
                        id: 'cust001',
                        name: 'Walk-in Customer',
                        phone: 'N/A',
                        email: 'walkin@example.com',
                        address: 'N/A',
                        city: 'N/A',
                        dateAdded: new Date(),
                        loyaltyPoints: 0
                    };
                    await db.saveItem('customers', walkinCustomer);
                    dbCustomers.unshift(walkinCustomer); // Add to the start
                }

                setProducts(dbProducts);
                setCustomers(dbCustomers);
                setSales(dbSales);
                setSuppliers(dbSuppliers);
                setPurchaseOrders(dbPurchaseOrders);
                setSupplierInvoices(dbSupplierInvoices);
                setSupplierPayments(dbSupplierPayments);
                setQuotations(dbQuotations);
                setAuditLogs(dbAuditLogs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
                setShifts(dbShifts);
                setTimeClockEvents(dbTimeClockEvents);
                setExpenses(dbExpenses);
                setLayaways(dbLayaways);
                setWorkOrders(dbWorkOrders);
                setSalesOrders(dbSalesOrders);
                setHeldReceipts(dbHeldReceipts);
                setAccountingTransactions(dbAccountingTransactions);
                setBankDeposits(dbBankDeposits);

                let accounts = dbChartOfAccounts;
                if (accounts.length === 0) {
                    const DEFAULT_ACCOUNTS: Account[] = [
                        { id: 'acc_cash', code: '1010', name: 'Cash on Hand', type: 'Assets', isEditable: false },
                        { id: 'acc_mpesa', code: '1020', name: 'M-Pesa Till', type: 'Assets', isEditable: false },
                        { id: 'acc_card', code: '1030', name: 'Card/Bank Payments', type: 'Assets', isEditable: false },
                        { id: 'acc_inventory', code: '1200', name: 'Inventory Asset', type: 'Assets', isEditable: false },
                        { id: 'acc_ap', code: '2010', name: 'Accounts Payable', type: 'Liabilities', isEditable: false },
                        { id: 'acc_sales', code: '4010', name: 'Sales Revenue', type: 'Revenue', isEditable: false },
                        { id: 'acc_cogs', code: '5010', name: 'Cost of Goods Sold', type: 'Expenses', isEditable: false },
                        { id: 'acc_sales_returns', code: '4510', name: 'Sales Returns & Allowances', type: 'Contra Revenue', isEditable: false },
                        { id: 'acc_vat_payable', code: '2310', name: 'VAT Payable', type: 'Liabilities', isEditable: false },
                    ];
                    for (const acc of DEFAULT_ACCOUNTS) {
                        await db.saveItem('chartOfAccounts', acc);
                    }
                    accounts = DEFAULT_ACCOUNTS;
                }
                setChartOfAccounts(accounts);
                
                let currentSettings = dbSettings;
                if (currentSettings) {
                    // FIX: Deep merge loaded settings with defaults to ensure all properties exist.
                    // This handles migrations where new settings properties are added in code updates
                    // and prevents crashes from components trying to access undefined properties.
                    currentSettings = {
                        ...DEFAULT_SETTINGS,
                        ...currentSettings,
                        businessInfo: { ...DEFAULT_SETTINGS.businessInfo, ...(currentSettings.businessInfo || {}) },
                        tax: { ...DEFAULT_SETTINGS.tax, ...(currentSettings.tax || {}) },
                        discount: { ...DEFAULT_SETTINGS.discount, ...(currentSettings.discount || {}) },
                        communication: {
                            ...DEFAULT_SETTINGS.communication,
                            ...(currentSettings.communication || {}),
                            sms: { ...DEFAULT_SETTINGS.communication.sms, ...(currentSettings.communication?.sms || {}) },
                            email: { ...DEFAULT_SETTINGS.communication.email, ...(currentSettings.communication?.email || {}) },
                            whatsapp: { ...DEFAULT_SETTINGS.communication.whatsapp, ...(currentSettings.communication?.whatsapp || {}) },
                            mpesa: { ...DEFAULT_SETTINGS.communication.mpesa, ...(currentSettings.communication?.mpesa || {}) },
                        },
                        receipt: { ...DEFAULT_SETTINGS.receipt, ...(currentSettings.receipt || {}) },
                        layaway: { ...DEFAULT_SETTINGS.layaway, ...(currentSettings.layaway || {}) },
                        hardware: {
                            ...DEFAULT_SETTINGS.hardware,
                            ...(currentSettings.hardware || {}),
                            printer: { ...DEFAULT_SETTINGS.hardware.printer, ...(currentSettings.hardware?.printer || {}) },
                            barcodeScanner: { ...DEFAULT_SETTINGS.hardware.barcodeScanner, ...(currentSettings.hardware?.barcodeScanner || {}) },
                            barcodePrinter: { ...DEFAULT_SETTINGS.hardware.barcodePrinter, ...(currentSettings.hardware?.barcodePrinter || {}) },
                        },
                        loyalty: { ...DEFAULT_SETTINGS.loyalty, ...(currentSettings.loyalty || {}) },
                        measurements: { ...DEFAULT_SETTINGS.measurements, ...(currentSettings.measurements || {}) },
                        permissions: { ...DEFAULT_SETTINGS.permissions, ...(currentSettings.permissions || {}) },
                        paymentMethods: { ...DEFAULT_SETTINGS.paymentMethods, ...(currentSettings.paymentMethods || {}) },
                        inventory: { ...DEFAULT_SETTINGS.inventory, ...(currentSettings.inventory || {}) },
                        accounting: { ...DEFAULT_SETTINGS.accounting, ...(currentSettings.accounting || {}) },
                    };
                } else {
                    currentSettings = DEFAULT_SETTINGS;
                    await db.saveItem('settings', DEFAULT_SETTINGS);
                }

                if (!currentSettings.accounting?.defaultCashAccountId) {
                    const updatedAccountingSettings = {
                        defaultCashAccountId: 'acc_cash',
                        defaultMpesaAccountId: 'acc_mpesa',
                        defaultCardAccountId: 'acc_card',
                        defaultBankAccountId: 'acc_card', // For now, map to same
                        defaultSalesAccountId: 'acc_sales',
                        defaultVatPayableAccountId: 'acc_vat_payable',
                        defaultVatReceivableAccountId: '', // Not used yet
                        defaultCogsAccountId: 'acc_cogs',
                        defaultInventoryAccountId: 'acc_inventory',
                        defaultSalesReturnAccountId: 'acc_sales_returns',
                        defaultAccountsPayableId: 'acc_ap',
                        // FIX: Add missing 'defaultCustomerDepositsId' property to satisfy the Settings['accounting'] type.
                        defaultCustomerDepositsId: '',
                    };
                    currentSettings = { ...currentSettings, accounting: updatedAccountingSettings as any };
                    await db.saveItem('settings', currentSettings);
                }
                setSettings(currentSettings);


                const currentActiveShift = dbShifts.find(s => s.userId === currentUser.id && s.status === 'active');
                setActiveShift(currentActiveShift || null);
                
                const currentActiveTimeClock = dbTimeClockEvents.find(e => e.userId === currentUser.id && e.status === 'clocked-in');
                setActiveTimeClockEvent(currentActiveTimeClock || null);
                
                // Set default customer after customers are loaded and walk-in is guaranteed
                setSelectedCustomerId(walkinCustomer.id);

            } catch (error) {
                console.error("Error loading data:", error);
                showToast("Error loading data from the database.", 'error');
            } finally {
                setIsAppLoading(false);
            }
        };
        loadData();
    }, [currentUser.id, showToast]);


    const userPermissions = useMemo(() => {
        return settings.permissions[currentUser.role] || [];
    }, [settings.permissions, currentUser.role]);

    const handleViewChange = (view: View) => {
        // Close component-specific views when changing main view
        setSaleToView(null);
        setQuoteToView(null);
        setInvoiceToView(null);
        setExpenseToView(null);
        setLayawayToView(null);
        setWorkOrderToView(null);
        setSalesOrderToView(null);
        setCurrentView(view);
        setIsSidebarOpen(false);
    };

    const clearCart = useCallback(() => {
        setCart([]);
        setOriginatingWorkOrderId(null);
        setOriginatingSalesOrderId(null);
        setOriginatingQuotationId(null);
        setSelectedCustomerId(customers.find(c => c.id === 'cust001')?.id || '');
    }, [customers]);

    const handleUpdateSettings = async (updatedFields: Partial<Settings>) => {
        try {
            const newSettings = { ...settings, ...updatedFields };
            setSettings(newSettings);
            await db.saveItem('settings', newSettings);
        } catch (error) {
            console.error("Failed to update settings", error);
            showToast('Failed to save settings.', 'error');
        }
    };
    const logAudit = useCallback(async (action: string, details: string) => {
        if (!currentUser) return;
        try {
            const newLog: AuditLog = {
                id: `log_${Date.now()}`,
                timestamp: new Date(),
                userId: currentUser.id,
                userName: currentUser.name,
                action,
                details
            };
            await db.saveItem('auditLogs', newLog);
            setAuditLogs(prev => [newLog, ...prev]);
        } catch (error) {
            console.error("Failed to write to audit log.", { action, details, error });
        }
    }, [currentUser]);

    const handleOpenDrawer = useCallback(async () => {
        if (settings.hardware.printer.type !== 'ESC/POS') {
            showToast("Open Drawer is only available for ESC/POS direct printers.", 'info');
            return;
        }
        try {
            await escpos.kickCashDrawer(settings.hardware.printer);
            showToast("Open drawer signal sent!", 'success');
            if(currentUser) {
                await logAudit('Cash Drawer Opened', `User ${currentUser.name} opened the cash drawer manually.`);
            }
        } catch (error: any) {
            console.error("Open drawer error:", error);
            // The error from escpos is user-friendly enough to show in a toast.
            showToast(error.message || 'Failed to open drawer.', 'error');
        }
    }, [settings.hardware.printer, showToast, logAudit, currentUser]);

    const addToCart = useCallback((product: Product) => {
        if (product.productType === 'Inventory' && product.stock <= 0) {
            showToast(`${product.name} is out of stock.`, 'error');
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                if (product.productType === 'Inventory' && existingItem.quantity >= product.stock) {
                    showToast(`No more stock available for ${product.name}.`, 'warning');
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
    }, [products, showToast]);

    const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
        setCart(prevCart => {
            const itemToUpdate = prevCart.find(item => item.id === productId);
            if (!itemToUpdate) return prevCart;

            const product = products.find(p => p.id === productId);
            if (product && product.productType === 'Inventory' && quantity > product.stock) {
                showToast(`Only ${product.stock} units of ${product.name} available.`, 'warning');
                quantity = product.stock;
            }

            if (quantity <= 0) {
                return prevCart.filter(item => item.id !== productId);
            }

            return prevCart.map(item =>
                item.id === productId ? { ...item, quantity: quantity } : item
            );
        });
    }, [products, showToast]);

    const updateCartItemDiscount = useCallback((productId: string, discount: CartItem['discount'] | undefined) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId ? { ...item, discount: discount } : item
            )
        );
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    }, []);

    const createAccountingTransaction = useCallback(async (description: string, referenceId: string, referenceType: AccountingTransaction['referenceType'], entries: JournalEntry[]) => {
        try {
            // Validate that the transaction balances
            const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
            const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
            if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for small floating point discrepancies
                console.error("Accounting transaction does not balance!", { description, entries, totalDebits, totalCredits });
                showToast(`Critical accounting error: ${description} does not balance.`, 'error');
                return; // Stop execution to prevent corrupting the ledger
            }

            const newTransaction: AccountingTransaction = {
                id: `trans_${Date.now()}`,
                date: new Date(),
                description,
                referenceId,
                referenceType,
                entries
            };
            await db.saveItem('accountingTransactions', newTransaction);
            setAccountingTransactions(prev => [...prev, newTransaction]);
        } catch (error) {
            console.error("Failed to create accounting transaction.", { description, error });
            showToast("Failed to record transaction in General Ledger.", "error");
        }
    }, [showToast]);

    const handleStartShift = async (startingFloat: number) => {
        if (activeShift) {
            showToast('A shift is already active.', 'error');
            return;
        }
        if (!currentUser) {
            showToast('Cannot start shift, no user logged in.', 'error');
            return;
        }

        const newShift: Shift = {
            id: `shift_${Date.now()}_${currentUser.id}`,
            userId: currentUser.id,
            userName: currentUser.name,
            startTime: new Date(),
            status: 'active',
            startingFloat,
            salesIds: [],
            expenseIds: [],
        };

        try {
            await db.saveItem('shifts', newShift);
            setShifts(prev => [...prev, newShift]);
            setActiveShift(newShift);
            await logAudit('Shift Started', `User ${currentUser.name} started a new shift with a float of KES ${startingFloat}.`);
            showToast(`Shift started for ${currentUser.name}.`, 'success');
        } catch (error) {
            console.error("Failed to start shift:", error);
            showToast('Failed to start a new shift.', 'error');
        }
    };
    
    const handleConfirmEndShift = async (actualCashInDrawer: number) => {
        if (!activeShift) {
            showToast('No active shift to end.', 'error');
            return;
        }
    
        const shiftSales = sales.filter(s => activeShift.salesIds.includes(s.id));
        const shiftExpenses = expenses.filter(p => activeShift.expenseIds?.includes(p.id));
    
        const paymentBreakdown: { [key in Payment['method']]?: number } = {};
        let cashChange = 0;
    
        shiftSales.forEach(sale => {
            sale.payments.forEach(p => {
                paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + p.amount;
            });
            cashChange += sale.change;
        });
    
        const totalSales = shiftSales.reduce((acc, s) => acc + s.total, 0);
        const totalPayouts = shiftExpenses.reduce((acc, p) => acc + p.amount, 0);
        
        const netCashFromSales = (paymentBreakdown.Cash || 0) - cashChange;
    
        const expectedCashInDrawer = activeShift.startingFloat + netCashFromSales - totalPayouts;
        const cashVariance = actualCashInDrawer - expectedCashInDrawer;
    
        const updatedShift: Shift = {
            ...activeShift,
            endTime: new Date(),
            status: 'closed',
            salesIds: shiftSales.map(s => s.id),
            expenseIds: shiftExpenses.map(p => p.id),
            paymentBreakdown,
            totalSales,
            totalPayouts,
            expectedCashInDrawer,
            actualCashInDrawer,
            cashVariance,
        };
    
        try {
            await db.saveItem('shifts', updatedShift);
            setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
            setActiveShift(null);
            setShiftReportToShow(updatedShift);
            setIsEndingShift(false);
            await logAudit('Shift Ended', `User ${currentUser.name} ended shift ${updatedShift.id} with a variance of KES ${cashVariance}.`);
            showToast('Shift ended successfully.', 'success');
        } catch (error) {
            console.error("Failed to end shift:", error);
            showToast('An error occurred while ending the shift.', 'error');
        }
    };
    
    const handleCompleteSale = async (saleData: SaleData): Promise<Sale> => {
        if (!activeShift || !currentUser) {
            throw new Error("Cannot complete sale. No active shift or user.");
        }
    
        try {
            const pointsEarned = settings.loyalty.enabled ? Math.floor((saleData.total + (saleData.depositApplied || 0)) / settings.loyalty.pointsPerKsh) : 0;
        
            const saleWithOrigin: Partial<Sale> = {
                quotationId: originatingQuotationId || undefined,
                workOrderId: (saleData as Partial<Sale>).workOrderId || originatingWorkOrderId || undefined,
                salesOrderId: (saleData as Partial<Sale>).salesOrderId || originatingSalesOrderId || undefined,
            };

            const newSale: Sale = {
                ...saleData,
                ...saleWithOrigin,
                id: `${settings.receipt.invoicePrefix}${Date.now()}`,
                synced: false,
                cashierId: currentUser.id,
                cashierName: currentUser.name,
                shiftId: activeShift.id,
                pointsEarned,
                pointsBalanceAfter: 0 
            };
        
            const updatedProducts = [...products];

            // Determine if this sale completes a Sales Order
            const completingSO = salesOrders.find(
                so => so.id === newSale.salesOrderId && !newSale.items.some(i => i.id.startsWith('SO_DEPOSIT'))
            );

            // Stock deduction logic
            if (completingSO) {
                // This is a sales order completion (either direct or via POS payment)
                // We iterate over the ORIGINAL SO items to ensure correct stock deduction
                for (const soItem of completingSO.items) {
                    if (soItem.productId && soItem.quantity > 0) {
                        const productIndex = updatedProducts.findIndex(p => p.id === soItem.productId);
                        if (productIndex !== -1 && updatedProducts[productIndex].productType === 'Inventory') {
                            const product = updatedProducts[productIndex];
                            // This logic is critical: deduct from both total and reserved stock
                            const newStock = product.stock - soItem.quantity;
                            const newReservedStock = (product.reservedStock || 0) - soItem.quantity;

                            updatedProducts[productIndex] = {
                                ...product,
                                stock: newStock,
                                reservedStock: Math.max(0, newReservedStock) // Ensure it doesn't go below zero
                            };
                            await db.saveItem('products', updatedProducts[productIndex]);
                        }
                    }
                }
            } else {
                // This is a regular POS sale or a deposit payment (WO/SO/Layaway)
                // Deduct stock based on items in the cart
                for (const item of newSale.items) {
                    if (item.productType === 'Inventory') {
                        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
                        if (productIndex !== -1) {
                            const product = updatedProducts[productIndex];
                            const newStock = product.stock - item.quantity;
                            updatedProducts[productIndex] = { ...product, stock: newStock };
                            await db.saveItem('products', updatedProducts[productIndex]);
                        }
                    }
                }
            }
            
            setProducts(updatedProducts);
        
            if (settings.loyalty.enabled && newSale.customerId !== 'cust001') {
                const customerIndex = customers.findIndex(c => c.id === newSale.customerId);
                if (customerIndex !== -1) {
                    const customer = customers[customerIndex];
                    const updatedPoints = customer.loyaltyPoints + pointsEarned - newSale.pointsUsed;
                    newSale.pointsBalanceAfter = updatedPoints;
                    const updatedCustomer = { ...customer, loyaltyPoints: updatedPoints };
                    const updatedCustomers = [...customers];
                    updatedCustomers[customerIndex] = updatedCustomer;
                    setCustomers(updatedCustomers);
                    await db.saveItem('customers', updatedCustomer);
                }
            }

            if (newSale.salesOrderId) {
                const so = salesOrders.find(s => s.id === newSale.salesOrderId);
                if (so) {
                    if (newSale.items.some(i => i.id.startsWith('SO_DEPOSIT'))) {
                        newSale.grandTotal = so.total;
                        newSale.depositApplied = 0;
                        newSale.balanceDue = so.balance;
                    } else { 
                        newSale.grandTotal = so.total;
                        newSale.depositApplied = so.deposit;
                        newSale.balanceDue = 0;
                        const updatedSO = { ...so, balance: 0, status: 'Completed' as const };
                        await handleUpdateSalesOrder(updatedSO);
                    }
                }
            } else if (newSale.workOrderId) {
                const wo = workOrders.find(w => w.id === newSale.workOrderId);
                if (wo) {
                     if (newSale.items.some(i => i.id.startsWith('WO_DEPOSIT'))) {
                        newSale.grandTotal = wo.estimatedCost;
                        newSale.depositApplied = 0;
                        newSale.balanceDue = wo.estimatedCost - newSale.total;
                        const updatedWO = { ...wo, depositPaid: newSale.total };
                        // FIX: Added missing 'handleUpdateWorkOrder' function to fix 'Cannot find name' error.
                        await handleUpdateWorkOrder(updatedWO, true); 
                    } else { 
                         newSale.grandTotal = wo.estimatedCost;
                         newSale.depositApplied = wo.depositPaid;
                         newSale.balanceDue = 0;
                         const updatedWO = { ...wo, status: 'Completed' as const, completedDate: new Date(), depositPaid: wo.estimatedCost };
                         // FIX: Added missing 'handleUpdateWorkOrder' function to fix 'Cannot find name' error.
                         await handleUpdateWorkOrder(updatedWO, true);
                    }
                }
            }
            
            await db.saveItem('sales', newSale);
            setSales(prev => [newSale, ...prev]);
        
            const updatedShift = { ...activeShift, salesIds: [...activeShift.salesIds, newSale.id] };
            setActiveShift(updatedShift);
            setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
            await db.saveItem('shifts', updatedShift);

            // --- Create Accounting Transaction ---
            const { accounting: accSettings } = settings;
            const cogs = newSale.items.reduce((acc, item) => {
                if (item.productType === 'Inventory') {
                    return acc + (item.costPrice || 0) * item.quantity;
                }
                return acc;
            }, 0);

            const entries: JournalEntry[] = [];
            // Debit assets from payments
            newSale.payments.forEach(p => {
                let accountId = '';
                switch (p.method) {
                    case 'Cash': accountId = accSettings.defaultCashAccountId; break;
                    case 'M-Pesa': accountId = accSettings.defaultMpesaAccountId; break;
                    case 'Card': accountId = accSettings.defaultCardAccountId; break;
                    case 'Points': return;
                }
                if (accountId) {
                    // FIX: The debit amount for a cash transaction must account for change given.
                    // The original code used the tendered amount, causing an imbalance.
                    const debitAmount = p.method === 'Cash' ? p.amount - newSale.change : p.amount;
                    if (debitAmount > 0) {
                        entries.push({ accountId, debit: debitAmount, credit: 0 });
                    }
                }
            });
            // Handle points used as a form of payment/discount
            if (newSale.pointsValue > 0) {
                 // Debiting sales account acts as a contra-revenue (discount)
                 entries.push({ accountId: accSettings.defaultSalesAccountId, debit: newSale.pointsValue, credit: 0 });
            }
            // Credit revenue and tax liabilities
            entries.push({ accountId: accSettings.defaultSalesAccountId, debit: 0, credit: newSale.taxableAmount });
            if (newSale.tax > 0) {
                entries.push({ accountId: accSettings.defaultVatPayableAccountId, debit: 0, credit: newSale.tax });
            }
            // Handle COGS and Inventory
            if (cogs > 0) {
                entries.push({ accountId: accSettings.defaultCogsAccountId, debit: cogs, credit: 0 });
                entries.push({ accountId: accSettings.defaultInventoryAccountId, debit: 0, credit: cogs });
            }
            await createAccountingTransaction(`Sale: ${newSale.id}`, newSale.id, 'Sale', entries);
            // --- End Accounting Transaction ---
        
            await logAudit('Sale Completed', `Sale ${newSale.id} for KES ${newSale.total.toFixed(2)} to ${customers.find(c => c.id === newSale.customerId)?.name}.`);
        
            return newSale;
        } catch (error) {
            console.error("Critical error during sale completion process:", { saleData, error });
            throw new Error("Failed to save the sale. Please check for errors and try again.");
        }
    };

    const handleProcessExpense = async (amount: number, reason: string, category: string, source: Expense['source'], payee?: string, receiptImageUrl?: string) => {
        try {
            const newExpense: Expense = {
                id: `exp_${Date.now()}`,
                cashierId: currentUser.id,
                cashierName: currentUser.name,
                date: new Date(),
                amount,
                reason,
                payee,
                category,
                source,
                receiptImageUrl,
            };

            if (source === 'Cash Drawer') {
                if (!activeShift) {
                    showToast("Cannot process expense from drawer. No active shift.", "error");
                    return;
                }
                newExpense.shiftId = activeShift.id;
                const updatedShift = { ...activeShift, expenseIds: [...(activeShift.expenseIds || []), newExpense.id] };
                setActiveShift(updatedShift);
                setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
                await db.saveItem('shifts', updatedShift);
            }
            
            await db.saveItem('payouts', newExpense); // Still use 'payouts' store for data continuity
            setExpenses(prev => [newExpense, ...prev]);
            
            // Create accounting transaction
            const expenseAccountId = settings.accounting.defaultCogsAccountId; // Simplified assumption
            let sourceAccountId = '';
            switch (source) {
                case 'Cash Drawer': sourceAccountId = settings.accounting.defaultCashAccountId; break;
                case 'M-Pesa': sourceAccountId = settings.accounting.defaultMpesaAccountId; break;
                case 'Bank': sourceAccountId = settings.accounting.defaultBankAccountId; break;
            }

            if (expenseAccountId && sourceAccountId) {
                await createAccountingTransaction(
                    `Expense: ${reason}`,
                    newExpense.id,
                    'Expense',
                    [
                        { accountId: expenseAccountId, debit: amount, credit: 0 },
                        { accountId: sourceAccountId, debit: 0, credit: amount },
                    ]
                );
            } else {
                showToast('Accounting accounts not fully configured. Transaction not recorded in General Ledger.', 'warning');
            }
            
            await logAudit('Expense Recorded', `Expense of KES ${amount.toFixed(2)} for ${reason} from ${source}.`);
            showToast('Expense recorded successfully.', 'success');
            handleViewChange(View.Expenditures);
        } catch (error) {
            console.error("Failed to process expense:", { amount, reason, payee, error });
            showToast("Error recording expense. Please try again.", "error");
        }
    };

    const handleAddBankDeposit = async (depositData: Omit<BankDeposit, 'id' | 'depositedById' | 'depositedByName' | 'shiftId'>) => {
        if (!currentUser) {
            showToast("Cannot record deposit, no user logged in.", 'error');
            return;
        }

        const newDeposit: BankDeposit = {
            id: `dep_${Date.now()}`,
            ...depositData,
            depositedById: currentUser.id,
            depositedByName: currentUser.name,
            shiftId: activeShift?.id,
        };

        try {
            await db.saveItem('bankDeposits', newDeposit);
            setBankDeposits(prev => [newDeposit, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));

            const { defaultCashAccountId, defaultBankAccountId } = settings.accounting;
            if (defaultCashAccountId && defaultBankAccountId) {
                await createAccountingTransaction(
                    `Bank Deposit - Ref: ${newDeposit.receiptNumber}`,
                    newDeposit.id,
                    'Bank Deposit',
                    [
                        { accountId: defaultBankAccountId, debit: newDeposit.amount, credit: 0 }, // Increase bank (Asset)
                        { accountId: defaultCashAccountId, debit: 0, credit: newDeposit.amount }, // Decrease cash (Asset)
                    ]
                );
            } else {
                 showToast('Accounting accounts for cash/bank not configured.', 'warning');
            }

            await logAudit('Bank Deposit Recorded', `Recorded deposit of KES ${newDeposit.amount} to ${newDeposit.bankName}.`);
            showToast('Bank deposit recorded successfully.', 'success');
        } catch (error) {
            console.error("Failed to record bank deposit:", error);
            showToast("Error recording bank deposit.", "error");
        }
    };
    
    const handleRecordSupplierPayment = async (invoiceId: string, paymentData: Omit<SupplierPayment, 'id' | 'invoiceId'>) => {
        const { amount, method, paymentDate } = paymentData;
        const invoiceIndex = supplierInvoices.findIndex(inv => inv.id === invoiceId);
        if (invoiceIndex === -1) {
            showToast("Invoice not found.", 'error');
            return;
        }

        try {
            const invoice = supplierInvoices[invoiceIndex];
            const newPaidAmount = invoice.paidAmount + amount;
            const newStatus: SupplierInvoice['status'] = newPaidAmount >= invoice.totalAmount ? 'Paid' : 'Partially Paid';
            const updatedInvoice: SupplierInvoice = {
                ...invoice,
                paidAmount: newPaidAmount,
                status: newStatus,
            };
            
            const newPayment: SupplierPayment = {
                id: `spay_${Date.now()}`,
                invoiceId,
                ...paymentData,
            };

            // DB operations
            await db.saveItem('supplierInvoices', updatedInvoice);
            await db.saveItem('supplierPayments', newPayment);
            
            // State updates
            const updatedInvoices = [...supplierInvoices];
            updatedInvoices[invoiceIndex] = updatedInvoice;
            setSupplierInvoices(updatedInvoices);
            setSupplierPayments(prev => [...prev, newPayment]);

            // Accounting transaction
            const { accounting: accSettings } = settings;
            let sourceAccountId = '';
            switch (method) {
                case 'Cash': sourceAccountId = accSettings.defaultCashAccountId; break;
                case 'M-Pesa': sourceAccountId = accSettings.defaultMpesaAccountId; break;
                case 'Bank Transfer': sourceAccountId = accSettings.defaultBankAccountId; break;
            }

            if (sourceAccountId && accSettings.defaultAccountsPayableId) {
                await createAccountingTransaction(
                    `Payment for invoice ${invoice.invoiceNumber}`,
                    newPayment.id,
                    'Supplier Payment',
                    [
                        { accountId: accSettings.defaultAccountsPayableId, debit: amount, credit: 0 }, // Decrease liability
                        { accountId: sourceAccountId, debit: 0, credit: amount } // Decrease asset
                    ]
                );
            } else {
                showToast('Accounting accounts not fully configured. Transaction not recorded in General Ledger.', 'warning');
            }

            await logAudit('Supplier Payment Recorded', `Recorded payment of KES ${amount} for invoice ${invoice.invoiceNumber} via ${method}.`);
            showToast('Supplier payment recorded successfully.', 'success');

        } catch (error) {
            console.error("Failed to record supplier payment:", error);
            showToast("Error recording payment.", "error");
        }
    };

    const handleImportProducts = async (file: File) => {
        if (!file) {
            showToast('No file selected.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csvData = event.target?.result as string;
                if (!csvData) {
                    showToast('Could not read file content.', 'error');
                    return;
                }

                const lines = csvData.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    showToast('CSV file must have a header and at least one data row.', 'error');
                    return;
                }

                const headerLine = lines.shift()!.trim();
                const headers = parseCsvLine(headerLine).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
                
                const requiredHeaders = ['name', 'price', 'stock'];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                if (missingHeaders.length > 0) {
                    showToast(`CSV is missing required columns: ${missingHeaders.join(', ')}`, 'error');
                    return;
                }

                const productsToUpdate: Product[] = [];
                const productsToAdd: Product[] = [];
                let skippedRows = 0;

                const existingProducts = await db.getAllItems<Product>('products');
                const existingInventoryCodes = new Set(existingProducts.map(p => p.inventoryCode));
                const existingUpcs = new Set(existingProducts.filter(p => p.upc).map(p => p.upc));

                for (const line of lines) {
                    if(!line.trim()) continue;
                    const values = parseCsvLine(line.trim());
                    if (values.length < headers.length) {
                        skippedRows++;
                        continue;
                    }
                    const rowData: { [key: string]: string } = {};
                    headers.forEach((header, index) => {
                        rowData[header] = values[index];
                    });

                    const name = rowData['name'];
                    const price = parseFloat(rowData['price']);
                    const stock = parseInt(rowData['stock'], 10);

                    if (!name || isNaN(price) || isNaN(stock)) {
                        skippedRows++;
                        continue;
                    }
                    
                    const inventoryCode = rowData['inventorycode'] || `IC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    const upc = rowData['upc'];

                    let existingProduct = existingProducts.find(p => p.inventoryCode === inventoryCode || (upc && p.upc && p.upc === upc));
                    
                    const productData: Partial<Product> = {
                        name,
                        price,
                        stock,
                        inventoryCode,
                        upc: upc || undefined,
                        description: rowData['description'] || '',
                        category: rowData['category'] || 'Uncategorized',
                        pricingType: (rowData['pricingtype'] === 'inclusive' || rowData['pricingtype'] === 'exclusive') ? rowData['pricingtype'] : 'inclusive',
                        productType: (rowData['producttype'] === 'Inventory' || rowData['producttype'] === 'Service') ? rowData['producttype'] : 'Inventory',
                        costPrice: parseFloat(rowData['costprice']) || 0,
                        unitOfMeasure: rowData['unitofmeasure'] || 'pc(s)',
                        imageUrl: rowData['imageurl'] || '',
                    };
                    
                    if (existingProduct) {
                        const updatedProduct = { ...existingProduct, ...productData };
                        productsToUpdate.push(updatedProduct);
                    } else {
                        if (existingInventoryCodes.has(inventoryCode) || (upc && existingUpcs.has(upc))) {
                            skippedRows++;
                            continue;
                        }
                        const newProduct: Product = {
                            id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            reservedStock: 0,
                            ...productData
                        } as Product;
                        productsToAdd.push(newProduct);
                        existingInventoryCodes.add(newProduct.inventoryCode);
                        if(newProduct.upc) existingUpcs.add(newProduct.upc);
                    }
                }

                for (const p of [...productsToAdd, ...productsToUpdate]) {
                    await db.saveItem('products', p);
                }
                
                setProducts(await db.getAllItems<Product>('products'));

                let summaryMessage = '';
                if (productsToAdd.length > 0) summaryMessage += `${productsToAdd.length} products added. `;
                if (productsToUpdate.length > 0) summaryMessage += `${productsToUpdate.length} products updated. `;
                if (skippedRows > 0) summaryMessage += `${skippedRows} rows skipped.`;

                showToast(summaryMessage || 'No products were imported.', 'success');
                await logAudit('Inventory Imported', `Imported from ${file.name}. ${summaryMessage}`);

            } catch (error) {
                console.error("Error importing products:", error);
                showToast('Failed to import products. Check file format.', 'error');
            }
        };
        reader.readAsText(file);
    };

    const handleAddProduct = async (productData: Omit<Product, 'id' | 'stock' | 'inventoryCode' | 'reservedStock'>): Promise<Product> => {
        try {
            const baseCode = (productData.name.substring(0, 3).toUpperCase() + String(Date.now()).slice(-4)).replace(/\s/g, '');
            let inventoryCode = baseCode;
            let counter = 1;
            while(products.some(p => p.inventoryCode === inventoryCode)) {
                inventoryCode = `${baseCode}-${counter++}`;
            }

            const newProduct: Product = {
                ...productData,
                id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                stock: 0,
                reservedStock: 0,
                inventoryCode: inventoryCode
            };
            await db.saveItem('products', newProduct);
            setProducts(prev => [...prev, newProduct].sort((a,b) => a.name.localeCompare(b.name)));
            await logAudit('Product Added', `Added new product: ${newProduct.name}`);
            showToast('Product added successfully!', 'success');
            return newProduct;
        } catch (error) {
            console.error("Failed to add product:", error);
            showToast('Failed to add product.', 'error');
            throw error;
        }
    };

    const handleUpdateProduct = async (product: Product) => {
        try {
            await db.saveItem('products', product);
            setProducts(prev => prev.map(p => p.id === product.id ? product : p).sort((a,b) => a.name.localeCompare(b.name)));
            await logAudit('Product Updated', `Updated product: ${product.name} (ID: ${product.id})`);
            showToast('Product updated successfully!', 'success');
        } catch (error) {
            console.error("Failed to update product:", error);
            showToast('Failed to update product.', 'error');
        }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            await db.deleteItem('products', productToDelete.id);
            setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
            await logAudit('Product Deleted', `Deleted product: ${productToDelete.name} (ID: ${productToDelete.id})`);
            showToast('Product deleted successfully.', 'success');
            setProductToDelete(null);
        } catch (error) {
            console.error("Failed to delete product:", error);
            showToast('Failed to delete product.', 'error');
        }
    };

    const handleAddSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier | null> => {
        try {
            const newSupplier: Supplier = {
                ...supplierData,
                id: `supp_${Date.now()}`
            };
            await db.saveItem('suppliers', newSupplier);
            setSuppliers(prev => [...prev, newSupplier].sort((a,b) => (a.businessName || a.name).localeCompare(b.businessName || b.name)));
            await logAudit('Supplier Added', `Added new supplier: ${newSupplier.businessName || newSupplier.name}`);
            showToast('Supplier added successfully!', 'success');
            return newSupplier;
        } catch (error) {
            console.error("Failed to add supplier:", error);
            showToast('Failed to add supplier.', 'error');
            return null;
        }
    };
    
    const handleUpdateSupplier = async (supplier: Supplier) => {
        try {
            await db.saveItem('suppliers', supplier);
            setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s).sort((a,b) => (a.businessName || a.name).localeCompare(b.businessName || b.name)));
            await logAudit('Supplier Updated', `Updated supplier: ${supplier.businessName || supplier.name}`);
            showToast('Supplier updated successfully!', 'success');
        } catch (error) {
            console.error("Failed to update supplier:", error);
            showToast('Failed to update supplier.', 'error');
        }
    };

    const handleDeleteSupplier = async (supplierId: string) => {
        try {
            // Check if supplier is used in any POs or invoices before deleting.
            const isUsedInPO = purchaseOrders.some(po => po.supplierId === supplierId);
            const isUsedInInvoice = supplierInvoices.some(inv => inv.supplierId === supplierId);
            if (isUsedInPO || isUsedInInvoice) {
                showToast('Cannot delete supplier. They are linked to existing purchase orders or invoices.', 'error');
                return;
            }
            const deletedSupplier = suppliers.find(s => s.id === supplierId);
            await db.deleteItem('suppliers', supplierId);
            setSuppliers(prev => prev.filter(s => s.id !== supplierId));
            await logAudit('Supplier Deleted', `Deleted supplier: ${deletedSupplier?.businessName || deletedSupplier?.name}`);
            showToast('Supplier deleted successfully.', 'success');
        } catch (error) {
            console.error("Failed to delete supplier:", error);
            showToast('Failed to delete supplier.', 'error');
        }
    };


    const handleSetupComplete = () => {
        handleUpdateSettings({ isSetupComplete: true });
    };
    
    // --- Purchase Order Action Handlers ---
    const handleAddPurchaseOrder = async (poData: PurchaseOrderData): Promise<PurchaseOrder> => {
        try {
            const poNumber = `${settings.receipt.poNumberPrefix}${Date.now()}`;
            const totalCost = poData.items.reduce((acc, item) => acc + item.cost * item.quantity, 0);

            // FIX: The property 'orderDate' was missing from the PurchaseOrderData type and was not being passed
            // from the creation form. This has been corrected in `types.ts` and `CreatePOForm.tsx`.
            // We destructure it here to use it for `createdDate` and to prevent it from being
            // incorrectly spread into the `newPO` object, which would cause a type error.
            const { orderDate, ...restOfPoData } = poData;

            const newPO: PurchaseOrder = {
                id: `po_${Date.now()}`,
                poNumber,
                ...restOfPoData,
                items: poData.items.map(item => ({ ...item, quantityReceived: 0 })),
                createdDate: orderDate ? new Date(orderDate) : new Date(),
                totalCost,
            };

            if (poData.salesOrderId) {
                const so = salesOrders.find(s => s.id === poData.salesOrderId);
                if (so) {
                    const updatedSOItems = so.items.map(soItem => {
                        const poItem = poData.items.find(pi => pi.salesOrderItemId === soItem.id);
                        if (poItem) {
                            return { ...soItem, status: 'Ordered' as const, purchaseOrderId: newPO.id };
                        }
                        return soItem;
                    });
                    const allItemsOrdered = updatedSOItems.every(item => item.status !== 'Pending');
                    const updatedSO: SalesOrder = { ...so, items: updatedSOItems, status: allItemsOrdered ? 'Ordered' : 'Pending' };
                    await handleUpdateSalesOrder(updatedSO);
                }
            }

            await db.saveItem('purchaseOrders', newPO);
            setPurchaseOrders(prev => [newPO, ...prev].sort((a,b) => b.createdDate.getTime() - a.createdDate.getTime()));
            
            await logAudit('Purchase Order Created', `Created PO #${newPO.poNumber} for supplier ${suppliers.find(s => s.id === newPO.supplierId)?.name}. Status: ${newPO.status}`);
            showToast(`Purchase Order ${newPO.poNumber} created.`, 'success');
            return newPO;
        } catch (error) {
            console.error("Failed to create purchase order:", error);
            showToast('Failed to create purchase order.', 'error');
            throw error;
        }
    };

    const handleSendPO = async (poId: string) => {
        const po = purchaseOrders.find(p => p.id === poId);
        if (!po) {
            showToast('Purchase Order not found.', 'error');
            return;
        }
        if (po.status !== 'Draft') {
            showToast('Only Draft purchase orders can be sent.', 'info');
            return;
        }
        const updatedPO: PurchaseOrder = { ...po, status: 'Sent' };
        try {
            await db.saveItem('purchaseOrders', updatedPO);
            setPurchaseOrders(prev => prev.map(p => p.id === poId ? updatedPO : p));
            await logAudit('Purchase Order Sent', `PO #${po.poNumber} was marked as Sent.`);
            showToast(`Purchase Order ${po.poNumber} marked as Sent.`, 'success');
            setModalEmail({type: 'PurchaseOrder', id: po.id, customerId: po.supplierId});
        } catch (error) {
            console.error("Failed to send purchase order:", error);
            showToast('Failed to update PO status.', 'error');
        }
    };

    // FIX: Implemented the logic to handle receiving stock, updating inventory and PO status, and creating a supplier invoice.
    const handleReceivePurchaseOrder = async (receivedItems: ReceivedPOItem[]) => {
        if (!poToReceive) return;

        try {
            const poToUpdate = purchaseOrders.find(po => po.id === poToReceive.id);
            if (!poToUpdate) throw new Error("Purchase Order not found");

            const updatedProducts: Product[] = [];
            let subtotal = 0;

            for (const receivedItem of receivedItems) {
                if (receivedItem.productId) {
                    const product = products.find(p => p.id === receivedItem.productId);
                    if (product && product.productType === 'Inventory') {
                        const updatedProduct = {
                            ...product,
                            stock: product.stock + receivedItem.quantityReceived,
                            upc: receivedItem.upc,
                            category: receivedItem.category,
                            costPrice: receivedItem.cost, // Also update cost price on receipt
                        };
                        updatedProducts.push(updatedProduct);
                        await db.saveItem('products', updatedProduct);
                    }
                }
                subtotal += receivedItem.cost * receivedItem.quantityReceived;
            }
            
            // Create new supplier invoice for this batch, but only if items were received
            if (subtotal > 0) {
                const taxAmount = subtotal * (settings.tax.vatRate / 100);
                const totalAmount = subtotal + taxAmount;

                const newInvoice: SupplierInvoice = {
                    id: `sinv_${Date.now()}`,
                    invoiceNumber: `INV-${poToUpdate.poNumber}-${Date.now()}`,
                    purchaseOrderId: poToUpdate.id,
                    supplierId: poToUpdate.supplierId,
                    invoiceDate: new Date(),
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Net 30 default
                    subtotal,
                    taxAmount,
                    totalAmount,
                    paidAmount: 0,
                    status: 'Unpaid',
                };
                await db.saveItem('supplierInvoices', newInvoice);
                setSupplierInvoices(prev => [newInvoice, ...prev]);
                await logAudit('Supplier Invoice Created', `Invoice #${newInvoice.invoiceNumber} created for PO #${poToUpdate.poNumber}.`);
            }
            
            // Update PO items with new received quantities
            let allItemsReceived = true;
            const updatedPOItems = poToUpdate.items.map(item => {
                const received = receivedItems.find(ri => ri.productId ? ri.productId === item.productId : ri.productName === item.productName);
                if (received) {
                    const newQuantityReceived = (item.quantityReceived || 0) + received.quantityReceived;
                    if (newQuantityReceived < item.quantity) {
                        allItemsReceived = false;
                    }
                    return { ...item, quantityReceived: newQuantityReceived };
                }
                if ((item.quantityReceived || 0) < item.quantity) {
                    allItemsReceived = false;
                }
                return item;
            });

            const newStatus: PurchaseOrder['status'] = receivedItems.length > 0
                ? (allItemsReceived ? 'Received' : 'Partially Received')
                : poToUpdate.status;

            const updatedPO: PurchaseOrder = {
                ...poToUpdate,
                items: updatedPOItems,
                status: newStatus,
                receivedDate: new Date(),
            };

            // Update sales order item status if linked
            const salesOrderToUpdate = salesOrders.find(so => so.id === poToUpdate.salesOrderId);
            if (salesOrderToUpdate) {
                const updatedSOItems = salesOrderToUpdate.items.map(soItem => {
                    const receivedPOItem = receivedItems.find(ri => ri.salesOrderItemId === soItem.id);
                    if (receivedPOItem) {
                        const newSOQuantityReceived = (soItem.quantityReceived || 0) + receivedPOItem.quantityReceived;
                        let soItemStatus: SalesOrderItem['status'] = 'Partially Received';
                        if (newSOQuantityReceived >= soItem.quantity) {
                            soItemStatus = 'Received';
                        }
                        return { ...soItem, quantityReceived: newSOQuantityReceived, status: soItemStatus };
                    }
                    return soItem;
                });

                const allSOItemsReceived = updatedSOItems.every(item => item.status === 'Received');
                const newSOStatus: SalesOrder['status'] = allSOItemsReceived ? 'Received' : 'Partially Received';
                
                const updatedSO = { ...salesOrderToUpdate, items: updatedSOItems, status: newSOStatus };
                await db.saveItem('salesOrders', updatedSO);
                setSalesOrders(prev => prev.map(so => so.id === updatedSO.id ? updatedSO : so));
            }


            // Update state
            setProducts(prev => {
                const productMap = new Map(prev.map(p => [p.id, p]));
                updatedProducts.forEach(up => productMap.set(up.id, up));
                return Array.from(productMap.values());
            });
            setPurchaseOrders(prev => prev.map(po => po.id === updatedPO.id ? updatedPO : po));
            
            await db.saveItem('purchaseOrders', updatedPO);
            
            await logAudit('Stock Received', `Received stock for PO #${updatedPO.poNumber}.`);
            showToast('Stock received and supplier invoice created.', 'success');
            setPoToReceive(null);
        } catch (error) {
            console.error("Failed to receive stock:", error);
            showToast('Error receiving stock. Please try again.', 'error');
        }
    };


    // --- Sales Order Action Handlers ---
    const handleUpdateSalesOrder = async (updatedSO: SalesOrder) => {
        try {
            setSalesOrders(prev => prev.map(so => so.id === updatedSO.id ? updatedSO : so));
            await db.saveItem('salesOrders', updatedSO);
            setSalesOrderToView(updatedSO); // Keep the view open with updated data
            showToast(`Sales Order #${updatedSO.id} updated.`, 'success');
        } catch (error) {
            console.error("Failed to update sales order:", { salesOrderId: updatedSO.id, error });
            showToast("Error updating sales order.", "error");
        }
    };

    // FIX: Add missing 'handleUpdateWorkOrder' function definition to resolve errors where it is called.
    const handleUpdateWorkOrder = async (updatedWO: WorkOrder, fromSale: boolean = false) => {
        try {
            setWorkOrders(prev => prev.map(wo => wo.id === updatedWO.id ? updatedWO : wo));
            await db.saveItem('workOrders', updatedWO);
            if (!fromSale) { // Don't show toast if it's part of sale completion
                showToast(`Work Order #${updatedWO.id} updated.`, 'success');
            }
            setWorkOrderToView(updatedWO); // Keep view open
        } catch (error) {
            console.error("Failed to update work order:", { workOrderId: updatedWO.id, error });
            showToast("Error updating work order.", "error");
        }
    };

    const handleDirectCompleteSalesOrder = async (salesOrder: SalesOrder, payments: Payment[]): Promise<Sale> => {
        if (!activeShift || !currentUser) {
            showToast("Cannot complete sale. No active shift or user.", "error");
            throw new Error("No active shift or user.");
        }
    
        const cartItems: CartItem[] = salesOrder.items.map(soItem => {
            const product = products.find(p => p.id === soItem.productId);
            // This creates a "snapshot" of the item at the time of sale, using the price from the SO
            return {
                id: product?.id || soItem.id,
                name: soItem.description,
                inventoryCode: product?.inventoryCode || `SO-${soItem.id}`,
                upc: product?.upc,
                description: product?.description,
                category: product?.category || 'Sales Order Item',
                price: soItem.unitPrice,
                pricingType: soItem.pricingType,
                productType: product?.productType || 'Inventory',
                costPrice: product?.costPrice,
                stock: product?.stock || 0,
                reservedStock: product?.reservedStock || 0,
                imageUrl: product?.imageUrl || '',
                unitOfMeasure: product?.unitOfMeasure || 'pc(s)',
                quantity: soItem.quantity,
            };
        });
    
        const { subtotal, tax, totalDiscountAmount, taxableAmount, lineItemsDiscountAmount, cartDiscountAmount } = calculateCartTotals(cartItems, { type: 'fixed', value: 0 }, settings.tax.vatRate / 100);
    
        const totalPaidInThisTransaction = payments.reduce((acc, p) => acc + p.amount, 0);
    
        const saleData: SaleData = {
            items: cartItems,
            subtotal,
            lineItemsDiscountAmount,
            cartDiscountAmount,
            discountAmount: totalDiscountAmount,
            taxableAmount,
            tax,
            total: totalPaidInThisTransaction,
            payments,
            change: Math.max(0, totalPaidInThisTransaction - salesOrder.balance),
            customerId: salesOrder.customerId,
            date: new Date(),
            pointsUsed: 0,
            pointsValue: 0,
            salesOrderId: salesOrder.id,
            grandTotal: salesOrder.total,
            depositApplied: salesOrder.deposit,
            balanceDue: 0,
        };
        
        // Use the main sale completion logic
        return handleCompleteSale(saleData);
    };

    const handleCancelSalesOrder = (salesOrder: SalesOrder) => {
        const updatedSO = { ...salesOrder, status: 'Cancelled' as const };
        handleUpdateSalesOrder(updatedSO);
    };

    const handleCreatePOFromSO = (salesOrder: SalesOrder) => {
        setSalesOrderForPO(salesOrder);
        setSalesOrderToView(null);
        handleViewChange(View.Purchases);
    };
    
    const handlePushSOToPOS = (salesOrder: SalesOrder) => {
        const balanceDue = salesOrder.balance;
        if (balanceDue <= 0) {
            showToast('Sales order is fully paid.', 'info');
            return;
        }
    
        const item: CartItem = {
            id: `SO_PAYMENT_${salesOrder.id}`,
            inventoryCode: `SO-${salesOrder.id}`,
            name: `Payment for Sales Order #${salesOrder.id}`,
            price: salesOrder.total, // Push the FULL original total
            pricingType: 'inclusive', // Prices are VAT inclusive
            stock: 9999,
            quantity: 1,
            productType: 'Service',
            category: 'Sales Order',
            reservedStock: 0,
            imageUrl: '',
            unitOfMeasure: 'payment',
        };
    
        setCart([item]);
        setSelectedCustomerId(salesOrder.customerId);
        setOriginatingSalesOrderId(salesOrder.id); // This is crucial for applying the deposit
        setSalesOrderToView(null);
        handleViewChange(View.POS);
    };

    // --- Layaway Action Handlers ---
    const handleAddLayaway = async (layawayData: Omit<Layaway, 'id' | 'balance' | 'cashierId' | 'cashierName' | 'shiftId' | 'payments'> & { initialPayment: { amount: number; method: Payment['method']; } }) => {
        if (!activeShift || !currentUser) {
            showToast("Cannot create layaway. No active shift.", "error");
            throw new Error("No active shift for layaway.");
        }

        try {
            // 1. Create the Sale record for the deposit first to get a saleId
            const depositItem: CartItem = {
                id: `LAYAWAY_DEPOSIT_${Date.now()}`, name: `Layaway Deposit`,
                inventoryCode: 'DEPOSIT', price: layawayData.deposit, pricingType: 'inclusive',
                productType: 'Service', stock: 9999, imageUrl: '', unitOfMeasure: 'unit',
                category: 'Layaway', quantity: 1,
                reservedStock: 0,
            };
            const { subtotal, tax, total, taxableAmount, lineItemsDiscountAmount, cartDiscountAmount, totalDiscountAmount } = calculateCartTotals([depositItem], {type: 'fixed', value: 0}, settings.tax.vatRate / 100);

            const depositSaleData: SaleData = {
                items: [depositItem],
                subtotal, lineItemsDiscountAmount, cartDiscountAmount, discountAmount: totalDiscountAmount,
                taxableAmount, tax, total,
                payments: [{...layawayData.initialPayment}],
                change: 0, customerId: layawayData.customerId, date: new Date(), 
                pointsUsed: 0, pointsValue: 0,
            };
            const depositSale = await handleCompleteSale(depositSaleData);

            // 2. Now create the Layaway object with the generated saleId
            const newLayaway: Layaway = {
                id: `${settings.receipt.layawayPrefix}${Date.now()}`,
                cashierId: currentUser.id,
                cashierName: currentUser.name,
                shiftId: activeShift.id,
                ...layawayData,
                balance: layawayData.total - layawayData.deposit,
                payments: [{
                    saleId: depositSale.id,
                    date: depositSale.date,
                    amount: layawayData.deposit,
                    method: layawayData.initialPayment.method,
                    cashierId: currentUser.id
                }]
            };

            await db.saveItem('layaways', newLayaway);
            setLayaways(prev => [...prev, newLayaway]);
            
            // FIX: Pass the complete 'newLayaway' object to 'setLayawayForReceipt' to match the 'Layaway' type.
            setLayawayForReceipt(newLayaway);
            return newLayaway;
        } catch(error) {
            console.error("Failed to create layaway:", error);
            showToast("Error creating layaway. The deposit sale may have failed.", 'error');
            throw error;
        }
    };

    const handleAddLayawayPayment = async (layawayId: string, amount: number, method: Payment['method']) => {
        const layaway = layaways.find(l => l.id === layawayId);
        if (!layaway || !activeShift || !currentUser) {
            showToast("Cannot process payment. No layaway or active shift found.", "error");
            return;
        }

        try {
            const paymentItem: CartItem = {
                id: `LAYAWAY_PAYMENT_${layawayId}_${Date.now()}`, name: `Layaway Payment for #${layawayId}`,
                inventoryCode: 'PAYMENT', price: amount, pricingType: 'inclusive',
                productType: 'Service', stock: 9999, imageUrl: '', unitOfMeasure: 'unit',
                category: 'Layaway', quantity: 1,
                reservedStock: 0,
            };
            const { subtotal, tax, total, taxableAmount, lineItemsDiscountAmount, cartDiscountAmount, totalDiscountAmount } = calculateCartTotals([paymentItem], {type: 'fixed', value: 0}, settings.tax.vatRate / 100);

            const saleData: SaleData = {
                items: [paymentItem],
                subtotal, lineItemsDiscountAmount, cartDiscountAmount, discountAmount: totalDiscountAmount,
                taxableAmount, tax, total,
                payments: [{ method, amount, details: {} }],
                change: 0, customerId: layaway.customerId, date: new Date(), 
                pointsUsed: 0, pointsValue: 0,
            };
            const paymentSale = await handleCompleteSale(saleData);

            const newPayment: LayawayPayment = {
                saleId: paymentSale.id,
                date: paymentSale.date,
                amount: amount,
                method: method,
                cashierId: currentUser.id
            };

            const newBalance = layaway.balance - amount;
            const newStatus = newBalance <= 0 ? 'Completed' : layaway.status;

            const updatedLayaway: Layaway = {
                ...layaway,
                payments: [...layaway.payments, newPayment],
                balance: newBalance,
                status: newStatus,
            };

            await db.saveItem('layaways', updatedLayaway);
            setLayaways(prev => prev.map(l => l.id === layawayId ? updatedLayaway : l));
            setLayawayToView(updatedLayaway); // Update the detail view
            setLayawayForReceipt(updatedLayaway); // For the receipt view
            showToast("Layaway payment recorded successfully.", "success");
        } catch (error) {
            console.error("Failed to add layaway payment:", error);
            showToast("Error recording layaway payment.", "error");
        }
    };


    if (!settings.isSetupComplete) {
        return <SetupWizard 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            showToast={showToast}
            onSetupComplete={handleSetupComplete} 
        />;
    }
    
    if (isAppLoading) {
        return <div className="h-screen w-screen flex items-center justify-center">Loading Application...</div>;
    }
    
    if (isLocked) {
        return <PinLockView currentUser={currentUser} onUnlock={() => setIsLocked(false)} onForceLogout={onLogout} />;
    }

    const onEmailReceiptRequest = (type: 'Receipt' | 'Quotation' | 'Proforma-Invoice', id: string, customerId: string) => setModalEmail({ type, id, customerId });
    const onWhatsAppReceiptRequest = (type: 'Receipt' | 'Quotation', id: string, customerId: string) => setModalWhatsApp({ type, id, customerId });

    const posViewProps = {
        products, cart, customers, selectedCustomerId,
        onCustomerChange: setSelectedCustomerId, addToCart, updateCartItemQuantity, updateCartItemDiscount,
        removeFromCart, clearCart, completeSale: handleCompleteSale, isOnline: true, currentUser, settings, sales, expenses,
        activeShift, onStartShift: handleStartShift, onEndShiftRequest: () => setIsEndingShift(true), isEndingShift,
        onConfirmEndShift: handleConfirmEndShift, onCancelEndShift: () => setIsEndingShift(false),
        shiftReportToShow, onCloseShiftReport: () => setShiftReportToShow(null), onEmailReceiptRequest: (saleId: string, customerId: string) => onEmailReceiptRequest('Receipt', saleId, customerId), onWhatsAppReceiptRequest: (saleId: string, customerId: string) => onWhatsAppReceiptRequest('Receipt', saleId, customerId),
        onHoldRequest: () => setIsHoldModalOpen(true),
        workOrders, originatingWorkOrderId, salesOrders, originatingSalesOrderId,
        showToast,
        payouts: expenses,
    };


    const renderView = () => {
        switch (currentView) {
            case View.POS:
                return saleSuccessInfo ? (
                    <SaleSuccessView 
                        sale={saleSuccessInfo.sale}
                        layaway={saleSuccessInfo.layaway}
                        onNewSale={() => { setSaleSuccessInfo(null); clearCart(); }}
                        currentUser={currentUser}
                        settings={settings}
                        onEmailReceiptRequest={(saleId, customerId) => onEmailReceiptRequest('Receipt', saleId, customerId)}
                        onWhatsAppReceiptRequest={(saleId, customerId) => onWhatsAppReceiptRequest('Receipt', saleId, customerId)}
                        showToast={showToast}
                    />
                ) : (
                    <PosView {...posViewProps} />
                );
            case View.Dashboard:
                return <DashboardView 
                    sales={sales} 
                    products={products}
                    suppliers={suppliers}
                    supplierInvoices={supplierInvoices}
                    expenses={expenses}
                    settings={settings}
                />;
            case View.Inventory:
                return <InventoryView
                    products={products}
                    purchaseOrders={purchaseOrders}
                    suppliers={suppliers}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProductRequest={setProductToDelete}
                    permissions={userPermissions}
                    onImportProducts={handleImportProducts}
                    onPrintBarcodeRequest={setProductForBarcode}
                    onAddToPORequest={setProductForPO}
                    settings={settings}
                 />;
            case View.Purchases:
                 return <PurchasesView 
                    purchaseOrders={purchaseOrders}
                    suppliers={suppliers}
                    products={products}
                    permissions={userPermissions}
                    onReceivePORequest={setPoToReceive}
                    onAddPurchaseOrder={handleAddPurchaseOrder}
                    onAddSupplier={handleAddSupplier}
                    onSendPO={handleSendPO}
                    onEmailPORequest={(poId, supplierId) => setModalEmail({type: 'PurchaseOrder', id: poId, customerId: supplierId})}
                    onWhatsAppPORequest={(poId, supplierId) => setModalWhatsApp({type: 'PurchaseOrder', id: poId, customerId: supplierId})}
                    settings={settings}
                    salesOrderForPO={salesOrderForPO}
                    onClearSalesOrderForPO={() => setSalesOrderForPO(null)}
                />;
            case View.Suppliers:
                return <SuppliersView
                    suppliers={suppliers}
                    purchaseOrders={purchaseOrders}
                    supplierInvoices={supplierInvoices}
                    supplierPayments={supplierPayments}
                    onAddSupplier={handleAddSupplier}
                    onUpdateSupplier={handleUpdateSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                    permissions={userPermissions}
                    settings={settings}
                />
            case View.AccountsPayable:
                return invoiceToView ? (
                    <InvoiceDetailView
                        invoice={invoiceToView}
                        supplier={suppliers.find(s => s.id === invoiceToView.supplierId)}
                        purchaseOrder={purchaseOrders.find(po => po.id === invoiceToView.purchaseOrderId)}
                        settings={settings}
                        onBack={() => setInvoiceToView(null)}
                        onEmailRequest={(invoiceId, supplierId) => setModalEmail({type: 'SupplierInvoice', id: invoiceId, customerId: supplierId})}
                     />
                ) : (
                    <AccountsPayableView
                        invoices={supplierInvoices}
                        suppliers={suppliers}
                        onRecordPayment={handleRecordSupplierPayment}
                        onViewInvoice={setInvoiceToView}
                        activeShift={activeShift}
                        sales={sales}
                        payouts={expenses}
                        accountingTransactions={accountingTransactions}
                        chartOfAccounts={chartOfAccounts}
                        settings={settings}
                    />
                );
             case View.TaxReport:
                return <TaxReportView sales={sales} supplierInvoices={supplierInvoices} settings={settings} />;
            case View.ProfitReport:
                return <ProfitReportView sales={sales} products={products} expenses={expenses} settings={settings} showToast={showToast} />;
            case View.PaymentSummary:
                return <PaymentSummaryView sales={sales} users={users} />;
            case View.ShiftReport:
                return <ShiftReportView shifts={shifts} sales={sales} expenses={expenses} settings={settings} />;
            case View.SalesHistory:
                return saleToView ? (
                    <ReceiptDetailView 
                        sale={saleToView} 
                        layaway={layawayForReceipt || undefined}
                        onBack={() => {setSaleToView(null); setLayawayForReceipt(null);}} 
                        currentUser={currentUser} 
                        settings={settings} 
                        onEmailReceiptRequest={(type, saleId, customerId) => onEmailReceiptRequest(type, saleId, customerId)}
                        onWhatsAppReceiptRequest={(type, saleId, customerId) => onWhatsAppReceiptRequest(type, saleId, customerId)}
                        showToast={showToast}
                    />
                ) : (
                    <SalesHistoryView sales={sales} customers={customers} users={users} onViewSaleRequest={(sale) => {
                        if (layaways.some(l => l.payments.some(p => p.saleId === sale.id))) {
                            const layaway = layaways.find(l => l.payments.some(p => p.saleId === sale.id));
                            if (layaway) setLayawayForReceipt(layaway);
                        }
                        setSaleToView(sale);
                    }}/>
                );
            case View.Customers:
                return <CustomersView customers={customers} sales={sales} onAddCustomer={() => {}} onUpdateCustomer={() => {}} onDeleteCustomer={() => {}} permissions={userPermissions} settings={settings} />;
            case View.Quotations:
                 return quoteToView ? (
                    <QuotationDetailView 
                        quotation={quoteToView} 
                        settings={settings}
                        sales={sales}
                        onBack={() => setQuoteToView(null)} 
                        onConvertQuoteToSale={() => {}}
                        onEmailRequest={(type, quoteId, customerId) => setModalEmail({ type, id: quoteId, customerId })}
                        permissions={userPermissions}
                    />
                 ) : (
                    <QuotationsView quotations={quotations} sales={sales} onSelectQuotation={setQuoteToView} onCreateQuoteRequest={() => setCurrentView(View.CreateQuotation)} permissions={userPermissions} />
                 );
            case View.CreateQuotation:
                return <CreateQuotationForm
                    customers={customers}
                    products={products}
                    settings={settings}
                    onSave={() => {}}
                    onCancel={() => setCurrentView(View.Quotations)}
                />;
            case View.Staff:
                return <StaffView 
                    users={users}
                    permissions={userPermissions}
                    onAddUser={onAddUser}
                    onUpdateUser={onUpdateUser}
                    onDeleteUser={onDeleteUser}
                    onManagePermissionsRequest={() => setModalToOpenInSettings('users-perms')}
                />;
            case View.TimeSheets:
                return <TimeSheetsView 
                    timeClockEvents={timeClockEvents}
                    users={users}
                    permissions={userPermissions}
                    onAddRequest={() => { setTimeClockEventToEdit(null); setIsTimeClockModalOpen(true); }}
                    onEditRequest={(event) => { setTimeClockEventToEdit(event); setIsTimeClockModalOpen(true); }}
                    onDeleteRequest={() => {}}
                />;
            case View.Settings:
                return <SettingsView 
                    settings={settings} 
                    onUpdateSettings={handleUpdateSettings} 
                    users={users}
                    auditLogs={auditLogs}
                    showToast={showToast}
                    onBackup={() => {}}
                    onRestoreRequest={(file) => {
                        setFileToRestore(file);
                        setIsRestoreConfirmOpen(true);
                    }}
                    onFactoryResetRequest={() => setIsResetConfirmOpen(true)}
                    openModalId={modalToOpenInSettings}
                    onModalOpened={() => setModalToOpenInSettings(null)}
                    onTestBarcodePrint={() => {}}
                    // Google Drive
                    onInitDrive={() => {}}
                    isDriveReady={isDriveReady}
                    isDriveInitializing={isDriveInitializing}
                    isDriveAuthenticated={isDriveAuthenticated}
                    driveUser={driveUser}
                    onDriveSignIn={() => {}}
                    onDriveSignOut={() => {}}
                    onDriveBackup={() => {}}
                    onDriveRestore={() => {}}
                    onDriveBackupAuditLogs={() => {}}
                    isDriveConfigured={isDriveConfigured}
                    // Accounting
                    chartOfAccounts={chartOfAccounts}
                    onAddAccount={async () => {}}
                    onUpdateAccount={async () => {}}
                    onDeleteAccount={async () => {}}
                />;
            // POS Sub-menu
            case View.ReturnReceipt:
                return <ReturnReceiptView sales={sales} activeShift={activeShift} onProcessReturn={() => {}} onBack={() => handleViewChange(View.POS)} />;
            case View.NewExpense:
                return <NewExpenseView 
                    activeShift={activeShift} 
                    onProcessExpense={handleProcessExpense} 
                    onBack={() => handleViewChange(View.POS)}
                    sales={sales}
                    expenses={expenses}
                    accountingTransactions={accountingTransactions}
                    chartOfAccounts={chartOfAccounts}
                    settings={settings}
                    currentUser={currentUser}
                />;
            case View.Expenditures:
                 return expenseToView ? (
                    <ExpenseDetailView expense={expenseToView} settings={settings} onBack={() => setExpenseToView(null)} />
                 ) : (
                    <ExpendituresView expenses={expenses} onViewExpenseRequest={setExpenseToView} setCurrentView={setCurrentView} />
                 );
            case View.Layaway: // This is the form, LayawayList is the list
                return <NewLayawayView products={products} customers={customers} settings={settings} onAddLayaway={handleAddLayaway} onBack={() => handleViewChange(View.POS)} activeShift={activeShift} />;
            case View.WorkOrder: // Form
                return <NewWorkOrderView products={products} customers={customers} users={users} settings={settings} onAddWorkOrder={() => {}} onBack={() => handleViewChange(View.POS)} activeShift={activeShift} />;
            case View.SalesOrder: // Form
                return <NewSalesOrderView products={products} customers={customers} settings={settings} onAddSalesOrder={() => {}} onBack={() => handleViewChange(View.POS)} activeShift={activeShift} />;
            case View.LayawayList:
                return layawayToView ? (
                    <LayawayDetailView layaway={layawayToView} sales={sales} onBack={() => setLayawayToView(null)} onAddPayment={handleAddLayawayPayment} onViewReceiptRequest={(sale, layaway) => { setSaleToView(sale); setLayawayForReceipt(layaway); }} />
                ) : (
                    <LayawayListView layaways={layaways} onSelectLayaway={setLayawayToView} onCreateRequest={() => handleViewChange(View.Layaway)} />
                );
            case View.WorkOrderList:
                return workOrderToView ? (
                    <WorkOrderDetailView workOrder={workOrderToView} users={users} sales={sales} settings={settings} onBack={() => setWorkOrderToView(null)} onUpdate={handleUpdateWorkOrder} onPushToPOS={() => {}} />
                ) : (
                    <WorkOrderListView workOrders={workOrders} users={users} customers={customers} onViewWorkOrder={setWorkOrderToView} onCreateRequest={() => handleViewChange(View.WorkOrder)} />
                );
            case View.SalesOrderList:
                 return salesOrderToView ? (
                    <SalesOrderDetailView 
                        salesOrder={salesOrderToView}
                        onBack={() => setSalesOrderToView(null)}
                        onCreatePO={handleCreatePOFromSO}
                        onCancelRequest={setSalesOrderToCancel}
                        onUpdate={handleUpdateSalesOrder}
                        settings={settings}
                        onDirectComplete={handleDirectCompleteSalesOrder}
                        sales={sales}
                        currentUser={currentUser}
                        onEmailReceiptRequest={(type, saleId, customerId) => onEmailReceiptRequest(type, saleId, customerId)}
                        onWhatsAppReceiptRequest={(type, saleId, customerId) => onWhatsAppReceiptRequest(type, saleId, customerId)}
                        showToast={showToast}
                    />
                 ) : (
                    <SalesOrderListView
                        salesOrders={salesOrders}
                        onViewSalesOrder={setSalesOrderToView}
                        onCancelRequest={setSalesOrderToCancel}
                        onCreatePORequest={handleCreatePOFromSO}
                        onPushToPOSRequest={handlePushSOToPOS}
                        onCreateRequest={() => handleViewChange(View.SalesOrder)}
                    />
                 );
            case View.HeldReceipts:
                return <HeldReceiptsView heldReceipts={heldReceipts} onRecallReceipt={() => {}} onDeleteReceiptRequest={setHeldReceiptToDelete} />;
            case View.OpenCashDrawer:
                return <OpenCashDrawerView onBack={() => handleViewChange(View.POS)} onOpenDrawer={handleOpenDrawer} />;
            case View.WhatsAppOrders:
                return <WhatsAppOrdersView products={products} customers={customers} settings={settings} activeShift={activeShift} onAddSalesOrder={async () => ({} as SalesOrder)} onBack={() => handleViewChange(View.POS)} />;
            case View.Accounts:
                return <AccountsView
                    accountingTransactions={accountingTransactions}
                    chartOfAccounts={chartOfAccounts}
                    settings={settings}
                    sales={sales}
                    expenses={expenses}
                    activeShift={activeShift}
                    users={users}
                    bankDeposits={bankDeposits}
                    onAddBankDeposit={handleAddBankDeposit}
                    currentUser={currentUser}
                    customers={customers}
                    supplierPayments={supplierPayments}
                    suppliers={suppliers}
                    supplierInvoices={supplierInvoices}
                />;
            case View.GeneralLedger:
                return <GeneralLedgerView transactions={accountingTransactions} accounts={chartOfAccounts} />;
            default:
                return <div>View not implemented yet.</div>;
        }
    };


    return (
        <div className={`theme-${theme} h-screen w-screen bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground flex overflow-hidden`}>
            <Sidebar 
                currentView={currentView} 
                setCurrentView={handleViewChange} 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen}
                currentUser={currentUser}
                onLogout={onLogout}
                permissions={userPermissions}
                settings={settings}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <Header 
                    isOnline={true} 
                    isSyncing={false} 
                    queuedSalesCount={0} 
                    onMenuClick={() => setIsSidebarOpen(prev => !prev)}
                    currentUser={currentUser}
                    products={products}
                    settings={settings}
                    onInstallClick={handleInstallClick}
                    installPromptEvent={installPromptEvent}
                    activeTimeClockEvent={activeTimeClockEvent}
                    onClockIn={() => {}}
                    onClockOut={() => {}}
                    onLogout={onLogout}
                />
                 <main className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <MotionDiv
                            key={currentView}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {renderView()}
                        </MotionDiv>
                    </AnimatePresence>
                </main>
            </div>
             <AnimatePresence>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} />
                ))}
                {updateAvailable && <UpdateNotification onUpdate={handleUpdateAndReload} />}
                {productToDelete && (
                    <ConfirmationModal
                        title={`Delete ${productToDelete.name}?`}
                        message="Are you sure? This action cannot be undone and may affect historical sales reports."
                        onConfirm={handleDeleteProduct}
                        onClose={() => setProductToDelete(null)}
                        confirmText="Delete"
                        isDestructive
                    />
                )}
                 {poToReceive && (
                    <ReceivePOModal 
                        purchaseOrder={poToReceive}
                        supplier={suppliers.find(s => s.id === poToReceive.supplierId)}
                        products={products}
                        onConfirm={handleReceivePurchaseOrder}
                        onClose={() => setPoToReceive(null)}
                    />
                )}
                 {productForPO && (
                    <AddToPOModal 
                        product={productForPO}
                        purchaseOrders={purchaseOrders}
                        suppliers={suppliers}
                        onConfirm={() => {}}
                        onClose={() => setProductForPO(null)}
                    />
                )}
                 {productForBarcode && (
                    <BarcodePrintModal
                        product={productForBarcode}
                        onClose={() => setProductForBarcode(null)}
                    />
                )}
                {modalEmail && (
                    <EmailModal
                        documentType={modalEmail.type}
                        documentId={modalEmail.id}
                        recipientName={
                            (customers.find(c => c.id === modalEmail.customerId) || suppliers.find(s => s.id === modalEmail.customerId))?.name || 'Valued Client'
                        }
                        defaultEmail={
                             (customers.find(c => c.id === modalEmail.customerId) || suppliers.find(s => s.id === modalEmail.customerId))?.email || ''
                        }
                        onSend={() => {}}
                        onClose={() => setModalEmail(null)}
                    />
                )}
                 {modalWhatsApp && (
                    <WhatsAppModal
                        mode={modalWhatsApp.type === 'PurchaseOrder' ? 'po' : 'receipt'}
                        recipient={
                            customers.find(c => c.id === modalWhatsApp.customerId) || suppliers.find(s => s.id === modalWhatsApp.customerId)
                        }
                        documentId={modalWhatsApp.id}
                        onSend={() => {}}
                        onClose={() => setModalWhatsApp(null)}
                    />
                 )}
                 {isTimeClockModalOpen && (
                    <TimeClockModal 
                        event={timeClockEventToEdit}
                        users={users}
                        onClose={() => setIsTimeClockModalOpen(false)}
                        onSave={() => {}}
                    />
                )}
                {salesOrderToCancel && (
                    <ConfirmationModal
                        title={`Cancel Sales Order ${salesOrderToCancel.id}?`}
                        message="Are you sure? This will mark the order as cancelled. This action cannot be undone."
                        onConfirm={() => {
                            handleCancelSalesOrder(salesOrderToCancel);
                            setSalesOrderToCancel(null);
                        }}
                        onClose={() => setSalesOrderToCancel(null)}
                        confirmText="Cancel Order"
                        isDestructive
                    />
                )}
                 {isHoldModalOpen && (
                    <HoldReceiptModal
                        onConfirm={() => {}}
                        onClose={() => setIsHoldModalOpen(false)}
                    />
                 )}
                 {heldReceiptToDelete && (
                     <ConfirmationModal
                        title="Delete Held Receipt?"
                        message={`Are you sure you want to delete the held receipt "${heldReceiptToDelete.name}"? This action cannot be undone.`}
                        onConfirm={() => {}}
                        onClose={() => setHeldReceiptToDelete(null)}
                        confirmText="Delete"
                        isDestructive
                    />
                 )}
                {isRestoreConfirmOpen && fileToRestore && (
                     <ConfirmationModal
                        title="Restore from Backup?"
                        message={`This will replace all current data with the data from the file '${fileToRestore.name}'. This action cannot be undone.`}
                        onConfirm={() => {
                            // handleRestore(fileToRestore);
                            setIsRestoreConfirmOpen(false);
                            setFileToRestore(null);
                        }}
                        onClose={() => {
                            setIsRestoreConfirmOpen(false);
                            setFileToRestore(null);
                        }}
                        confirmText="Restore Data"
                        isDestructive
                    />
                )}
                {isResetConfirmOpen && (
                    <ConfirmationModal
                        title="Factory Reset Confirmation"
                        message="This will permanently delete ALL data in the application and cannot be undone. You will be logged out and taken to the setup screen."
                        onConfirm={() => {}}
                        onClose={() => setIsResetConfirmOpen(false)}
                        confirmText="RESET"
                        isDestructive
                        requiresConfirmationText
                    />
                )}

            </AnimatePresence>
        </div>
    );
};

// FIX: Added a default export for the App component to resolve module resolution errors.
export default App;