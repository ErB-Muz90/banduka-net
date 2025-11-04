import React, { useState, useMemo } from 'react';
import { AuditLog, User } from '../../types';

interface AuditLogSettingsProps {
    auditLogs: AuditLog[];
    users: User[];
    onDriveBackupAuditLogs: () => void;
    isDriveAuthenticated: boolean;
}

const ITEMS_PER_PAGE = 20;

const AuditLogSettings: React.FC<AuditLogSettingsProps> = ({ auditLogs, users, onDriveBackupAuditLogs, isDriveAuthenticated }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredLogs = useMemo(() => {
        const start = startDate ? new Date(startDate) : null;
        if(start) start.setHours(0,0,0,0);
        
        const end = endDate ? new Date(endDate) : null;
        if(end) end.setHours(23,59,59,999);

        // Assuming auditLogs is pre-sorted descending by timestamp from App.tsx
        return auditLogs
            .filter(log => selectedUser === 'all' || log.userId === selectedUser)
            .filter(log => {
                const logDate = new Date(log.timestamp);
                if (start && logDate < start) return false;
                if (end && logDate > end) return false;
                return true;
            })
            .filter(log => 
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.userName.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [auditLogs, searchTerm, selectedUser, startDate, endDate]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    
    const exportData = (format: 'csv' | 'json') => {
        const dataToExport = filteredLogs;
        if(dataToExport.length === 0) {
            alert('No logs to export with current filters.');
            return;
        }

        const filename = `banduka_pos_audit_logs_${new Date().toISOString().split('T')[0]}`;
        let fileContent = '';
        let mimeType = '';

        if(format === 'csv') {
            const headers = ['id', 'timestamp', 'userId', 'userName', 'action', 'details'];
            const csvRows = [
                headers.join(','),
                ...dataToExport.map(log => [
                    log.id,
                    new Date(log.timestamp).toISOString(),
                    log.userId,
                    `"${log.userName.replace(/"/g, '""')}"`,
                    log.action,
                    `"${log.details.replace(/"/g, '""')}"`
                ].join(','))
            ];
            fileContent = csvRows.join('\n');
            mimeType = 'text/csv;charset=utf-8;';
        } else {
            fileContent = JSON.stringify(dataToExport, null, 2);
            mimeType = 'application/json;charset=utf-8;';
        }

        const blob = new Blob([fileContent], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };


    return (
        <div className="space-y-4">
            <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg border border-border dark:border-dark-border space-y-4">
                <h4 className="font-semibold text-foreground dark:text-dark-foreground">Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm"
                    />
                    <select 
                        value={selectedUser}
                        onChange={e => setSelectedUser(e.target.value)}
                        className="w-full block pl-3 pr-10 py-2 text-base bg-card dark:bg-dark-card border border-border dark:border-dark-border focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm rounded-md"
                    >
                        <option value="all">All Users</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-dark-primary sm:text-sm" />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button onClick={() => exportData('csv')} className="bg-primary/80 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary">Export as CSV</button>
                <button onClick={() => exportData('json')} className="bg-primary/80 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary">Export as JSON</button>
                <button onClick={onDriveBackupAuditLogs} disabled={!isDriveAuthenticated} className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed">Backup to Drive</button>
            </div>
            
            <div className="bg-card dark:bg-dark-card rounded-lg shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                        <tr>
                            <th scope="col" className="px-6 py-3">Timestamp</th>
                            <th scope="col" className="px-6 py-3">User</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                            <th scope="col" className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLogs.map(log => (
                             <tr key={log.id} className="bg-card dark:bg-dark-card border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted dark:hover:bg-dark-muted">
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                                <td className="px-6 py-4 font-medium text-foreground dark:text-dark-foreground">{log.userName}</td>
                                <td className="px-6 py-4"><span className="font-mono text-xs bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground px-2 py-1 rounded">{log.action}</span></td>
                                <td className="px-6 py-4">{log.details}</td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-8">No logs found matching criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-border dark:border-dark-border rounded-md disabled:opacity-50">Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-border dark:border-dark-border rounded-md disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
};

export default AuditLogSettings;