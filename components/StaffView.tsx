

import React, { useState, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Permission } from '../types';
import UserModal from './settings/UserModal';
import ConfirmationModal from './common/ConfirmationModal';
import ResetPasscodeModal from './settings/ResetPasscodeModal';
import { ICONS } from '../constants';

// Icons for actions
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2h2v-2h2v-2h2l2.05-2.05A6 6 0 0121 11z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface StaffViewProps {
    users: User[];
    permissions: Permission[];
    onAddUser: (user: Omit<User, 'id'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onManagePermissionsRequest: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="p-3 rounded-lg bg-muted dark:bg-dark-muted text-primary dark:text-dark-primary">
            {icon}
        </div>
        <div>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">{title}</p>
            <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);

const StaffView: React.FC<StaffViewProps> = ({ users, permissions, onAddUser, onUpdateUser, onDeleteUser, onManagePermissionsRequest }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [userToResetPasscode, setUserToResetPasscode] = useState<User | null>(null);
    
    const canManage = permissions.includes('manage_staff');

    const activeRoles = useMemo(() => new Set(users.map(u => u.role)).size, [users]);

    const openUserModal = (user?: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };
    
    const handleSaveUser = (userData: Omit<User, 'id'> | User) => {
        if ('id' in userData) {
            onUpdateUser(userData);
        } else {
            onAddUser(userData as Omit<User, 'id'>);
        }
        setIsUserModalOpen(false);
    };

    const handleDeleteConfirm = () => {
        if(deletingUser) {
            onDeleteUser(deletingUser.id);
            setDeletingUser(null);
        }
    };
    
    const handlePasscodeSave = (userId: string, newPasscode: string) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate) {
            onUpdateUser({ ...userToUpdate, password: newPasscode });
        }
        setUserToResetPasscode(null);
    };

    return (
        <div className="p-4 md:p-6 bg-muted dark:bg-dark-muted min-h-full">
            <AnimatePresence>
                {isUserModalOpen && (
                    <UserModal 
                        onClose={() => setIsUserModalOpen(false)}
                        onSave={handleSaveUser}
                        user={editingUser}
                    />
                )}
                {deletingUser && (
                     <ConfirmationModal
                        title={`Delete User ${deletingUser.name}?`}
                        message="Are you sure you want to permanently delete this user? This action cannot be undone."
                        confirmText="Delete"
                        onConfirm={handleDeleteConfirm}
                        onClose={() => setDeletingUser(null)}
                        isDestructive
                    />
                )}
                 {userToResetPasscode && (
                    <ResetPasscodeModal
                        user={userToResetPasscode}
                        onClose={() => setUserToResetPasscode(null)}
                        onSave={handlePasscodeSave}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">Staff Management</h1>
                    <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">Add, edit, and manage staff members and their roles.</p>
                </div>
                 {canManage && (
                     <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        <button 
                            onClick={onManagePermissionsRequest}
                            whileTap={{ scale: 0.95 }}
                            className="bg-card text-foreground dark:bg-dark-card dark:text-dark-foreground font-bold px-4 py-2 rounded-lg border border-border dark:border-dark-border hover:bg-border dark:hover:bg-dark-border transition-colors shadow-sm"
                        >
                           Manage Roles
                        </button>
                        <button 
                            onClick={() => openUserModal()} 
                            whileTap={{ scale: 0.95 }} 
                            className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-sm flex items-center"
                        >
                            + Add New Staff
                        </button>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Staff" value={users.length} icon={ICONS.users} />
                <StatCard title="Active Roles" value={activeRoles} icon={ICONS.staff} />
            </div>

            <div className="bg-card dark:bg-dark-card rounded-lg shadow-sm">
                 <div className="p-4 border-b border-border dark:border-dark-border">
                    <h2 className="text-lg font-semibold text-foreground dark:text-dark-foreground">Staff List</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-foreground-muted dark:text-dark-foreground-muted">
                        <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                            <tr>
                                <th scope="col" className="px-6 py-3">Staff Member</th>
                                <th scope="col" className="px-6 py-3">Login ID</th>
                                <th scope="col" className="px-6 py-3">Role</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-dark-border">
                            {users.map(user => {
                                const isRootAdmin = !!user.email; // Only the signup account has an email
                                return (
                                <tr key={user.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                                    <td className="px-6 py-4 font-semibold text-foreground dark:text-dark-foreground flex items-center gap-2">
                                        {user.name}
                                        {isRootAdmin && (
                                            <span title="Primary Business Account Holder">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{user.email || user.username}</td>
                                    <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-semibold text-white bg-gray-800 rounded-full">{user.role}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        {canManage && !isRootAdmin ? (
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => openUserModal(user)} className="p-1.5 rounded-md text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Edit User"><EditIcon /></button>
                                                <button onClick={() => setUserToResetPasscode(user)} className="p-1.5 rounded-md text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50" title="Reset Passcode"><ResetIcon /></button>
                                                <button onClick={() => setDeletingUser(user)} className="p-1.5 rounded-md text-danger hover:bg-danger/10" title="Delete User"><DeleteIcon /></button>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-semibold text-foreground-muted dark:text-dark-foreground-muted">Locked</span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffView;
