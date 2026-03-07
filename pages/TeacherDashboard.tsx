import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    BookOpen, Sparkles, Trash, FileText, Loader2, Edit,
    ChevronRight, Zap, Save, BarChart, TrendingUp, Clock,
    Plus, Users, Calendar, CheckCircle, Eye, Clipboard
} from '../components/Icons';
import { LessonNote, Assessment } from '../types';
import { db } from '../database';
import { showAlert } from '../utils/alerts';
import UpgradeCard from '../components/UpgradeCard';

interface SchoolInfo {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
}

const TeacherDashboard: React.FC = () => {
    const [savedNotes, setSavedNotes] = useState<LessonNote[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any | null>(null);
    const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [forecastFilter, setForecastFilter] = useState<'This Week' | 'Last Week'>('This Week');
    const navigate = useNavigate();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        const currentUser = db.auth.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);

        if (currentUser.subscriptionPlan !== 'School' || !currentUser.schoolId) {
            navigate('/dashboard');
            return;
        }

        try {
            const [notes, assessmentsData, usageData] = await Promise.all([
                db.notes.getUserNotes(),
                db.assessments.getUserAssessments(),
                db.auth.getUsage(currentUser.schoolId)
            ]);
            setSavedNotes(notes);
            setAssessments(assessmentsData);
            setUsage(usageData);

            // School info
            const response = await fetch(`/api/school-admin/details`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.school) setSchoolInfo(data.data.school);
            }

        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, type: 'note' | 'assessment', e: React.MouseEvent) => {
        e.preventDefault();
        const title = type === 'note' ? 'Delete Note' : 'Delete Assessment';
        if (await showAlert.confirm(title, 'Permanently remove this item?')) {
            try {
                if (type === 'note') {
                    await db.notes.delete(id);
                    setSavedNotes(prev => prev.filter(n => n.id !== id));
                } else {
                    await db.assessments.delete(id);
                    setAssessments(prev => prev.filter(a => a.id !== id));
                }
                showAlert.success('Deleted', 'Item removed.');
            } catch (err) {
                showAlert.error('Error', 'Failed to delete note.');
            }
        }
    };

    // --- Dynamic Stats ---
    const stats = useMemo(() => {
        const timeSaved = (savedNotes.length * 2) + (assessments.length * 1.5);
        const today = new Date().toLocaleDateString();
        const todayCount = savedNotes.filter(n => new Date(n.createdAt || '').toLocaleDateString() === today).length +
            assessments.filter(a => new Date(a.createdAt || '').toLocaleDateString() === today).length;

        return [
            { label: 'Time Saved', value: `${timeSaved}h`, icon: Clock, color: 'text-brand-500 bg-brand-500/10' },
            {
                label: 'Weekly Activity', value: savedNotes.filter(n => {
                    const d = new Date(n.createdAt || '');
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return d >= weekAgo;
                }).length, icon: TrendingUp, color: 'text-teal-500 bg-teal-500/10'
            },
            { label: 'Daily Pulse', value: `${todayCount}/5`, icon: Zap, color: 'text-amber-500 bg-amber-500/10' }
        ];
    }, [savedNotes, assessments]);

    // --- Dynamic Forecast Chart Data ---
    const forecastChartData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const startOfCurrentWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfCurrentWeek.setHours(0, 0, 0, 0);

        const targetWeekStart = new Date(startOfCurrentWeek);
        if (forecastFilter === 'Last Week') {
            targetWeekStart.setDate(targetWeekStart.getDate() - 7);
        }

        const dailyCounts = days.map((day, index) => {
            const targetDate = new Date(targetWeekStart);
            targetDate.setDate(targetDate.getDate() + index);
            const dateStr = targetDate.toLocaleDateString();

            const noteCount = savedNotes.filter(n => new Date(n.createdAt || '').toLocaleDateString() === dateStr).length;
            const quizCount = assessments.filter(a => new Date(a.createdAt || '').toLocaleDateString() === dateStr).length;

            return {
                label: day,
                primary: noteCount,
                secondary: quizCount,
                total: noteCount + quizCount
            };
        });

        const maxCount = Math.max(...dailyCounts.map(d => d.total + 1), 5);

        return dailyCounts.map(d => ({
            ...d,
            primaryHeight: (d.primary / maxCount) * 100,
            secondaryHeight: (d.secondary / maxCount) * 100
        }));
    }, [savedNotes, assessments, forecastFilter]);

    // Combined history for the table
    const recentContent = useMemo(() => {
        const combined = [
            ...savedNotes.map(n => ({ ...n, contentType: 'Lesson Note' })),
            ...assessments.map(a => ({ ...a, contentType: 'Assessment' }))
        ];
        return combined.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()).slice(0, 5);
    }, [savedNotes, assessments]);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Teacher Dashboard</h1>
                    <p className="text-slate-500 font-bold">{schoolInfo?.name || 'Institutional Account'} • Active Teacher</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/generator"
                        className="px-6 py-3 bg-white dark:bg-slate-950 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-black rounded-2xl flex items-center gap-2 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all shadow-sm"
                    >
                        <Sparkles className="w-4 h-4" />
                        New Lesson
                    </Link>
                    <Link
                        to="/assessment"
                        className="px-6 py-3 bg-brand-500 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Quiz
                    </Link>
                </div>
            </div>

            <UpgradeCard />

            {/* School Banner Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-teal-500 rounded-[2.5rem] p-8 lg:p-12 text-white shadow-2xl shadow-brand-500/20 group transition-all duration-500">
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl lg:text-4xl font-black tracking-tight">{schoolInfo?.name || 'Institutional Hub'}</h2>
                            <p className="text-xl text-white/80 font-bold opacity-80">{schoolInfo?.address || 'Teacher Control Center'}</p>
                        </div>
                    </div>
                    {user?.isSchoolAdmin && (
                        <Link
                            to="/school"
                            className="px-8 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl font-black text-white hover:bg-white/30 transition-all text-lg shadow-lg"
                        >
                            Manage School
                        </Link>
                    )}
                </div>
                <div className="mt-10 flex flex-wrap gap-4 opacity-90">
                    <div className="flex items-center gap-3 text-sm font-black bg-black/10 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <span>📧</span> {schoolInfo?.email || 'Registered via Institution'}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[120px] rounded-full -mr-20 -mt-20 group-hover:bg-white/20 transition-all"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2/3 Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Dynamic Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm group hover:-translate-y-1 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Forecast Chart (New to Teacher Dashboard) */}
                    <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Instructional Forecast</h3>
                                <p className="text-slate-400 text-sm font-bold">Your activity {forecastFilter.toLowerCase()}</p>
                            </div>
                            <select
                                value={forecastFilter}
                                onChange={(e) => setForecastFilter(e.target.value as any)}
                                className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-500 focus:ring-0 cursor-pointer"
                            >
                                <option>This Week</option>
                                <option>Last Week</option>
                            </select>
                        </div>
                        <div className="h-64 mt-4 relative w-full flex items-end justify-between gap-4 pb-12">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="absolute w-full h-px bg-slate-100 dark:bg-slate-800" style={{ bottom: `${i * 25 + 25}%` }} />
                            ))}
                            {forecastChartData.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 relative z-10 group/bar">
                                    <div className="relative w-full flex flex-col justify-end h-48">
                                        <div className="w-2 md:w-3 mx-auto rounded-full bg-brand-500/80 group-hover:bg-brand-500 transition-all duration-500" style={{ height: `${day.primaryHeight}%` }} />
                                        <div className="w-2 md:w-3 mx-auto rounded-full bg-teal-500/40 group-hover:bg-teal-500/60 transition-all duration-500 mt-1" style={{ height: `${day.secondaryHeight}%` }} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right 1/3 Column */}
                <div className="space-y-8">

                    {/* Circular Usage Progress */}
                    <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-10 border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col items-center group">
                        <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 text-center">School Quota Used</h3>
                        <div className="relative w-48 h-48 group/meter">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="80" className="stroke-slate-100 dark:stroke-slate-900" strokeWidth="12" fill="transparent" />
                                <circle
                                    cx="96" cy="96" r="80" stroke="currentColor"
                                    className="text-brand-500 transition-all duration-1000 ease-in-out"
                                    strokeWidth="12"
                                    strokeDasharray={502}
                                    strokeDashoffset={502 - (502 * (usage?.used || 0)) / (usage?.limit || 1)}
                                    strokeLinecap="round" fill="transparent"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-5xl font-black text-slate-900 dark:text-white group-meter:scale-110 transition-transform">
                                    {usage?.used || 0}
                                </div>
                                <div className="text-xs font-black text-slate-400 border-t border-slate-200 dark:border-white/10 mt-1 pt-1 uppercase tracking-widest">
                                    / {usage?.limit || 0} units
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 text-center space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Institutional Quota</p>
                        </div>
                    </div>

                    {/* Recent Pulse Timeline */}
                    <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-8 tracking-tight">Recent Pulse</h3>
                        <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-slate-100 dark:before:bg-slate-800/50 before:ml-1.5 pt-2">
                            {recentContent.length > 0 ? recentContent.slice(0, 4).map((item: any, i) => (
                                <div key={i} className="flex gap-6 relative z-10">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[35px] pt-1">
                                        {new Date(item.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className="relative">
                                        <div className={`w-3.5 h-3.5 rounded-full ${item.contentType === 'Assessment' ? 'bg-teal-500' : 'bg-brand-500'} ring-4 ring-white dark:ring-slate-950`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight line-clamp-2">
                                            {item.contentType === 'Assessment' ? 'Quiz' : 'Lesson'} for <span className="text-slate-900 dark:text-white font-black">{item.topic}</span>
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center py-4 text-xs font-bold text-slate-400">No recent pulse</p>
                            )}
                        </div>
                    </div>

                    {/* Pedagogical Insight (New) */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-brand-900/40 dark:to-brand-950/40 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:rotate-12 transition-transform">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Expert Corner</h3>
                            </div>
                            <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                                "For every dedicated Nursery 1 teacher in Nigeria, a well-structured lesson note is more than just a document; it's a roadmap to effective learning. In the ECCDE framework, clarity and consistency are paramount."
                            </p>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-black text-white">TA</div>
                                <div>
                                    <p className="text-white text-xs font-black">TeachAide Insights</p>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-left">Standards</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Recent Generations Table */}
            <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Generations</h3>
                    <Link to="/history" className="text-xs font-black text-brand-500 uppercase tracking-widest hover:underline">View History</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-slate-900">
                                <th className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Topic</th>
                                <th className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                                <th className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                            {recentContent.map((item: any) => (
                                <tr key={item.id} className="group transition-colors">
                                    <td className="py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 ${item.contentType === 'Assessment' ? 'bg-teal-500/10 text-teal-600' : 'bg-brand-500/10 text-brand-500'} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                {item.contentType === 'Assessment' ? <Clipboard className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white line-clamp-1">{item.topic}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.subject} • {item.classLevel}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 text-center">
                                        <span className={`px-3 py-1 ${item.contentType === 'Assessment' ? 'bg-teal-50 text-teal-600' : 'bg-brand-50 text-brand-600'} text-[10px] font-black rounded-full uppercase tracking-widest border border-current opacity-70`}>
                                            {item.contentType}
                                        </span>
                                    </td>
                                    <td className="py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => navigate(item.contentType === 'Assessment' ? '/assessment' : '/generator', { state: { editData: item } })}
                                                className="p-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400 transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item.id!, item.contentType === 'Assessment' ? 'assessment' : 'note', e)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-red-500 transition-all font-black"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
