import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Trash, FileText, Loader2, Edit, Users, BarChart, Calendar, CheckCircle, Clock, Grid } from '../components/Icons';
import { LessonNote } from '../types';
import { db } from '../database';
import { showAlert } from '../utils/alerts';

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

    useEffect(() => {
        const currentUser = db.auth.getCurrentUser();
        setUser(currentUser);

        // Check if user is logged in
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Redirect non-school users to regular dashboard
        if (currentUser.subscriptionPlan !== 'School' || !currentUser.schoolId) {
            navigate('/dashboard');
            return;
        }

        const loadData = async () => {
            try {
                // Load notes
                const notes = await db.notes.getUserNotes();
                setSavedNotes(notes);

                // Calculate teacher stats
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const thisWeekLessons = notes.filter(note => {
                    const noteDate = new Date(note.createdAt || '');
                    return noteDate >= weekAgo;
                }).length;

                const thisMonthLessons = notes.filter(note => {
                    const noteDate = new Date(note.createdAt || '');
                    return noteDate >= monthAgo;
                }).length;

                setTeacherStats({
                    totalLessons: notes.length,
                    thisWeekLessons,
                    thisMonthLessons,
                    averagePerWeek: thisMonthLessons / 4.3 // approximate weeks in a month
                });

                // Load school info
                if (currentUser.schoolId) {
                    const response = await fetch(`/api/school-admin/details`, {
                        headers: {
                            'Authorization': `Bearer ${currentUser.token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data.school) {
                            setSchoolInfo(data.data.school);
                        }
                    }
                }

                // Load usage stats
                const usageData = await db.auth.getUsage(currentUser.schoolId);
                setUsage(usageData);

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
                const updatedNotes = savedNotes.filter(note => note.id !== id);
                setSavedNotes(updatedNotes);

                // Recalculate stats
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const thisWeekLessons = updatedNotes.filter(note => {
                    const noteDate = new Date(note.createdAt || '');
                    return noteDate >= weekAgo;
                }).length;

                const thisMonthLessons = updatedNotes.filter(note => {
                    const noteDate = new Date(note.createdAt || '');
                    return noteDate >= monthAgo;
                }).length;

                setTeacherStats({
                    totalLessons: updatedNotes.length,
                    thisWeekLessons,
                    thisMonthLessons,
                    averagePerWeek: thisMonthLessons / 4.3
                });

                showAlert.success('Deleted', 'Lesson note removed successfully.');
            } catch (err) {
                console.error("Failed to delete note", err);
                showAlert.error('Delete Failed', 'Failed to delete note.');
            }
        }
    };

    const handleEdit = (note: LessonNote, e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/generator', { state: { editData: note } });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100 sm:text-3xl sm:truncate">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h2>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">
                        {schoolInfo?.name || 'Your School'} • {user?.teacherStatus} Teacher
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        to="/generator"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create New Note
                    </Link>
                </div>
            </div>

            {/* School Info Card */}
            {schoolInfo && (
                <div className="mb-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg mr-4">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">{schoolInfo.name}</h3>
                                <p className="text-sm opacity-90">{schoolInfo.address || 'School Address'}</p>
                            </div>
                        </div>
                        {user?.isSchoolAdmin && (
                            <Link
                                to="/school"
                                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors border border-white/20"
                            >
                                Manage School
                            </Link>
                        )}
                    </div>
                    {schoolInfo.email && (
                        <p className="text-sm opacity-90">📧 {schoolInfo.email}</p>
                    )}
                    {schoolInfo.phone && (
                        <p className="text-sm opacity-90 mt-1">📞 {schoolInfo.phone}</p>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Lessons */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Lessons</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                {teacherStats?.totalLessons || 0}
                            </p>
                        </div>
                        <div className="bg-brand-100 dark:bg-brand-900/30 p-3 rounded-lg">
                            <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                        </div>
                    </div>
                </div>

                {/* This Week */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">This Week</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                {teacherStats?.thisWeekLessons || 0}
                            </p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                            <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {/* This Month */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">This Month</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                {teacherStats?.thisMonthLessons || 0}
                            </p>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                            <BarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                {/* Average Per Week */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Avg/Week</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                {teacherStats?.averagePerWeek.toFixed(1) || '0.0'}
                            </p>
                        </div>
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                            <Grid className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Card */}
            {usage && (
                <div className="mb-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold capitalize">{usage.duration || 'Monthly'} Usage</h3>
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold">
                            {usage.remaining} remaining
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm opacity-75 mb-1">Used</p>
                            <p className="text-3xl font-bold">{usage.used}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-75 mb-1">Limit</p>
                            <p className="text-3xl font-bold">{usage.limit === 999999 ? '∞' : usage.limit}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-75 mb-1">Progress</p>
                            <div className="mt-2">
                                <div className="w-full bg-white/20 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full ${usage.remaining === 0 ? 'bg-red-400' : 'bg-green-400'}`}
                                        style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link
                    to="/generator"
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow group"
                >
                    <div className="flex items-center mb-4">
                        <div className="bg-brand-100 dark:bg-brand-900/30 p-3 rounded-lg group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
                            <Sparkles className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <h3 className="ml-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Generate Lesson</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Create a new AI-powered lesson note</p>
                </Link>

                <Link
                    to="/assessment"
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow group"
                >
                    <div className="flex items-center mb-4">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                            <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="ml-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Create Assessment</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Generate quizzes and tests</p>
                </Link>

                <Link
                    to="/smart-class"
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow group"
                >
                    <div className="flex items-center mb-4">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                            <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="ml-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Smart Class</h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your class schedule</p>
                </Link>
            </div>

            {/* Saved Lesson Notes */}
            <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-md border border-slate-200 dark:border-slate-700 min-h-[300px]">
                <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">Recent Lesson Notes</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                        {savedNotes.length} Saved
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-300">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-brand-500" />
                        <p>Loading your notes...</p>
                    </div>
                ) : savedNotes.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No notes saved yet</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Generate a lesson note and click 'Save' to see it here.</p>
                        <div className="mt-6">
                            <Link
                                to="/generator"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
                            >
                                <Sparkles className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                Generate First Note
                            </Link>
                        </div>
                    </div>
                ) : (
                    <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                        {savedNotes.slice(0, 5).map((note) => (
                            <li key={note.id || Math.random()}>
                                <Link
                                    to="/result"
                                    state={{ lessonNote: note }}
                                    className="block hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-brand-600 truncate">{note.topic} <span className="text-slate-400 dark:text-slate-400 font-normal">- {note.subtopic}</span></p>
                                            <div className="ml-2 flex-shrink-0 flex items-center">
                                                <button
                                                    onClick={(e) => handleEdit(note, e)}
                                                    className="text-slate-400 dark:text-slate-300 hover:text-brand-600 p-2 rounded-full hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors mr-1"
                                                    title="Edit Note"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => note.id && handleDelete(note.id, e)}
                                                    className="text-slate-400 dark:text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                                                    title="Delete Note"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-slate-500 mr-6">
                                                    <BookOpen className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                    {note.subject}
                                                </p>
                                                <p className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0 sm:ml-6">
                                                    Class: {note.classLevel}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                                                <p>
                                                    {note.date || note.createdAt?.split('T')[0]}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {savedNotes.length > 5 && (
                    <div className="px-4 py-4 sm:px-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
                        <Link
                            to="/history"
                            className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                            View all {savedNotes.length} notes →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
