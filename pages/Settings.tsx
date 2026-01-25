import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { AppSettings } from '../types';
import { SettingsIcon, Save, User, Sun, Info, ChevronRight, Moon, Shield, Trash, ChevronDown } from '../components/Icons';
import MyProfile from './MyProfile';
import { showAlert } from '../utils/alerts';
import { useBranding } from '../contexts/BrandingContext';

const Settings: React.FC = () => {
    const branding = useBranding();
    const [settings, setSettings] = useState<AppSettings>({ theme: 'light', textSize: 'medium' });
    const user = db.auth.getCurrentUser();
    const [tab, setTab] = useState<'profile' | 'appearance' | 'about'>('profile');

    useEffect(() => {
        setSettings(db.settings.get());
    }, []);

    const handleSave = () => {
        db.settings.save(settings);
        showAlert.success("Settings Saved");
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 transition-colors duration-300 pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">
                {/* Page Title */}
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-700">
                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                        <SettingsIcon className="w-6 h-6 text-[#16A34A]" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Navigation Sidebar / Mobile Tabs */}
                    <div className="lg:col-span-4 flex overflow-x-auto lg:flex-col gap-2 pb-4 lg:pb-0 scrollbar-hide">
                        {[
                            { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, desc: 'Personal' },
                            { id: 'appearance', label: 'Appearance', icon: <Sun className="w-5 h-5" />, desc: 'Themes' },
                            { id: 'about', label: 'About', icon: <Info className="w-5 h-5" />, desc: 'App info' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id as any)}
                                className={`flex-shrink-0 lg:w-full group px-5 sm:px-6 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] flex items-center justify-between transition-all duration-300 border ${tab === t.id
                                    ? 'bg-[#16A34A] text-white border-transparent shadow-xl shadow-[#16A34A]/20 scale-[1.02]'
                                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-[#16A34A] hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${tab === t.id ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800 text-[#16A34A]'}`}>
                                        {t.icon}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-xs sm:text-sm">{t.label}</p>
                                        <p className={`hidden lg:block text-[10px] uppercase tracking-widest font-bold ${tab === t.id ? 'text-white/60' : 'text-slate-400'}`}>{t.desc}</p>
                                    </div>
                                </div>
                                <ChevronRight className={`hidden lg:block w-5 h-5 transition-transform ${tab === t.id ? 'translate-x-1' : 'opacity-0'}`} />
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-8">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden min-h-[500px]">
                            <div className="p-8 sm:p-12">
                                {tab === 'profile' && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                        <MyProfile />
                                    </div>
                                )}

                                {tab === 'appearance' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#16A34A]/10 rounded-xl flex items-center justify-center text-[#16A34A]">
                                                    <Sun className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Display & Theme</h3>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Color Mode</label>
                                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                                        <button
                                                            onClick={() => {
                                                                const newSettings = { ...settings, theme: 'light' as const };
                                                                setSettings(newSettings);
                                                                try { db.settings.save(newSettings); } catch (e) { }
                                                            }}
                                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${settings.theme === 'light' ? 'bg-[#16A34A] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                        >
                                                            <Sun className="w-4 h-4" /> Light
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newSettings = { ...settings, theme: 'dark' as const };
                                                                setSettings(newSettings);
                                                                try { db.settings.save(newSettings); } catch (e) { }
                                                            }}
                                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${settings.theme === 'dark' ? 'bg-[#16A34A] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                        >
                                                            <Moon className="w-4 h-4" /> Dark
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Text Scaling</label>
                                                    <div className="relative">
                                                        <select
                                                            value={settings.textSize}
                                                            onChange={(e) => {
                                                                const newSettings = { ...settings, textSize: e.target.value as any };
                                                                setSettings(newSettings);
                                                                try { db.settings.save(newSettings); } catch (e) { }
                                                            }}
                                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold appearance-none outline-none transition-all"
                                                        >
                                                            <option value="small">Small (Compact)</option>
                                                            <option value="medium">Medium (Default)</option>
                                                            <option value="large">Large (Accessible)</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50 flex justify-end">
                                            <button
                                                onClick={handleSave}
                                                className="px-10 py-4 bg-[#16A34A] text-white font-black rounded-2xl shadow-xl shadow-[#16A34A]/20 hover:shadow-[#16A34A]/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
                                            >
                                                <Save className="w-5 h-5" /> Save Appearance
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {tab === 'about' && (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="w-24 h-24 bg-[#16A34A]/10 rounded-[2.5rem] flex items-center justify-center text-[#16A34A]">
                                            <Info className="w-12 h-12" />
                                        </div>
                                        <div className="text-center space-y-4">
                                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{branding.siteName}</h3>
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">Version 1.2.0</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                <span className="text-slate-400 font-bold text-xs">Production Build</span>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto leading-relaxed text-sm">Empowering Nigerian educators with Advanced Pedagogy AI tools to transform teaching and learning outcomes.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-[#16A34A] shadow-sm">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                                                    <p className="text-slate-900 dark:text-white font-black text-sm mt-1">Certified Secure</p>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-[#16A34A] shadow-sm">
                                                    <Trash className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Storage</p>
                                                    <p className="text-slate-900 dark:text-white font-black text-sm mt-1">Local & Encrypted</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;