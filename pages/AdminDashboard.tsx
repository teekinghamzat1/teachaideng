import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { AdminLog } from '../types';
import { Users, FileText, BarChart, Activity, AlertTriangle, CheckCircle, CreditCard } from '../components/Icons';

const AdminOverview: React.FC = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalNotes: 0, totalStudents: 0, premiumUsers: 0 });
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const statsData = await db.admin.getStats();
                setStats(statsData);
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
                {/* Main Chart Area (Simulated) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Usage Analytics</h2>
                        <select className="text-sm border-slate-300 rounded-md shadow-sm">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    {/* Simulated Chart Bars */}
                    <div className="h-64 flex items-end justify-between space-x-2 px-2">
                        {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                            <div key={i} className="w-full bg-brand-100 rounded-t-md relative group">
                                <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-brand-500 rounded-t-md transition-all duration-500 hover:bg-brand-600"></div>
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded dark:bg-slate-700">
                                    {h * 12} Generations
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-slate-400">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                {/* Activity Log */}
                 <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                     <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h2>
                     <div className="flow-root">
                        <ul className="-mb-8">
                            {logs.map((log, logIdx) => (
                                <li key={log.id}>
                                    <div className="relative pb-8">
                                        {logIdx !== logs.length - 1 ? (
                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                                        ) : null}
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                                    log.type === 'error' ? 'bg-red-100 text-red-600' :
                                                    log.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {log.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : 
                                                     log.type === 'warning' ? <Activity className="w-4 h-4" /> :
                                                     <CheckCircle className="w-4 h-4" />}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-slate-500">
                                                        <span className="font-medium text-slate-900">{log.action}</span> by {log.adminName}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">Target: {log.target}</p>
                                                </div>
                                                <div className="text-right text-xs whitespace-nowrap text-slate-400">
                                                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;