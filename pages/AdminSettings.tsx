import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { SystemSettings } from '../types';
import { SettingsIcon, Save, AlertTriangle, Zap, Building, UserIcon, Shield, CreditCard, Activity, Bell } from '../components/Icons';
import { showAlert } from '../utils/alerts';

const AdminSettings: React.FC = () => {
    // Immediate check for authorization
    const currentUser = db.adminAuth.getCurrentUser();
    const isSuperAdmin = currentUser?.role?.toLowerCase() === 'superadmin';

    if (!currentUser || !['Admin', 'SuperAdmin', 'admin', 'superadmin'].includes(currentUser.role) || currentUser.isSchoolAdmin) {
        return <div className="p-8 text-center text-slate-500">Access Denied: Global Admin privileges required.</div>;
    }

    const [config, setConfig] = useState<SystemSettings>({
        maintenanceMode: false,
        allowSignup: true,
        defaultModel: 'gemini-1.5-flash',
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
        schoolPlanLessonLimit: 999999,
        googleGeminiApiKey: '',
        smtpHost: '',
        smtpUser: '',
        smtpPassword: '',
        smtpFromEmail: '',
        smtpFromName: '',
        cloudinaryCloudName: '',
        cloudinaryApiKey: '',
        cloudinaryApiSecret: '',
        paystackPublicKey: '',
        paystackSecretKey: '',
        jwtSecret: '',
        jwtExpire: '30d',
        databaseUrl: '',
        freePlanName: 'Free',
        freePlanPrice: 0,
        proPlanName: 'Pro Plan',
        proPlanPrice: 5000,
        schoolPlanName: 'School License',
        schoolPlanPrice: 50000
    });

    const [loading, setLoading] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [activeSection, setActiveSection] = useState('general');

    useEffect(() => {
        db.admin.getSystemSettings().then(data => {
            if (data) setConfig(prev => ({ ...prev, ...data }));
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await db.admin.updateSystemSettings(config);
            showAlert.success("Settings Saved", "All configurations updated and synced to .env");
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
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${db.adminAuth.getCurrentUser()?.token}` },
                body: formData
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setConfig({ ...config, [field]: data.data.url });
                showAlert.success('Upload Successful');
            }
        } catch (error: any) {
            showAlert.error('Upload Error', error.message);
        } finally {
            setUploadingLogo(false);
        }
    };

    const sections = [
        { id: 'general', name: 'General', icon: SettingsIcon },
        { id: 'branding', name: 'Branding', icon: Zap },
        { id: 'ai', name: 'AI Engine', icon: Shield },
        { id: 'billing', name: 'Plans & Billing', icon: CreditCard },
        { id: 'limits', name: 'Usage Limits', icon: Activity },
        { id: 'services', name: 'Services & Keys', icon: Building },
        { id: 'email', name: 'Email (SMTP)', icon: Bell },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="md:w-64 space-y-1">
                    <h2 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Settings</h2>
                    {sections.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === s.id
                                ? 'bg-brand-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            <s.icon className="w-5 h-5 mr-3" />
                            {s.name}
                        </button>
                    ))}

                    <div className="pt-8 px-4">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 min-h-[600px]">
                    {activeSection === 'general' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                                <SettingsIcon className="w-6 h-6 mr-3 text-brand-500" />
                                General Settings
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Maintenance Mode</h3>
                                        <button
                                            onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                                            className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors ${config.maintenanceMode ? 'bg-red-500' : 'bg-slate-200'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${config.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">Enable to restrict access to the app for non-admins.</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Allow Registration</h3>
                                        <button
                                            onClick={() => setConfig({ ...config, allowSignup: !config.allowSignup })}
                                            className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors ${config.allowSignup ? 'bg-brand-600' : 'bg-slate-200'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${config.allowSignup ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">Public user registration toggle.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Environment</label>
                                    <select
                                        value={config.nodeEnv}
                                        onChange={e => setConfig({ ...config, nodeEnv: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                    >
                                        <option value="development">Development</option>
                                        <option value="production">Production</option>
                                        <option value="test">Test</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Server Port</label>
                                    <input
                                        type="number"
                                        value={config.port}
                                        onChange={e => setConfig({ ...config, port: Number(e.target.value) })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'branding' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                                <Zap className="w-6 h-6 mr-3 text-amber-500" />
                                Branding & Identity
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">App Name</label>
                                        <input
                                            value={config.siteName}
                                            onChange={e => setConfig({ ...config, siteName: e.target.value })}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
                                        <input
                                            value={config.siteTagline}
                                            onChange={e => setConfig({ ...config, siteTagline: e.target.value })}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Color</label>
                                            <div className="flex gap-2">
                                                <input type="color" value={config.brandPrimaryColor} onChange={e => setConfig({ ...config, brandPrimaryColor: e.target.value })} className="w-10 h-10 rounded border" />
                                                <input value={config.brandPrimaryColor} onChange={e => setConfig({ ...config, brandPrimaryColor: e.target.value })} className="flex-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-sm text-slate-900 dark:text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Font Family</label>
                                        <select
                                            value={config.brandFont}
                                            onChange={e => setConfig({ ...config, brandFont: e.target.value })}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                        >
                                            <option value="Inter">Inter</option>
                                            <option value="Outfit">Outfit</option>
                                            <option value="Plus Jakarta Sans">Plus Jakarta</option>
                                            <option value="Roboto">Roboto</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'ai' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                                <Shield className="w-6 h-6 mr-3 text-blue-500" />
                                AI Engine Intelligence
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">AI Model Strategy</label>
                                    <select
                                        value={config.defaultModel}
                                        onChange={e => setConfig({ ...config, defaultModel: e.target.value })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                    >
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast/Cheap)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Smarter)</option>
                                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Advanced)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Response Limit (Max Tokens)</label>
                                    <input
                                        type="number"
                                        value={config.maxTokens}
                                        onChange={e => setConfig({ ...config, maxTokens: Number(e.target.value) })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Lesson Generation Cost (Tokens)</label>
                                    <input
                                        type="number"
                                        value={config.lessonGenerationCost}
                                        onChange={e => setConfig({ ...config, lessonGenerationCost: Number(e.target.value) })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Assessment Cost (Tokens)</label>
                                    <input
                                        type="number"
                                        value={config.assessmentGenerationCost}
                                        onChange={e => setConfig({ ...config, assessmentGenerationCost: Number(e.target.value) })}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-2.5 border text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'billing' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                                <CreditCard className="w-6 h-6 mr-3 text-brand-500" />
                                Plans & Pricing
                            </h2>
                            <div className="space-y-8">
                                {/* Free Plan */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                                        <span className="w-2 h-6 bg-slate-400 rounded-full mr-3" />
                                        Free Tier
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Display Name</label>
                                            <input value={config.freePlanName} onChange={e => setConfig({ ...config, freePlanName: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Monthly Price (₦)</label>
                                            <input type="number" readOnly value={0} className="w-full mt-1 rounded-lg border bg-slate-100 dark:bg-slate-800 p-2 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Pro Plan */}
                                <div className="p-6 bg-brand-50/50 dark:bg-brand-900/10 rounded-2xl border border-brand-100 dark:border-brand-900/30">
                                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                                        <span className="w-2 h-6 bg-brand-500 rounded-full mr-3" />
                                        Pro Plan
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Display Name</label>
                                            <input value={config.proPlanName} onChange={e => setConfig({ ...config, proPlanName: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Monthly Price (₦)</label>
                                            <input type="number" value={config.proPlanPrice} onChange={e => setConfig({ ...config, proPlanPrice: Number(e.target.value) })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Duration Label</label>
                                            <input placeholder="per month" value={config.proPlanDuration} onChange={e => setConfig({ ...config, proPlanDuration: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* School Plan */}
                                <div className="p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                                        <span className="w-2 h-6 bg-purple-500 rounded-full mr-3" />
                                        School License
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Display Name</label>
                                            <input value={config.schoolPlanName} onChange={e => setConfig({ ...config, schoolPlanName: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Annual Price (₦)</label>
                                            <input type="number" value={config.schoolPlanPrice} onChange={e => setConfig({ ...config, schoolPlanPrice: Number(e.target.value) })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Duration Label</label>
                                            <input placeholder="per year" value={config.schoolPlanDuration} onChange={e => setConfig({ ...config, schoolPlanDuration: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'limits' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                                <Activity className="w-6 h-6 mr-3 text-green-500" />
                                Monthly Lesson Allowances
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border dark:border-slate-700">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Free Plan</label>
                                        <div className="flex items-end gap-2 mt-1">
                                            <input type="number" value={config.freePlanLessonLimit} onChange={e => setConfig({ ...config, freePlanLessonLimit: Number(e.target.value) })} className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-2xl font-bold text-slate-700 dark:text-white" />
                                            <span className="text-sm text-slate-500 mb-2">/mo</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-xl border border-brand-100 dark:border-brand-900/30">
                                        <label className="text-xs font-bold text-brand-600 uppercase">Pro Plan</label>
                                        <div className="flex items-end gap-2 mt-1">
                                            <input type="number" value={config.proPlanLessonLimit} onChange={e => setConfig({ ...config, proPlanLessonLimit: Number(e.target.value) })} className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-2xl font-bold text-brand-700 dark:text-white" />
                                            <span className="text-sm text-brand-500 mb-2">/mo</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                        <label className="text-xs font-bold text-purple-600 uppercase">School Plan</label>
                                        <div className="flex items-end gap-2 mt-1">
                                            <input type="number" value={config.schoolPlanLessonLimit} onChange={e => setConfig({ ...config, schoolPlanLessonLimit: Number(e.target.value) })} className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-2xl font-bold text-purple-700 dark:text-white" />
                                            <span className="text-sm text-purple-500 mb-2">/mo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'services' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                                <Building className="w-6 h-6 mr-3 text-slate-500" />
                                Infrastructure & API Keys
                            </h2>
                            {!isSuperAdmin && (
                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-blue-700 dark:text-blue-400 text-sm flex items-start">
                                    <Shield className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                                    <p>Some extremely sensitive keys (like Database URL and JWT Secret) are restricted to SuperAdmins. You can update other service keys below.</p>
                                </div>
                            )}
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Google Gemini API Key</label>
                                        <input
                                            type="password"
                                            value={config.googleGeminiApiKey}
                                            onChange={e => setConfig({ ...config, googleGeminiApiKey: e.target.value })}
                                            className="w-full rounded-lg border dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                                            placeholder="Paste Gemini API Key..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Paystack Public Key</label>
                                        <input
                                            value={config.paystackPublicKey}
                                            onChange={e => setConfig({ ...config, paystackPublicKey: e.target.value })}
                                            className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2.5 font-mono text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Paystack Secret Key</label>
                                        <input
                                            type="password"
                                            value={config.paystackSecretKey}
                                            onChange={e => setConfig({ ...config, paystackSecretKey: e.target.value })}
                                            className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2.5 font-mono text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {isSuperAdmin && (
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-6">
                                        <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest">SuperAdmin Restricted Area</h3>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Database URL (Prisma)</label>
                                                <input
                                                    type="password"
                                                    value={config.databaseUrl}
                                                    onChange={e => setConfig({ ...config, databaseUrl: e.target.value })}
                                                    className="w-full rounded-lg border dark:border-slate-700 p-2.5 font-mono text-sm bg-red-50/30 dark:bg-red-900/10 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">JWT Secret Pin</label>
                                                    <input
                                                        type="password"
                                                        value={config.jwtSecret}
                                                        onChange={e => setConfig({ ...config, jwtSecret: e.target.value })}
                                                        className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2.5 font-mono text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">JWT Expiry</label>
                                                    <input
                                                        value={config.jwtExpire}
                                                        onChange={e => setConfig({ ...config, jwtExpire: e.target.value })}
                                                        className="w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white"
                                                        placeholder="e.g. 30d"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'email' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-slate-800 dark:text-slate-200">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                                <Bell className="w-6 h-6 mr-3 text-brand-500" />
                                SMTP Email Gateway
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">SMTP Host</label>
                                    <input value={config.smtpHost} onChange={e => setConfig({ ...config, smtpHost: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" placeholder="smtp.gmail.com" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Port</label>
                                        <input type="number" value={config.smtpPort} onChange={e => setConfig({ ...config, smtpPort: Number(e.target.value) })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Auth User</label>
                                        <input value={config.smtpUser} onChange={e => setConfig({ ...config, smtpUser: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Auth Password</label>
                                    <input type="password" value={config.smtpPassword} onChange={e => setConfig({ ...config, smtpPassword: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">From Email</label>
                                        <input value={config.smtpFromEmail} onChange={e => setConfig({ ...config, smtpFromEmail: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">From Name</label>
                                        <input value={config.smtpFromName} onChange={e => setConfig({ ...config, smtpFromName: e.target.value })} className="w-full mt-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 text-slate-900 dark:text-white" />
                                    </div>
                                </div>

                                <div className="col-span-2 pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Connection Test</h3>
                                    <div className="flex gap-4">
                                        <input
                                            type="email"
                                            value={testEmail}
                                            onChange={e => setTestEmail(e.target.value)}
                                            placeholder="Recipient email address"
                                            className="flex-1 rounded-lg border dark:border-slate-700 dark:bg-slate-900 p-2 pr-12 focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
                                        />
                                        <button
                                            onClick={handleTestSmtp}
                                            disabled={testingSmtp}
                                            className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50"
                                        >
                                            {testingSmtp ? 'Testing...' : 'Send Test Mail'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;