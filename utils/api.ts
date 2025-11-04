// FIX: Replace 'Payout' with 'Expense' as 'Payout' is not an exported member of types.
import { User, Sale, Product, Customer, Supplier, PurchaseOrder, Quotation, Settings, AuditLog, Shift, TimeClockEvent, Expense, Layaway, WorkOrder, SalesOrder, HeldReceipt, SaleData, PurchaseOrderData, ReceivedPOItem, SupplierPayment, SupplierInvoice, Account, AccountingTransaction } from '../types';

const API_BASE_URL = 'http://localhost:3001/api'; // Backend API URL

const getToken = () => localStorage.getItem('kenpos_token');

const fetchApi = async (path: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type')) {
        headers.append('Content-Type', 'application/json');
    }
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'An API error occurred');
    }
    
    if (response.status === 204) { // Handle No Content responses
        return null;
    }

    return response.json();
};

// --- Auth ---
export const login = (credentials: { email: string, password: string }): Promise<{ token: string, user: User }> => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const signup = (userData: Omit<User, 'id' | 'role'>): Promise<{ token: string, user: User }> => fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
export const getMe = (): Promise<User> => fetchApi('/auth/me');
export const findUserForRecovery = (email: string): Promise<User> => fetchApi('/auth/find-recovery', { method: 'POST', body: JSON.stringify({ email }) });
export const resetPassword = (password: string, userId: string): Promise<void> => fetchApi('/auth/reset-password', { method: 'POST', body: JSON.stringify({ password, userId }) });


// --- Data Fetching ---
export const getProducts = (): Promise<Product[]> => fetchApi('/products');
export const getCustomers = (): Promise<Customer[]> => fetchApi('/customers');
export const getSales = (): Promise<Sale[]> => fetchApi('/sales');
export const getSuppliers = (): Promise<Supplier[]> => fetchApi('/suppliers');
export const getPurchaseOrders = (): Promise<PurchaseOrder[]> => fetchApi('/purchase-orders');
export const getSupplierInvoices = (): Promise<SupplierInvoice[]> => fetchApi('/supplier-invoices');
export const getQuotations = (): Promise<Quotation[]> => fetchApi('/quotations');
export const getUsers = (): Promise<User[]> => fetchApi('/users');
export const getSettings = (): Promise<Settings> => fetchApi('/settings');
export const getAuditLogs = (): Promise<AuditLog[]> => fetchApi('/audit-logs');
export const getShifts = (): Promise<Shift[]> => fetchApi('/shifts');
export const getTimeClockEvents = (): Promise<TimeClockEvent[]> => fetchApi('/time-clock-events');
// FIX: Replace 'Payout' with 'Expense' to match the imported type.
export const getPayouts = (): Promise<Expense[]> => fetchApi('/payouts');
export const getLayaways = (): Promise<Layaway[]> => fetchApi('/layaways');
export const getWorkOrders = (): Promise<WorkOrder[]> => fetchApi('/work-orders');
export const getSalesOrders = (): Promise<SalesOrder[]> => fetchApi('/sales-orders');
export const getHeldReceipts = (): Promise<HeldReceipt[]> => fetchApi('/held-receipts');

