import React, { useMemo, useState } from 'react';
import { Sale, Product, Expense, Settings, ToastData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface ProfitReportViewProps {
    sales: Sale[];
    products: Product[];
    expenses: Expense[];
    settings: Settings;
    showToast: (message: string, type: ToastData['type']) => void;
}

const StatCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className = '' }) => (
    <div
        className={`bg-card dark:bg-dark-card p-4 rounded-xl shadow-clay-light dark:shadow-clay-dark border border-border dark:border-dark-border ${className}`}
        variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
    >
        <p className="text-sm font-semibold text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
        <p className={`text-2xl font-bold text-foreground dark:text-dark-foreground mt-1`}>{value}</p>
    </div>
);

const DateButton: React.FC<{ label: string; range: 'today' | 'week' | 'month'; activeRange: string; onClick: (range: any) => void }> = ({ label, range, activeRange, onClick }) => (
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


const ProfitReportView: React.FC<ProfitReportViewProps> = ({ sales, products, expenses, settings, showToast }) => {
    const [theme] = useTheme();
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

    const { filteredSales, filteredExpenses } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate = new Date();

        if (dateRange === 'today') {
            startDate = startOfToday;
        } else if (dateRange === 'week') {
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as start of week
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0,0,0,0);
        } else if (dateRange === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0,0,0,0);
        }
        
        const fs = sales.filter(sale => new Date(sale.date) >= startDate);
        const fp = expenses.filter(expense => new Date(expense.date) >= startDate);

        return { filteredSales: fs, filteredExpenses: fp };
    }, [sales, expenses, dateRange]);

    const summaryStats = useMemo(() => {
        const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
        const totalCogs = filteredSales.reduce((acc, sale) => {
            const saleCost = sale.items.reduce((itemAcc, item) => {
                const cost = item.costPrice || 0;
                return itemAcc + cost * Math.abs(item.quantity);
            }, 0);
            return acc + saleCost;
        }, 0);
        const totalPayouts = filteredExpenses.reduce((acc, p) => acc + p.amount, 0);
        const totalExpenses = totalCogs + totalPayouts;
        const netProfit = totalRevenue - totalExpenses;
        const margin = totalRevenue !== 0 ? (netProfit / Math.abs(totalRevenue)) * 100 : 0;
        
        return { totalRevenue, totalCogs, totalPayouts, totalExpenses, netProfit, margin };
    }, [filteredSales, filteredExpenses]);

    const chartData = useMemo(() => {
        const dataMap = new Map<string, { date: Date; profit: number; expenses: number }>();
        const now = new Date();
        
        let startDate: Date;
        let days: number;

        if (dateRange === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            days = 1;
        } else if (dateRange === 'week') {
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(new Date().setDate(diff));
            startDate.setHours(0,0,0,0);
            days = 7;
        } else { // month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        }

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime());
            date.setDate(date.getDate() + i);
            if (date > now) break; // Don't show future dates
            const dayKey = date.toLocaleDateString('en-CA');
            dataMap.set(dayKey, { date, profit: 0, expenses: 0 });
        }

        filteredSales.forEach(sale => {
            const dayKey = new Date(sale.date).toLocaleDateString('en-CA');
            const dayData = dataMap.get(dayKey);
            if(dayData) {
                const cogs = sale.items.reduce((acc, item) => acc + (item.costPrice || 0) * Math.abs(item.quantity), 0);
                dayData.profit += sale.total;
                dayData.expenses += cogs;
            }
        });
        
        filteredExpenses.forEach(payout => {
            const dayKey = new Date(payout.date).toLocaleDateString('en-CA');
            const dayData = dataMap.get(dayKey);
            if(dayData) {
                dayData.expenses += payout.amount;
            }
        });

        // Calculate final profit after all expenses are tallied
        for (const dayData of dataMap.values()) {
            dayData.profit = dayData.profit - dayData.expenses;
        }
        
        return Array.from(dataMap.values()).map(d => ({
            name: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            profit: d.profit,
            expenses: d.expenses
        }));
    }, [filteredSales, filteredExpenses, dateRange]);
    
     const topProductsData = useMemo(() => {
        const productMap = new Map<string, { name: string; profit: number; margin: number; revenue: number }>();
        filteredSales.forEach(sale => {
            // Distribute cart-level discount proportionally if it exists
            const subtotalAfterLineDiscounts = sale.subtotal - sale.lineItemsDiscountAmount;
            
            sale.items.forEach(item => {
                const itemGrossTotal = item.price * Math.abs(item.quantity);
                let itemLineDiscount = 0;
                if(item.discount) {
                    itemLineDiscount = item.discount.type === 'fixed' ? item.discount.value : itemGrossTotal * (item.discount.value / 100);
                }
                const itemNetAfterLineDiscount = itemGrossTotal - itemLineDiscount;
                
                const itemShareOfCartDiscount = subtotalAfterLineDiscounts > 0 ? (itemNetAfterLineDiscount / subtotalAfterLineDiscounts) * sale.cartDiscountAmount : 0;
                
                const itemRevenue = itemNetAfterLineDiscount - itemShareOfCartDiscount;
                const itemCogs = (item.costPrice || 0) * Math.abs(item.quantity);
                const itemProfit = itemRevenue - itemCogs;
                
                const existing = productMap.get(item.id);
                if (existing) {
                    existing.profit += itemProfit;
                    existing.revenue += itemRevenue;
                } else {
                    productMap.set(item.id, { name: item.name, profit: itemProfit, revenue: itemRevenue, margin: 0 });
                }
            });
        });

        return Array.from(productMap.values()).map(p => ({
            ...p,
            margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
        })).sort((a,b) => b.profit - a.profit).slice(0, 5);
    }, [filteredSales]);

    const formatCurrency = (amount: number) => `Ksh ${amount.toFixed(2)}`;

    // Chart colors
    const primaryColor = theme === 'dark' ? '#FF9800' : '#FF6F00';
    const expenseColor = theme === 'dark' ? '#EF5350' : '#D32F2F';
    const profitColor = theme === 'dark' ? '#66BB6A' : '#43A047';
    const gridColor = theme === 'dark' ? '#444444' : '#E0E0E0';
    const textColor = theme === 'dark' ? '#BDBDBD' : '#616161';

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Profit & Loss</h1>
                <div className="flex space-x-1 bg-muted dark:bg-dark-muted p-1 rounded-lg">
                    <DateButton label="Today" range="today" activeRange={dateRange} onClick={setDateRange} />
                    <DateButton label="This Week" range="week" activeRange={dateRange} onClick={setDateRange} />
                    <DateButton label="This Month" range="month" activeRange={dateRange} onClick={setDateRange} />
                </div>
            </div>

            <div
                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6"
                 variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                 initial="hidden"
                 animate="visible"
            >
                <StatCard title="Total Revenue" value={formatCurrency(summaryStats.totalRevenue)} />
                <StatCard title="COGS" value={formatCurrency(summaryStats.totalCogs)} />
                <StatCard title="Other Expenses" value={formatCurrency(summaryStats.totalPayouts)} />
                <StatCard title="Net Profit" value={formatCurrency(summaryStats.netProfit)} className={summaryStats.netProfit < 0 ? 'text-danger dark:text-dark-danger' : 'text-success dark:text-dark-success'} />
                <StatCard title="Profit Margin" value={`${summaryStats.margin.toFixed(2)}%`} className={summaryStats.margin < 0 ? 'text-danger dark:text-dark-danger' : 'text-success dark:text-dark-success'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <div className="lg:col-span-3 bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border">
                    <h3 className="font-bold text-foreground dark:text-dark-foreground mb-4">Profit vs Expenses</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={chartData}>
                             <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                             <XAxis dataKey="name" stroke={textColor} fontSize={12} />
                             <YAxis stroke={textColor} fontSize={12} tickFormatter={(value) => `Ksh ${value/1000}k`}/>
                             <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#333333' : '#FFFFFF', border: `1px solid ${gridColor}` }} formatter={(value: number) => formatCurrency(value)} />
                             <Legend />
                             <Bar dataKey="profit" fill={profitColor} name="Net Profit" />
                             <Bar dataKey="expenses" fill={expenseColor} name="Total Expenses" />
                         </BarChart>
                     </ResponsiveContainer>
                 </div>
                  <div className="lg:col-span-2 bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border">
                    <h3 className="font-bold text-foreground dark:text-dark-foreground mb-4">Top 5 Products by Profit</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={topProductsData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                             <XAxis type="number" stroke={textColor} fontSize={12} tickFormatter={(value) => `Ksh ${value/1000}k`} />
                             <YAxis type="category" dataKey="name" width={80} stroke={textColor} fontSize={10} interval={0} />
                             <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#333333' : '#FFFFFF', border: `1px solid ${gridColor}` }} formatter={(value: number) => formatCurrency(value)} />
                             <Bar dataKey="profit" fill={primaryColor} name="Total Profit" />
                         </BarChart>
                     </ResponsiveContainer>
                 </div>
            </div>
        </div>
    );
};

export default ProfitReportView;