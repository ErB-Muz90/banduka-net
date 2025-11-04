

import React from 'react';
// FIX: Added 'Sale' to the type imports to resolve 'Cannot find name Sale' error.
import { Product, Customer, Supplier, PurchaseOrder, SupplierInvoice, User, Settings, AuditLog, Permission, Role, Quotation, BusinessType, Shift, Expense, TimeClockEvent, Layaway, WorkOrder, SalesOrder, HeldReceipt, SupplierPayment, Sale, BankDeposit, WorkOrderMaterial, WorkOrderPayment } from './types';

// --- SEED DATA ---
// This data is cleared for production readiness. The application will start with an empty database.

export const MOCK_USERS: User[] = [];
export const MOCK_SUPPLIERS: Supplier[] = [];
export const MOCK_PRODUCTS: Product[] = [];
export const MOCK_CUSTOMERS: Customer[] = [];
export const MOCK_SALES: Sale[] = [];
export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const MOCK_SUPPLIER_INVOICES: SupplierInvoice[] = [];
export const MOCK_SUPPLIER_PAYMENTS: SupplierPayment[] = [];
export const MOCK_QUOTATIONS: Quotation[] = [];
export const MOCK_SHIFTS: Shift[] = [];
export const MOCK_EXPENSES: Expense[] = [];
export const MOCK_TIME_CLOCK_EVENTS: TimeClockEvent[] = [];
export const MOCK_LAYAWAYS: Layaway[] = [];
export const MOCK_WORK_ORDERS: WorkOrder[] = [];
export const MOCK_WORK_ORDER_MATERIALS: WorkOrderMaterial[] = [];
export const MOCK_WORK_ORDER_PAYMENTS: WorkOrderPayment[] = [];
export const MOCK_SALES_ORDERS: SalesOrder[] = [];
export const MOCK_HELD_RECEIPTS: HeldReceipt[] = [];
export const MOCK_AUDIT_LOGS: AuditLog[] = [];
export const MOCK_BANK_DEPOSITS: BankDeposit[] = [];

export const EXPENSE_CATEGORIES: string[] = [
    'Cost of Goods Sold',
    'Rent',
    'Salaries & Wages',
    'Utilities (Electricity, Water)',
    'Marketing & Advertising',
    'Office Supplies',
    'Repairs & Maintenance',
    'Transportation & Fuel',
    'Bank Fees & Charges',
    'Insurance',
    'Taxes & Licenses',
    'Travel & Entertainment',
    'Meals & Refreshments',
    'Miscellaneous',
];

