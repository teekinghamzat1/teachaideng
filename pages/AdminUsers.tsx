import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { User } from '../types';
import { Search, Filter, MoreVertical, Edit, Trash, CheckSquare, XSquare, Loader2 } from '../components/Icons';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Teacher', subscriptionPlan: 'Free' });

    // Teacher Limit Modal
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [newLimit, setNewLimit] = useState(15);
    const [creating, setCreating] = useState(false);

    // Broadcast State
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [broadcastData, setBroadcastData] = useState({ title: '', message: '', type: 'info' as 'info' | 'alert' | 'success' });
    const [broadcasting, setBroadcasting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await db.admin.getAllUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };



    // Manage Broadcasts state
    const [isManageBroadcastsOpen, setIsManageBroadcastsOpen] = useState(false);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [editingBroadcast, setEditingBroadcast] = useState<any | null>(null);

    const loadBroadcasts = async () => {
        try {
            const data = await db.notifications.get();
            // Filter only 'all' target notifications as "Broadcasts"
            setBroadcasts(data.filter((n: any) => n.target === 'all'));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteBroadcast = async (id: string) => {
        if (window.confirm('Delete this broadcast?')) {
            try {
                await db.notifications.delete(id);
                loadBroadcasts();
            } catch (e) { alert('Failed to delete'); }
        }
    };

    const handleRebroadcast = (broadcast: any) => {
        setBroadcastData({ title: broadcast.title, message: broadcast.message, type: broadcast.type });
        setIsManageBroadcastsOpen(false);
        setIsBroadcastOpen(true);
    };

    const handleUpdateBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBroadcast) return;
        try {
            await db.notifications.update(editingBroadcast.id, {
                title: editingBroadcast.title,
                message: editingBroadcast.message,
                type: editingBroadcast.type
            });
            setEditingBroadcast(null);
            loadBroadcasts();
            alert('Updated successfully');
        } catch (e) { alert('Failed to update'); }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await db.admin.createUser(newUser);
            alert('User created successfully!');
            setIsModalOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'Teacher', subscriptionPlan: 'Free' });
            loadUsers();
        } catch (error: any) {
            alert(error.message || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        setBroadcasting(true);
        try {
            await db.notifications.create(broadcastData.title, broadcastData.message, broadcastData.type, 'all');
            alert('Broadcast sent successfully!');
            setIsBroadcastOpen(false);
            setBroadcastData({ title: '', message: '', type: 'info' });
        } catch (error: any) {
            alert(error.message || 'Failed to send broadcast');
        } finally {
            setBroadcasting(false);
        }
    };

    const handleUpdateTeacherLimit = async () => {
        if (!selectedSchool) return;

        try {
            const response = await fetch(`http://localhost:5001/api/admin/schools/${selectedSchool.id}/teacher-limit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${db.auth.getCurrentUser()?.token}`
                },
                body: JSON.stringify({ teacherLimit: newLimit })
            });

            if (response.ok) {
                alert('Teacher limit updated successfully!');
                setShowLimitModal(false);
                loadUsers();
            } else {
                alert('Failed to update teacher limit');
            }
        } catch (error) {
            console.error('Error updating teacher limit:', error);
            alert('Error updating teacher limit');
        }
    };

    useEffect(() => {
        let res = users;
        if (search) {
            res = res.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
        }
        if (roleFilter !== 'All') {
            res = res.filter(u => u.role === roleFilter);
        }
        setFilteredUsers(res);
    }, [search, roleFilter, users]);

    const handleStatusChange = async (userId: string, currentStatus: string | undefined) => {
        const newStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
        await db.admin.updateUserStatus(userId, newStatus);
        loadUsers();
    };

    const handleDelete = async (userId: string) => {
        if (window.confirm("Permanently delete this user?")) {
            await db.admin.deleteUser(userId);
            loadUsers();
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Modal */}
            {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Add New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                                <input required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                                <input type="email" required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                                <input type="password" required minLength={6} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                                <select className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 dark:text-slate-100 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Student Teacher">Student Teacher</option>
                                    <option value="Tutor">Tutor</option>
                                    <option value="School Admin">School Admin</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md">Cancel</button>
                                <button type="submit" disabled={creating} className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50">
                                    {creating ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Broadcasts Modal */}
            {isManageBroadcastsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg p-6 w-full max-w-2xl h-3/4 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Manage Broadcasts</h2>
                            <button onClick={() => setIsManageBroadcastsOpen(false)}><XSquare className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {broadcasts.length === 0 ? <p className="text-center text-slate-500 my-8">No broadcasts found</p> :
                                broadcasts.map(b => (
                                    <div key={b.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex justify-between items-start">
                                        {editingBroadcast?.id === b.id ? (
                                            <form onSubmit={handleUpdateBroadcast} className="flex-1 mr-4 space-y-2">
                                                <input className="w-full text-sm font-bold border rounded p-1" value={editingBroadcast.title} onChange={e => setEditingBroadcast({ ...editingBroadcast, title: e.target.value })} />
                                                <textarea className="w-full text-sm border rounded p-1" value={editingBroadcast.message} onChange={e => setEditingBroadcast({ ...editingBroadcast, message: e.target.value })} />
                                                <div className="flex gap-2">
                                                    <button type="submit" className="text-xs bg-green-600 text-white px-2 py-1 rounded">Save</button>
                                                    <button type="button" onClick={() => setEditingBroadcast(null)} className="text-xs bg-slate-300 px-2 py-1 rounded">Cancel</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-800">{b.title}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${b.type === 'alert' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{b.type}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1">{b.message}</p>
                                                <p className="text-xs text-slate-400 mt-2">{new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2 ml-2">
                                            <button onClick={() => setEditingBroadcast(b)} className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"><Edit className="w-3 h-3" /> Edit</button>
                                            <button onClick={() => handleRebroadcast(b)} className="text-brand-500 hover:text-brand-700 text-sm flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Resend</button>
                                            <button onClick={() => handleDeleteBroadcast(b.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"><Trash className="w-3 h-3" /> Delete</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Modal */}
            {isBroadcastOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Broadcast Message</h2>
                        <form onSubmit={handleBroadcast} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Title</label>
                                <input required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={broadcastData.title} onChange={e => setBroadcastData({ ...broadcastData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Message</label>
                                <textarea required rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={broadcastData.message} onChange={e => setBroadcastData({ ...broadcastData, message: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Type</label>
                                <select className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    value={broadcastData.type} onChange={e => setBroadcastData({ ...broadcastData, type: e.target.value as any })}>
                                    <option value="info">Info</option>
                                    <option value="success">Success</option>
                                    <option value="alert">Alert</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsBroadcastOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md">Cancel</button>
                                <button type="submit" disabled={broadcasting} className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50">
                                    {broadcasting ? 'Sending...' : 'Send Broadcast'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

                <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
                <div className="flex gap-2">
                    <button onClick={() => { setIsManageBroadcastsOpen(true); loadBroadcasts(); }} className="bg-slate-100 dark:bg-slate-800 dark:text-slate-200 text-slate-700 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700">
                        Manage Broadcasts
                    </button>
                    <button onClick={() => setIsBroadcastOpen(true)} className="bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700">
                        Broadcast Message
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
                        Add New User
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-8 py-2 border border-slate-300 rounded-md leading-5 bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="All">All Roles</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Tutor">Tutor</option>
                            <option value="Student Teacher">Student Teacher</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" /></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No users found</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</div>
                                                        <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900 dark:text-slate-100">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.subscriptionPlan === 'School' ? 'bg-slate-900 text-white' :
                                                user.subscriptionPlan === 'Pro' ? 'bg-brand-100 text-brand-800' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {user.subscriptionPlan || 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.isSchoolAdmin && user.ownedSchools && user.ownedSchools.length > 0 ? (
                                                <div className="text-sm">
                                                    <div className="font-medium text-slate-900">{user.ownedSchools[0].name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                                        {user.ownedSchools[0]._count?.teachers || 0}/{user.ownedSchools[0].teacherLimit} teachers
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSchool(user.ownedSchools[0]);
                                                                setNewLimit(user.ownedSchools[0].teacherLimit);
                                                                setShowLimitModal(true);
                                                            }}
                                                            className="text-brand-600 hover:text-brand-800 underline text-xs"
                                                        >
                                                            Edit Limit
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : user.school ? (
                                                <div className="text-sm text-slate-600">
                                                    Member of: {user.school.name}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Suspended' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {user.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleStatusChange(user.id, user.status)} className="text-slate-400 hover:text-slate-600" title={user.status === 'Suspended' ? "Activate" : "Suspend"}>
                                                    {user.status === 'Suspended' ? <CheckSquare className="w-4 h-4" /> : <XSquare className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="text-slate-400 hover:text-red-600" title="Delete">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Teacher Limit Modal */}
                {showLimitModal && selectedSchool && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Teacher Limit</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                School: <span className="font-semibold">{selectedSchool.name}</span>
                            </p>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Teacher Limit
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newLimit}
                                    onChange={(e) => setNewLimit(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Current: {selectedSchool.teacherLimit} teachers
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowLimitModal(false);
                                        setSelectedSchool(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateTeacherLimit}
                                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
                                >
                                    Update Limit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;