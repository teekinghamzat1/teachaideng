import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../database';
import { LayoutDashboard, Users, FileText, SettingsIcon, LogOut, Menu, X, Shield, BookOpen, Bell, Search, Activity } from './Icons';
import { User } from '../types';

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = db.auth.getCurrentUser();
        if (!currentUser || !['admin', 'superadmin', 'Admin'].includes(currentUser.role)) {
            navigate('/dashboard');
        }
        setUser(currentUser);
    }, [navigate]);

    const handleLogout = async () => {
        await db.auth.logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Overview', path: '/admin', icon: LayoutDashboard },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Content', path: '/admin/content', icon: FileText },
        { name: 'Testimonials', path: '/admin/testimonials', icon: Activity },
        { name: 'Curriculum', path: '/admin/curriculum', icon: BookOpen },
        { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
    ];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="flex items-center justify-between h-16 px-4 bg-slate-800 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">TeachAide <span className="text-brand-400">Admin</span></span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="px-4 py-6 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
                                        ? 'bg-brand-600 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700">
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1 max-w-lg mx-4 hidden md:block">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Global Search..."
                                type="search"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Bell removed */}
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                                {user?.name?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 sm:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;