// --- DEFAULT SETTINGS ---
export const DEFAULT_SETTINGS: Settings = {
    id: 'banduka_pos_settings', // Fixed ID for single settings object in DB
    isSetupComplete: false,
    businessType: 'GeneralRetail',
    businessInfo: {
        name: 'ERUNS TECHNOLOGIES',
        kraPin: '',
        logoUrl: '',
        location: '',
        phone: '',
        email: 'admin@pos.pos',
        branch: 'Main Branch',
        currency: 'KES',
        language: 'en-US',
    },
    tax: {
        vatEnabled: true,
        vatRate: 16,
        pricingType: 'inclusive',
        etimsEnabled: false,
    },
    discount: {
        enabled: true,
        type: 'percentage',
        maxValue: 10,
    },
    receipt: {
        footer: 'Thank you for your business!\nBidhaa zilizouzwa hazirudishwi.',
        invoicePrefix: 'INV-',
        quotePrefix: 'QUO-',
        poNumberPrefix: 'PO-',
        layawayPrefix: 'LAY-',
        workOrderPrefix: 'WO-',
        salesOrderPrefix: 'SO-',
    },
    layaway: {
        minDepositPercentage: 20,
        maxDurationDays: 90,
    },
    hardware: {
        printer: {
            type: 'ESC/POS',
            connection: 'USB',
            name: '',
            address: '',
        },
        barcodeScanner: {
            enabled: true,
        },
        barcodePrinter: {
            enabled: false,
            type: 'Image',
            connection: 'USB',
            name: '',
        },
    },
    loyalty: {
        enabled: true,
        pointsPerKsh: 100,
        redemptionRate: 0.5, // 1 point = 0.5 KES
        minRedeemablePoints: 100,
        maxRedemptionPercentage: 50,
    },
    measurements: {
        enabled: false,
        units: ['pc(s)', 'in', 'cm', 'm', 'kg', 'g', 'sq ft', 'ltr', 'hr'],
    },
    permissions: {
        Admin: ['view_dashboard', 'view_pos', 'view_inventory', 'edit_inventory', 'delete_inventory', 'view_purchases', 'manage_purchases', 'view_ap', 'manage_ap', 'view_shift_report', 'view_sales_history', 'view_customers', 'manage_customers', 'view_settings', 'view_quotations', 'manage_quotations', 'view_staff', 'manage_staff', 'view_timesheets', 'manage_timesheets', 'manage_returns', 'manage_expenditures', 'manage_sales_orders', 'manage_layaways', 'manage_work_orders', 'view_held_receipts', 'open_cash_drawer', 'view_payment_summary', 'manage_whatsapp_orders', 'view_suppliers', 'manage_suppliers', 'view_profit_report', 'view_general_ledger'],
        Cashier: ['view_pos', 'view_shift_report', 'view_customers', 'open_cash_drawer'],
        Supervisor: ['view_dashboard', 'view_pos', 'view_inventory', 'edit_inventory', 'view_purchases', 'manage_purchases', 'view_ap', 'manage_ap', 'view_shift_report', 'view_sales_history', 'view_customers', 'manage_customers', 'view_quotations', 'manage_quotations', 'view_staff', 'view_timesheets', 'manage_timesheets', 'manage_returns', 'manage_expenditures', 'manage_sales_orders', 'manage_layaways', 'manage_work_orders', 'view_held_receipts', 'open_cash_drawer', 'view_payment_summary', 'manage_whatsapp_orders', 'view_suppliers', 'manage_suppliers', 'view_profit_report', 'view_general_ledger'],
        Accountant: ['view_dashboard', 'view_purchases', 'manage_purchases', 'view_ap', 'manage_ap', 'view_sales_history', 'view_customers', 'view_payment_summary', 'view_suppliers', 'manage_suppliers', 'view_profit_report', 'view_general_ledger'],
    },
    paymentMethods: {
        enabled: false,
        displayOnDocuments: ['Invoice', 'Quotation', 'Receipt'],
        bank: [],
        mpesaPaybill: {
            paybillNumber: '',
            accountNumber: '',
        },
        mpesaTill: {
            tillNumber: '',
        },
    },
    inventory: {
        lowStockThreshold: 10,
        definedCategories: [],
        expenseCategories: EXPENSE_CATEGORIES,
    },
    // FIX: Added missing 'accounting' property to satisfy the Settings type.
    accounting: {
        defaultCashAccountId: '',
        defaultMpesaAccountId: '',
        defaultCardAccountId: '',
        defaultBankAccountId: '',
        defaultSalesAccountId: '',
        defaultVatPayableAccountId: '',
        defaultVatReceivableAccountId: 'acc_vat_receivable',
        defaultCogsAccountId: '',
        defaultInventoryAccountId: '',
        defaultSalesReturnAccountId: '',
        defaultAccountsPayableId: '',
        defaultCustomerDepositsId: '',
        // FIX: Add missing 'defaultShiftClearingId' property to satisfy the Settings type.
        defaultShiftClearingId: '',
    },
};

export const BUSINESS_TYPES_CONFIG: { [key in BusinessType]: { name: string; description: string; icon: React.ReactNode; } } = {
    GeneralRetail: {
        name: 'General Retail',
        description: 'For kiosks, shops, boutiques, hardware stores, or any business selling physical items.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.21 9 12.83 2.44a1 1 0 0 0-1.66 0L6.79 9H2l4 12h12l4-12h-4.79Z"></path><path d="M9 9h6l-3-5Z"></path></svg>
    },
    Restaurant: {
        name: 'Restaurant / Cafe',
        description: 'For businesses serving food and drinks, with features for table management and kitchen orders.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6a3 3 0 0 1 3 3H9a3 3 0 0 1 3-3Z"></path><path d="M21.94 11.3C21.74 10.54 21 10 20.14 10H3.86c-.86 0-1.6.54-1.8 1.3l-1.06 4.24A1 1 0 0 0 2 17h20a1 1 0 0 0 .94-1.46l-1-4.24Z"></path><path d="M2 20h20v2H2z"></path></svg>
    },
    Salon: {
        name: 'Salon / Barber',
        description: 'For spas, salons, and barbershops with appointment booking and stylist management.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 2H3v2h18V2Zm0 4H3v2h18V6Zm0 4H3v2h18v-2Zm0 4H3v2h18v-2Z"></path><path d="M7 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm9.46-3.54L9.5 7.5a1 1 0 0 1 1.41-1.41l6.96 6.96a1 1 0 0 1-1.41 1.42Z"></path><path d="M17 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"></path></svg>
    },
    Services: {
        name: 'Professional Services',
        description: 'For consultants, repair shops, or any business selling time-based or custom services.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2H10a.5.5 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65a.5.5 0 0 0 .49.42h4a.5.5 0 0 0 .49.42l.38-2.65c.61-.25 1.17-.59-1.69.98l2.49 1a.5.5 0 0 0 .61.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"></path><path d="M12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"></path></svg>
    }
};

