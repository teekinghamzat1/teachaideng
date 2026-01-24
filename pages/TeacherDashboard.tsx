import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Trash, FileText, Loader2, Edit, Users, BarChart, Calendar, CheckCircle, Clock, ChevronRight, Eye, Plus } from '../components/Icons';
import { LessonNote } from '../types';
import { db } from '../database';
import { showAlert } from '../utils/alerts';
import SupportChat from '../components/SupportChat';

interface SchoolInfo {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
}

interface TeacherStats {
    totalLessons: number;
    thisWeekLessons: number;
    thisMonthLessons: number;
    averagePerWeek: number;
}

const TeacherDashboard: React.FC = () => {
    const [savedNotes, setSavedNotes] = useState<LessonNote[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [user, setUser] = useState<any | null>(null);
    const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number; duration?: string } | null>(null);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        const currentUser = db.auth.getCurrentUser();
        setUser(currentUser);

        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (currentUser.subscriptionPlan !== 'School' || !currentUser.schoolId) {
            navigate('/dashboard');
            return;
        }

        const loadData = async () => {
            try {
                const notes = await db.notes.getUserNotes();
                setSavedNotes(notes);

                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                setTeacherStats({
                    totalLessons: notes.length,
                    thisWeekLessons: notes.filter(n => new Date(n.createdAt || '') >= weekAgo).length,
                    thisMonthLessons: notes.filter(n => new Date(n.createdAt || '') >= monthAgo).length,
                    averagePerWeek: (notes.filter(n => new Date(n.createdAt || '') >= monthAgo).length / 4.3)
                });

                if (currentUser.schoolId) {
                    const response = await fetch(`/api/school-admin/details`, {
                        headers: { 'Authorization': `Bearer ${currentUser.token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data.school) setSchoolInfo(data.data.school);
                    }
                }

                setUsage(await db.auth.getUsage(currentUser.schoolId));

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (await showAlert.confirm('Delete Note', 'Are you sure you want to delete this lesson note?')) {
            try {
                await db.notes.delete(id);
                setSavedNotes(prev => prev.filter(note => note.id !== id));
                showAlert.success('Deleted', 'Lesson note removed successfully.');
            } catch (err) {
                showAlert.error('Delete Failed', 'Failed to delete note.');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen dashboard-bg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen dashboard-bg text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Desktop/Tablet Layout */}
                <div className="hidden lg:block p-4 lg:p-10 space-y-8">
                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                Welcome back, {user?.name?.split(' ')[0]}! 👋
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
                                {schoolInfo?.name || 'Kings College'} <span className="mx-2 text-slate-300 dark:text-slate-600">•</span> Active Teacher
                            </p>
                        </div>
                        <Link
                            to="/generator"
                            className="inline-flex items-center px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-1 active:scale-95"
                        >
                            <Sparkles className="w-5 h-5 mr-3" />
                            Create New Note
                        </Link>
                    </div>

                    {/* School Profile Card (Gradient) */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-indigo-500/20 text-white group transition-all duration-500 hover:shadow-indigo-500/30">
                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                                    <Users className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{schoolInfo?.name || 'Kings College'}</h2>
                                    <p className="text-xl text-white/90 font-medium opacity-80">{schoolInfo?.address || 'Ijebu Ode'}</p>
                                </div>
                            </div>
                            {user?.isSchoolAdmin ? (
                                <Link
                                    to="/school"
                                    className="px-8 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl font-bold text-white hover:bg-white/30 transition-all text-lg shadow-lg"
                                >
                                    Manage School
                                </Link>
                            ) : (
                                <div className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-bold text-white/70 italic text-lg">
                                    Managed by Admin
                                </div>
                            )}
                        </div>
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90">
                            <div className="flex items-center gap-3 text-base font-bold bg-black/10 w-fit px-5 py-3 rounded-2xl border border-white/5">
                                <span className="text-xl">📧</span>
                                {schoolInfo?.email || 'adetunjitaoheedolanrewaju@gmail.com'}
                            </div>
                            <div className="flex items-center gap-3 text-base font-bold bg-black/10 w-fit px-5 py-3 rounded-2xl border border-white/5">
                                <span className="text-xl">📞</span>
                                {schoolInfo?.phone || '+2348158087663'}
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[120px] rounded-full -mr-20 -mt-20 group-hover:bg-white/20 transition-all"></div>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* Primary Content (Stats & Table) */}
                        <div className="lg:col-span-3 space-y-8">

                            {/* 3 Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass-card rounded-[2.5rem] p-8 glow-edge-emerald group hover:-translate-y-1 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest">Total Lessons</p>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {teacherStats?.totalLessons || 3}
                                    </p>
                                </div>

                                <div className="glass-card rounded-[2.5rem] p-8 glow-edge-indigo group hover:-translate-y-1 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest">This Week</p>
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {teacherStats?.thisWeekLessons || 3}
                                    </p>
                                </div>

                                <div className="glass-card rounded-[2.5rem] p-8 glow-edge-indigo group hover:-translate-y-1 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest">Avg / Week</p>
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                            <BarChart className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {teacherStats?.averagePerWeek.toFixed(1) || '0.7'}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Resets in 12 days</p>
                                </div>
                            </div>

                            {/* Recent Lesson Notes Table */}
                            <div className="glass-card rounded-[3rem] overflow-hidden">
                                <div className="px-10 py-8 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-brand-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Lesson Notes</h3>
                                    </div>
                                    <Link to="/history" className="text-sm font-black text-brand-600 dark:text-slate-400 hover:text-brand-700 transition-colors flex items-center gap-1 group">
                                        View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] border-b border-slate-200/50 dark:border-white/5">
                                                <th className="px-10 py-6">Lesson</th>
                                                <th className="px-10 py-6">Subject</th>
                                                <th className="px-10 py-6">Class</th>
                                                <th className="px-10 py-6">Date</th>
                                                <th className="px-10 py-6 min-w-[120px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {savedNotes.length > 0 ? (
                                                savedNotes.slice(0, 5).map((note) => (
                                                    <tr key={note.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-all group">
                                                        <td className="px-10 py-6 font-black text-slate-800 dark:text-slate-200 truncate max-w-[240px] group-hover:text-brand-600 transition-colors">{note.topic}</td>
                                                        <td className="px-10 py-6 text-sm text-slate-500 font-bold">{note.subject}</td>
                                                        <td className="px-10 py-6 text-sm text-slate-500 font-bold">{note.classLevel}</td>
                                                        <td className="px-10 py-6 text-sm text-slate-400 font-bold">{new Date(note.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                        <td className="px-10 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex p-1.5 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10">
                                                                    <Link to="/result" state={{ lessonNote: note }} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" title="View"><Eye className="w-4 h-4" /></Link>
                                                                    <button onClick={() => navigate('/generator', { state: { editData: note } })} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Edit"><Edit className="w-4 h-4" /></button>
                                                                    <button onClick={(e) => handleDelete(note.id!, e)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Delete"><Trash className="w-4 h-4" /></button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-bold italic">No notes created yet. Let's create one!</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Bottom Tagline */}
                            <div className="flex items-center justify-center py-6 text-center">
                                <p className="text-sm text-slate-400 font-bold tracking-widest uppercase opacity-60">Empowering Nigerian teachers with AI tools to save time and improve education quality.</p>
                            </div>
                        </div>

                        {/* Sidebar Area (Usage & Actions) */}
                        <div className="space-y-8">

                            {/* Circular Usage Progress */}
                            <div className="glass-card rounded-[3rem] p-10 flex flex-col items-center">
                                <h3 className="text-slate-400 dark:text-slate-500 text-sm font-black uppercase tracking-widest mb-10">Monthly Usage</h3>
                                <div className="relative w-48 h-48 group">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="96"
                                            cy="96"
                                            r="84"
                                            className="stroke-slate-100 dark:stroke-white/5"
                                            strokeWidth="16"
                                            fill="transparent"
                                        />
                                        <circle
                                            cx="96"
                                            cy="96"
                                            r="84"
                                            stroke="url(#usage-grad)"
                                            strokeWidth="16"
                                            strokeDasharray={528}
                                            strokeDashoffset={528 - (528 * (usage?.used || 3)) / (usage?.limit || 10)}
                                            strokeLinecap="round"
                                            fill="transparent"
                                            className="transition-all duration-1000 ease-in-out"
                                        />
                                        <defs>
                                            <linearGradient id="usage-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#34d399" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-5xl font-black text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                                            {usage?.used || 3}
                                        </div>
                                        <div className="text-base font-black text-slate-400 border-t border-slate-200 dark:border-white/10 mt-1 pt-1">
                                            / {usage?.limit || 10}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 text-center space-y-2">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Resets in 12 days</p>
                                    <Link to="/pricing" className="inline-block text-emerald-600 dark:text-emerald-500 font-extrabold hover:underline">Upgrade Plan</Link>
                                </div>
                            </div>

                            {/* Quick Mini Action Cards */}
                            <div className="glass-card rounded-[2.5rem] p-8 glow-edge-emerald group">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">Generate Lesson Note</h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                                    Quickly create detailed lesson notes tailored to your class and subject.
                                </p>
                                <Link to="/generator" className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl flex items-center justify-center gap-3 text-white font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-[1.02] active:scale-95 transition-all">
                                    <Sparkles className="w-5 h-5" /> Generate Note
                                </Link>
                            </div>

                            <div className="glass-card rounded-[2.5rem] p-8 glow-edge-indigo group">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">Create Assessment</h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                                    Easily create formative and summative assessments for your students.
                                </p>
                                <Link to="/assessment" className="w-full py-4 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-2xl flex items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    <Plus className="w-5 h-5" /> New Assessment
                                </Link>
                            </div>

                            <div className="relative glass-card rounded-[2.5rem] p-8 overflow-hidden min-h-[180px] group">
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight text-brand-600">TeachAide <span className="text-slate-400">AI</span></span>
                                    </div>
                                    <h4 className="font-black text-lg text-slate-800 dark:text-slate-200">Recent Lesson Notes</h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
                                        Empowering Nigerian teachers with AI tools.
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/5 blur-[80px] group-hover:bg-brand-500/10 transition-all"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden p-4 space-y-6 pb-24">
                    {/* Welcome Header */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Welcome back, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold">
                            {schoolInfo?.name || 'Kings College'} <span className="mx-1 text-slate-300 dark:text-slate-600">•</span> Active Teacher
                        </p>
                    </div>

                    {/* School Profile Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-3xl p-6 shadow-2xl text-white">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-extrabold">{schoolInfo?.name || 'Kings College'}</h2>
                                    <p className="text-sm text-white/80">{schoolInfo?.address || 'Ijebu Ode'}</p>
                                </div>
                                {user?.isSchoolAdmin && (
                                    <Link to="/school" className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold">
                                        Manage School
                                    </Link>
                                )}
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 bg-black/10 w-fit px-3 py-2 rounded-xl">
                                    <span>📧</span>
                                    <span className="truncate text-xs">{schoolInfo?.email || 'adetunjitaoheedolanrewaju@gmail.com'}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/10 w-fit px-3 py-2 rounded-xl">
                                    <span>📞</span>
                                    <span className="text-xs">{schoolInfo?.phone || '+2348158087663'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-[80px] rounded-full -mr-10 -mt-10"></div>
                    </div>

                    {/* Stats Grid - 2x2 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card rounded-2xl p-5 glow-edge-emerald">
                            <div className="flex items-center justify-between mb-3">
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">Total Lessons</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white">{teacherStats?.totalLessons || 3}</p>
                        </div>

                        <div className="glass-card rounded-2xl p-5 glow-edge-indigo">
                            <div className="flex items-center justify-between mb-3">
                                <Calendar className="w-5 h-5 text-indigo-500" />
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                    <Calendar className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">This Week</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white">{teacherStats?.thisWeekLessons || 3}</p>
                        </div>

                        <div className="glass-card rounded-2xl p-5 glow-edge-indigo">
                            <div className="flex items-center justify-between mb-3">
                                <BarChart className="w-5 h-5 text-purple-500" />
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                                    <BarChart className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">This Month</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white">{teacherStats?.thisMonthLessons || 3}</p>
                        </div>

                        <div className="glass-card rounded-2xl p-5 glow-edge-indigo">
                            <div className="flex items-center justify-between mb-3">
                                <Calendar className="w-5 h-5 text-orange-500" />
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                    <Calendar className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">Avg / Week</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{teacherStats?.averagePerWeek.toFixed(1) || '0.7'}</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">Resets in 12 days</p>
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="glass-card rounded-2xl p-6 glow-edge-emerald">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Generate Lesson Note</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Quickly create detailed lesson notes tailored to your class and subject.
                            </p>
                            <Link to="/generator" className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl flex items-center justify-center gap-2 text-white font-bold shadow-lg">
                                <Sparkles className="w-4 h-4" /> Generate
                            </Link>
                        </div>

                        <div className="glass-card rounded-2xl p-6 glow-edge-indigo">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Create Assessment</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                Easily create formative and summative assessments for your students.
                            </p>
                            <Link to="/assessment" className="w-full py-3 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-xl flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                                New Assessment
                            </Link>
                        </div>
                    </div>

                    {/* Recent Notes Section */}
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                                <BookOpen className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-sm">TeachAide <span className="text-slate-400">AI</span></span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Recent Lesson Notes</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Empowering Nigerian teachers with AI tools to save time and improve education quality.
                        </p>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setShowChat(!showChat)}
                className="fixed bottom-10 right-10 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:scale-110 active:scale-95 transition-all z-50"
            >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
            </button>

            {/* Support Chat */}
            {user && <SupportChat hideToggle={true} defaultOpen={showChat} />}
        </div>
    );
};

export default TeacherDashboard;
