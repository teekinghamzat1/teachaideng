import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { SystemSettings } from '../types';
import { SettingsIcon, Save, AlertTriangle } from '../components/Icons';

const AdminSettings: React.FC = () => {
    const [config, setConfig] = useState<SystemSettings>({ maintenanceMode: false, allowSignup: true, defaultModel: 'gemini-2.5-flash', maxTokens: 4096 });
    const [loading, setLoading] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testingSmtp, setTestingSmtp] = useState(false);

    useEffect(() => {
        db.admin.getSystemSettings().then(setConfig);
    }, []);

    const handleSave = async () => {
        setLoading(true);
        await db.admin.updateSystemSettings(config);
        setLoading(false);
        alert("System configuration updated.");
    };

    const handleTestSmtp = async () => {
        if (!testEmail) {
            alert('Please enter an email address');
            return;
        }

        setTestingSmtp(true);
        try {
            const response = await fetch('http://localhost:5001/api/admin/test-smtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${db.auth.getCurrentUser()?.token}`
                },
                body: JSON.stringify({ email: testEmail })
            });

            const data = await response.json();
            if (response.ok) {
                alert('✅ Test email sent successfully! Check your inbox.');
            } else {
                alert(`❌ Failed to send test email: ${data.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setTestingSmtp(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">System Configuration</h1>

            <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-8">

                {/* General Settings */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">General</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-medium text-slate-900 dark:text-slate-100">Maintenance Mode</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Disable access for non-admins.</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${config.maintenanceMode ? 'bg-brand-600' : 'bg-slate-200'}`}
                                role="switch"
                                aria-checked={config.maintenanceMode}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-medium text-slate-900">Allow New Signups</h3>
                                <p className="text-xs text-slate-500">Public registration toggle.</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, allowSignup: !config.allowSignup })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${config.allowSignup ? 'bg-brand-600' : 'bg-slate-200'}`}
                                role="switch"
                                aria-checked={config.allowSignup}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.allowSignup ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* SMTP Configuration */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">📧 Email Configuration (SMTP)</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
                        <p className="text-sm text-blue-800">
                            Configure your SMTP server to send payment receipts and notifications to users.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">SMTP Host</label>
                            <input
                                type="text"
                                value={config.smtpHost || ''}
                                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                                placeholder="smtp.gmail.com"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">SMTP Port</label>
                            <input
                                type="number"
                                value={config.smtpPort || 587}
                                onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                                placeholder="587"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">SMTP Username</label>
                            <input
                                type="text"
                                value={config.smtpUser || ''}
                                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                                placeholder="your-email@gmail.com"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">SMTP Password</label>
                            <input
                                type="password"
                                value={config.smtpPassword || ''}
                                onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                                placeholder="••••••••"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">From Email</label>
                            <input
                                type="email"
                                value={config.smtpFromEmail || ''}
                                onChange={(e) => setConfig({ ...config, smtpFromEmail: e.target.value })}
                                placeholder="noreply@teachaide.com"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">From Name</label>
                            <input
                                type="text"
                                value={config.smtpFromName || 'TeachAide AI'}
                                onChange={(e) => setConfig({ ...config, smtpFromName: e.target.value })}
                                placeholder="TeachAide AI"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Test SMTP */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">Test SMTP Configuration</h3>
                        <p className="text-xs text-blue-700 mb-3">Send a test email to verify your SMTP settings are working correctly.</p>
                        <div className="flex gap-2">
                                <input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="Enter email to receive test"
                                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <button
                                onClick={handleTestSmtp}
                                disabled={testingSmtp || !testEmail}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                {testingSmtp ? 'Sending...' : 'Send Test Email'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Config */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">AI Engine</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Default Model</label>
                            <select
                                value={config.defaultModel}
                                onChange={e => setConfig({ ...config, defaultModel: e.target.value })}
                                className="w-full rounded-lg border-slate-300 shadow-sm dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2.5 border"
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="gemini-pro">Gemini Pro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Tokens</label>
                            <input
                                type="number"
                                value={config.maxTokens}
                                onChange={e => setConfig({ ...config, maxTokens: Number(e.target.value) })}
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2.5 border"
                            />
                        </div>
                    </div>
                </div>

                {/* API Keys */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">API Keys</h2>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-700">Sensitive credentials should be managed via environment variables in production. This UI allows runtime overrides.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Google Gemini API Key</label>
                        <input
                            type="password"
                            className="w-full rounded-lg border-slate-300 shadow-sm dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2.5 border"
                            placeholder="sk-..."
                            defaultValue="************************"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        <SettingsIcon className="w-5 h-5 mr-2" />
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;