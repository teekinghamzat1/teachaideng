import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { SystemSettings } from '../types';
import { SettingsIcon, Save, AlertTriangle, Zap, Building, UserIcon, Shield, CreditCard } from '../components/Icons';
import { showAlert } from '../utils/alerts';

const AdminSettings: React.FC = () => {
    const [config, setConfig] = useState<SystemSettings>({
        maintenanceMode: false,
        allowSignup: true,
        defaultModel: 'gemini-2.5-flash',
        maxTokens: 4096,
        smtpPort: 587,
        lessonGenerationCost: 600,
        assessmentGenerationCost: 200,
        port: 5000,
        nodeEnv: 'development',
        siteName: 'TeachAide AI',
        siteTagline: 'Lesson Notes in Seconds',
        siteLogo: '',
        siteLogoDark: '',
        siteFavicon: '',
        brandPrimaryColor: '#1F4FD8',
        brandSecondaryColor: '#16A34A',
        brandAccentColor: '#FBBF24',
        brandFont: 'Inter',
        freePlanLessonLimit: 10,
        proPlanLessonLimit: 100,
        schoolPlanLessonLimit: 999999
    });
    const [loading, setLoading] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingLogoDark, setUploadingLogoDark] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);

    useEffect(() => {
        db.admin.getSystemSettings().then(data => {
            if (data) setConfig(data);
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await db.admin.updateSystemSettings(config);
            showAlert.success("Settings Saved");
        } catch (err: any) {
            showAlert.error("Error", `Failed to update settings: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTestSmtp = async () => {
        if (!testEmail) {
            showAlert.warning('Email Required', 'Please enter an email address');
            return;
        }

        setTestingSmtp(true);
        try {
            const response = await fetch('/api/admin/test-smtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${db.adminAuth.getCurrentUser()?.token}`
                },
                body: JSON.stringify({ email: testEmail })
            });

            const data = await response.json();
            if (response.ok) {
                showAlert.success('Test Email Sent', 'Check your inbox for a message from TeachAide.');
            } else {
                showAlert.error('SMTP Error', data.message || 'Unknown error');
            }
        } catch (error: any) {
            showAlert.error('Connection Error', error.message);
        } finally {
            setTestingSmtp(false);
        }
    };

    const handleImageUpload = async (file: File, field: 'siteLogo' | 'siteLogoDark' | 'siteFavicon') => {
        const setUploading = field === 'siteLogo' ? setUploadingLogo : field === 'siteLogoDark' ? setUploadingLogoDark : setUploadingFavicon;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file); // Changed from 'file' to 'image'

            const response = await fetch('/api/upload/image', { // Changed from '/api/upload' to '/api/upload/image'
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${db.adminAuth.getCurrentUser()?.token}`
                },
                body: formData
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setConfig({ ...config, [field]: data.data.url });
                showAlert.success('Upload Successful', 'Image uploaded to Cloudinary');
            } else {
                showAlert.error('Upload Failed', data.message || 'Failed to upload image');
            }
        } catch (error: any) {
            showAlert.error('Upload Error', error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">System Configuration</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage environment variables and global application settings.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none disabled:opacity-50"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>

            <div className="space-y-8">
                {/* General Settings */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
                            <SettingsIcon className="w-5 h-5 mr-2 text-brand-500" />
                            General & Registration
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Maintenance Mode</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Restricts app access to administratorsOnly.</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${config.maintenanceMode ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${config.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Allow New Signups</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Enable or disable public user registration.</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, allowSignup: !config.allowSignup })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${config.allowSignup ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${config.allowSignup ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Site Branding & Customization */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">🎨 Site Branding & Identity</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customize your site's name, logo, colors, and typography</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site Name</label>
                                <input
                                    type="text"
                                    value={config.siteName || ''}
                                    onChange={e => setConfig({ ...config, siteName: e.target.value })}
                                    placeholder="TeachAide AI"
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
                                <input
                                    type="text"
                                    value={config.siteTagline || ''}
                                    onChange={e => setConfig({ ...config, siteTagline: e.target.value })}
                                    placeholder="Lesson Notes in Seconds"
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo (Light Mode)</label>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'siteLogo')}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className={`w-full flex items-center justify-center px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploadingLogo
                                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        {uploadingLogo ? 'Uploading...' : '📤 Upload Image'}
                                    </label>
                                    <input
                                        type="text"
                                        value={config.siteLogo || ''}
                                        onChange={e => setConfig({ ...config, siteLogo: e.target.value })}
                                        placeholder="Or paste image URL"
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border text-sm"
                                    />
                                    {config.siteLogo && (
                                        <img src={config.siteLogo} alt="Logo preview" className="h-12 w-auto border border-slate-200 dark:border-slate-600 rounded p-1" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo (Dark Mode) <span className="text-xs text-slate-400">Optional</span></label>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'siteLogoDark')}
                                        className="hidden"
                                        id="logo-dark-upload"
                                    />
                                    <label
                                        htmlFor="logo-dark-upload"
                                        className={`w-full flex items-center justify-center px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploadingLogoDark
                                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        {uploadingLogoDark ? 'Uploading...' : '📤 Upload Image'}
                                    </label>
                                    <input
                                        type="text"
                                        value={config.siteLogoDark || ''}
                                        onChange={e => setConfig({ ...config, siteLogoDark: e.target.value })}
                                        placeholder="Or paste image URL"
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border text-sm"
                                    />
                                    {config.siteLogoDark && (
                                        <img src={config.siteLogoDark} alt="Dark logo preview" className="h-12 w-auto border border-slate-200 dark:border-slate-600 rounded p-1 bg-slate-800" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Favicon</label>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'siteFavicon')}
                                        className="hidden"
                                        id="favicon-upload"
                                    />
                                    <label
                                        htmlFor="favicon-upload"
                                        className={`w-full flex items-center justify-center px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploadingFavicon
                                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        {uploadingFavicon ? 'Uploading...' : '📤 Upload Image'}
                                    </label>
                                    <input
                                        type="text"
                                        value={config.siteFavicon || ''}
                                        onChange={e => setConfig({ ...config, siteFavicon: e.target.value })}
                                        placeholder="Or paste image URL"
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border text-sm"
                                    />
                                    {config.siteFavicon && (
                                        <img src={config.siteFavicon} alt="Favicon preview" className="h-8 w-8 border border-slate-200 dark:border-slate-600 rounded" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Brand Color System</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Color (Authority & Trust)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={config.brandPrimaryColor || '#1F4FD8'}
                                            onChange={e => setConfig({ ...config, brandPrimaryColor: e.target.value })}
                                            className="h-10 w-16 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={config.brandPrimaryColor || '#1F4FD8'}
                                            onChange={e => setConfig({ ...config, brandPrimaryColor: e.target.value })}
                                            className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Secondary Color (Growth & Learning)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={config.brandSecondaryColor || '#16A34A'}
                                            onChange={e => setConfig({ ...config, brandSecondaryColor: e.target.value })}
                                            className="h-10 w-16 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={config.brandSecondaryColor || '#16A34A'}
                                            onChange={e => setConfig({ ...config, brandSecondaryColor: e.target.value })}
                                            className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Accent Color (Insight & Ideas)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={config.brandAccentColor || '#FBBF24'}
                                            onChange={e => setConfig({ ...config, brandAccentColor: e.target.value })}
                                            className="h-10 w-16 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={config.brandAccentColor || '#FBBF24'}
                                            onChange={e => setConfig({ ...config, brandAccentColor: e.target.value })}
                                            className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Typography</h3>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Font</label>
                                <select
                                    value={config.brandFont || 'Inter'}
                                    onChange={e => setConfig({ ...config, brandFont: e.target.value })}
                                    className="w-full md:w-1/2 rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                >
                                    <option value="Inter">Inter (Recommended)</option>
                                    <option value="Manrope">Manrope</option>
                                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                                    <option value="DM Sans">DM Sans</option>
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose a clean, screen-optimized font for readability</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Configuration */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">🤖 AI Engine (Gemini)</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Model</label>
                                <select
                                    value={config.defaultModel}
                                    onChange={e => setConfig({ ...config, defaultModel: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                >
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
                                    <option value="gemini-pro">Gemini Pro (Classic)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Tokens</label>
                                <input
                                    type="number"
                                    value={config.maxTokens}
                                    onChange={e => setConfig({ ...config, maxTokens: Number(e.target.value) })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Google Gemini API Key</label>
                            <input
                                type="password"
                                value={config.googleGeminiApiKey || ''}
                                onChange={e => setConfig({ ...config, googleGeminiApiKey: e.target.value })}
                                placeholder="Enter API Key"
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                            />
                        </div>
                    </div>
                </section>

                {/* Email (SMTP) Configuration */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">📧 Email Configuration (SMTP)</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SMTP Host</label>
                                <input
                                    type="text"
                                    value={config.smtpHost || ''}
                                    onChange={e => setConfig({ ...config, smtpHost: e.target.value })}
                                    placeholder="e.g. smtp.gmail.com"
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SMTP Port</label>
                                <input
                                    type="number"
                                    value={config.smtpPort}
                                    onChange={e => setConfig({ ...config, smtpPort: Number(e.target.value) })}
                                    placeholder="587"
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SMTP Username</label>
                                <input
                                    type="text"
                                    value={config.smtpUser || ''}
                                    onChange={e => setConfig({ ...config, smtpUser: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SMTP Password</label>
                                <input
                                    type="password"
                                    value={config.smtpPassword || ''}
                                    onChange={e => setConfig({ ...config, smtpPassword: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From Email</label>
                                <input
                                    type="email"
                                    value={config.smtpFromEmail || ''}
                                    onChange={e => setConfig({ ...config, smtpFromEmail: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-brand-900 dark:text-brand-300">Test SMTP Connection</h4>
                                <p className="text-xs text-brand-700 dark:text-brand-400">Enter an email to send a test message using these settings.</p>
                            </div>
                            <div className="flex gap-2 min-w-[300px]">
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="flex-1 rounded-lg border-brand-200 dark:border-brand-700 dark:bg-slate-800 dark:text-white text-sm p-2 border"
                                />
                                <button
                                    onClick={handleTestSmtp}
                                    disabled={testingSmtp || !testEmail}
                                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50"
                                >
                                    {testingSmtp ? 'Sending...' : 'Send Test'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cloudinary Configuration */}
                    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">☁️ Cloudinary (Storage)</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cloud Name</label>
                                <input
                                    type="text"
                                    value={config.cloudinaryCloudName || ''}
                                    onChange={e => setConfig({ ...config, cloudinaryCloudName: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
                                <input
                                    type="password"
                                    value={config.cloudinaryApiKey || ''}
                                    onChange={e => setConfig({ ...config, cloudinaryApiKey: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Secret</label>
                                <input
                                    type="password"
                                    value={config.cloudinaryApiSecret || ''}
                                    onChange={e => setConfig({ ...config, cloudinaryApiSecret: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Paystack Configuration */}
                    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">💳 Paystack (Payments)</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Public Key</label>
                                <input
                                    type="text"
                                    value={config.paystackPublicKey || ''}
                                    onChange={e => setConfig({ ...config, paystackPublicKey: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Secret Key</label>
                                <input
                                    type="password"
                                    value={config.paystackSecretKey || ''}
                                    onChange={e => setConfig({ ...config, paystackSecretKey: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Security Configuration */}
                    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">🔒 Security (JWT)</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">JWT Secret</label>
                                <input
                                    type="password"
                                    value={config.jwtSecret || ''}
                                    onChange={e => setConfig({ ...config, jwtSecret: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">JWT Expiration (e.g. 30d, 24h)</label>
                                <input
                                    type="text"
                                    value={config.jwtExpire || ''}
                                    onChange={e => setConfig({ ...config, jwtExpire: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Infrastructure Configuration */}
                    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">🏗️ Infrastructure</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Server Port</label>
                                <input
                                    type="number"
                                    value={config.port}
                                    onChange={e => setConfig({ ...config, port: Number(e.target.value) })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Node Environment</label>
                                <select
                                    value={config.nodeEnv}
                                    onChange={e => setConfig({ ...config, nodeEnv: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                                >
                                    <option value="development">Development</option>
                                    <option value="production">Production</option>
                                    <option value="test">Testing</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Database URL (Risky: Requires Restart)</label>
                                <input
                                    type="password"
                                    value={config.databaseUrl || ''}
                                    onChange={e => setConfig({ ...config, databaseUrl: e.target.value })}
                                    placeholder="file:./dev.db or postgresql://..."
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border text-xs"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Plan Limits Section */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-12">
                    <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                                <CreditCard className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Plan Usage Limits</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Define monthly generation quotas for each subscription tier
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-12">
                        {/* Free Plan Row */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 italic">Free Plan Configuration</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Plan Name (Display)</label>
                                    <input
                                        type="text"
                                        value={config.freePlanName || 'Free Starter'}
                                        onChange={(e) => setConfig({ ...config, freePlanName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Price (Fixed)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            disabled
                                            value={0}
                                            className="w-full pl-8 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₦</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Billing Cycle</label>
                                    <select
                                        value={config.freePlanDuration || 'month'}
                                        onChange={(e) => setConfig({ ...config, freePlanDuration: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    >
                                        <option value="week">Weekly</option>
                                        <option value="month">Monthly</option>
                                        <option value="term">Per Term</option>
                                        <option value="year">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Lesson Notes / Mo</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={config.freePlanLessonLimit || 10}
                                            onChange={(e) => setConfig({ ...config, freePlanLessonLimit: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs uppercase font-bold">Qty</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pro Plan Row */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                                    <Zap className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 italic">Pro Plan Configuration</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-brand-50/20 dark:bg-brand-900/5 p-5 rounded-xl border border-brand-100/50 dark:border-brand-900/20">
                                <div>
                                    <label className="block text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2">Plan Name (Display)</label>
                                    <input
                                        type="text"
                                        value={config.proPlanName || 'Professional'}
                                        onChange={(e) => setConfig({ ...config, proPlanName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2">Price (₦)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={config.proPlanPrice || 2500}
                                            onChange={(e) => setConfig({ ...config, proPlanPrice: parseInt(e.target.value) || 0 })}
                                            className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded-lg text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 font-bold">₦</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2">Billing Cycle</label>
                                    <select
                                        value={config.proPlanDuration || 'month'}
                                        onChange={(e) => setConfig({ ...config, proPlanDuration: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    >
                                        <option value="week">Weekly</option>
                                        <option value="month">Monthly</option>
                                        <option value="term">Per Term</option>
                                        <option value="year">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2">Lesson Notes / Mo</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={config.proPlanLessonLimit || 100}
                                            onChange={(e) => setConfig({ ...config, proPlanLessonLimit: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded-lg text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 text-xs uppercase font-bold">Qty</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* School Plan Row */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 italic">School Plan Configuration</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-emerald-50/20 dark:bg-emerald-900/5 p-5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                                <div>
                                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Plan Name (Display)</label>
                                    <input
                                        type="text"
                                        value={config.schoolPlanName || 'School License'}
                                        onChange={(e) => setConfig({ ...config, schoolPlanName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Price (₦)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={config.schoolPlanPrice || 20000}
                                            onChange={(e) => setConfig({ ...config, schoolPlanPrice: parseInt(e.target.value) || 0 })}
                                            className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">₦</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Billing Cycle</label>
                                    <select
                                        value={config.schoolPlanDuration || 'term'}
                                        onChange={(e) => setConfig({ ...config, schoolPlanDuration: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    >
                                        <option value="week">Weekly</option>
                                        <option value="month">Monthly</option>
                                        <option value="term">Per Term</option>
                                        <option value="year">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Lesson Notes / Mo</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={config.schoolPlanLessonLimit || 999999}
                                            onChange={(e) => setConfig({ ...config, schoolPlanLessonLimit: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs uppercase font-bold">Qty</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-5 bg-brand-50/50 dark:bg-slate-900/80 border border-brand-100 dark:border-slate-700 rounded-2xl flex items-start gap-4">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-1">System Integrity Policy</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Limits are applied globally to all accounts within the tier. Changes take effect on the user's next subscription cycle reset. Note: setting zero enables unrestricted internal access for testing only.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Floating Save Button (FAB) */}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`fixed bottom-8 right-8 p-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-2xl shadow-brand-500/40 transition-all transform hover:scale-110 active:scale-95 z-50 flex items-center justify-center ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
                    title="Save Configuration"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <Save className="w-6 h-6" />
                    )}
                </button>

                <div className="h-24"></div> {/* Spacer to ensure content isn't hidden behind FAB */}
            </div>
        </div>
    );
};

export default AdminSettings;