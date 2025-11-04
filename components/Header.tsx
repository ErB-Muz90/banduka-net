import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Product, Settings, TimeClockEvent } from '../types';
import { ICONS } from '../constants';
import LowStockNotificationPopover from './notifications/LowStockNotificationPopover';
// FIX: The Logo component is now correctly exported from Sidebar.tsx, resolving this import error.
import { Logo } from './Sidebar';

const MotionSvg = motion.svg;
const MotionDiv = motion.div;
const MotionSpan = motion.span;
const MotionButton = motion.button;

const SyncIcon = () => (
    <MotionSvg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-secondary dark:text-dark-secondary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
        stroke="currentColor"
        animate={{ rotate: 360 }}
        transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
        }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.69a8.25 8.25 0 00-11.664 0l-3.181 3.183"
        />
    </MotionSvg>
);


interface HeaderProps {
    isOnline: boolean;
    isSyncing: boolean;
    queuedSalesCount: number;
    onMenuClick: () => void;
    currentUser: User;
    products: Product[];
    settings: Settings;
    onInstallClick: () => void;
    installPromptEvent: Event | null;
    activeTimeClockEvent: TimeClockEvent | null;
    onLogout: () => void;
}

const Header = ({ isOnline, isSyncing, queuedSalesCount, onMenuClick, currentUser, products, settings, onInstallClick, installPromptEvent, activeTimeClockEvent, onLogout }: HeaderProps) => {
    const [time, setTime] = useState(new Date());
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('');

    const lowStockThreshold = settings.inventory?.lowStockThreshold ?? 3;
    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.productType === 'Inventory' && p.stock > 0 && p.stock <= lowStockThreshold);
    }, [products, lowStockThreshold]);

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if(activeTimeClockEvent) {
            const updateElapsedTime = () => {
                const now = new Date();
                const start = new Date(activeTimeClockEvent.clockInTime);
                const diff = now.getTime() - start.getTime();
                const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setElapsedTime(`${hours}:${minutes}:${seconds}`);
            };
            updateElapsedTime();
            interval = setInterval(updateElapsedTime, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimeClockEvent]);

    const userInitials = useMemo(() => {
        if (!currentUser || !currentUser.name) return '';
        const nameParts = currentUser.name.split(' ').filter(Boolean);
        if (nameParts.length > 1) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return nameParts[0] ? nameParts[0][0].toUpperCase() : '';
    }, [currentUser]);

    return (
        <header className="bg-white/30 dark:bg-dark-card/50 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 relative z-30 no-print shadow-lg">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
                <button onClick={onMenuClick} className="md:hidden text-foreground-muted hover:text-primary dark:text-dark-foreground-muted dark:hover:text-dark-primary p-2 rounded-full hover:bg-muted dark:hover:bg-dark-muted">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="md:hidden">
                    <Logo layout="horizontal" />
                </div>
                <div className="text-left hidden sm:block">
                    <div className="font-bold text-sm text-foreground dark:text-dark-foreground">{time.toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi' })}</div>
                    <div className="text-xs text-foreground-muted dark:text-dark-foreground-muted">{time.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'Africa/Nairobi' })}</div>
                </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center space-x-2 md:space-x-4">
                 {installPromptEvent && (
                    <MotionButton
                        onClick={onInstallClick}
                        whileTap={{ scale: 0.95 }}
                        className="hidden sm:flex items-center space-x-2 bg-primary text-primary-content font-bold px-3 py-1.5 rounded-xl transition-shadow shadow-clay-light active:shadow-clay-light-inset dark:bg-dark-primary dark:text-dark-primary-content dark:shadow-clay-dark dark:active:shadow-clay-dark-inset"
                    >
                        {ICONS.install}
                        <span className="text-sm">Install App</span>
                    </MotionButton>
                )}
                
                 <div className="hidden md:flex items-center space-x-2 px-2 py-1.5 bg-muted/50 dark:bg-dark-muted/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} title={isOnline ? 'Online' : 'Offline'}></div>
                    <div className="flex items-center space-x-1" title={`${queuedSalesCount} unsynced sales`}>
                        {isSyncing ? <SyncIcon/> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary dark:text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
                        <span className="text-sm font-bold text-secondary dark:text-dark-secondary">{queuedSalesCount}</span>
                    </div>
                </div>

                {/* Notifications */}
                 <div className="relative">
                    <MotionButton whileTap={{scale: 0.95}} onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full transition-all duration-200 hover:shadow-clay-light active:shadow-clay-light-inset dark:hover:shadow-clay-dark dark:active:shadow-clay-dark-inset">
                        {ICONS.bell}
                        {lowStockProducts.length > 0 && (
                            <MotionSpan 
                                className="absolute -top-0.5 -right-0.5 flex h-3 w-3"
                                initial={{scale:0}} animate={{scale:1}}
                            >
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
                            </MotionSpan>
                        )}
                    </MotionButton>
                    <AnimatePresence>
                        {isNotificationsOpen && (
                            <LowStockNotificationPopover lowStockProducts={lowStockProducts} onClose={() => setIsNotificationsOpen(false)} />
                        )}
                    </AnimatePresence>
                </div>

                {/* User Menu */}
                 <div className="relative">
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 p-1 rounded-full transition-all duration-200 hover:shadow-clay-light active:shadow-clay-light-inset dark:hover:shadow-clay-dark dark:active:shadow-clay-dark-inset">
                        <div className="text-right hidden md:block">
                            <div className="font-bold text-sm text-foreground dark:text-dark-foreground">{currentUser.name}</div>
                            <div className="text-xs text-foreground-muted dark:text-dark-foreground-muted">{currentUser.role}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-lg border-2 border-primary/50">
                            <span>{userInitials}</span>
                        </div>
                    </button>
                    <AnimatePresence>
                        {isUserMenuOpen && (
                            <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                            <MotionDiv
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-56 bg-white/50 dark:bg-dark-card/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-xl shadow-xl py-1 z-20"
                            >
                                {activeTimeClockEvent && (
                                    <div className="px-4 py-2 text-sm text-foreground dark:text-dark-foreground border-b dark:border-white/10">
                                        <p>Shift Active: <span className="font-bold">{elapsedTime}</span></p>
                                    </div>
                                )}
                                <div className="border-t border-border dark:border-white/10 my-1"></div>
                                <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-danger flex items-center space-x-2 hover:bg-danger/10">
                                    {ICONS.logout}
                                    <span>Logout</span>
                                </button>
                            </MotionDiv>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;