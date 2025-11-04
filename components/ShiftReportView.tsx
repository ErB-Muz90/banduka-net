
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sale, User, Shift, Settings, Expense, SupplierPayment, BankDeposit } from '../types';
import ZReportView from './pos/ZReportView';
import { DEFAULT_SETTINGS } from '../constants'; // Import default settings

interface ShiftReportViewProps {
  shifts: Shift[];
  sales: Sale[];
  expenses: Expense[];
  supplierPayments: SupplierPayment[];
  bankDeposits: BankDeposit[];
  settings: Settings;
}

const StatCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className = '' }) => (
    <div className={`bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm border border-border dark:border-dark-border ${className}`}>
        <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-medium">{title}</p>
        <p className={`text-xl font-bold text-foreground dark:text-dark-foreground`}>{value}</p>
    </div>
);

const FilterButton: React.FC<{ label: string; filterKey: string; activeFilter: string; onClick: (filter: string) => void }> = ({ label, filterKey, activeFilter, onClick }) => (
    <button
        onClick={() => onClick(filterKey)}
        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors duration-200 ${
            activeFilter === filterKey 
            ? 'bg-primary dark:bg-dark-primary text-primary-content dark:text-dark-primary-content shadow-sm' 
            : 'bg-card dark:bg-dark-card text-foreground-muted dark:text-dark-foreground-muted hover:bg-muted dark:hover:bg-dark-muted'
        }`}
    >
        {label}
    </button>
);


const ShiftReportView: React.FC<ShiftReportViewProps> = ({ shifts, sales, expenses, supplierPayments, bankDeposits, settings }) => {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [activeFilter, setActiveFilter] = useState('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    // Monday as start of week
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const weekStart = new Date(today.setDate(diff));

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    // Reset date inputs before setting new ones
    setDateFrom('');
    setDateTo('');

    switch (newFilter) {
      case 'today':
        setDateFrom(formatDate(new Date()));
        setDateTo(formatDate(new Date()));
        break;
      case 'yesterday':
        setDateFrom(formatDate(yesterday));
        setDateTo(formatDate(yesterday));
        break;
      case 'this_week':
        setDateFrom(formatDate(weekStart));
        setDateTo(formatDate(new Date()));
        break;
      case 'last_week':
        setDateFrom(formatDate(lastWeekStart));
        setDateTo(formatDate(lastWeekEnd));
        break;
      case 'this_month':
        setDateFrom(formatDate(monthStart));
        setDateTo(formatDate(new Date()));
        break;
      case 'last_month':
        setDateFrom(formatDate(lastMonthStart));
        setDateTo(formatDate(lastMonthEnd));
        break;
      default:
        // 'custom' or other cases will not set dates
    }
  };

  useEffect(() => {
    handleFilterChange('today');
  }, []);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'from' | 'to') => {
    setActiveFilter('custom');
    if (type === 'from') {
        setDateFrom(e.target.value);
    } else {
        setDateTo(e.target.value);
    }
  };

  const filteredShifts = useMemo(() => {
    const start = dateFrom ? new Date(dateFrom) : null;
    if(start) start.setHours(0,0,0,0);
    
    const end = dateTo ? new Date(dateTo) : null;
    if(end) end.setHours(23,59,59,999);

    return shifts
      .filter(s => s.status === 'closed' && s.endTime)
      .filter(s => {
        const shiftEndDate = new Date(s.endTime!);
        if (start && shiftEndDate < start) return false;
        if (end && shiftEndDate > end) return false;
        return true;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [shifts, dateFrom, dateTo]);
  
  const summary = useMemo(() => {
    return filteredShifts.reduce((acc, shift) => {
        acc.totalSales += shift.totalSales || 0;
        acc.totalPayouts += shift.totalPayouts || 0;
        acc.cashSales += shift.paymentBreakdown?.Cash || 0;
        acc.cashVariance += shift.cashVariance || 0;
        return acc;
    }, { totalSales: 0, totalPayouts: 0, cashSales: 0, cashVariance: 0 });
  }, [filteredShifts]);

  const formatCurrency = (amount: number) => `Ksh ${amount.toFixed(2)}`;

  if (selectedShift) {
    return (
      <div className="h-full bg-slate-100">
         <ZReportView
            shift={selectedShift}
            sales={sales}
            expenses={expenses}
            supplierPayments={supplierPayments}
            bankDeposits={bankDeposits}
            settings={settings || DEFAULT_SETTINGS}
            onClose={() => setSelectedShift(null)}
            isHistoricalView={true}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Z-Reports (Closed Shifts)</h1>

      <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-border dark:border-dark-border space-y-4">
        <div className="flex flex-wrap items-center gap-2">
            <FilterButton label="Today" filterKey="today" activeFilter={activeFilter} onClick={handleFilterChange} />
            <FilterButton label="Yesterday" filterKey="yesterday" activeFilter={activeFilter} onClick={handleFilterChange} />
            <FilterButton label="This Week" filterKey="this_week" activeFilter={activeFilter} onClick={handleFilterChange} />
            <FilterButton label="Last Week" filterKey="last_week" activeFilter={activeFilter} onClick={handleFilterChange} />
            <FilterButton label="This Month" filterKey="this_month" activeFilter={activeFilter} onClick={handleFilterChange} />
            <FilterButton label="Last Month" filterKey="last_month" activeFilter={activeFilter} onClick={handleFilterChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border dark:border-dark-border">
             <div>
                <label htmlFor="dateFrom" className="text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">From</label>
                <input type="date" id="dateFrom" value={dateFrom} onChange={e => handleDateInputChange(e, 'from')} className="w-full mt-1 px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background" />
            </div>
             <div>
                <label htmlFor="dateTo" className="text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">To</label>
                <input type="date" id="dateTo" value={dateTo} onChange={e => handleDateInputChange(e, 'to')} className="w-full mt-1 px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background" />
            </div>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Sales" value={formatCurrency(summary.totalSales)} className="!text-primary dark:!text-dark-primary"/>
            <StatCard title="Cash Sales" value={formatCurrency(summary.cashSales)} />
            <StatCard title="Total Payouts" value={formatCurrency(summary.totalPayouts)} className="!text-warning dark:!text-dark-warning"/>
            <StatCard title="Net Cash Variance" value={formatCurrency(summary.cashVariance)} className={summary.cashVariance < 0 ? '!text-danger' : '!text-green-600'}/>
       </div>

      <div className="bg-card dark:bg-dark-card rounded-xl shadow-md overflow-x-auto border border-border dark:border-dark-border">
        <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
          <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
            <tr>
              <th scope="col" className="px-6 py-3">Cashier</th>
              <th scope="col" className="px-6 py-3">Shift Start</th>
              <th scope="col" className="px-6 py-3">Shift End</th>
              <th scope="col" className="px-6 py-3 text-right">Total Sales</th>
              <th scope="col" className="px-6 py-3 text-right">Cash Variance</th>
              <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-dark-border">
            {filteredShifts.map(shift => {
              const variance = shift.cashVariance || 0;
              return (
                <tr key={shift.id} className="hover:bg-muted dark:hover:bg-dark-muted cursor-pointer" onClick={() => setSelectedShift(shift)}>
                  <td className="px-6 py-4 font-medium text-foreground dark:text-dark-foreground">{shift.userName}</td>
                  <td className="px-6 py-4">{new Date(shift.startTime).toLocaleString('en-GB', {timeZone: 'Africa/Nairobi'})}</td>
                  <td className="px-6 py-4">{shift.endTime ? new Date(shift.endTime).toLocaleString('en-GB', {timeZone: 'Africa/Nairobi'}) : 'N/A'}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(shift.totalSales || 0)}</td>
                  <td className={`px-6 py-4 text-right font-mono font-semibold ${
                    variance === 0 ? 'text-foreground dark:text-dark-foreground' : variance > 0 ? 'text-warning' : 'text-danger'
                  }`}>{formatCurrency(variance)}</td>
                   <td className="px-6 py-4 text-right">
                    <button className="font-medium text-primary dark:text-dark-primary hover:underline">View Report</button>
                  </td>
                </tr>
              );
            })}
            {filteredShifts.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-foreground-muted dark:text-dark-foreground-muted">
                        No closed shifts found for the selected period.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftReportView;
