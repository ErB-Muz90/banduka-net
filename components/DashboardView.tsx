

import React, { useMemo, useState, ReactNode } from 'react';
import { Sale, Product, Supplier, SupplierInvoice, Payment, Settings, Expense, WorkOrder } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface DashboardViewProps {
    sales: Sale[];
    products: Product[];
    suppliers: Supplier[];
    supplierInvoices: SupplierInvoice[];
    settings: Settings;
    expenses: Expense[];
    workOrders: WorkOrder[];
}

const StatCard: React.FC<{ title: string; value: string; children: ReactNode; className?: string }> = ({ title, value, children, className = '' }) => (
    <div
        className={`bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border flex items-center space-x-4 ${className}`}
        variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1 }
        }}
    >
        <div className="bg-muted dark:bg-dark-muted text-primary dark:text-dark-primary p-3 rounded-lg">
            {children}
        </div>
        <div>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-semibold">{title}</p>
            <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);

const DateButton: React.FC<{ label: string; range: 'today' | '7d' | '30d'; activeRange: string; onClick: (range: any) => void }> = ({ label, range, activeRange, onClick }) => (
    <button
        onClick={() => onClick(range)}
        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors duration-200 ${
            activeRange === range
            ? 'bg-card dark:bg-dark-card text-primary dark:text-dark-primary shadow-sm'
            : 'text-foreground-muted dark:text-dark-foreground-muted hover:text-foreground dark:hover:text-dark-foreground'
        }`}
    >
        {label}
    </button>
);

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
        <g>
            <text x={cx} y={cy} dy={-5} textAnchor="middle" fill={fill} className="font-bold text-base">{payload.name}</text>
            <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#64748b" className="text-xs">
                {`${(percent * 100).toFixed(2)}%`}
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill}/>
        </g>
    );
};

const ICONS = {
    revenue: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"></path><path d="M12 14c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z"></path></svg>,
    profit: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"></path></svg>,
    cogs: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor"><path d="M2 13h10v9H2v-9Z"></path><path d="m22 8-10 5-10-5 10-5 10 5Z"></path><path d="M12 13h10v9H12v-9Z"></path></svg>,
    payout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor"><path d="M15 15H3c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2h-4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h4v2c0 1.1-.9 2-2 2Z"></path><path d="M23 7v10c0 1.1-.9 2-2 2h-1V7h3Zm-5 2h2v6h-2V9Z"></path></svg>,
    workOrder: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>,
};


export const DashboardView = ({ sales, products, suppliers, supplierInvoices, settings, expenses, workOrders }: DashboardViewProps) => {
    const [theme] = useTheme();
    const [dateRange, setDateRange] = useState<'today' | '7d' | '30d'>('7d');
    const [activePieIndex, setActivePieIndex] = useState(0);

    const productCostMap = useMemo(() => new Map(products.map(p => [p.id, p.costPrice || 0])), [products]);

    const { filteredSales, filteredExpenses } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let startDate = new Date();
        if (dateRange === 'today') { startDate = startOfToday; } 
        else if (dateRange === '7d') { startDate = new Date(new Date().setDate(startOfToday.getDate() - 6)); } 
        else if (dateRange === '30d') { startDate = new Date(new Date().setDate(startOfToday.getDate() - 29)); }
        startDate.setHours(0,0,0,0);
        
        const fs = sales.filter(sale => new Date(sale.date) >= startDate);
        const fp = expenses.filter(expense => new Date(expense.date) >= startDate);

        return { filteredSales: fs, filteredExpenses: fp };
    }, [sales, expenses, dateRange]);

    const stats = useMemo(() => {
        const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
        const totalCogs = filteredSales.reduce((acc, sale) => {
            const saleCost = sale.items.reduce((itemAcc, item) => itemAcc + (productCostMap.get(item.id) || 0) * Math.abs(item.quantity), 0);
            return acc + saleCost;
        }, 0);
        const totalPayouts = filteredExpenses.reduce((acc, p) => acc + p.amount, 0);
        const netProfit = totalRevenue - totalCogs - totalPayouts;
        
        // Work Order Stats
        const openWorkOrders = workOrders.filter(wo => wo.status === 'Pending' || wo.status === 'InProgress').length;
        const outstandingWoBalance = workOrders.reduce((acc, wo) => acc + wo.balanceDue, 0);
        
        return { totalRevenue, netProfit, totalCogs, totalPayouts, openWorkOrders, outstandingWoBalance };
    }, [filteredSales, filteredExpenses, productCostMap, workOrders]);

    const chartData = useMemo(() => {
        const data: { [key: string]: { sales: number, profit: number } } = {};
        
        // Initialize with sales and gross profit
        filteredSales.forEach(sale => {
            const day = new Date(sale.date).toLocaleDateString('en-CA', {timeZone: 'Africa/Nairobi'});
            if (!data[day]) data[day] = { sales: 0, profit: 0 };
            const saleCost = sale.items.reduce((acc, item) => acc + (productCostMap.get(item.id) || 0) * Math.abs(item.quantity), 0);
            data[day].sales += sale.total;
            data[day].profit += (sale.total - saleCost);
        });

        // Subtract payouts to get net profit
        filteredExpenses.forEach(payout => {
            const day = new Date(payout.date).toLocaleDateString('en-CA', {timeZone: 'Africa/Nairobi'});
            if (data[day]) {
                data[day].profit -= payout.amount;
            } else {
                // If there's a payout on a day with no sales, create an entry for it
                data[day] = { sales: 0, profit: -payout.amount };
            }
        });

        const result = [];
        const daysInRange = dateRange === 'today' ? 1 : dateRange === '7d' ? 7 : 30;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        for (let i = daysInRange - 1; i >= 0; i--) {
            const date = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
            const dayKey = date.toLocaleDateString('en-CA', {timeZone: 'Africa/Nairobi'});
            const name = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'Africa/Nairobi' });
            
            result.push({ 
                name, 
                Sales: data[dayKey]?.sales || 0, 
                'Net Profit': data[dayKey]?.profit || 0 
            });
        }
        return result;
    }, [filteredSales, filteredExpenses, dateRange, productCostMap]);

    const paymentMethodData = useMemo(() => {
        const data: { [key in Payment['method']]?: number } = {};
        filteredSales.forEach(sale => {
            sale.payments.forEach(p => {
                data[p.method] = (data[p.method] || 0) + p.amount;
            });
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [filteredSales]);
    
    const lightColors = ['#10b981', '#3b82f6', '#facc15', '#a78bfa'];
    const darkColors = ['#34d399', '#60a5fa', '#fde047', '#c4b5fd'];
    const chartColors = theme === 'dark' ? darkColors : lightColors;

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Dashboard</h1>
                <div className="flex space-x-1 bg-muted dark:bg-dark-muted p-1 rounded-lg">
                    <DateButton label="Today" range="today" activeRange={dateRange} onClick={setDateRange} />
                    <DateButton label="Last 7 Days" range="7d" activeRange={dateRange} onClick={setDateRange} />
                    <DateButton label="Last 30 Days" range="30d" activeRange={dateRange} onClick={setDateRange} />
                </div>
            </div>

            <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                initial="hidden"
                animate="visible"
            >
                <StatCard title="Total Revenue" value={`Ksh ${stats.totalRevenue.toFixed(2)}`}>{ICONS.revenue}</StatCard>
                <StatCard title="Net Profit" value={`Ksh ${stats.netProfit.toFixed(2)}`} className={stats.netProfit < 0 ? 'text-danger dark:text-dark-danger' : 'text-success dark:text-dark-success'}>{ICONS.profit}</StatCard>
                <StatCard title="Expenses" value={`Ksh ${stats.totalPayouts.toFixed(2)}`}>{ICONS.payout}</StatCard>
                <StatCard title="COGS" value={`Ksh ${stats.totalCogs.toFixed(2)}`}>{ICONS.cogs}</StatCard>
                <StatCard title="Open Work Orders" value={`${stats.openWorkOrders}`}>{ICONS.workOrder}</StatCard>
                <StatCard title="Outstanding Balances" value={`Ksh ${stats.outstandingWoBalance.toFixed(2)}`} className={stats.outstandingWoBalance > 0 ? 'text-warning dark:text-dark-warning' : ''}>{ICONS.workOrder}</StatCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border">
                    <h3 className="font-bold text-foreground dark:text-dark-foreground mb-4">Sales & Profit Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} />
                            <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', border: '1px solid #334155' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Net Profit" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border">
                    <h3 className="font-bold text-foreground dark:text-dark-foreground mb-4">Payments by Type</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                             <Pie
                                data={paymentMethodData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                activeIndex={activePieIndex}
                                activeShape={renderActiveShape}
                                onMouseEnter={(_, index) => setActivePieIndex(index)}
                            >
                                {paymentMethodData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                ))}
                            </Pie>
                         </PieChart>
                     </ResponsiveContainer>
                 </div>
            </div>
        </div>
    );
};