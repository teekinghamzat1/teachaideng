import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Sparkles, Clipboard, Users, Calendar,
    Shield, SettingsIcon as Settings, BookOpen, X
} from './Icons';
import { useBranding } from '../contexts/BrandingContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const DashboardSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const branding = useBranding();
    const isActive = (path: string) => location.pathname === path;

    const menuGroups = [
        {
            title: '', // No title for top level
            items: [
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: 'History', path: '/history', icon: BookOpen },
            ]
        },
        {
            title: 'AI TOOLS',
            items: [
                { name: 'Lesson Generator', path: '/generator', icon: Sparkles },
                { name: 'Quiz Creator', path: '/assessment', icon: Clipboard },
            ]
        },
        {
            title: 'MANAGEMENT',
            items: [
                { name: 'Classes', path: '/classes', icon: Users },
                { name: 'Timetable', path: '/timetable', icon: Calendar },
                { name: 'School', path: '/school', icon: Shield },
            ]
        },
        {
            title: 'UTILITIES',
            items: [
                { name: 'Settings', path: '/settings', icon: Settings },
            ]
        }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200/60 dark:border-slate-800/60
        transform transition-transform duration-300 lg:translate-x-0 lg:static
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col h-screen
      `}>
                {/* Logo */}
                <div className="p-8 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 transition-transform group-hover:rotate-3">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">
                            {branding.siteName.split(' ')[0]}<span className="text-brand-500">Dash</span>
                        </span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-8">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className={group.title ? "space-y-2" : "space-y-1"}>
                            {group.title && (
                                <h3 className="px-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`
                      flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all group
                      ${isActive(item.path)
                                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-brand-600 dark:hover:text-brand-400'
                                            }
                    `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-5 h-5 transition-colors ${isActive(item.path) ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-500'}`} />
                                            <span>{item.name}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>


            </aside>
        </>
    );
};

export default DashboardSidebar;
