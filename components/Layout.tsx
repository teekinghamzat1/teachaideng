import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, Sparkles, UserIcon, LogOut, FileText, Clipboard, Users, Calendar, SettingsIcon, WifiOff, Shield, Bell, Sun, Moon, ChevronDown } from './Icons';
import { db } from '../database';
import SEO from './SEO';
import { User } from '../types';
import { useBranding } from '../contexts/BrandingContext';
import SupportChat from './SupportChat';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(db.auth.getCurrentUser());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const branding = useBranding();

  const [theme, setTheme] = useState<'light' | 'dark'>(db.settings.get()?.theme || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      db.settings.save({ ...(db.settings.get()), theme: newTheme });
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
  };

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for auth changes and network status
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = db.auth.getCurrentUser();
      setUser(currentUser);

      // Fetch System Settings (Maintenance Mode)
      try {
        const sysSettings = await db.settings.getPublic();
        if (sysSettings) setMaintenanceMode(sysSettings.maintenanceMode);
      } catch (e) {
        // Silent fail or default to false
      }

      // Apply theme settings on load
      const settings = db.settings.get();
      db.settings.save(settings); // Re-applies css side effects

      // Fetch notifications if logged in
      if (currentUser) {
        try {
          const data = await db.notifications.get();
          setNotifications(data);
        } catch (e) { console.error('Failed to load notifications'); }
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    checkAuth(); // Initial check

    // Re-fetch profile ONCE on mount to ensure session has latest plan/schoolId
    if (db.auth.getCurrentUser()) {
      db.auth.refreshUser().catch(e => console.error('Refresh fail', e));
    }

    // Add event listeners
    window.addEventListener('auth-change', checkAuth);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await db.auth.logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
  ];

  const authLinks = [
    ...(user?.subscriptionPlan?.toLowerCase() === 'school' && user?.schoolId
      ? [{ name: 'Dashboard', path: '/teacher-dashboard', icon: FileText }]
      : user?.subscriptionPlan?.toLowerCase() !== 'school'
        ? [{ name: 'Dashboard', path: '/dashboard', icon: FileText }]
        : []
    ),
    ...(user?.isSchoolAdmin ? [{ name: 'School', path: '/school', icon: Users }] : []),
    { name: 'History', path: '/history', icon: BookOpen },
    { name: 'Quiz', path: '/assessment', icon: Clipboard },
    { name: 'Classes', path: '/classes', icon: Users },
    { name: 'Timetable', path: '/timetable', icon: Calendar },
    { name: 'Smart Class (Beta)', path: '/smart-class', icon: Sparkles, disabled: true },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
      <SEO />
      {/* Maintenance Mode Overlay */}
      {maintenanceMode && (!user || user.role !== 'Admin') && (
        <div className="fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Under Maintenance</h1>
            <p className="text-slate-600 mb-6">
              We are currently performing scheduled maintenance to improve our services. Please check back shortly.
            </p>
            <div className="text-xs text-slate-400">
              If you are an admin, please <Link to="/login" className="text-brand-600 hover:underline">login here</Link>.
            </div>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-slate-800 text-white text-center text-sm py-2 px-4 font-medium flex items-center justify-center print:hidden z-50">
          <WifiOff className="w-4 h-4 mr-2" />
          You are currently offline. Generation features are disabled, but you can view your saved history.
        </div>
      )}

      {/* Navbar */}
      <nav className={`sticky top-0 z-40 w-full transition-all duration-300 border-b ${isOnline ? 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md' : 'bg-white dark:bg-slate-800'} border-slate-200/60 dark:border-slate-700/60 shadow-sm print:hidden`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                {(theme === 'dark' && branding.siteLogoDark) || branding.siteLogo ? (
                  <img
                    src={theme === 'dark' && branding.siteLogoDark ? branding.siteLogoDark : branding.siteLogo}
                    alt={branding.siteName}
                    className="h-10 w-auto max-w-[240px] object-contain transition-transform group-hover:scale-105 duration-300"
                  />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:rotate-3 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-2xl text-slate-900 dark:text-slate-100 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                      {branding.siteName}
                    </span>
                  </>
                )}
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex lg:items-center lg:space-x-1">
              <div className="flex items-center space-x-1 mr-4 border-r border-slate-200 dark:border-slate-700 pr-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive(link.path)
                      ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}

                {user && authLinks.slice(0, 5).map((link) => (
                  link.disabled ? (
                    <div
                      key={link.path}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed flex items-center gap-1.5 opacity-60"
                      title="Coming Soon"
                    >
                      {link.name}
                    </div>
                  ) : (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center ${isActive(link.path)
                        ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                      {link.name}
                    </Link>
                  )
                ))}

                {user && authLinks.length > 5 && (
                  <div className="relative group/more">
                    <button className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center">
                      More <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                    <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all duration-200 z-50">
                      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        {authLinks.slice(5).map(link => (
                          link.disabled ? (
                            <div
                              key={link.path}
                              className="block px-4 py-3 text-sm font-medium text-slate-400 cursor-not-allowed opacity-60"
                            >
                              {link.name}
                            </div>
                          ) : (
                            <Link
                              key={link.path}
                              to={link.path}
                              className="block px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-600"
                            >
                              {link.name}
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className={`p-2.5 rounded-xl transition-all ${notificationsOpen ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-white dark:ring-slate-800 animate-pulse">
                          {notifications.filter(n => !n.isRead).length}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl py-0 z-50 border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-800 dark:text-white">Recent Updates</span>
                          <button onClick={() => setNotificationsOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="max-h-[24rem] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6">
                              <Bell className="w-10 h-10 text-slate-200 mb-3" />
                              <p className="text-center text-sm text-slate-500">Everything caught up!</p>
                            </div>
                          ) : (
                            notifications.map((n: any) => (
                              <div
                                key={n.id}
                                onClick={async () => {
                                  if (!n.isRead) {
                                    try {
                                      await db.notifications.markAsRead(n.id);
                                      setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
                                    } catch (e) { }
                                  }
                                }}
                                className={`px-4 py-4 border-b border-slate-50 dark:border-slate-700 last:border-0 cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'bg-blue-50/50 dark:bg-slate-700/40 hover:bg-blue-50'}`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <p className={`text-sm ${n.isRead ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'} leading-tight`}>{n.title}</p>
                                  {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 mt-1.5"></span>}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase">{new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-600 text-center">
                            <button className="text-xs font-bold text-brand-600 hover:text-brand-700">Mark all as read</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Theme Toggle */}
                <button onClick={toggleTheme} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand-600 transition-all">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Profile / Auth Section */}
                {user ? (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="relative group/profile">
                      <button className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500 transition-all bg-white dark:bg-slate-800">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 hidden xl:block">{user.name.split(' ')[0]}</span>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-50 dark:ring-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 ring-2 ring-slate-50 dark:ring-slate-700">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                      <div className="absolute top-full right-0 pt-2 w-56 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                          <div className="p-4 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                          </div>
                          <div className="p-2">
                            {['admin', 'superadmin'].includes((user.role || '').toLowerCase()) && (
                              <Link to="/admin" className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                                <Shield className="w-4 h-4 mr-3" /> Admin Dashboard
                              </Link>
                            )}
                            <Link to="/settings" className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                              <SettingsIcon className="w-4 h-4 mr-3" /> Account Settings
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <LogOut className="w-4 h-4 mr-3" /> Sign Out
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="ml-2 px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors"
                  >
                    Sign In
                  </Link>
                )}

                <Link
                  to={user ? "/generator" : "/login"}
                  className="ml-1 inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-sm font-bold rounded-2xl shadow-lg shadow-brand-500/25 text-white transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {user ? 'New Lesson' : 'Free Trial'}
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden gap-3">
              {user && (
                <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 text-slate-400 relative">
                  <Bell className="w-6 h-6" />
                  {notifications.filter(n => !n.isRead).length > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-800"></span>}
                </button>
              )}
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="block w-7 h-7" /> : <Menu className="block w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {
          isMobileMenuOpen && (
            <div className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 max-h-[calc(100vh-5rem)] overflow-y-auto animate-in slide-in-from-top-4 duration-300">
              <div className="px-4 pt-6 pb-8 space-y-4">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${isActive(link.path)
                        ? 'bg-brand-50 border-brand-100 text-brand-700 dark:bg-brand-900/30 dark:border-brand-800'
                        : 'bg-slate-50 border-transparent text-slate-600 dark:bg-slate-800/50'
                        }`}
                    >
                      <span className="text-sm font-bold">{link.name}</span>
                    </Link>
                  ))}
                </div>

                {user ? (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4">
                      <div className="flex items-center gap-3 mb-4">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600">
                            <UserIcon className="w-7 h-7" />
                          </div>
                        )}
                        <div>
                          <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {authLinks.map(link => (
                          link.disabled ? (
                            <div
                              key={link.path}
                              className="flex items-center px-4 py-3 rounded-xl text-sm font-bold text-slate-400 opacity-60 cursor-not-allowed"
                            >
                              <link.icon className="w-5 h-5 mr-3" />
                              {link.name}
                            </div>
                          ) : (
                            <Link
                              key={link.path}
                              to={link.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isActive(link.path)
                                ? 'text-brand-700 bg-white dark:bg-slate-800 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
                                }`}
                            >
                              <link.icon className="w-5 h-5 mr-3 text-slate-400" />
                              {link.name}
                            </Link>
                          )
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold text-sm"
                      >
                        <LogOut className="w-5 h-5" /> Sign Out from Account
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center p-4 rounded-2xl bg-brand-600 text-white font-bold"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                {/* Mobile Bottom Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 font-bold text-sm text-slate-500">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <Link
                    to={user ? "/generator" : "/login"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-extrabold text-sm shadow-xl"
                  >
                    {user ? 'New Lesson' : 'Get Started'}
                  </Link>
                </div>
              </div>
            </div>
          )
        }
      </nav>

      {/* Main Content */}
      <main className="flex-grow print:w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 print:hidden">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              {/* Footer Logo - Prefer dark logo, fallback to main logo */}
              {branding.siteLogoDark || branding.siteLogo ? (
                <img
                  src={branding.siteLogoDark || branding.siteLogo}
                  alt={branding.siteName}
                  className="h-10 w-auto mb-4"
                />
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl text-white">{branding.siteName}</span>
                </div>
              )}
              <p className="text-sm text-slate-400">
                Empowering Nigerian teachers with AI tools to save time and improve education quality.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/generator" className="hover:text-white transition-colors">Lesson Generator</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Support</h3>
              <ul className="space-y-3">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Contact</h3>
              <p className="text-sm">Lagos, Nigeria</p>
              <p className="text-sm mt-2">hello@teachaide.ng</p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {branding.siteName}. All rights reserved.
          </div>
        </div>
      </footer>
      {user && <SupportChat />}
    </div >
  );
};

export default Layout;