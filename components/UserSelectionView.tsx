import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';

interface UserSelectionViewProps {
    users: User[];
    onUserSelect: (user: User) => void;
}

const UserCard: React.FC<{ user: User; onClick: () => void }> = ({ user, onClick }) => {
    const isAdmin = user.role === 'Admin' || !!user.email;
    const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || user.name[0];

    return (
        <div
            onClick={onClick}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -5, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card/60 dark:bg-dark-card/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/20 dark:border-dark-border/50 cursor-pointer flex flex-col items-center text-center relative hover:border-primary/50 dark:hover:border-dark-primary/50 transition-colors"
        >
            {isAdmin && (
                <div className="absolute top-3 right-3 text-warning" title="Admin Account">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
            <div className="w-20 h-20 mb-4 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-4xl border-4 border-card dark:border-dark-card shadow-lg">
                <span>{initials}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground dark:text-dark-foreground">{user.name}</h3>
            <p className="text-sm text-foreground-muted dark:text-dark-foreground-muted">{user.role}</p>
        </div>
    );
};

const UserSelectionView: React.FC<UserSelectionViewProps> = ({ users, onUserSelect }) => {
    
    const staffUsers = users.filter(u => !u.email);
    const adminUser = users.find(u => !!u.email);

    return (
        <div className="min-h-screen auth-background flex flex-col items-center justify-center p-4">
            <div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h1 className="text-4xl font-extrabold text-foreground dark:text-dark-foreground">Banduka POS™</h1>
                <p className="text-lg text-foreground-muted dark:text-dark-foreground-muted mt-2">Select your profile to sign in</p>
            </div>
            
            <div 
                className="w-full max-w-4xl"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.08, delayChildren: 0.2 }
                    }
                }}
                initial="hidden"
                animate="visible"
            >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {adminUser && <UserCard user={adminUser} onClick={() => onUserSelect(adminUser)} />}
                    {staffUsers.map(user => (
                        <UserCard key={user.id} user={user} onClick={() => onUserSelect(user)} />
                    ))}
                </div>
                 {staffUsers.length === 0 && adminUser && (
                    <div 
                        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                        className="mt-8 text-center p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary/80 dark:text-dark-primary/80"
                    >
                        <p>No staff profiles found. Log in as Admin to add staff members from the Settings menu.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSelectionView;