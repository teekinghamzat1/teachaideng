import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../database';
import { School, Teacher } from '../types';
import {
    Users, UserPlus, UserCheck, UserX, Trash, Loader2, AlertCircle,
    SettingsIcon, Zap, Edit, Save, X, Shield, Sparkles, FileText, Clipboard, ArrowRight
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-900">Edit School Profile</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                            <input
                                type="text"
                                value={editProfile.name}
                                onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                required
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                            <textarea
                                value={editProfile.address}
                                onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                rows={3}
                                placeholder="Full street address, city, state"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Official Phone</label>
                            <input
                                type="tel"
                                value={editProfile.phone}
                                onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                placeholder="+234..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Official Email</label>
                            <input
                                type="email"
                                value={editProfile.email}
                                onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                placeholder="admin@school.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input
                                type="url"
                                value={editProfile.website}
                                onChange={(e) => setEditProfile({ ...editProfile, website: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Student Capacity</label>
                            <input
                                type="number"
                                value={editProfile.capacity}
                                onChange={(e) => setEditProfile({ ...editProfile, capacity: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile Details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SchoolManagement: React.FC = () => {
    const user = db.auth.getCurrentUser();
    const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'settings'>('overview');
    const [school, setSchool] = useState<School | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', gender: '' });
    const [adding, setAdding] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [editingLimit, setEditingLimit] = useState<string | null>(null);
    const [newLimitValue, setNewLimitValue] = useState<number>(0);
    const [updatingLimit, setUpdatingLimit] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [editProfile, setEditProfile] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        capacity: 0
    });
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        loadSchoolData();
    }, []);

    useEffect(() => {
        if (activeTab === 'overview') {
            loadActivities();
        }
    }, [activeTab]);

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
        if (!newTeacher.name || !newTeacher.email) {
            showAlert.warning('Required Fields', 'Name and email are required to invite a teacher.');
            return;
        }

        setAdding(true);
        try {
            await db.school.addTeacher(newTeacher.name, newTeacher.email, newTeacher.gender);
            showAlert.success('Teacher Invited', 'Invitation sent successfully. The teacher will receive an email with their login credentials.');
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
            showAlert.success('Status Updated', `Teacher status moved to ${newStatus}.`);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Update Failed', error.message || 'Failed to update status');
        }
    };

    const handleRemoveTeacher = async (teacherId: string, teacherName: string) => {
        if (await showAlert.confirm('Remove Teacher', `Are you sure you want to remove ${teacherName} from your school?`)) {
            try {
                await db.school.removeTeacher(teacherId);
                showAlert.success('Teacher Removed', 'The teacher has been removed from your school list.');
                loadSchoolData();
            } catch (error: any) {
                showAlert.error('Removal Failed', error.message || 'Failed to remove teacher');
            }
        }
    };

    const handleToggleAdmin = async (teacherId: string, teacherName: string, currentStatus: boolean) => {
        const action = currentStatus ? 'remove admin privileges from' : 'promote to admin';
        if (await showAlert.confirm(currentStatus ? 'Demote Admin' : 'Promote to Admin', `Are you sure you want to ${action} ${teacherName}?`)) {
            try {
                await db.school.toggleTeacherAdmin(teacherId, !currentStatus);
                const title = currentStatus ? 'Admin Removed' : 'Promoted to Admin';
                const message = currentStatus
                    ? `${teacherName} has been demoted. They must re-login to see changes.`
                    : `${teacherName} is now an admin! They must re-login for dashboard access.`;
                showAlert.success(title, message);
                loadSchoolData();
            } catch (error: any) {
                showAlert.error('Update Failed', error.message || 'Failed to update admin status');
            }
        }
    };

    const handleToggleAdminAccess = async (newValue: boolean) => {
        try {
            await db.school.updateSettings({ allowAdminAccess: newValue });
            showAlert.success('Settings Updated', `Teacher admin access ${newValue ? 'enabled' : 'disabled'} successfully`);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Update Failed', error.message || 'Failed to update settings');
        }
    };

    const handleUpdateLimit = async (teacherId: string) => {
        if (newLimitValue < 0) return;
        setUpdatingLimit(true);
        try {
            await db.school.updateTeacherLimit(teacherId, newLimitValue);
            showAlert.success('Limit Updated', 'Teacher lesson limit has been updated.');
            setEditingLimit(null);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Update Failed', error.message || 'Failed to update limit');
        } finally {
            setUpdatingLimit(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await db.school.updateProfile(editProfile);
            showAlert.success('Profile Updated', 'Your school details have been successfully updated.');
            setShowProfileModal(false);
            loadSchoolData();
        } catch (error: any) {
            showAlert.error('Update Failed', error.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    if (!school) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No School Found</h3>
                    <p className="text-slate-600">
                        You need an active School License to access this feature.
                    </p>
                </div>
            </div>
        );
    }

    const progressPercentage = (stats.totalTeachers / (school.teacherLimit || 1)) * 100;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-xl">
                            <Shield className="w-6 h-6 text-brand-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">School Management</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Control center for {school.name}</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('teachers')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'teachers' ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Teachers
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Settings
                    </button>
                </div>
            </div>

            {/* Profile Completion Warning */}
            {school && (!school.address || !school.phone || !school.email) && (
                <div className="mb-8 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-brand-100 dark:bg-brand-800 p-4 rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-brand-600" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-black text-brand-900 dark:text-brand-100">Complete Your Registry</h3>
                        <p className="text-brand-700 dark:text-brand-300 font-medium">Add your school's official address and contact to finalize the branding on generated notes.</p>
                    </div>
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-black hover:bg-brand-700 transition-all shadow-xl shadow-brand-200"
                    >
                        Complete Profile
                    </button>
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Hero Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-2 bg-gradient-to-br from-brand-600 to-brand-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-brand-200">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black mb-1">{school.name}</h2>
                                <p className="text-brand-100 font-semibold mb-8 text-sm uppercase tracking-widest">Administrative Hub</p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between font-bold text-sm">
                                        <span>Teacher Capacity</span>
                                        <span>{stats.totalTeachers} / {school.teacherLimit} Slots</span>
                                    </div>
                                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-brand-100 font-medium">{stats.slotsRemaining} available licenses</p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/20 rounded-full blur-2xl -ml-24 -mb-24" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                                    <UserCheck className="w-6 h-6" />
                                </div>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.activeTeachers}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active Staff</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.invitedTeachers}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Sync</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">{activities.length}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Weekly Signals</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 mb-4">
                                    <Users className="w-6 h-6" />
                                </div>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">{school.capacity || 0}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Student Reach</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Signals Feed */}
                        <div className="lg:col-span-2 flex flex-col">
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex-1 flex flex-col">
                                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">Teaching Signals</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Real-time system awareness</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Live Monitor</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-50 dark:divide-slate-700">
                                    {loadingActivities ? (
                                        <div className="p-12 text-center text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Syncing logs...</p>
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Zap className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="text-sm font-bold">No active signals detected</p>
                                            <p className="text-xs mt-1">Teaching activity will appear here as staff use the platform.</p>
                                        </div>
                                    ) : (
                                        activities.map((log) => {
                                            const meta = log.meta ? JSON.parse(log.meta) : {};
                                            return (
                                                <div key={log.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${log.action.includes('LESSON') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600'
                                                            }`}>
                                                            {log.action.includes('LESSON') ? <FileText className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                                {log.user?.name} <span className="text-slate-400 font-medium italic">processed a</span> {log.action === 'LESSON_GENERATION' ? 'Lesson Plan' : 'Assessment'}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                {meta.subject && <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-600">{meta.subject}</span>}
                                                                {meta.classLevel && <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-600">{meta.classLevel}</span>}
                                                                <span className="text-[10px] font-bold text-slate-400 ml-auto">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-700 text-center">
                                    <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors">Historical Logs Architecture</button>
                                </div>
                            </div>
                        </div>

                        {/* Side Panel: Intelligence & Attention */}
                        <div className="space-y-6">
                            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative group">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-black text-sm uppercase tracking-wider">Administrative Intelligence</h3>
                                    </div>
                                    <p className="text-indigo-50 text-sm leading-relaxed font-medium">
                                        {stats.totalTeachers > 0 && stats.activeTeachers < stats.totalTeachers
                                            ? "You have staff awaiting activation. Send a nudge to help them complete their onboarding."
                                            : stats.totalTeachers === 0
                                                ? "Start building your digital staffroom by inviting your first teacher."
                                                : "Your team is highly active. All staff members are successfully leveraging AI to streamline their lesson planning."}
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('teachers')}
                                        className="mt-8 w-full py-3 bg-white text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg"
                                    >
                                        Optimization Plan
                                    </button>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4">Subscription Status</h3>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-3xl font-black">{user?.subscriptionPlan || 'School'}</span>
                                        <span className="text-emerald-400 text-xs font-bold mb-1.5 uppercase tracking-widest">Active</span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                        Your institutional license is active with {stats.totalTeachers}/{school.teacherLimit} slots utilized.
                                    </p>
                                    <Link
                                        to="/pricing"
                                        className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors"
                                    >
                                        Manage Subscription <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-colors duration-500" />
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-6">Critical Attention</h3>
                                <div className="space-y-4">
                                    {stats.slotsRemaining < 2 && (
                                        <div className="flex gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-red-800 dark:text-red-200">Capacity Warning</p>
                                                <p className="text-[11px] text-red-600 dark:text-red-300 mt-1 font-bold">Only {stats.slotsRemaining} license slots remaining.</p>
                                            </div>
                                        </div>
                                    )}
                                    {school && (!school.address || !school.phone) && (
                                        <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600">
                                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                                                <SettingsIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-200">Missing Meta</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-bold">Incomplete profile affects PDF branding.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button className="mt-8 w-full py-3 border-2 border-slate-100 dark:border-slate-700 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    Dismiss Non-Criticals
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'teachers' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Teachers Registry</h2>
                            <p className="text-slate-500 font-medium">Management of your active teaching staff.</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            disabled={stats.slotsRemaining <= 0}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-[2rem] flex items-center gap-2 font-black transition-all shadow-xl shadow-brand-200/50 text-sm disabled:opacity-50"
                        >
                            <UserPlus className="w-5 h-5" />
                            Invite Teachers
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Teacher Identity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quota Utilization</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Onboarding</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {school.teachers && school.teachers.length > 0 ? (
                                        school.teachers.map((teacher) => (
                                            <tr
                                                key={teacher.id}
                                                onClick={() => setSelectedTeacher(teacher)}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg shadow-sm">
                                                            {teacher.name.split(' ')[0]?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 dark:text-white text-base leading-none mb-1">{teacher.name}</p>
                                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[150px]">{teacher.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${teacher.teacherStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                                                        teacher.teacherStatus === 'Invited' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                                                            'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                        }`}>
                                                        {teacher.teacherStatus}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {editingLimit === teacher.id ? (
                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="number"
                                                                value={newLimitValue}
                                                                onChange={(e) => setNewLimitValue(parseInt(e.target.value) || 0)}
                                                                className="w-20 px-2 py-1 border border-brand-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateLimit(teacher.id)}
                                                                disabled={updatingLimit}
                                                                className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                                                            >
                                                                {updatingLimit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingLimit(null)}
                                                                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                                {teacher.lessonsUsedThisMonth || 0} / {teacher.monthlyLessonLimit || 0}
                                                            </span>
                                                            <div className="w-20 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                                <div
                                                                    className="h-full bg-brand-400 rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(((teacher.lessonsUsedThisMonth || 0) / (teacher.monthlyLessonLimit || 1)) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                                        {new Date(teacher.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingLimit(teacher.id);
                                                                setNewLimitValue(teacher.monthlyLessonLimit || 0);
                                                            }}
                                                            className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        {teacher.id !== school?.ownerId && (
                                                            <button
                                                                onClick={() => handleToggleAdmin(teacher.id, teacher.name, teacher.isSchoolAdmin)}
                                                                className={`p-2.5 rounded-xl transition-all ${teacher.isSchoolAdmin ? "text-purple-600 bg-purple-50" : "text-blue-600 bg-blue-50"}`}
                                                            >
                                                                <SettingsIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRemoveTeacher(teacher.id, teacher.name)}
                                                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                                                <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                                <p className="text-lg font-black uppercase tracking-widest">Registry Empty</p>
                                                <p className="text-sm font-medium mt-1">Begin by finalizing an invitation for your staff.</p>
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
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Configuration</h2>
                        <p className="text-slate-500 font-medium">Define your institution's operational parameters.</p>
                    </div>

                    <div className="space-y-6">
                        {/* School Settings - Only for Owner */}
                        {school && school.ownerId === db.auth.getCurrentUser()?.id && (
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Access Protocol</h3>
                                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white">Admin Privileges</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Allow promoted teachers to manage registry and settings.</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleAdminAccess(!school.allowAdminAccess)}
                                        className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${school.allowAdminAccess ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        role="switch"
                                        aria-checked={school.allowAdminAccess}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${school.allowAdminAccess ? 'translate-x-6' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Institutional Profile</h3>
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="px-6 py-2 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    Update Identity
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Name</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{school.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Physical Location</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{school.address || <span className="text-slate-300 italic">Not finalized</span>}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Electronic Reach</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{school.email || <span className="text-slate-300 italic">No official email</span>}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unique Identifier</p>
                                        <p className="text-base font-bold text-brand-600 uppercase tracking-tighter">#{school.slug}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Protocol</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{school.phone || <span className="text-slate-300 italic">No phone record</span>}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Web Architecture</p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white truncate">{school.website || <span className="text-slate-300 italic">No domain linked</span>}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Licensing & Plan</h3>
                                    <Link
                                        to="/pricing"
                                        className="px-6 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                                    >
                                        Manage Subscription
                                    </Link>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Plan</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{user?.subscriptionPlan || 'School License'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teacher Quota</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalTeachers} / {school.teacherLimit} Slots Used</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Detail Slide Panel */}
            {selectedTeacher && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setSelectedTeacher(null)}
                    />
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-[0_0_80px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[3rem]">
                        <div className="p-10 flex-1 overflow-y-auto">
                            <div className="flex justify-between items-start mb-12">
                                <div className="w-24 h-24 rounded-[2rem] bg-brand-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-brand-200">
                                    {selectedTeacher.name.split(' ')[0]?.[0]}
                                </div>
                                <button
                                    onClick={() => setSelectedTeacher(null)}
                                    className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2">{selectedTeacher.name}</h3>
                                <p className="text-lg text-slate-500 font-bold uppercase tracking-widest">{selectedTeacher.isSchoolAdmin ? 'Administrative Faculty' : 'Teaching Faculty'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-12">
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-600">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Usage</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedTeacher.lessonsUsedThisMonth || 0}</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Finalized Lessons</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-600">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                                    <p className={`text-2xl font-black ${selectedTeacher.teacherStatus === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedTeacher.teacherStatus}</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">System State</p>
                                </div>
                            </div>

                            <div className="mb-12">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Teaching Impact (Recent Activity)</h4>
                                <div className="space-y-4">
                                    {activities.filter(a => a.userId === selectedTeacher.id).length > 0 ? (
                                        activities
                                            .filter(a => a.userId === selectedTeacher.id)
                                            .slice(0, 5)
                                            .map(log => (
                                                <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.action === 'LESSON_GENERATION' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {log.action === 'LESSON_GENERATION' ? <FileText className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                            {log.action === 'LESSON_GENERATION' ? 'Lesson Plan' : 'Assessment'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                                            <Sparkles className="w-8 h-8 mx-auto mb-3 text-slate-200" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No activity data yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Contact Identity</h4>
                                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                        <div className="truncate">
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{selectedTeacher.email}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Primary Sync Point</p>
                                        </div>
                                        <button className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all">Copy</button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Registry Timeline</h4>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Member since {new Date(selectedTeacher.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTeacher(selectedTeacher.id, selectedTeacher.name);
                                }}
                                className="py-4 px-6 border-2 border-red-100 dark:border-red-900/30 text-red-600 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                                Remove Staff
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLimit(selectedTeacher.id);
                                    setNewLimitValue(selectedTeacher.monthlyLessonLimit || 0);
                                }}
                                className="py-4 px-6 bg-brand-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-200"
                            >
                                Edit Quota
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Teacher Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Add New Teacher</h3>
                        <form onSubmit={handleAddTeacher}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newTeacher.name}
                                        onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={newTeacher.email}
                                        onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Gender (Optional)
                                    </label>
                                    <select
                                        value={newTeacher.gender}
                                        onChange={(e) => setNewTeacher({ ...newTeacher, gender: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewTeacher({ name: '', email: '', gender: '' });
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                                >
                                    {adding ? 'Adding...' : 'Add Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                editProfile={editProfile}
                setEditProfile={setEditProfile}
                onSubmit={handleUpdateProfile}
                saving={savingProfile}
            />
        </div>
    );
};

export default SchoolManagement;
