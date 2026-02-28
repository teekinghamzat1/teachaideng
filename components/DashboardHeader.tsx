import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, Bell, Sun, Moon, Download, Menu,
    SettingsIcon as Settings, LogOut, ChevronDown, CheckCircle, X, ChevronRight
} from './Icons';
import { db } from '../database';
import UserAvatar from './UserAvatar';
import { User } from '../types';

interface HeaderProps {
    onToggleSidebar: () => void;
    user: User | null;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const DashboardHeader: React.FC<HeaderProps> = ({
    onToggleSidebar,
    user,
    theme,
    onToggleTheme
}) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const navigate = useNavigate();

    React.useEffect(() => {
        if (user) {
            db.notifications.get().then(setNotifications).catch(() => { });
        }
    }, [user]);

    const handleLogout = async () => {
        await db.auth.logout();
        navigate('/');
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await db.notifications.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) { }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 sm:px-8 py-3 h-20 flex items-center justify-between shadow-sm">
            {/* Search Bar - hidden on mobile, shown on desktop */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 w-72 group focus-within:border-brand-500/50 transition-all">
                    <Search className="w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search dashboard..."
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium ml-2 w-full text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-6">


                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={onToggleTheme}
                        className="p-2.5 text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 bg-slate-50 dark:bg-slate-900 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className={`p-2.5 rounded-xl transition-all bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${notificationsOpen ? 'bg-brand-50 text-brand-500' : 'text-slate-400'}`}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                    <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Notifications</span>
                                    <button onClick={() => setNotificationsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div key={n.id} className={`p-4 border-b border-slate-50 dark:border-slate-900 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer ${!n.isRead ? 'bg-brand-50/20 dark:bg-brand-500/5' : ''}`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                                                    {!n.isRead && (
                                                        <button onClick={(e) => handleMarkAsRead(n.id, e)} className="p-1 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded text-brand-500 transition-colors">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center space-y-3">
                                            <Bell className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All clear!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Profile */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-3 p-1 pl-1.5 pr-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 hover:border-brand-500/30 transition-all bg-slate-50 dark:bg-slate-900 shadow-sm group"
                    >
                        <UserAvatar user={user} className="w-8 h-8 md:w-10 md:h-10 rounded-xl" />
                        <div className="hidden lg:block text-left">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">{user?.name.split(' ')[0]}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{user?.subscriptionPlan || 'Free'}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                        <div className="absolute top-full right-0 mt-4 w-60 bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-slate-800 p-3 overflow-hidden animate-in fade-in slide-in-from-top-4">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-900 mb-2">
                                <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-1">Teacher Account</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.name}</p>
                            </div>
                            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <Settings className="w-4 h-4" /> Settings
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
