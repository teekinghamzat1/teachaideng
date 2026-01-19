import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { AdminLog } from '../types';
import { Users, FileText, BarChart, Activity, AlertTriangle, CheckCircle, CreditCard } from '../components/Icons';

const AdminOverview: React.FC = () => {
    const [stats, setStats] = useState<any>({ totalUsers: 0, totalNotes: 0, totalStudents: 0, premiumUsers: 0, chartData: [], chartLabels: [], totalTokens: 0, modelUsage: {} });
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Immediate synchronous check to prevent Flash of Unauthorized Content
    const currentUser = db.adminAuth.getCurrentUser();

    // Redirect non-admins immediately
    const normalizedRole = (currentUser?.role || '').toLowerCase();
    if (!currentUser || !['admin', 'superadmin'].includes(normalizedRole)) {
        // Return null or empty fragment so nothing renders while redirect logic (in App or here) kicks in
        // Ideally this component shouldn't even mount, but if it does:
        return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Checking authorization...</div>;
    }

    useEffect(() => {
        const user = db.adminAuth.getCurrentUser();
        const userRole = (user?.role || '').toLowerCase();
        if (!user || !['admin', 'superadmin'].includes(userRole)) {
            window.location.href = '/admin/login'; // Redirect to admin login
            return;
        }

        const loadData = async () => {
            try {
                const statsData = await db.admin.getStats();
                const analyticsData = await db.admin.getAnalytics();
                setStats({ ...statsData, ...analyticsData });

                const logsData = await db.admin.getLogs();
                setLogs(logsData);
            } catch (error) {
                console.error("Failed to load admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-300">Loading Dashboard...</div>;

    const cards = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Notes Generated', value: stats.totalNotes, icon: FileText, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Premium Revenue', value: `₦${(stats.premiumUsers * 2500).toLocaleString()}`, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Active Students', value: stats.totalStudents, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Dashboard Overview</h1>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{card.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${card.bg}`}>
                            <card.icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Generation Analytics</h2>
                            <p className="text-sm text-slate-500">Last 7 Days Usage</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-brand-600">{stats.totalTokens?.toLocaleString() || 0}</p>
                            <p className="text-xs text-slate-400">Total Tokens Used</p>
                        </div>
                    </div>
                    {/* Chart Bars */}
                    <div className="h-64 flex items-end justify-between space-x-2 px-2">
                        {(stats.chartData || []).map((count: number, i: number) => {
                            // Calculate height percentage relative to max, defaulting to 5% min
                            const max = Math.max(...(stats.chartData || [1]));
                            const height = max === 0 ? 0 : (count / max) * 100;
                            return (
                                <div key={i} className="w-full bg-brand-50 dark:bg-slate-700 rounded-t-md relative group h-full flex flex-col justify-end">
                                    <div style={{ height: `${Math.max(height, 5)}%` }} className={`w-full rounded-t-md transition-all duration-500 ${count > 0 ? 'bg-brand-500 hover:bg-brand-600' : 'bg-slate-200 dark:bg-slate-600'}`}></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap pointer-events-none">
                                        {count} Gens
                                        <br />
                                        {(stats.chartLabels || [])[i]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium">
                        {(stats.chartLabels || []).map((label: string, i: number) => (
                            <span key={i} className="text-center w-full">{label}</span>
                        ))}
                    </div>

                    {/* Model Usage Stats */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Model Distribution</h3>
                        <div className="flex gap-4 flex-wrap">
                            {Object.entries(stats.modelUsage || {}).map(([model, count]: [string, any]) => (
                                <div key={model} className="bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg text-sm">
                                    <span className="text-slate-500 dark:text-slate-300 mr-2">{model}:</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{count}</span>
                                </div>
                            ))}
                            {Object.keys(stats.modelUsage || {}).length === 0 && <span className="text-sm text-slate-400 italic">No model data yet</span>}
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Activity Feed</h2>
                    <div className="flow-root">
                        <ul className="-mb-8">
                            {logs.length === 0 ? (
                                <li className="text-sm text-slate-400 italic py-4">No recent activity found</li>
                            ) : logs.map((log: any, logIdx) => {
                                const isDestructive = log.actionType.includes('DELETE') || log.actionType.includes('SUSPEND');
                                const isImportant = log.actionType.includes('CREATE') || log.actionType.includes('UPDATE');
                                const isGeneration = log.actionType.includes('GENERATE');
                                const details = log.details ? JSON.parse(log.details) : {};

                                return (
                                    <li key={log.id}>
                                        <div className="relative pb-8">
                                            {logIdx !== logs.length - 1 ? (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100 dark:bg-slate-700" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800 ${isDestructive ? 'bg-red-100 text-red-600' :
                                                        isImportant ? 'bg-brand-100 text-brand-600' :
                                                            isGeneration ? 'bg-purple-100 text-purple-600' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {isDestructive ? <AlertTriangle className="w-4 h-4" /> :
                                                            isImportant ? <CheckCircle className="w-4 h-4" /> :
                                                                isGeneration ? <FileText className="w-4 h-4" /> :
                                                                    <Activity className="w-4 h-4" />}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-slate-900 dark:text-slate-100">
                                                            {isGeneration ? (
                                                                <>
                                                                    <span className="font-bold text-brand-600 mr-1">{log.user?.name || 'A user'}</span>
                                                                    <span>generated a new {log.actionType === 'GENERATE_LESSON' ? 'note' : 'assessment'} on </span>
                                                                    <span className="font-bold italic text-slate-700 dark:text-slate-300">"{details.topic || 'Unknown topic'}"</span>
                                                                </>
                                                            ) : (
                                                                <span className="font-bold">{log.actionType.replace(/_/g, ' ')}</span>
                                                            )}
                                                        </p>
                                                        {!isGeneration && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                by <span className="font-medium text-slate-700 dark:text-slate-200">{log.user?.name || 'Unknown'}</span>
                                                            </p>
                                                        )}
                                                        {log.school?.name && (
                                                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1">{log.school.name}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right text-xs whitespace-nowrap text-slate-400">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;