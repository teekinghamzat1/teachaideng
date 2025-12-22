import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, Sparkles, UserIcon, LogOut, FileText, Clipboard, Users, Calendar, SettingsIcon, WifiOff, Shield, Bell, Sun, Moon } from './Icons';
import { db } from '../database';
import { User } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [theme, setTheme] = useState<'light'|'dark'>(db.settings.get()?.theme || 'light');

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
        const sysSettings = await db.admin.getSystemSettings();
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
    { name: 'Dashboard', path: '/dashboard', icon: FileText },
    { name: 'History', path: '/history', icon: BookOpen },
    { name: 'Quiz', path: '/assessment', icon: Clipboard },
    { name: 'Classes', path: '/classes', icon: Users },
    { name: 'Timetable', path: '/timetable', icon: Calendar },
    ...(user?.isSchoolAdmin ? [{ name: 'School', path: '/school', icon: Users }] : []),
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
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
      <nav className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight">TeachAide<span className="text-brand-600">AI</span></span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.path)
                    ? 'text-brand-700 bg-brand-50 dark:bg-brand-900'
                    : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  {link.name}
                </Link>
              ))}

              {user && authLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${isActive(link.path)
                    ? 'text-brand-700 bg-brand-50 dark:bg-brand-900'
                    : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  {link.name}
                </Link>

              ))}

              {/* Notification Bell */}
              {user && (
                <div className="relative ml-2">
                  <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 text-slate-400 hover:text-brand-600 relative">
                    <Bell className="w-5 h-5" />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-2 z-50 border border-slate-100 dark:border-slate-700">
                      <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-semibold text-sm text-slate-800">Notifications</span>
                        <button onClick={() => setNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-xs text-slate-500 py-4">No new notifications</p>
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
                              className={`px-4 py-3 border-b border-slate-50 dark:border-slate-700 last:border-0 cursor-pointer transition-colors ${n.isRead ? 'bg-white dark:bg-slate-800 opacity-60' : 'bg-blue-50 dark:bg-slate-700 hover:bg-blue-100'}`}
                            >
                              <div className="flex justify-between items-start">
                                <p className={`text-sm ${n.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'} `}>{n.title}</p>
                                {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1"></span>}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Link */}
              {user && user.role === 'Admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${isActive('/admin')
                    ? 'text-purple-700 bg-purple-50 dark:bg-purple-900'
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <Shield className="w-4 h-4 mr-1.5" />
                  Admin
                </Link>
              )}

              {/* Theme Toggle */}
              <div className="ml-3 flex items-center">
                <button onClick={toggleTheme} title="Toggle theme" className="p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {user ? (
                <>
                  <div className="flex items-center gap-4 border-l border-slate-200 pl-4 ml-2">
                    <span className="text-sm font-medium text-slate-700 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-slate-400" />
                      {user.name}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-600 hover:text-brand-600"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              <Link
                to={user ? "/generator" : "/login"}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {user ? 'New Lesson' : 'Get Started'}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
              >
                {isMobileMenuOpen ? <X className="block w-6 h-6" /> : <Menu className="block w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {
          isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path)
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}

                {user ? (
                  <>
                    {authLinks.map(link => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive(link.path)
                          ? 'text-brand-700 bg-brand-50'
                          : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
                          }`}
                      >
                        <link.icon className="w-5 h-5 mr-3" />
                        {link.name}
                      </Link>
                    ))}
                    {user.role === 'Admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive('/admin')
                          ? 'text-purple-700 bg-purple-50'
                          : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                      >
                        <Shield className="w-5 h-5 mr-3" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="px-3 py-2 border-t border-slate-100 mt-2">
                      <p className="text-sm font-medium text-slate-500 mb-2">Signed in as {user.name}</p>
                      <button
                        onClick={handleLogout}
                        className="flex items-center text-red-600 font-medium text-sm"
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-3 py-2 border-t border-slate-100 mt-2 space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-base font-medium text-slate-600 hover:text-brand-600"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-base font-medium text-brand-600 hover:text-brand-700"
                    >
                      Create Account
                    </Link>
                  </div>
                )}

                {/* Mobile Theme Toggle */}
                <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-700 mt-2 flex items-center justify-center">
                  <button onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600">
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span className="text-sm">Toggle theme</span>
                  </button>
                </div>

                <Link
                  to={user ? "/generator" : "/login"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-5 py-3 rounded-md font-medium text-white bg-brand-600 hover:bg-brand-700 mt-4 shadow-md"
                >
                  {user ? 'Create New Lesson' : 'Get Started Now'}
                </Link>
              </div>
            </div>
          )
        }
      </nav >

      {/* Main Content */}
      < main className="flex-grow print:w-full" >
        {children}
      </main >

      {/* Footer */}
      < footer className="bg-slate-900 text-slate-300 print:hidden" >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-white">TeachAide<span className="text-brand-500">AI</span></span>
              </div>
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
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Contact</h3>
              <p className="text-sm">Lagos, Nigeria</p>
              <p className="text-sm mt-2">hello@teachaide.ng</p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} TeachAide AI. All rights reserved.
          </div>
        </div>
      </footer >
    </div >
  );
};

export default Layout;