import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TimeClockEvent, User } from '../../types';

interface TimeClockModalProps {
    event: TimeClockEvent | null;
    users: User[];
    onClose: () => void;
    onSave: (eventData: Omit<TimeClockEvent, 'id' | 'userName' | 'status'>, eventId?: string) => void;
}

const formatDateTimeLocal = (date?: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - tzOffset);
    return localDate.toISOString().slice(0, 16);
};

const TimeClockModal: React.FC<TimeClockModalProps> = ({ event, users, onClose, onSave }) => {
    const isNew = !event;
    const [userId, setUserId] = useState(event?.userId || users[0]?.id || '');
    const [clockInTime, setClockInTime] = useState(formatDateTimeLocal(event?.clockInTime || new Date()));
    const [clockOutTime, setClockOutTime] = useState(formatDateTimeLocal(event?.clockOutTime));
    const [notes, setNotes] = useState(event?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const clockInDate = new Date(clockInTime);
        const clockOutDate = clockOutTime ? new Date(clockOutTime) : undefined;
        
        if(clockOutDate && clockOutDate < clockInDate) {
            alert('Clock out time cannot be before clock in time.');
            return;
        }

        const eventData = {
            userId,
            clockInTime: clockInDate,
            clockOutTime: clockOutDate,
            notes,
        };
        onSave(eventData, event?.id);
    };

    return (
        <div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
            <div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-8 border border-border dark:border-dark-border"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">
                        {isNew ? 'Add Manual Time Entry' : 'Edit Time Entry'}
                    </h2>
                    <button onClick={onClose} className="text-foreground-muted dark:text-dark-foreground-muted hover:text-foreground dark:hover:text-dark-foreground">
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="user" className="block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">Staff Member</label>
                        <select
                            id="user"
                            value={userId}
                            onChange={e => setUserId(e.target.value)}
                            disabled={!isNew}
                            className="mt-1 block w-full px-3 py-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border text-foreground dark:text-dark-foreground rounded-md disabled:bg-muted dark:disabled:bg-dark-muted"
                        >
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="clockInTime" className="block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">Clock In</label>
                            <input type="datetime-local" id="clockInTime" value={clockInTime} onChange={e => setClockInTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md bg-background text-foreground border-border dark:border-dark-border dark:text-dark-foreground" />
                        </div>
                        <div>
                            <label htmlFor="clockOutTime" className="block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">Clock Out</label>
                            <input type="datetime-local" id="clockOutTime" value={clockOutTime} onChange={e => setClockOutTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md bg-background text-foreground border-border dark:border-dark-border dark:text-dark-foreground" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-foreground-muted dark:text-dark-foreground-muted">Notes (Optional)</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border rounded-md bg-background text-foreground border-border dark:border-dark-border dark:text-dark-foreground" placeholder="e.g., Forgot to clock out, manual entry by admin." />
                    </div>
                    <div className="mt-8 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground font-bold px-4 py-2 rounded-xl shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset">Cancel</button>
                        <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-bold px-6 py-2 rounded-xl shadow-clay dark:shadow-clay-dark active:shadow-clay-inset dark:active:shadow-clay-dark-inset">Save Entry</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TimeClockModal;