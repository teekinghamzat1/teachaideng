import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../database';
import { School, Teacher } from '../types';
import {
    Users, UserPlus, UserCheck, Trash, Loader2, AlertCircle,
    SettingsIcon, Zap, Edit, X, Shield, Sparkles, FileText, Clipboard, ChevronRight, BookOpen, Search, Save
} from '../components/Icons';
import { showAlert } from '../utils/alerts';
import UserAvatar from '../components/UserAvatar';
import UpgradeCard from '../components/UpgradeCard';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    editProfile: any;
    setEditProfile: (p: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    saving: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, editProfile, setEditProfile, onSubmit, saving }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800/50 animate-in zoom-in-95 duration-500">
                <div className="p-8 lg:p-10 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                            <Edit className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">School Profile</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Identity</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-400 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-8 lg:p-10 overflow-y-auto space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official School Name</label>
                            <input
                                type="text"
                                value={editProfile.name}
                                onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all shadow-inner"
                                required
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Campus Address</label>
                            <textarea
                                value={editProfile.address}
                                onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all resize-none shadow-inner"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Hotline</label>
                            <input
                                type="tel"
                                value={editProfile.phone}
                                onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                            <input
                                type="email"
                                value={editProfile.email}
                                onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-4 bg-brand-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 shadow-xl shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SchoolManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'settings'>('overview');
    const [school, setSchool] = useState<School | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', gender: '' });
    const [adding, setAdding] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editProfile, setEditProfile] = useState({
        name: '', address: '', phone: '', email: '', website: '', capacity: 0
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => { loadSchoolData(); }, []);
    useEffect(() => { if (activeTab === 'overview') loadActivities(); }, [activeTab]);

    const loadSchoolData = async () => {
        setLoading(true);
        try {
            const data = await db.school.getDetails();
            setSchool(data.school);
            setStats(data.stats);
            setEditProfile({
                name: data.school.name || '',
                address: data.school.address || '',
                phone: data.school.phone || '',
                email: data.school.email || '',
                website: data.school.website || '',
                capacity: data.school.capacity || 0
            });
        } catch (error: any) {
            console.error('Failed to load school data:', error);
            showAlert.error('Load Error', error.message || 'Failed load school data');
        } finally {
            setLoading(false);
        }
    };

    const loadActivities = async () => {
        setLoadingActivities(true);
        try {
            const logs = await db.school.getActivityLogs();
            setActivities(logs);
        } catch (error) {
            console.error('Failed to load activities:', error);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            await db.school.addTeacher(newTeacher.name, newTeacher.email, newTeacher.gender);
            showAlert.success('Teacher Invited', 'Staff member added to the registry.');
            setNewTeacher({ name: '', email: '', gender: '' });
            setShowAddModal(false);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Invite Failed', error.message || 'Could not add teacher');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveTeacher = async (teacherId: string, teacherName: string) => {
        if (await showAlert.confirm('Remove Teacher', `Permanently remove ${teacherName}?`)) {
            try {
                await db.school.removeTeacher(teacherId);
                showAlert.success('Staff Removed', 'Registry updated.');
                loadSchoolData();
            } catch (error: any) {
                showAlert.error('Failure', 'Could not remove staff.');
            }
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await db.school.updateProfile(editProfile);
            showAlert.success('Synced', 'School profile updated.');
            setShowProfileModal(false);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Error', 'Update failed.');
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        </div>
    );

    if (!school) return (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-300 mx-auto">
                <AlertCircle className="w-12 h-12" />
            </div>
            <div className="space-y-3">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Access Denied</h1>
                <p className="text-slate-500 font-bold max-w-sm mx-auto">You require an institutional license to activate the School Hub control center.</p>
            </div>
            <Link
                to="/pricing"
                className="inline-block px-10 py-4 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:scale-105 transition-all"
            >
                Upgrade Plan
            </Link>
        </div>
    );

    const progressPercentage = (stats.totalTeachers / (school.teacherLimit || 1)) * 100;

    return (
        <div className="space-y-8 pb-12">
            {/* Page Title & Tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">School Management</h1>
                    <p className="text-slate-500 font-bold">{school.name} Control Center</p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm w-full lg:w-auto">
                    {(['overview', 'teachers', 'settings'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <UpgradeCard />

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Stats Card */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                <Shield className="w-8 h-8 text-brand-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{school.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Identity</p>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {/* Progress Bar Item */}
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Faculty Capacity Sync</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalTeachers} <span className="text-slate-400">/ {school.teacherLimit} slots</span></p>
                                </div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-brand-500 to-teal-500 rounded-full shadow-lg shadow-brand-500/20 transition-all duration-1000"
                                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-[10px] font-bold text-slate-400 italic">Institutional licenses remaining: {stats.slotsRemaining}</p>
                            </div>

                            {/* Secondary Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {[
                                    { label: 'Active Staff', val: stats.activeTeachers, icon: UserCheck, color: 'text-teal-600 bg-teal-500/10' },
                                    { label: 'Pending Invitations', val: stats.invitedTeachers, icon: UserPlus, color: 'text-amber-600 bg-amber-500/10' },
                                    { label: 'Weekly Activities', val: activities.length, icon: Zap, color: 'text-brand-600 bg-brand-500/10' }
                                ].map((s, i) => (
                                    <div key={i} className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-4`}>
                                            <s.icon className="w-5 h-5" />
                                        </div>
                                        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{s.val}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions & Feed */}
                    <div className="space-y-8">
                        {/* Invite Button */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            disabled={stats.slotsRemaining <= 0}
                            className="w-full py-5 bg-brand-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <UserPlus className="w-5 h-5" />
                            Invite Staff Member
                        </button>

                        {/* Recent Activity Mini-Feed */}
                        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Staff Pulse
                            </h3>
                            <div className="space-y-6">
                                {activities.length > 0 ? activities.slice(0, 5).map((log, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {log.action.includes('LESSON') ? <FileText className="w-5 h-5 text-brand-500" /> : <Clipboard className="w-5 h-5 text-teal-500" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-tight">
                                                <span className="font-black text-slate-900 dark:text-white">{log.user?.name.split(' ')[0]}</span> generated a new {log.action === 'LESSON_GENERATION' ? 'lesson' : 'quiz'}.
                                            </p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center py-10 text-slate-400 font-bold uppercase text-[10px] tracking-widest italic opacity-40">Awaiting activity...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'teachers' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search faculty name or email..."
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-50 dark:border-slate-900">
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty Member</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Protocol</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Registry Management</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                    {(school.teachers || []).filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase())).map((t) => (
                                        <tr key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="py-6 min-w-[300px]">
                                                <div className="flex items-center gap-4">
                                                    <UserAvatar user={t} className="w-12 h-12 rounded-2xl shadow-sm" />
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white leading-tight group-hover:text-brand-500 transition-colors">{t.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${t.teacherStatus === 'Active' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {t.teacherStatus === 'Active' ? 'SYNCED' : 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="py-6 text-right">
                                                <button
                                                    onClick={() => handleRemoveTeacher(t.id, t.name)}
                                                    className="p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-10 border border-slate-200/60 dark:border-slate-800/60 shadow-sm group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Institutional Registry</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Protocol Data</p>
                                </div>
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="px-6 py-3 bg-white dark:bg-slate-900 border border-brand-500 text-brand-600 dark:text-brand-400 font-extrabold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-brand-50 transition-all shadow-sm"
                                >
                                    Modify Identity
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { k: 'Full Legal Name', v: school.name, icon: Shield },
                                    { k: 'Electronic Sync', v: school.email || 'Awaiting entry...', icon: Sparkles },
                                    { k: 'Phone Protocol', v: school.phone || 'Awaiting entry...', icon: Zap },
                                    { k: 'Registry Slug', v: `#${school.slug}`, c: 'text-brand-500' }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80 mb-2">{item.k}</p>
                                        <p className={`text-base font-bold ${item.c || 'text-slate-600 dark:text-slate-300'}`}>{item.v}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                    </div>
                </div>
            )}

            {/* Modals & Overlays */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl max-w-md w-full p-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="mb-10 text-center">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">Invite Staff</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">New Faculty Registry Entry</p>
                        </div>
                        <form onSubmit={handleAddTeacher} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                                <input type="text" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner" required placeholder="Staff Name" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</label>
                                <input type="email" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner" required placeholder="staff@example.com" />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800">Close</button>
                                <button type="submit" disabled={adding} className="flex-1 py-4 bg-brand-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-600">Sync Invitation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} editProfile={editProfile} setEditProfile={setEditProfile} onSubmit={handleUpdateProfile} saving={savingProfile} />
        </div>
    );
};

export default SchoolManagement;