// --- Data Mutation ---
export const createProduct = (productData: Omit<Product, 'id' | 'stock'>): Promise<Product> => fetchApi('/products', { method: 'POST', body: JSON.stringify(productData) });
export const updateProduct = (product: Product): Promise<Product> => fetchApi(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
export const deleteProduct = (productId: string): Promise<void> => fetchApi(`/products/${productId}`, { method: 'DELETE' });
export const importProducts = (products: Omit<Product, 'id'|'stock'>[]): Promise<{ added: number, updated: number }> => fetchApi('/products/import', { method: 'POST', body: JSON.stringify(products) });

export const createCustomer = (customerData: Omit<Customer, 'id' | 'dateAdded' | 'loyaltyPoints'>): Promise<Customer> => fetchApi('/customers', { method: 'POST', body: JSON.stringify(customerData) });
export const updateCustomer = (customer: Customer): Promise<Customer> => fetchApi(`/customers/${customer.id}`, { method: 'PUT', body: JSON.stringify(customer) });
export const deleteCustomer = (customerId: string): Promise<void> => fetchApi(`/customers/${customerId}`, { method: 'DELETE' });

export const createSale = (saleData: SaleData | Sale): Promise<Sale> => fetchApi('/sales', { method: 'POST', body: JSON.stringify(saleData) });
export const createReturn = (returnData: any): Promise<Sale> => fetchApi('/sales/return', { method: 'POST', body: JSON.stringify(returnData) });

export const createSupplier = (supplierData: Omit<Supplier, 'id'>): Promise<Supplier> => fetchApi('/suppliers', { method: 'POST', body: JSON.stringify(supplierData) });

export const createPurchaseOrder = (poData: PurchaseOrderData): Promise<PurchaseOrder> => fetchApi('/purchase-orders', { method: 'POST', body: JSON.stringify(poData) });
export const updatePurchaseOrder = (po: PurchaseOrder): Promise<PurchaseOrder> => fetchApi(`/purchase-orders/${po.id}`, { method: 'PUT', body: JSON.stringify(po) });
export const receivePurchaseOrder = (poId: string, receivedItems: ReceivedPOItem[]): Promise<{ updatedPO: PurchaseOrder, newInvoice: SupplierInvoice }> => fetchApi(`/purchase-orders/${poId}/receive`, { method: 'POST', body: JSON.stringify({ receivedItems }) });
export const createPOFromSO = (soId: string): Promise<{ newPO: PurchaseOrder, updatedSalesOrder: SalesOrder }> => fetchApi(`/sales-orders/${soId}/create-po`, { method: 'POST' });

export const recordSupplierPayment = (invoiceId: string, paymentData: Omit<SupplierPayment, 'id' | 'invoiceId'>): Promise<SupplierInvoice> => fetchApi(`/supplier-invoices/${invoiceId}/payment`, { method: 'POST', body: JSON.stringify(paymentData) });

export const createQuotation = (quoteData: Omit<Quotation, 'id'>): Promise<Quotation> => fetchApi('/quotations', { method: 'POST', body: JSON.stringify(quoteData) });
export const updateQuotation = (quote: Quotation): Promise<Quotation> => fetchApi(`/quotations/${quote.id}`, { method: 'PUT', body: JSON.stringify(quote) });

export const updateUser = (user: User): Promise<User> => fetchApi(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) });
export const createUser = (userData: Omit<User, 'id'>): Promise<User> => fetchApi('/users', { method: 'POST', body: JSON.stringify(userData) });
export const deleteUser = (userId: string): Promise<void> => fetchApi(`/users/${userId}`, { method: 'DELETE' });

export const updateSettings = (settings: Partial<Settings>): Promise<Settings> => fetchApi('/settings', { method: 'POST', body: JSON.stringify(settings) });

// FIX: Changed 'payoutIds' to 'expenseIds' to match the 'Shift' type definition.
export const createShift = (shiftData: Omit<Shift, 'id' | 'salesIds' | 'expenseIds'>): Promise<Shift> => fetchApi('/shifts', { method: 'POST', body: JSON.stringify(shiftData) });
export const updateShift = (shift: Shift): Promise<Shift> => fetchApi(`/shifts/${shift.id}`, { method: 'PUT', body: JSON.stringify(shift) });

// FIX: Replace 'Payout' with 'Expense' to match the imported type.
export const createPayout = (payoutData: Omit<Expense, 'id'>): Promise<Expense> => fetchApi('/payouts', { method: 'POST', body: JSON.stringify(payoutData) });

export const createTimeClockEvent = (eventData: Omit<TimeClockEvent, 'id'>): Promise<TimeClockEvent> => fetchApi('/time-clock-events', { method: 'POST', body: JSON.stringify(eventData) });
export const updateTimeClockEvent = (event: TimeClockEvent): Promise<TimeClockEvent> => fetchApi(`/time-clock-events/${event.id}`, { method: 'PUT', body: JSON.stringify(event) });
export const deleteTimeClockEvent = (eventId: string): Promise<void> => fetchApi(`/time-clock-events/${eventId}`, { method: 'DELETE' });

export const createLayaway = (data: any): Promise<Layaway> => fetchApi('/layaways', { method: 'POST', body: JSON.stringify(data) });
export const createWorkOrder = (data: any): Promise<WorkOrder> => fetchApi('/work-orders', { method: 'POST', body: JSON.stringify(data) });
export const updateWorkOrder = (wo: WorkOrder): Promise<WorkOrder> => fetchApi(`/work-orders/${wo.id}`, { method: 'PUT', body: JSON.stringify(wo) });

export const createSalesOrder = (data: any): Promise<SalesOrder> => fetchApi('/sales-orders', { method: 'POST', body: JSON.stringify(data) });
export const updateSalesOrder = (so: SalesOrder): Promise<SalesOrder> => fetchApi(`/sales-orders/${so.id}`, { method: 'PUT', body: JSON.stringify(so) });

export const createHeldReceipt = (data: Omit<HeldReceipt, 'id'>): Promise<HeldReceipt> => fetchApi('/held-receipts', { method: 'POST', body: JSON.stringify(data) });
export const deleteHeldReceipt = (id: string): Promise<void> => fetchApi(`/held-receipts/${id}`, { method: 'DELETE' });