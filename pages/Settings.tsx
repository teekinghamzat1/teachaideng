import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { AppSettings } from '../types';
import { SettingsIcon, Save } from '../components/Icons';
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
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                <SettingsIcon className="w-8 h-8 mr-3 text-brand-600" />
                Settings
            </h1>

            <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
                <div className="border-b px-6 py-4 border-slate-200 dark:border-slate-700">
                    <nav className="flex space-x-4">
                        <button onClick={() => setTab('profile')} className={`px - 3 py - 2 rounded ${tab === 'profile' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 dark:text-slate-300'} `}>My Profile</button>
                        <button onClick={() => setTab('appearance')} className={`px - 3 py - 2 rounded ${tab === 'appearance' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 dark:text-slate-300'} `}>Appearance</button>
                        <button onClick={() => setTab('about')} className={`px - 3 py - 2 rounded ${tab === 'about' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 dark:text-slate-300'} `}>About App</button>
                    </nav>
                </div>

                <div className="p-6 divide-y divide-slate-200 dark:divide-slate-700">
                    {tab === 'profile' && (
                        <div className="pb-6">
                            <MyProfile />
                        </div>
                    )}

                    {tab === 'appearance' && (
                        <div className="p-0 pt-6">
                            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Appearance</h2>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Theme</label>
                                    <select
                                        value={settings.theme}
                                        onChange={(e) => {
                                            const newSettings = { ...settings, theme: e.target.value as any };
                                            setSettings(newSettings);
                                            // apply immediately
                                            try { db.settings.save(newSettings); } catch (e) { /* ignore */ }
                                        }}
                                        className="block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2"
                                    >
                                        <option value="light">Light Mode</option>
                                        <option value="dark">Dark Mode (Beta)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Text Size</label>
                                    <select
                                        value={settings.textSize}
                                        onChange={(e) => {
                                            const newSettings = { ...settings, textSize: e.target.value as any };
                                            setSettings(newSettings);
                                            try { db.settings.save(newSettings); } catch (e) { /* ignore */ }
                                        }}
                                        className="block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2"
                                    >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'about' && (
                        <div className="p-0 pt-6">
                            <h2 className="text-lg font-medium text-slate-900">About App</h2>
                            <div className="mt-2 text-sm text-slate-500">
                                <p>Version: 1.2.0</p>
                                <p>{branding.siteName} is designed to help Nigerian educators.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end">
                    {tab === 'appearance' && (
                        <button onClick={handleSave} className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;