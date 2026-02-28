import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { db } from '../database';
import { User } from '../types';
import SEO from './SEO';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<User | null>(db.auth.getCurrentUser());
    const [theme, setTheme] = useState<'light' | 'dark'>(db.settings.get()?.theme || 'light');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuthChange = () => {
            const currentUser = db.auth.getCurrentUser();
            setUser(currentUser);
            if (!currentUser) navigate('/login');
        };

        window.addEventListener('auth-change', handleAuthChange);
        return () => window.removeEventListener('auth-change', handleAuthChange);
    }, [navigate]);

    useEffect(() => {
        // Scroll to top and close sidebar on route change
        window.scrollTo(0, 0);
        setSidebarOpen(false);
    }, [location.pathname]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        try {
            db.settings.save({ ...(db.settings.get()), theme: newTheme });
        } catch (e) { }
    };

    return (
        <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200 ${theme === 'dark' ? 'dark' : ''}`}>
            <SEO />

            {/* Sidebar - Desktop stays fixed, Mobile is overlay */}
            <DashboardSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <DashboardHeader
                    onToggleSidebar={() => setSidebarOpen(true)}
                    user={user}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] dark:bg-[#020617] p-4 sm:p-6 lg:p-10 animate-in fade-in duration-500">
                    <div className="max-w-[1600px] mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
