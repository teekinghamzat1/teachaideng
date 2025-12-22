import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../database';
import { Lock, Mail, Shield, Loader2 } from '../components/Icons';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        admin_email: '',
        admin_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.admin_email || !formData.admin_password) {
            setError("Please enter both email and password.");
            return;
        }

        setLoading(true);

        try {
            const user = await db.adminAuth.login(formData.admin_email, formData.admin_password);

            if (['admin', 'superadmin'].includes(user.role.toLowerCase())) {
                navigate('/admin');
            } else {
                setError('Access denied. You do not have admin privileges.');
                // Optionally logout if they are not admin
                // await db.auth.logout(); 
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-200">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                        Admin Portal
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Secure login for administrators
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center animate-pulse">
                        <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="admin_email" className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="admin_email"
                                    name="admin_email"
                                    type="email"
                                    required
                                    autoComplete="off"
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
                                    placeholder="admin@teachaide.com"
                                    value={formData.admin_email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="admin_password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="admin_password"
                                    name="admin_password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
                                    placeholder="Enter admin password"
                                    value={formData.admin_password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {/* Reuse simple text if Icon not imported or specific icons */}
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-md hover:shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Signing in...
                            </>
                        ) : (
                            'Sign into Console'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
