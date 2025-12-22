import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { School, Teacher } from '../types';
import { Users, UserPlus, UserCheck, UserX, Trash, Loader2, AlertCircle, SettingsIcon, Zap, Edit, Save, X } from '../components/Icons';
import { showAlert } from '../utils/alerts';

const SchoolManagement: React.FC = () => {
    const [school, setSchool] = useState<School | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', gender: '' });
    const [adding, setAdding] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [editingLimit, setEditingLimit] = useState<string | null>(null);
    const [newLimitValue, setNewLimitValue] = useState<number>(0);
    const [updatingLimit, setUpdatingLimit] = useState(false);

    useEffect(() => {
        loadSchoolData();
    }, []);

    const loadSchoolData = async () => {
        setLoading(true);
        try {
            const data = await db.school.getDetails();
            setSchool(data.school);
            setStats(data.stats);
        } catch (error: any) {
            console.error('Failed to load school data:', error);
            showAlert.error('Load Error', error.message || 'Failed to load school data');
        } finally {
            setLoading(false);
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
            const result = await db.school.addTeacher(newTeacher.name, newTeacher.email, newTeacher.gender);
            setTempPassword(result.tempPassword); // Temporary - will be sent via email in production
            showAlert.success('Teacher Invited', `Invitation sent! Temporary password: ${result.tempPassword}`);
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

    const progressPercentage = (stats.totalTeachers / school.teacherLimit) * 100;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">School Management</h1>
                <p className="text-slate-600">Manage your teachers and school settings</p>
            </div>

            {/* School Overview Card */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg p-6 text-white mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">{school.name}</h2>
                        <p className="text-brand-100 text-sm">School ID: {school.slug}</p>
                    </div>
                    <Users className="w-12 h-12 text-white/30" />
                </div>

                {/* Teacher Limit Progress */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Teachers</span>
                        <span className="text-sm font-bold">{stats.totalTeachers} / {school.teacherLimit}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                        <div
                            className="bg-white rounded-full h-3 transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-brand-100 mt-1">
                        {stats.slotsRemaining} slots remaining
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <UserCheck className="w-5 h-5 mb-1" />
                        <p className="text-2xl font-bold">{stats.activeTeachers}</p>
                        <p className="text-xs text-brand-100">Active</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <UserPlus className="w-5 h-5 mb-1" />
                        <p className="text-2xl font-bold">{stats.invitedTeachers}</p>
                        <p className="text-xs text-brand-100">Invited</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <UserX className="w-5 h-5 mb-1" />
                        <p className="text-2xl font-bold">{stats.suspendedTeachers}</p>
                        <p className="text-xs text-brand-100">Suspended</p>
                    </div>
                </div>
            </div>

            {/* School Settings - Only for Owner */}
            {school && school.ownerId === db.auth.getCurrentUser()?.id && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">School Settings</h3>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-slate-900">Allow Teacher Admin Access</h4>
                            <p className="text-sm text-slate-500 mt-1">When enabled, promoted teachers can access School Management</p>
                        </div>
                        <button
                            onClick={() => handleToggleAdminAccess(!school.allowAdminAccess)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${school.allowAdminAccess ? 'bg-brand-600' : 'bg-slate-200'}`}
                            role="switch"
                            aria-checked={school.allowAdminAccess}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${school.allowAdminAccess ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>
                </div>
            )}

            {/* Teachers List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Teachers</h3>
                    <button
                        onClick={() => setShowAddModal(true)}
                        disabled={stats.slotsRemaining <= 0}
                        className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Teacher
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quota / Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {school.teachers && school.teachers.length > 0 ? (
                                school.teachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{teacher.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600">{teacher.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${teacher.teacherStatus === 'Active' ? 'bg-green-100 text-green-800' :
                                                teacher.teacherStatus === 'Invited' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {teacher.teacherStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingLimit === teacher.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={newLimitValue}
                                                        onChange={(e) => setNewLimitValue(parseInt(e.target.value) || 0)}
                                                        className="w-20 px-2 py-1 border border-brand-300 rounded text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateLimit(teacher.id)}
                                                        disabled={updatingLimit}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    >
                                                        {updatingLimit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingLimit(null)}
                                                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-semibold text-slate-700">
                                                        {teacher.lessonsUsedThisMonth || 0} / {teacher.monthlyLessonLimit || 0}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setEditingLimit(teacher.id);
                                                            setNewLimitValue(teacher.monthlyLessonLimit || 0);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                                                        title="Edit Limit"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(teacher.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {teacher.teacherStatus === 'Active' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(teacher.id, 'Suspended')}
                                                        className="text-yellow-600 hover:text-yellow-800"
                                                        title="Suspend"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {teacher.teacherStatus === 'Suspended' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(teacher.id, 'Active')}
                                                        className="text-green-600 hover:text-green-800"
                                                        title="Activate"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {teacher.id !== school?.ownerId && (
                                                    <button
                                                        onClick={() => handleToggleAdmin(teacher.id, teacher.name, teacher.isSchoolAdmin)}
                                                        className={teacher.isSchoolAdmin ? "text-purple-600 hover:text-purple-800" : "text-blue-600 hover:text-blue-800"}
                                                        title={teacher.isSchoolAdmin ? "Remove Admin" : "Make Admin"}
                                                    >
                                                        <SettingsIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveTeacher(teacher.id, teacher.name)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Remove"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>No teachers added yet</p>
                                        <p className="text-sm mt-1">Click "Add Teacher" to invite your first teacher</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </div>
    );
};

export default SchoolManagement;
