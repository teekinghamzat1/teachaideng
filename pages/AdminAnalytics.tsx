import React, { useState, useEffect } from 'react';
import { getAdminAuthHeader } from '../database';
import {
    BarChart,
    Activity,
    Users,
    Globe,
    Calendar,
    ChevronDown,
    TrendingUp,
    BookOpen,
    RefreshCw,
    Loader2
} from '../components/Icons';

const AdminAnalytics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [range, setRange] = useState('30d');
    const [data, setData] = useState<any>(null);

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await fetch(`/api/analytics/report?range=${range}`, {
                headers: getAdminAuthHeader()
            });
            const payload = await res.json();
            if (payload.success) {
                setData(payload.data);
            }
        } catch (error) {
            console.error("Failed to load analytics report", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [range]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-11 animate-spin text-brand-600 mb-4" />
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Assembling Intelligence...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <BarChart className="w-8 h-8 text-brand-600" /> Platform Analytics
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Real-time insights into platform growth and pedagogical trends.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className="appearance-none pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 focus:border-brand-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="month">Current Month</option>
                            <option value="year">Current Year</option>
                        </select>
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="p-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Live Educators', value: data?.liveUsers || 0, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                    { label: 'Total Visits', value: data?.totalVisits?.toLocaleString() || 0, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                    { label: 'Unique Visitors', value: data?.uniqueUsers?.toLocaleString() || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/10' },
                    { label: 'Engagement Rate', value: 'High', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-50 dark:border-slate-700 shadow-sm flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Traffic Volume</h3>
                            <p className="text-sm text-slate-500 font-medium">Daily interactions across the ecosystem</p>
                        </div>
                    </div>

                    {/* Visual Chart Placeholder/Implementation */}
                    <div className="h-72 flex items-end gap-2 px-2">
                        {data?.chartData.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-sm">No traffic data for this range</div>
                        ) : data?.chartData.map((day: any, i: number) => {
                            const max = Math.max(...data.chartData.map((d: any) => d.visits), 1);
                            const height = (day.visits / max) * 100;
                            return (
                                <div key={i} className="group relative flex-1 flex flex-col justify-end h-full">
                                    <div
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                        className={`w-full rounded-t-xl transition-all duration-500 cursor-help ${day.visits > 0 ? 'bg-brand-500 hover:bg-brand-600 shadow-[0_-4px_12px_rgba(22,163,74,0.2)]' : 'bg-slate-100 dark:bg-slate-700'}`}
                                    ></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg z-20 whitespace-nowrap pointer-events-none transition-opacity">
                                        {day.visits.toLocaleString()} Visits
                                        <div className="text-white/60 font-medium">{new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-6 px-1">
                        {data?.chartData.filter((_: any, i: number) => i % Math.ceil(data.chartData.length / 6) === 0).map((day: any, i: number) => (
                            <span key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Popular Pedagogy */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 shadow-sm h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-brand-600">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Top Subjects</h3>
                        </div>

                        <div className="space-y-4">
                            {data?.topSubjects.length === 0 ? (
                                <p className="text-slate-400 italic text-sm text-center py-10">No pedagogical data collected yet.</p>
                            ) : data?.topSubjects.map((subject: any, i: number) => (
                                <div key={i} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:text-brand-600 group-hover:border-brand-200 transition-all">{i + 1}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">{subject.name}</span>
                                    </div>
                                    <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-black text-slate-400 group-hover:text-brand-600 shadow-sm transition-all">{subject.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Trending Search Topics</h3>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {data?.topTopics.length === 0 ? (
                            <p className="w-full text-slate-400 italic text-sm text-center py-4">No topic trends detected.</p>
                        ) : data?.topTopics.map((topic: any, i: number) => (
                            <div key={i} className="px-5 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all group">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{topic.name}</span>
                                <span className="w-2 h-2 rounded-full bg-brand-500 transform group-hover:scale-150 transition-transform"></span>
                                <span className="text-xs font-black text-slate-400">{topic.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
