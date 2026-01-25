import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../database';
import { School, Teacher } from '../types';
import {
    Users, UserPlus, UserCheck, UserX, Trash, Loader2, AlertCircle,
    SettingsIcon, Zap, Edit, Save, X, Shield, Sparkles, FileText, Clipboard, ArrowRight, ChevronRight, BookOpen, Search
} from '../components/Icons';
import { showAlert } from '../utils/alerts';

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
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800/50 animate-in zoom-in-95 duration-500">
                <div className="p-8 lg:p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#16A34A]/10 rounded-2xl flex items-center justify-center text-[#16A34A]">
                            <Edit className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Registry Profile</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Identity</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-8 lg:p-10 overflow-y-auto space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Official School Name</label>
                            <input
                                type="text"
                                value={editProfile.name}
                                onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all"
                                required
                                placeholder="Enter school name"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Physical Campus Address</label>
                            <textarea
                                value={editProfile.address}
                                onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all resize-none"
                                rows={3}
                                placeholder="Enter address"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Primary Hotline</label>
                            <input
                                type="tel"
                                value={editProfile.phone}
                                onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all"
                                placeholder="+234..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contact Protocol Email</label>
                            <input
                                type="email"
                                value={editProfile.email}
                                onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all"
                                placeholder="school@example.com"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-100 dark:border-slate-800 hover:bg-slate-100 transition-all"
                        >
                            Cancel Changes
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-5 bg-[#16A34A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-[#16A34A]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync Identity"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SchoolManagement: React.FC = () => {
    const userProfile = db.auth.getCurrentUser();
    const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'settings'>('overview');
    const [school, setSchool] = useState<School | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', gender: '' });
    const [adding, setAdding] = useState(false);
    const [editingLimit, setEditingLimit] = useState<string | null>(null);
    const [newLimitValue, setNewLimitValue] = useState<number>(0);
    const [updatingLimit, setUpdatingLimit] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [editProfile, setEditProfile] = useState({
        name: '', address: '', phone: '', email: '', website: '', capacity: 0
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
            showAlert.error('Load Error', error.message || 'Failed to load school data');
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
            showAlert.success('Teacher Invited', 'Invitation sent successfully. Check your staff list.');
            setNewTeacher({ name: '', email: '', gender: '' });
            setShowAddModal(false);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Invite Failed', error.message || 'Failed to add teacher');
        } finally {
            setAdding(false);
        }
    };

    const handleUpdateStatus = async (teacherId: string, newStatus: string) => {
        try {
            await db.school.updateTeacherStatus(teacherId, newStatus);
            showAlert.success('Status Updated', `System state: ${newStatus}.`);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Update Failed', error.message || 'Failed');
        }
    };

    const handleRemoveTeacher = async (teacherId: string, teacherName: string) => {
        if (await showAlert.confirm('Remove Teacher', `Finalize removal of ${teacherName}?`)) {
            try {
                await db.school.removeTeacher(teacherId);
                showAlert.success('Staff Removed', 'Teacher deleted from institutional registry.');
                loadSchoolData();
            } catch (error: any) {
                showAlert.error('Failure', 'Could not remove staff member.');
            }
        }
    };

    const handleToggleAdmin = async (teacherId: string, teacherName: string, currentStatus: boolean) => {
        if (await showAlert.confirm(currentStatus ? 'Revoke Admin' : 'Grant Admin', `Proceed with role modification for ${teacherName}?`)) {
            try {
                await db.school.toggleTeacherAdmin(teacherId, !currentStatus);
                showAlert.success('Identity Updated', 'Teacher must re-login to reflect privileges.');
                loadSchoolData();
            } catch (error: any) {
                showAlert.error('Failure', 'Update failed.');
            }
        }
    };

    const handleToggleAdminAccess = async (newValue: boolean) => {
        try {
            await db.school.updateSettings({ allowAdminAccess: newValue });
            showAlert.success('System Updated', `Administrative bridge ${newValue ? 'active' : 'dormant'}`);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Failed', 'Protocol update failed.');
        }
    };

    const handleUpdateLimit = async (teacherId: string) => {
        setUpdatingLimit(true);
        try {
            await db.school.updateTeacherLimit(teacherId, newLimitValue);
            showAlert.success('Quota Synced', 'Staff generation limit updated.');
            setEditingLimit(null);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Failure', 'Update mismatch.');
        } finally {
            setUpdatingLimit(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await db.school.updateProfile(editProfile);
            showAlert.success('Synched', 'Organizational registry updated.');
            setShowProfileModal(false);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Error', 'Update rejected by server.');
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
            <Loader2 className="w-12 h-12 animate-spin text-[#16A34A]" />
        </div>
    );

    if (!school) return (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <AlertCircle className="w-20 h-20 text-[#6B7280] dark:text-slate-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-[#111827] dark:text-white mb-4">No School Linked</h1>
            <p className="text-[#6B7280] dark:text-slate-400 max-w-sm mx-auto font-medium mb-10">You require an institutional license to activate the School Hub.</p>
            <Link to="/pricing" className="px-10 py-4 bg-[#16A34A] text-white rounded-2xl font-bold tracking-widest uppercase text-xs shadow-2xl shadow-[#16A34A]/20">Upgrade Now</Link>
        </div>
    );

    const progressPercentage = (stats.totalTeachers / (school.teacherLimit || 1)) * 100;

    return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 transition-colors duration-300 w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10 space-y-6 lg:space-y-10 w-full max-w-full overflow-x-hidden relative">

                {/* Mobile View Header & Mobile Structure */}
                <div className="lg:hidden space-y-6">
                    {/* Brand/Title */}
                    <div className="flex flex-col gap-1 overflow-hidden">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-lg shadow-[#16A34A]/20 flex-shrink-0">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#111827] dark:text-white truncate">School Management</h1>
                        </div>
                        <p className="text-[#6B7280] dark:text-slate-400 text-sm font-medium ml-[52px] break-words">Control center for {school.name}</p>
                    </div>

                    {/* Main Institutional Card (Mobile) */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#F9FAFB] dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                <Shield className="w-6 h-6 text-[#16A34A]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#111827] dark:text-white">{school.name}</h2>
                                <p className="text-[10px] text-[#6B7280] dark:text-slate-400 font-bold uppercase tracking-widest">Administrative Hub</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-[#6B7280] dark:text-slate-400 mb-2">Teacher Capacity</p>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 h-3 bg-[#F9FAFB] dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-[#16A34A] rounded-full transition-all duration-1000 shadow-lg shadow-[#16A34A]/20"
                                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-[#111827] dark:text-white whitespace-nowrap">{stats.totalTeachers} / {school.teacherLimit} Slots</span>
                                </div>
                                <p className="text-[10px] text-[#6B7280] dark:text-slate-500 mt-2 italic font-medium">{stats.slotsRemaining} available licenses</p>
                            </div>
                        </div>

                        {/* Mobile Grid Layout as per Image */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            {/* Card 1: Active Staff */}
                            <div className="bg-[#F9FAFB] dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-[#16A34A]/10 rounded-lg flex items-center justify-center border border-[#16A34A]/20">
                                        <UserCheck className="w-4 h-4 text-[#16A34A]" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[#111827] dark:text-white leading-none">{stats.activeTeachers}</p>
                                <p className="text-[9px] font-bold text-[#6B7280] dark:text-slate-400 uppercase tracking-widest mt-1">Active Staff</p>
                            </div>

                            {/* Card 2: Pending Sync */}
                            <div className="bg-[#F9FAFB] dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-[#FBBF24]/10 rounded-lg flex items-center justify-center border border-[#FBBF24]/20">
                                        <UserPlus className="w-4 h-4 text-[#FBBF24]" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[#111827] dark:text-white leading-none">{stats.invitedTeachers}</p>
                                <p className="text-[9px] font-bold text-[#6B7280] dark:text-slate-400 uppercase tracking-widest mt-1">Pending Sync</p>
                            </div>

                            {/* Card 3: Weekly Signals (Full Width below) */}
                            <div className="col-span-2 bg-[#F9FAFB] dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center border border-[#3B82F6]/20 shadow-sm shadow-[#3B82F6]/10">
                                    <Zap className="w-5 h-5 text-[#3B82F6]" />
                                </div>
                                <div className="flex items-center justify-between flex-1">
                                    <span className="text-sm font-bold text-[#111827] dark:text-white uppercase tracking-widest">Weekly Signals</span>
                                    <span className="text-xl font-bold text-[#111827] dark:text-white">{activities.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Card (Mobile) */}
                    <div className="bg-gradient-to-br from-[#16A34A]/5 to-[#FBBF24]/10 dark:from-[#16A34A]/20 dark:to-[#FBBF24]/10 rounded-[2rem] p-6 border border-[#16A34A]/20 shadow-xl shadow-[#16A34A]/5 flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-[#FBBF24]/30 shadow-lg shadow-[#FBBF24]/10 flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-[#FBBF24]" />
                        </div>
                        <h3 className="font-bold text-xs text-[#111827] dark:text-white uppercase tracking-widest leading-relaxed line-clamp-2">Administrative Intelligence</h3>
                    </div>

                    {/* Tabs Selector for Mobile */}
                    <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
                        {['overview', 'teachers', 'settings'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 min-w-[80px] px-2 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${activeTab === tab ? "bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/20" : "text-[#6B7280] dark:text-slate-400"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop View Header & Tabs */}
                <div className="hidden lg:flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#16A34A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#16A34A]/20">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#111827] dark:text-white">Management</h1>
                            <p className="text-[#6B7280] dark:text-slate-400">{school.name} Admin Panel</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        {['overview', 'teachers', 'settings'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? "bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/20" : "text-[#6B7280] dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-800"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Desktop Hero Section (Hidden on Mobile) */}
                        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden relative group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-[#F9FAFB] dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                                        <Shield className="w-8 h-8 text-[#16A34A]" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#111827] dark:text-white">{school.name}</h2>
                                        <p className="text-sm text-[#6B7280] dark:text-slate-400 font-medium">Administrative Hub</p>
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <div className="flex items-center justify-between text-sm font-semibold text-[#6B7280] dark:text-slate-400 mb-3">
                                        <span>Teacher Capacity Sync</span>
                                        <span className="text-[#111827] dark:text-white">{stats.totalTeachers} / {school.teacherLimit} Slots</span>
                                    </div>
                                    <div className="h-4 bg-[#F9FAFB] dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-[#16A34A] rounded-full transition-all duration-1000 shadow-lg shadow-[#16A34A]/20"
                                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-[#6B7280] dark:text-slate-500 mt-2 italic font-medium">Available Licenses: {stats.slotsRemaining}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-[#F9FAFB] dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-[#16A34A] dark:hover:border-[#16A34A] transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                                <UserCheck className="w-6 h-6 text-[#16A34A]" />
                                            </div>
                                            <p className="text-sm font-semibold text-[#6B7280] dark:text-slate-400">Active Staff</p>
                                        </div>
                                        <p className="text-4xl font-bold text-[#111827] dark:text-white">{stats.activeTeachers}</p>
                                    </div>

                                    <div className="bg-[#F9FAFB] dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-[#FBBF24] dark:hover:border-[#FBBF24] transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                                <UserPlus className="w-6 h-6 text-[#FBBF24]" />
                                            </div>
                                            <p className="text-sm font-semibold text-[#6B7280] dark:text-slate-400">Pending Sync</p>
                                        </div>
                                        <p className="text-4xl font-bold text-[#111827] dark:text-white">{stats.invitedTeachers}</p>
                                    </div>

                                    <div className="bg-[#F9FAFB] dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-[#3B82F6] dark:hover:border-[#3B82F6] transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                                <Zap className="w-6 h-6 text-[#3B82F6]" />
                                            </div>
                                            <p className="text-sm font-semibold text-[#6B7280] dark:text-slate-400">Weekly Signals</p>
                                        </div>
                                        <p className="text-4xl font-bold text-[#111827] dark:text-white">{activities.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Common Signals/Content Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                                    <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-[#F9FAFB] dark:bg-slate-900/50">
                                        <div>
                                            <h3 className="text-lg lg:text-xl font-bold text-[#111827] dark:text-white">Teaching Signals</h3>
                                            <p className="text-xs lg:text-sm text-[#6B7280] dark:text-slate-400">Real-time system awareness</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#16A34A]/10 rounded-full border border-[#16A34A]/20">
                                            <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse"></span>
                                            <span className="text-xs font-semibold text-[#16A34A]">Live Monitor</span>
                                        </div>
                                    </div>

                                    <div className="p-4 lg:p-6 max-h-[500px] overflow-y-auto custom-scrollbar space-y-4">
                                        {activities.length === 0 ? (
                                            <div className="text-center py-20 opacity-30 text-[#6B7280]">
                                                <Zap className="w-16 h-16 mx-auto mb-4" />
                                                <p className="font-bold flex flex-col items-center uppercase tracking-widest text-sm text-center">
                                                    Awaiting First Signal
                                                </p>
                                            </div>
                                        ) : (
                                            activities.map((log) => {
                                                const meta = log.meta ? JSON.parse(log.meta) : {};
                                                return (
                                                    <div key={log.id} className="group bg-[#F9FAFB] dark:bg-slate-800/80 rounded-2xl p-4 lg:p-5 border border-slate-200 dark:border-slate-700 hover:border-[#16A34A] transition-all duration-300">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${log.action.includes('LESSON') ? 'bg-[#16A34A] text-white shadow-[#16A34A]/20' : 'bg-[#3B82F6] text-white shadow-[#3B82F6]/20'}`}>
                                                                {log.action.includes('LESSON') ? <FileText className="w-5 h-5 lg:w-6 lg:h-6" /> : <Clipboard className="w-5 h-5 lg:w-6 lg:h-6" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs lg:text-sm font-semibold text-[#111827] dark:text-white truncate">
                                                                    {log.user?.name} <span className="text-[#6B7280] dark:text-slate-400 font-normal">synced</span> {log.action === 'LESSON_GENERATION' ? 'Lesson' : 'Quiz'}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1 lg:mt-2">
                                                                    {meta.subject && <span className="px-2 py-0.5 bg-white dark:bg-slate-900 text-[9px] lg:text-[10px] font-bold text-[#6B7280] dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700">{meta.subject}</span>}
                                                                    <span className="ml-auto text-[10px] text-[#6B7280] dark:text-slate-500">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="hidden lg:block bg-gradient-to-br from-[#16A34A]/5 to-[#FBBF24]/10 dark:from-[#16A34A]/20 dark:to-[#FBBF24]/10 rounded-3xl lg:rounded-[2rem] p-8 border border-[#16A34A]/20 shadow-xl shadow-[#16A34A]/5">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-[#FBBF24]/30 shadow-lg shadow-[#FBBF24]/20">
                                            <Sparkles className="w-6 h-6 text-[#FBBF24]" />
                                        </div>
                                        <h3 className="font-bold text-[#111827] dark:text-white">Admin Intelligence</h3>
                                    </div>
                                    <p className="text-[#6B7280] dark:text-slate-400 text-sm leading-relaxed mb-8">
                                        {stats.activeTeachers === stats.totalTeachers ? "High operational excellence detected. All staff members are active." : "Onboarding gap identified. Nudge inactive staff to finalize registry sync."}
                                    </p>
                                    <button onClick={() => setActiveTab('teachers')} className="w-full py-3.5 bg-white dark:bg-slate-900 border-2 border-[#16A34A] text-[#16A34A] dark:text-[#34d399] rounded-xl font-bold hover:bg-[#F9FAFB] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">View Staff Registry</button>
                                </div>

                                <button onClick={() => setShowAddModal(true)} disabled={stats.slotsRemaining <= 0} className="w-full py-4 bg-[#16A34A] text-white rounded-2xl lg:rounded-[1.5rem] font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-[#16A34A]/30 flex items-center justify-center gap-3">
                                    <UserPlus className="w-6 h-6" /> Invite Staff
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'teachers' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <Users className="w-6 h-6 text-[#16A34A]" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff Registry</h1>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Institutional Faculty Control</p>
                                </div>
                            </div>
                            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative w-full sm:w-64 group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-300 group-focus-within:text-[#16A34A] transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold placeholder:text-slate-300 outline-none focus:border-[#16A34A] transition-all shadow-sm"
                                        placeholder="Search faculty..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => setShowAddModal(true)} disabled={stats.slotsRemaining <= 0} className="w-full sm:w-auto px-10 py-3.5 bg-[#16A34A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-[#16A34A]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    <UserPlus className="w-5 h-5" /> Invite Staff
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/20 w-full">
                            <div className="overflow-x-auto custom-scrollbar w-full">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                            {['Identity', 'Status Protocol', 'Monthly Gen Quota', 'Sync Origin', 'Actions'].map((h, i) => (
                                                <th key={i} className={`px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {(school.teachers || []).filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                            (school.teachers || []).filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase())).map((t) => (
                                                <tr key={t.id} onClick={() => setSelectedTeacher(t)} className="group hover:bg-[#16A34A]/[0.02] cursor-pointer transition-all">
                                                    <td className="px-8 py-6 min-w-[280px]">
                                                        <div className="flex items-center gap-5">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg relative group-hover:scale-105 transition-transform ${t.teacherStatus === 'Active' ? 'bg-gradient-to-br from-[#16A34A] to-[#15803d]' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                                {t.name[0]}
                                                                {t.teacherStatus === 'Active' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#16A34A] border-2 border-white dark:border-slate-900 rounded-full"></div>}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-slate-900 dark:text-white text-lg truncate group-hover:text-[#16A34A] transition-colors leading-tight">{t.name}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70 truncate">{t.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${t.teacherStatus === 'Active' ? 'bg-[#16A34A]/5 text-[#16A34A] border-[#16A34A]/10' : 'bg-amber-500/5 text-amber-500 border-amber-500/10'}`}>
                                                            {t.teacherStatus === 'Active' ? 'Sync Active' : 'Pending Link'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 min-w-[180px]">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-[10px] font-black">
                                                                <span className="text-slate-400 uppercase tracking-widest">{t.lessonsUsedThisMonth || 0} Synced</span>
                                                                <span className="text-slate-900 dark:text-white">{t.monthlyLessonLimit} Cap</span>
                                                            </div>
                                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                                <div className="h-full bg-gradient-to-r from-[#16A34A] to-[#34d399] transition-all duration-1000" style={{ width: `${Math.min(((t.lessonsUsedThisMonth || 0) / (t.monthlyLessonLimit || 1)) * 100, 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-wider">{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                    <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                            <button onClick={() => { setEditingLimit(t.id); setNewLimitValue(t.monthlyLessonLimit || 0); }} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-[#16A34A] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:scale-110"><Edit className="w-4 h-4" /></button>
                                                            <button onClick={() => handleRemoveTeacher(t.id, t.name)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:scale-110"><Trash className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-32">
                                                    <div className="flex flex-col items-center text-center space-y-6">
                                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-inner">
                                                            <Users className="w-12 h-12" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">No faculty found</h3>
                                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Institutional Search Mismatch</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 max-w-5xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                                <SettingsIcon className="w-6 h-6 text-[#16A34A]" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Protocol</h1>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Institutional Configuration Hub</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] p-8 lg:p-12 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A34A]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#16A34A]/10 transition-colors"></div>

                                <div className="flex items-center justify-between mb-12 relative z-10">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Organizational Profile</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-80 decoration-2 decoration-[#16A34A]/30 underline underline-offset-4 font-bold">Registry Info</p>
                                    </div>
                                    <button onClick={() => setShowProfileModal(true)} className="px-8 py-4 bg-white dark:bg-slate-900 border-2 border-[#16A34A]/20 text-[#16A34A] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#16A34A] hover:bg-slate-50 transition-all shadow-sm">Update Identity</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                    {[
                                        { k: 'Identity', v: school.name, icon: <Shield className="w-4 h-4" /> },
                                        { k: 'Physical Location', v: school.address || 'Awaiting entry', icon: <Edit className="w-4 h-4" /> },
                                        { k: 'Electronic Sync', v: school.email || 'Awaiting entry', icon: <Sparkles className="w-4 h-4" /> },
                                        { k: 'Phone Protocol', v: school.phone || 'Awaiting entry', icon: <Edit className="w-4 h-4" /> },
                                        { k: 'Slug Unique Protocol', v: `#${school.slug}`, c: 'text-[#16A34A] font-black italic', icon: <Zap className="w-4 h-4" /> },
                                        { k: 'Faculty Quota', v: `${stats.totalTeachers} / ${school.teacherLimit} Staff Capacity`, icon: <Users className="w-4 h-4" /> }
                                    ].map((item, i) => (
                                        <div key={i} className="group/item flex items-start gap-4 p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-[#16A34A]/30 transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-[#16A34A] shadow-sm border border-slate-50 dark:border-slate-800 group-hover/item:scale-110 transition-transform">
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80">{item.k}</p>
                                                <p className={`text-base font-bold mt-1.5 truncate ${item.c || 'text-slate-900 dark:text-white'}`}>{item.v}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide Panel for Teacher Details */}
            {selectedTeacher && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setSelectedTeacher(null)} />
                    <div className="relative w-full max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-700 rounded-l-[3rem] border-l border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                        <div className="p-8 lg:p-14 flex-1 overflow-y-auto custom-scrollbar space-y-12">
                            <div className="flex justify-between items-start">
                                <div className="relative group">
                                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[2.5rem] bg-gradient-to-br from-[#16A34A] to-[#15803d] text-white text-4xl lg:text-6xl flex items-center justify-center font-black shadow-2xl shadow-[#16A34A]/30 transition-transform group-hover:rotate-6">
                                        {selectedTeacher.name[0]}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-800">
                                        <Shield className="w-5 h-5 text-[#16A34A]" />
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTeacher(null)} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all hover:rotate-90">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{selectedTeacher.name}</h3>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] rounded-full border border-slate-200 dark:border-slate-700">
                                        {selectedTeacher.isSchoolAdmin ? "Faculty Administrator" : "Teaching Staff"}
                                    </span>
                                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${selectedTeacher.teacherStatus === 'Active' ? "bg-[#16A34A]/5 text-[#16A34A] border-[#16A34A]/10" : "bg-amber-500/5 text-amber-500 border-amber-500/10"}`}>
                                        {selectedTeacher.teacherStatus === 'Active' ? "Registry Active" : "Pending Sync"}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 lg:gap-6">
                                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group/card transition-all hover:bg-white dark:hover:bg-slate-800">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 opacity-80">Sync Activity</p>
                                    <p className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white group-hover/card:text-[#16A34A] transition-colors">{selectedTeacher.lessonsUsedThisMonth || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">Gens this cycle</p>
                                </div>
                                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group/card transition-all hover:bg-white dark:hover:bg-slate-800">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 opacity-80">Generation Limit</p>
                                    <p className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white group-hover/card:text-[#16A34A] transition-colors">{selectedTeacher.monthlyLessonLimit}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">Monthly Tier</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Signals</h4>
                                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    {activities.filter(a => a.userId === selectedTeacher.id).length > 0 ? (
                                        activities.filter(a => a.userId === selectedTeacher.id).slice(0, 5).map(log => (
                                            <div key={log.id} className="p-5 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-5 shadow-sm hover:border-[#16A34A] transition-all group/log">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 transition-transform group-hover/log:scale-110 ${log.action === 'LESSON_GENERATION' ? "bg-[#16A34A] shadow-[#16A34A]/20" : "bg-blue-500 shadow-blue-500/20"}`}>
                                                    {log.action === 'LESSON_GENERATION' ? <FileText className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1 truncate">{log.action === 'LESSON_GENERATION' ? "Lesson Mastery Generation" : "Quiz Assessment Sync"}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">{new Date(log.createdAt).toLocaleDateString()} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] text-slate-200 dark:text-slate-800">
                                            <Sparkles className="w-12 h-12 mx-auto mb-4" />
                                            <p className="font-black text-[10px] tracking-[0.3em] uppercase">Awaiting Registry Signals</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden group/id">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/5 blur-2xl rounded-full translate-x-12 -translate-y-12"></div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10 opacity-70">Registry Identification Protocol</p>
                                <p className="text-lg lg:text-xl font-black text-slate-900 dark:text-white truncate relative z-10 group-hover/id:text-[#16A34A] transition-colors">{selectedTeacher.email}</p>
                            </div>
                        </div>

                        <div className="p-8 lg:p-14 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-6 relative z-10">
                            <button onClick={e => { e.stopPropagation(); handleRemoveTeacher(selectedTeacher.id, selectedTeacher.name); }} className="py-5 bg-white dark:bg-slate-800 border-2 border-red-100 dark:border-red-900/30 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center">Terminate Access</button>
                            <button onClick={e => { e.stopPropagation(); setEditingLimit(selectedTeacher.id); setNewLimitValue(selectedTeacher.monthlyLessonLimit || 0); }} className="py-5 bg-[#16A34A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#16A34A]/20 hover:scale-[1.02] transition-all flex items-center justify-center">Adjust Limits</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invitation Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl max-w-md w-full p-8 lg:p-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="mb-8 lg:mb-10 text-center">
                            <h3 className="text-2xl lg:text-3xl font-bold text-[#111827] dark:text-white leading-tight">Invite Faculty</h3>
                            <p className="text-sm text-[#6B7280] dark:text-slate-400 mt-2 font-medium">New Staff Onboarding Profile</p>
                        </div>
                        <form onSubmit={handleAddTeacher} className="space-y-6 lg:space-y-8">
                            <div>
                                <label className="block text-sm font-semibold text-[#111827] dark:text-white mb-2">Staff Name</label>
                                <input type="text" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-5 py-4 text-base text-[#111827] dark:text-white focus:ring-2 focus:ring-[#16A34A] transition-all" required placeholder="Full name" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#111827] dark:text-white mb-2">Sync Email</label>
                                <input type="email" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-5 py-4 text-base text-[#111827] dark:text-white focus:ring-2 focus:ring-[#16A34A] transition-all" required placeholder="Institutional email" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8 lg:mt-12">
                                <button type="button" onClick={() => setShowAddModal(false)} className="py-4 bg-white dark:bg-slate-800 border-2 border-[#16A34A] text-[#16A34A] dark:text-[#34d399] rounded-xl font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">Cancel</button>
                                <button type="submit" disabled={adding} className="py-4 bg-[#16A34A] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-[#16A34A]/20 whitespace-nowrap">Send Invite</button>
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