export const ICONS = {
    pos: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>,
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
    inventory: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
    purchases: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
    suppliers: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 17.5c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-11 0c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"></path><path d="M22 17.5v-2.2c0-2.09-1.7-3.8-3.79-3.8-1.49 0-2.8.88-3.47 2.22"></path><path d="M2 15.3c0-2.09 1.7-3.8 3.79-3.8 1.49 0 2.8.88 3.47 2.22"></path><path d="M12 11.3V5.5a2 2 0 0 1 2-2h4.5a2 2 0 0 1 2 2v2.5"></path><path d="M12 11.3V5.5a2 2 0 0 0-2-2H5.5a2 2 0 0 0-2 2v2.5"></path></svg>,
    quotations: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m9 14 2 2 4-4"></path></svg>,
    ap: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8a2 2 0 0 0-2-2h-1a3 3 0 0 0-3 3v2c0 1.1-.9 2-2 2h-4v2h4a4 4 0 0 1 4-4V8Zm-8 4H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h10v-6Z"></path><path d="M6.5 6.5A3.5 3.5 0 1 1 3 3a3.5 3.5 0 0 1 3.5 3.5Z"></path></svg>,
    tax: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-8 14H9v-2h2v2Zm0-4H9v-2h2v2Zm0-4H9V7h2v2Zm4 8h-2v-2h2v2Zm0-4h-2v-2h2v2Zm0-4h-2V7h2v2Z"></path><path d="M9 17h2v-2H9v2Zm0-4h2v-2H9v2Zm0-4h2V7H9v2Zm4 8h2v-2h-2v2Zm0-4h2v-2h-2v2Zm0-4h2V7h-2v2Z"></path></svg>,
    paymentSummary: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"></path><path d="M12 14c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z"></path></svg>,
    // FIX: Added missing 'revenue' icon to resolve error in InventoryView.
    revenue: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"></path><path d="M12 14c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z"></path></svg>,
    shiftReport: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 7h-2V4h-4v3H6V4H2v3h2v13h16V7h2V4h-4v3ZM8 6h8V2H8v4Z"></path><path d="M20 7V4h-4v3h-2V4h-4v3H8V4H4v3H2v13h18V7h-2Zm-4 11h-2v-2h2v2Zm0-4h-2v-2h2v2Zm0-4h-2V8h2v2Z"></path></svg>,
    salesHistory: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>,
    customers: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    staff: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z"></path><path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"></path></svg>,
    timeSheets: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    settings: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    profitReport: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"></path></svg>,
    install: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7Z"></path><path d="M5 18v2h14v-2H5Z"></path></svg>,
    bell: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2Z"></path></svg>,
    moon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2Z"></path></svg>,
    sun: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.64 5.64c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41zm12.72 12.72c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41zM5.64 18.36c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0zm12.72-12.72c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0z"></path></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    business: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12ZM6 19H4v-2h2v2Zm0-4H4v-2h2v2Zm0-4H4V9h2v2Zm0-4H4V5h2v2Zm4 12H8v-2h2v2Zm0-4H8v-2h2v2Zm0-4H8V9h2v2Zm0-4H8V5h2v2Zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10Zm-2-8h-2v2h2v-2Zm0 4h-2v2h2v-2Z"></path><path d="M6 5h2v2H6V5Zm0 4h2v2H6V9Zm0 4h2v2H6v-2Zm0 4h2v2H6v-2Zm4-12h2v2h-2V5Zm0 4h2v2h-2V9Zm0 4h2v2h-2v-2Zm6-4h2v2h-2V9Zm0 4h2v2h-2v-2Z"></path></svg>,
    hardware: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 19H6v-4h12v4Z"></path><path d="M18 11H6c-1.66 0-3 1.34-3 3v6h4v-2h10v2h4v-6c0-1.66-1.34-3-3-3Zm1-7H5c-1.1 0-2 .9-2 2v4h18V6c0-1.1-.9-2-2-2Z"></path></svg>,
    receipt: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 17H6v-2h12v2Zm0-4H6v-2h12v2Zm0-4H6V7h12v2ZM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20Z"></path><path d="M6 9h12V7H6v2Zm0 4h12v-2H6v2Zm0 4h12v-2H6v2Z"></path></svg>,
    discount: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.79 2.29a1 1 0 0 0-1.58 0L2.29 11.21a1 1 0 0 0 0 1.58l8.92 8.92a1 1 0 0 0 1.58 0l8.92-8.92a1 1 0 0 0 0-1.58L12.79 2.29ZM8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"></path><path d="M8 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>,
    loyalty: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"></path><path d="M7.5 5C5.5 5 4 6.5 4 8.5c0 2.5 2.5 4.5 6 7.5h4c3.5-3 6-5 6-7.5C20 6.5 18.5 5 16.5 5c-1.5 0-2.8.9-3.5 2.1-.2.3-.5.5-.9.5s-.7-.2-.9-.5C10.3 5.9 9 5 7.5 5Z"></path></svg>,
    rewardManager: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"></path><path d="M7.5 5C5.5 5 4 6.5 4 8.5c0 2.5 2.5 4.5 6 7.5h4c3.5-3 6-5 6-7.5C20 6.5 18.5 5 16.5 5c-1.5 0-2.8.9-3.5 2.1-.2.3-.5.5-.9.5s-.7-.2-.9-.5C10.3 5.9 9 5 7.5 5Z"></path></svg>,
    measurements: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2Zm0 10H3V8h18v8Z"></path><path d="M9 10h2v4H9v-4Zm4 0h2v4h-2v-4Zm-8-2h2v4H5v-4Z"></path></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12.25c1.24 0 2.25-1.01 2.25-2.25S13.24 7.75 12 7.75 9.75 8.76 9.75 10s1.01 2.25 2.25 2.25Z"></path><path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"></path></svg>,
    email: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"></path><path d="m4 8 8 5 8-5v-2l-8 5-8-5Z"></path></svg>,
    sms: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Z"></path><path d="M6 9h12v2H6V9Zm0 3h8v2H6v-2Z"></path></svg>,
    whatsapp: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.75 13.96c.25.41.4 1.12.28 1.66-.12.54-1.03 1.1-1.33 1.15-.3.05-.72.23-2.93-1.07-2.21-1.3-3.66-3.48-3.8-3.68-.14-.2-.72-1.02-.72-1.92s.44-1.35.6-1.55c.16-.2.35-.25.5-.25s.33-.04.48.11c.15.15.48.55.53.59s.05.15.11.39c.06.24.03.4-.03.55-.06.15-.22.38-.33.5s-.22.25-.09.5c.13.25.64 1.13 1.45 1.83.99.88 1.63 1.12 1.88 1.23.25.11.4.1.54-.04.14-.14.61-.7.78-.92.17-.22.34-.18.54-.08l.15.08Z"></path><path d="M20.1 3.9C17.9 1.7 15.1 0 12 0 5.4 0 0 5.4 0 12c0 2.2.6 4.3 1.7 6.1L0 24l6.3-1.6c1.8.9 3.8 1.5 5.9 1.5h.1c6.6 0 12-5.4 12-12 0-3.1-1.2-6-3.3-8.1Z"></path></svg>,
    mpesa: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2Zm0 18H7V5h10v14Z"></path><path d="M8 7h8v2H8V7Z"></path></svg>,
    audit: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"></path><path d="M11 15H8v-2h3v2Zm0-4H8V9h3v2Zm3 4h-2v-2h2v2Zm0-4h-2V9h2v2Z"></path></svg>,
    accounts: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    clipboardList: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="8" y1="12" x2="16" y2="12"></line><line x1="8" y1="16" x2="16" y2="16"></line><line x1="10" y1="8" x2="10" y2="8"></line></svg>,
    // FIX: Added missing 'generalLedger' icon to resolve error in SettingsView.
    generalLedger: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"></path><path d="M11 15H8v-2h3v2Zm0-4H8V9h3v2Zm3 4h-2v-2h2v2Zm0-4h-2V9h2v2Z"></path></svg>,
    data: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 3.8 2 6v12c0 2.2 4.5 4 10 4s10-1.8 10-4V6c0-2.2-4.5-4-10-4Z"></path><path d="M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Z"></path></svg>,
    reset: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12Z"></path><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"></path></svg>,
    barcode: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v12H4V6Zm4 0h2v12H8V6Zm3 0h1v12h-1V6Zm3 0h2v12h-2V6Zm3 0h2v12h-2V6Z"></path></svg>,
    production: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 22H2V10l7-5 3 2.25L15 5l7 5v12ZM16 13h-2v2h2v-2Zm0 4h-2v2h2v-2Zm-4-4h-2v2h2v-2Zm0 4h-2v2h2v-2Z"></path><path d="M10 13h2v2h-2v-2Zm0 4h2v2h-2v-2Zm4-4h2v2h-2v-2Zm0 4h2v2h-2v-2Z"></path></svg>,
    categories: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
    // POS Sub-menu Icons
    returnReceipt: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10h2v7H7v-7Zm4 0h2v7h-2v-7Zm4 0h2v7h-2v-7Z"></path><path d="M19 5H5v3h14V5Z"></path><path d="M20 3H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v2l2.5-1.5L13 21v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Z"></path></svg>,
    payout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2h-4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h4v2c0 1.1-.9 2-2 2Z"></path><path d="M23 7v10c0 1.1-.9 2-2 2h-1V7h3Zm-5 2h2v6h-2V9Z"></path></svg>,
    salesOrder: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="8" y1="12" x2="16" y2="12"></line><line x1="8" y1="16" x2="16" y2="16"></line><line x1="10" y1="8" x2="10" y2="8"></line></svg>,
    layaway: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
    workOrder: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>,
    heldReceipts: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H9v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-1.93-1.57-3.5-3.5-3.5S7 3.07 7 5v12.5c0 2.21 1.79 4 4 4s4-1.79 4-4V6h-1.5Z"></path></svg>,
    openDrawer: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 10.5h7v3h-7v-3Z"></path><path d="M8.5 15.5h7v3h-7v-3Z"></path><path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm-1 14H4V7h16v11Z"></path></svg>,
};

