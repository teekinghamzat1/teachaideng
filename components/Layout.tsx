import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, BookOpen, Sparkles, UserIcon, LogOut, FileText, Clipboard,
  Users, Calendar, SettingsIcon, WifiOff, Shield, Bell, Sun, Moon,
  ChevronDown, Star, Instagram, Whatsapp, Mail, CheckCircle, ChevronRight, Grid, MessageSquare
} from './Icons';
import { db } from '../database';
import SEO from './SEO';
import { User } from '../types';
import { useBranding } from '../contexts/BrandingContext';
import UserAvatar from './UserAvatar';

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

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = db.auth.getCurrentUser();
      setUser(currentUser);

      try {
        const sysSettings = await db.settings.getPublic();
        if (sysSettings) setMaintenanceMode(sysSettings.maintenanceMode);
      } catch (e) { }

      const settings = db.settings.get();
      db.settings.save(settings);

      if (currentUser) {
        try {
          const data = await db.notifications.get();
          setNotifications(data);
        } catch (e) { console.error('Failed to load notifications'); }
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    checkAuth();

    if (db.auth.getCurrentUser()) {
      db.auth.refreshUser().catch(e => console.error('Refresh fail', e));
    }

    window.addEventListener('auth-change', checkAuth);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Scroll to top and close mobile menu on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const isActive = (path: string) => location.pathname === path;

  const handleMarkAsRead = async (id: string) => {
    try {
      await db.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Failed to mark notification as read');
    }
  };

  const handleLogout = async () => {
    await db.auth.logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'Blog', path: '/blog' },
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <SEO />

      {/* Maintenance Mode Overlay */}
      {maintenanceMode && (!user || user.role !== 'Admin') && (
        <div className="fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Under Maintenance</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
              We are currently performing scheduled maintenance to improve our services. Please check back shortly.
            </p>
            <div className="text-xs text-slate-400">
              If you are an admin, please <Link to="/login" className="text-[#16A34A] hover:underline font-bold">login here</Link>.
            </div>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-slate-900 text-white text-center text-xs py-2.5 px-4 font-bold flex items-center justify-center print:hidden z-50 uppercase tracking-widest">
          <WifiOff className="w-4 h-4 mr-2" />
          Offline Mode · Generation Features Disabled
        </div>
      )}

      {/* Global Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm print:hidden h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center gap-4">
            {/* Logo Section - Hidden on mobile, moved to center logic */}
            <div className="flex-shrink-0 hidden lg:block">
              <Link to="/" className="flex items-center gap-2 group">
                {(theme === 'dark' && branding.siteLogoDark) || branding.siteLogo ? (
                  <img
                    src={theme === 'dark' && branding.siteLogoDark ? branding.siteLogoDark : branding.siteLogo}
                    alt={branding.siteName}
                    className="h-10 w-auto max-w-[200px] object-contain transition-transform group-hover:scale-105 duration-300"
                  />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-[#16A34A] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#16A34A]/20 transition-transform group-hover:rotate-3">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">
                      {branding.siteName}
                    </span>
                  </>
                )}
              </Link>
            </div>

            {/* Desktop Navigation - Centered for Everyone */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center gap-1">
                {!user ? (
                  navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive(link.path)
                        ? 'text-[#16A34A] bg-[#16A34A]/5'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#16A34A] hover:bg-[#16A34A]/5'
                        }`}
                    >
                      {link.name}
                    </Link>
                  ))
                ) : (
                  authLinks.slice(0, 5).map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive(link.path)
                        ? 'text-[#16A34A] bg-[#16A34A]/5'
                        : 'text-slate-600 dark:text-slate-400 hover:text-[#16A34A] hover:bg-[#16A34A]/5'
                        }`}
                    >
                      {link.name}
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Desktop Actions - Right Aligned (Hidden on small screens) */}
            {!user ? (
              <div className="hidden lg:flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#16A34A] transition-colors">Sign In</Link>
                <Link to="/signup" className="px-6 py-3 bg-[#16A34A] text-white text-sm font-black rounded-2xl shadow-lg shadow-[#16A34A]/20 hover:shadow-[#16A34A]/40 transition-all hover:-translate-y-0.5">Free Trial</Link>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className={`p-2.5 rounded-xl transition-all ${notificationsOpen ? 'bg-[#16A34A]/5 text-[#16A34A]' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-950 animate-pulse">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Inbox</span>
                        <button onClick={() => setNotificationsOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div key={n.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                              <div
                                onClick={() => setExpandedNotification(expandedNotification === n.id ? null : n.id)}
                                className={`p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative ${!n.isRead ? 'bg-brand-50/30 dark:bg-brand-500/5' : ''}`}
                              >
                                {!n.isRead && (
                                  <div className="absolute left-2 top-6 w-1 h-8 bg-brand-500 rounded-full"></div>
                                )}
                                <div className="pl-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm flex-1 ${!n.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedNotification === n.id ? 'rotate-90' : ''}`} />
                                  </div>
                                  {expandedNotification !== n.id && (
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">{n.message}</p>
                                  )}
                                  <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                                    {new Date(n.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {expandedNotification === n.id && (
                                <div className="px-5 pb-5 pl-7 bg-slate-50/50 dark:bg-slate-800/30">
                                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">{n.message}</p>
                                  {!n.isRead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(n.id);
                                        setExpandedNotification(null);
                                      }}
                                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Mark as Read
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center space-y-3">
                            <Bell className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto" />
                            <p className="text-sm font-bold text-slate-400">No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={toggleTheme} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full border border-slate-200 dark:border-slate-800 hover:border-[#16A34A] transition-all bg-white dark:bg-slate-900">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 hidden xl:block uppercase tracking-widest">{user.name.split(' ')[0]}</span>
                    <UserAvatar user={user} className="w-8 h-8" />
                  </button>
                  <div className="absolute top-full right-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-2 overflow-hidden">
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800">
                        <p className="text-xs font-bold text-[#16A34A] uppercase tracking-[0.2em] mb-1">Teacher Identity</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.name}</p>
                      </div>
                      <Link to="/settings" className="flex items-center gap-3 p-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <SettingsIcon className="w-4 h-4" /> Settings
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Header Layout (Matches UI Image) */}
            <div className="lg:hidden flex items-center justify-between w-full">
              {/* Left: Hamburger Menu */}
              <button
                onClick={toggleMenu}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm text-[#16A34A]"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Center: Logo (Supports Uploaded Branding) */}
              <Link to="/" className="flex items-center gap-2">
                {(theme === 'dark' && branding.siteLogoDark) || branding.siteLogo ? (
                  <img
                    src={theme === 'dark' && branding.siteLogoDark ? branding.siteLogoDark : branding.siteLogo}
                    alt={branding.siteName}
                    className="h-8 w-auto max-w-[120px] object-contain"
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center text-white">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                      {branding.siteName}
                    </span>
                  </>
                )}
              </Link>

              {/* Right: Notification & Profile Pill */}
              <div className="flex items-center gap-2">
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className={`p-2 rounded-xl transition-all relative ${notificationsOpen ? 'bg-brand-500 text-white' : 'text-slate-400'}`}
                    >
                      <Bell className="w-6 h-6" />
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-950 animate-pulse"></span>
                      )}
                    </button>

                    {/* Mobile Notification Popover */}
                    {notificationsOpen && (
                      <div className="fixed inset-x-4 top-20 z-50 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4 lg:hidden">
                        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                          <h3 className="font-black text-slate-900 dark:text-white tracking-tight">Notifications</h3>
                          <button onClick={() => setNotificationsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                          {notifications.length > 0 ? (
                            notifications.map(n => (
                              <div key={n.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                                <div
                                  onClick={() => setExpandedNotification(expandedNotification === n.id ? null : n.id)}
                                  className={`p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative ${!n.isRead ? 'bg-brand-50/30 dark:bg-brand-500/5' : ''}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm flex-1 ${!n.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedNotification === n.id ? 'rotate-90' : ''}`} />
                                  </div>
                                  {expandedNotification !== n.id && (
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">{n.message}</p>
                                  )}
                                </div>
                                {expandedNotification === n.id && (
                                  <div className="px-5 pb-5 bg-slate-50/50 dark:bg-slate-800/30">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">{n.message}</p>
                                    {!n.isRead && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsRead(n.id);
                                          setExpandedNotification(null);
                                        }}
                                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark as Read
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-10 text-center">
                              <p className="text-sm font-bold text-slate-400">No notifications yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={toggleTheme}
                  className="p-2 text-slate-400 hover:text-[#16A34A] transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                </button>

                {user ? (
                  <Link to="/settings" className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden xs:block">
                      {user.name.split(' ')[0]}
                    </span>
                    <UserAvatar user={user} className="w-8 h-8" />
                  </Link>
                ) : (
                  <Link to="/login" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400">
                    <UserIcon className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Refined Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-500">
            {/* Menu Header */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50 dark:border-slate-800">
              <Link to="/" onClick={toggleMenu} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center text-white font-black text-xs">T</div>
                <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">TeachAide</span>
              </Link>
              <button onClick={toggleMenu} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {!user && (
                <div className="space-y-2">
                  <p className="px-4 text-[10px] font-black text-[#16A34A] uppercase tracking-[0.3em] mb-4">Main Menu</p>
                  {navLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={toggleMenu}
                      className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${isActive(link.path) ? 'bg-[#16A34A]/5 text-[#16A34A]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}

              {user ? (
                <div className="space-y-6">
                  {/* User Profile Summary */}
                  <div className="flex items-center gap-4 p-4 bg-[#16A34A]/5 rounded-3xl border border-[#16A34A]/10">
                    <UserAvatar user={user} className="w-12 h-12 shadow-lg shadow-[#16A34A]/20" fallbackClassName="text-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-black text-slate-900 dark:text-white truncate leading-none mb-1">{user.name}</p>
                      <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-widest">{user.subscriptionPlan} Plan</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 mt-6">Workspace Area</p>
                    {authLinks.map(link => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={toggleMenu}
                        className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${isActive(link.path) ? 'bg-[#16A34A]/5 text-[#16A34A]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <link.icon className="w-5 h-5 opacity-40" />
                        <span>{link.name}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-50 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 dark:bg-red-950/20 text-red-500 font-black rounded-2xl transition-all hover:bg-red-100"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                  <Link to="/login" onClick={toggleMenu} className="block w-full text-center p-5 text-lg font-black text-slate-900 dark:text-white">Sign In</Link>
                  <Link to="/signup" onClick={toggleMenu} className="block w-full text-center p-5 bg-[#16A34A] text-white text-lg font-black rounded-2xl shadow-xl shadow-[#16A34A]/20">Get Started Free</Link>
                </div>
              )}
            </div>

            {/* Menu Footer */}
            <div className="mt-auto pt-6 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Powered by Advanced Pedagogy AI</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className={`flex-grow ${location.pathname === '/teacher-dashboard' ? 'dashboard-dark' : ''}`}>
        {children}
      </main>

      {/* Global Footer */}
      <footer className="bg-[#0F172A] text-slate-400 py-24 border-t border-slate-900 print:hidden relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#16A34A]/5 blur-[100px] rounded-full -mr-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 mb-20">
            {/* Logo/Identity Section */}
            <div className="col-span-1 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#16A34A] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#16A34A]/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="font-black text-2xl text-white tracking-tight">{branding.siteName}</span>
              </div>

              <p className="text-sm font-medium leading-relaxed max-w-xs">
                Empowering Nigerian teachers with AI tools to save time and improve education quality. Ministry compliant, curriculum aligned.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  `Trusted by ${branding.userCount > 1000 ? `${(branding.userCount / 1000).toFixed(0)}k+` : (branding.userCount || 0).toLocaleString()}+ Nigerian teachers`,
                  'Ministry-compliant lesson format',
                  'Dedicated Nigerian support team'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-bold text-white/90">
                    <CheckCircle className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#16A34A]/10 rounded-lg flex items-center justify-center text-[#16A34A]">
                  <Grid className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Product</h3>
              </div>
              <ul className="space-y-5 text-sm font-bold">
                <li>
                  <Link to="/generator" className="group flex items-center gap-2 hover:text-[#16A34A] transition-all">
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> Lesson Generator
                  </Link>
                </li>
                <li>
                  <Link to="/assessment" className="group flex items-center gap-2 hover:text-[#16A34A] transition-all">
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> Quiz Creator
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="group flex items-center gap-2 hover:text-[#16A34A] transition-all">
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#16A34A]/10 rounded-lg flex items-center justify-center text-[#16A34A]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Support</h3>
              </div>
              <ul className="space-y-5 text-sm font-bold">
                <li>
                  <Link to="/help" className="group flex items-center gap-2 hover:text-[#16A34A] transition-all">
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="group flex items-center gap-2 hover:text-[#16A34A] transition-all">
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="group flex items-center gap-2 hover:text-[#16A34A] transition-all">
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> Report Issue
                  </Link>
                </li>
              </ul>

              {/* Social Links Implemented precisely from UI */}
              <div className="flex items-center gap-4 pt-4">
                {[
                  { icon: Instagram, href: 'https://instagram.com/teachaide_ai' },
                  { icon: Whatsapp, href: 'https://whatsapp.com/channel/0029Vb6fNKRLNSaBPLVPTY1m' }
                ].map((social, i) => (
                  <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#16A34A]/20 hover:bg-[#16A34A] text-white rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95">
                    <social.icon className="w-5 h-5 shadow-sm" />
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#16A34A]/10 rounded-lg flex items-center justify-center text-[#16A34A]">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Contact</h3>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-black text-white tracking-wide">Lagos, Nigeria</p>
                <p className="text-sm font-bold hover:text-[#16A34A] cursor-pointer transition-colors">hello@teachaide.ng</p>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              &copy; {new Date().getFullYear()} {branding.siteName} . All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[#16A34A]"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Advanced Pedagogy AI</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;