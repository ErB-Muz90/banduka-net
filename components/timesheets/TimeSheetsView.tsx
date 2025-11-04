
import React, { useState, useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TimeClockEvent, User, Permission } from '../../types';
import ConfirmationModal from '../common/ConfirmationModal';
import { ICONS } from '../../constants';

interface TimeSheetsViewProps {
    timeClockEvents: TimeClockEvent[];
    users: User[];
    permissions: Permission[];
    onAddRequest: () => void;
    onEditRequest: (event: TimeClockEvent) => void;
    onDeleteRequest: (eventId: string) => void;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-sm flex items-center space-x-4 border border-border dark:border-dark-border">
        <div className="p-3 rounded-lg text-primary dark:text-dark-primary bg-muted dark:bg-dark-muted">
            {icon}
        </div>
        <div>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted font-semibold">{title}</p>
            <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);


const formatDuration = (start: Date, end?: Date): string => {
    if (!end) return 'Active';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return 'Invalid';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
};

const TimeSheetsView: React.FC<TimeSheetsViewProps> = ({ timeClockEvents, users, permissions, onAddRequest, onEditRequest, onDeleteRequest }) => {
    const [userFilter, setUserFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [eventToDelete, setEventToDelete] = useState<TimeClockEvent | null>(null);

    const canManage = permissions.includes('manage_timesheets');

    const filteredEvents = useMemo(() => {
        const start = dateFrom ? new Date(dateFrom) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = dateTo ? new Date(dateTo) : null;
        if (end) end.setHours(23, 59, 59, 999);
        
        return timeClockEvents
            .filter(event => userFilter === 'all' || event.userId === userFilter)
            .filter(event => {
                const eventDate = new Date(event.clockInTime);
                if (start && eventDate < start) return false;
                if (end && eventDate > end) return false;
                return true;
            })
            .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime());
    }, [timeClockEvents, userFilter, dateFrom, dateTo]);

    const { totalHours, avgDuration, activeStaffCount } = useMemo(() => {
        let totalMillis = 0;
        let completedEvents = 0;
        
        filteredEvents.forEach(event => {
            if (event.clockOutTime) {
                totalMillis += (new Date(event.clockOutTime).getTime() - new Date(event.clockInTime).getTime());
                completedEvents++;
            }
        });
        
        const tHours = totalMillis / 3600000;
        const aDuration = completedEvents > 0 ? (totalMillis / completedEvents) / 3600000 : 0;
        
        const activeCount = timeClockEvents.filter(e => e.status === 'clocked-in').length;

        return { totalHours: tHours, avgDuration: aDuration, activeStaffCount: activeCount };
    }, [filteredEvents, timeClockEvents]);


    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted min-h-full">
            {eventToDelete && (
                <ConfirmationModal 
                    title="Delete Time Entry?"
                    message={`Are you sure you want to delete this time clock entry for ${eventToDelete.userName}? This cannot be undone.`}
                    onConfirm={() => {
                        onDeleteRequest(eventToDelete.id);
                        setEventToDelete(null);
                    }}
                    onClose={() => setEventToDelete(null)}
                    confirmText="Delete"
                    isDestructive
                />
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Staff Shifts</h1>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Track staff clock-in/out times and total hours worked</p>
                </div>
                {canManage && (
                     <button 
                        onClick={onAddRequest}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-focus transition-colors mt-4 md:mt-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                        <span>Add Manual Entry</span>
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Hours (Filtered)" value={`${totalHours.toFixed(2)} hrs`} icon={ICONS.timeSheets} />
                <StatCard title="Shifts Recorded" value={filteredEvents.length} icon={ICONS.clipboardList} />
                <StatCard title="Avg. Duration" value={`${avgDuration.toFixed(2)} hrs`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
                <StatCard title="Staff Active Now" value={activeStaffCount} icon={ICONS.users} />
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border">
                 <div className="p-4 border-b border-border dark:border-dark-border">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background">
                            <option value="all">All Staff</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background" />
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-background" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground-muted dark:text-dark-foreground-muted uppercase bg-muted dark:bg-dark-muted/50">
                            <tr>
                                <th className="py-3 px-4">Staff Member</th>
                                <th className="py-3 px-4">Clock In</th>
                                <th className="py-3 px-4">Clock Out</th>
                                <th className="py-3 px-4">Duration</th>
                                <th className="py-3 px-4">Notes</th>
                                <th className="py-3 px-4"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-dark-border">
                            {filteredEvents.map(event => (
                                <tr key={event.id} className="hover:bg-muted dark:hover:bg-dark-muted/50">
                                    <td className="py-3 px-4 font-semibold text-foreground dark:text-dark-foreground">{event.userName}</td>
                                    <td className="py-3 px-4">{new Date(event.clockInTime).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                    <td className="py-3 px-4">
                                        {event.clockOutTime 
                                            ? new Date(event.clockOutTime).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) 
                                            : <span className="font-semibold text-primary">Active</span>}
                                    </td>
                                    <td className="py-3 px-4 font-mono font-semibold">{formatDuration(event.clockInTime, event.clockOutTime)}</td>
                                    <td className="py-3 px-4 text-xs italic text-foreground-muted">{event.notes}</td>
                                    <td className="py-3 px-4 text-right">
                                        {canManage && (
                                            <div className="space-x-4">
                                                <button onClick={() => onEditRequest(event)} className="font-medium text-primary hover:underline">Edit</button>
                                                <button onClick={() => setEventToDelete(event)} className="font-medium text-danger hover:underline">Delete</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredEvents.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-8 text-foreground-muted">No entries found for the selected filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TimeSheetsView;