export const PERMISSIONS_CONFIG: { module: string, permissions: { id: Permission, label: string }[] }[] = [
    {
        module: 'Core Access',
        permissions: [
            { id: 'view_dashboard', label: 'View Dashboard' },
            { id: 'view_pos', label: 'Access Point of Sale' },
            { id: 'view_settings', label: 'View Settings' },
        ]
    },
    {
        module: 'Point of Sale Actions',
        permissions: [
            { id: 'manage_returns', label: 'Process Returns' },
            { id: 'manage_expenditures', label: 'Manage Expenditures' },
            { id: 'manage_sales_orders', label: 'Manage Sales Orders' },
            { id: 'manage_layaways', label: 'Manage Layaways' },
            { id: 'manage_work_orders', label: 'Manage Work Orders' },
            { id: 'view_held_receipts', label: 'View Held Receipts' },
            { id: 'open_cash_drawer', label: 'Open Cash Drawer Manually' },
            { id: 'manage_whatsapp_orders', label: 'Manage WhatsApp Orders' },
        ]
    },
    {
        module: 'Inventory & Products',
        permissions: [
            { id: 'view_inventory', label: 'View Inventory' },
            { id: 'edit_inventory', label: 'Edit Inventory (add, update stock)' },
            { id: 'delete_inventory', label: 'Delete Inventory Items' },
        ]
    },
    {
        module: 'Purchasing & Suppliers',
        permissions: [
            { id: 'view_purchases', label: 'View Purchase Orders' },
            { id: 'manage_purchases', label: 'Manage Purchase Orders' },
            { id: 'view_suppliers', label: 'View Suppliers' },
            { id: 'manage_suppliers', label: 'Manage Suppliers' },
            { id: 'view_ap', label: 'View Accounts Payable' },
            { id: 'manage_ap', label: 'Manage Accounts Payable' },
        ]
    },
    {
        module: 'Sales & Customers',
        permissions: [
            { id: 'view_sales_history', label: 'View Sales History' },
            { id: 'view_customers', label: 'View Customers' },
            { id: 'manage_customers', label: 'Manage Customers' },
            { id: 'view_quotations', label: 'View Quotations' },
            { id: 'manage_quotations', label: 'Manage Quotations' },
        ]
    },
    {
        module: 'Staff & Reporting',
        permissions: [
            { id: 'view_staff', label: 'View Staff Members' },
            { id: 'manage_staff', label: 'Manage Staff Members' },
            { id: 'view_timesheets', label: 'View Time Sheets' },
            { id: 'manage_timesheets', label: 'Manage Time Sheets' },
            { id: 'view_shift_report', label: 'View Shift Reports' },
            { id: 'view_payment_summary', label: 'View Payment Summary' },
            { id: 'view_profit_report', label: 'View Profitability Report' },
        ]
    }
];