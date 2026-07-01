import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { School } from '../types';
import { Search, Loader2, Edit, MapPin, Phone, Mail, Globe, Activity, CheckSquare, XSquare, Download, Building, CreditCard, Plus, RefreshCw, Zap } from '../components/Icons';
import { showAlert } from '../utils/alerts';

const AdminSchools: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Limit Modal State
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [newLimit, setNewLimit] = useState(15);
    
    // Top-up Modal State
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [topupAmount, setTopupAmount] = useState(100);

    // Tier Modal State
    const [showTierModal, setShowTierModal] = useState(false);
    const [selectedTier, setSelectedTier] = useState<'Basic' | 'Standard' | 'Pro'>('Basic');

    const currentUser = db.adminAuth.getCurrentUser();
    const isSuperAdmin = currentUser?.role?.toLowerCase() === 'superadmin';

    useEffect(() => {
        loadSchools();
    }, []);

    const loadSchools = async () => {
        setLoading(true);
        try {
            const data = await db.admin.getAllSchools();
            setSchools(data || []);
            setFilteredSchools(data || []);
        } catch (error) {
            console.error("Failed to load schools", error);
            showAlert.error('Error', 'Failed to load school registries.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let res = schools;
        if (search) {
            const term = search.toLowerCase();
            res = res.filter(s =>
                (s.name && s.name.toLowerCase().includes(term)) ||
                (s.email && s.email.toLowerCase().includes(term)) ||
                (s.owner?.name && s.owner.name.toLowerCase().includes(term)) ||
                (s.owner?.email && s.owner.email.toLowerCase().includes(term))
            );
        }
        setFilteredSchools(res);
    }, [search, schools]);

    const handleUpdateTeacherLimit = async () => {
        if (!selectedSchool) return;

        try {
            await db.admin.updateTeacherLimit(selectedSchool.id, newLimit);
            showAlert.success('Limit Updated', 'Teacher limit updated successfully.');
            setShowLimitModal(false);
            loadSchools();
        } catch (error: any) {
            console.error('Error updating teacher limit:', error);
            showAlert.error('Error', error.message || 'Error updating teacher limit');
        }
    };

    const handleTopup = async () => {
        if (!selectedSchool) return;
        try {
            await db.admin.topupSchoolNotes(selectedSchool.id, topupAmount);
            showAlert.success('Top-up Successful', `Added ${topupAmount} notes to ${selectedSchool.name}`);
            setShowTopupModal(false);
            loadSchools();
        } catch (error: any) {
            showAlert.error('Top-up Failed', error.message);
        }
    };

    const handleUpdateTier = async () => {
        if (!selectedSchool) return;
        try {
            await db.admin.updateSchoolPlanTier(selectedSchool.id, selectedTier);
            showAlert.success('Plan Updated', `${selectedSchool.name} is now on ${selectedTier} plan`);
            setShowTierModal(false);
            loadSchools();
        } catch (error: any) {
            showAlert.error('Update Failed', error.message);
        }
    };

    // To prevent unauthorized access if school admin somehow accesses it
    if (!currentUser || (currentUser.isSchoolAdmin && !isSuperAdmin)) {
        return <div className="p-8 text-center text-slate-500">Access Denied</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Building className="w-8 h-8 text-brand-500" />
                        School Registry
                    </h1>
                    <p className="text-sm text-slate-500">View and manage all registered institutional accounts</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                            placeholder="Search by school name, email, or owner..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-slate-500 flex items-center tracking-wide font-medium bg-slate-100 dark:bg-slate-900 px-4 rounded-lg">
                        Total: {filteredSchools.length} Schools
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Institution Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Owner / Contact Person</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan & Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expiry</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quota & Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registered</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider sticky right-0 bg-slate-50 dark:bg-slate-800 z-20 border-l border-slate-200 dark:border-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" /><p className="mt-2 text-sm text-slate-500">Loading schools...</p></td></tr>
                            ) : filteredSchools.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-500 italic">No schools completely match your criteria</td></tr>
                            ) : (
                                filteredSchools.map((school) => (
                                    <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        
                                        {/* Name & Address */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    {school.name || "Unnamed Entity"}
                                                    {!school.isActive && <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-600 font-bold uppercase tracking-wider">Inactive</span>}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {school.address ? (school.address.length > 30 ? school.address.substring(0, 30) + '...' : school.address) : <span className="italic opacity-60">No address provided</span>}
                                                </span>
                                                {school.website && (
                                                    <span className="text-xs text-brand-500 mt-1 flex items-center gap-1 hover:underline cursor-pointer">
                                                        <Globe className="w-3 h-3" />
                                                        <a href={school.website.startsWith('http') ? school.website : `https://${school.website}`} target="_blank" rel="noreferrer">
                                                            Website
                                                        </a>
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Owner Info */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                {school.owner ? (
                                                    <>
                                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{school.owner.name}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{school.owner.email}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Owner details lost</span>
                                                )}
                                            </div>
                                        </td>

                                         {/* Plan & Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        school.planType === 'Pro' ? 'bg-purple-100 text-purple-700' :
                                                        school.planType === 'Standard' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {school.planType || 'Basic'}
                                                    </span>
                                                    {school.isActive ? (
                                                        <span className="flex h-2 w-2 rounded-full bg-green-500" title="Active"></span>
                                                    ) : (
                                                        <span className="flex h-2 w-2 rounded-full bg-red-500" title="Inactive"></span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">LICENSED ENTITY</span>
                                            </div>
                                        </td>

                                        {/* Expiry */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {school.owner?.subscriptionExpiryDate ? (() => {
                                                const expiry = new Date(school.owner.subscriptionExpiryDate);
                                                const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                
                                                let color = 'text-green-600 dark:text-green-400';
                                                let text = `${daysLeft}d left`;
                                                
                                                if (daysLeft <= 0) {
                                                    color = 'text-red-500 dark:text-red-400';
                                                    text = 'Expired';
                                                } else if (daysLeft <= 3) {
                                                    color = 'text-red-400 dark:text-red-300 font-medium';
                                                    text = `${daysLeft}d left`;
                                                } else if (daysLeft <= 7) {
                                                    color = 'text-amber-500 dark:text-amber-400';
                                                    text = `${daysLeft}d left`;
                                                }
                                                
                                                return (
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                            {expiry.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className={`text-xs ${color}`}>
                                                            {text}
                                                        </div>
                                                    </div>
                                                );
                                            })() : (
                                                <span className="text-xs text-brand-600 font-medium">Lifetime / Legacy</span>
                                            )}
                                        </td>

                                        {/* Quota & Usage */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    <Activity className="w-4 h-4 text-brand-500" />
                                                    {school.notesUsedThisMonth || 0} Notes Used (Month)
                                                </div>
                                                <div className="text-xs text-slate-500 font-semibold mt-1">
                                                    Total Generations: {school._count?.lessonNotes || 0} Notes
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                                                    <span className="text-slate-500">Teachers: <span className="text-slate-900 dark:text-slate-300 font-bold">{school.teacherLimit}</span></span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-slate-500">Bonus: <span className="text-brand-600 font-bold">+{school.additionalNotes || 0}</span></span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-slate-50 dark:bg-slate-800 dark:group-hover:bg-slate-700 z-10 border-l border-slate-200 dark:border-slate-700 transition-colors">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedSchool(school);
                                                        setNewLimit(school.teacherLimit || 15);
                                                        setShowLimitModal(true);
                                                    }} 
                                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                    title="Teacher Limit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedSchool(school);
                                                        setShowTopupModal(true);
                                                    }} 
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Top-up Notes"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedSchool(school);
                                                        setSelectedTier((school.planType as any) || 'Basic');
                                                        setShowTierModal(true);
                                                    }} 
                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Change Tier"
                                                >
                                                    <Zap className="w-4 h-4" />
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                        <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative overflow-hidden border border-slate-100">
                            <div className="absolute top-0 left-0 w-full h-2 bg-brand-500"></div>
                            
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Edit Teacher Limit</h3>
                            <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
                                Adjusting capacity for <span className="font-bold text-slate-900">{selectedSchool.name}</span>
                            </p>
                            
                            <div className="mb-8">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Total Allowed Licenses (Teachers)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={newLimit}
                                        onChange={(e) => setNewLimit(parseInt(e.target.value))}
                                        className="w-full px-4 py-4 text-xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-500 outline-none transition-colors"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-slate-300" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-slate-500 mt-3 text-right">
                                    Currently set to: <span className="font-bold text-slate-900">{selectedSchool.teacherLimit} slots</span>
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowLimitModal(false);
                                        setSelectedSchool(null);
                                    }}
                                    className="flex-1 px-4 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200/50 hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateTeacherLimit}
                                    className="flex-1 px-4 py-4 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-600 shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98]"
                                >
                                    Confirm Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top-up Modal */}
                {showTopupModal && selectedSchool && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                        <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Top-up Notes</h3>
                            <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
                                Add extra generation credits to <span className="font-bold text-slate-900">{selectedSchool.name}</span>
                            </p>
                            
                            <div className="mb-8">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Amount of Notes</label>
                                <input
                                    type="number"
                                    value={topupAmount}
                                    onChange={(e) => setTopupAmount(parseInt(e.target.value))}
                                    className="w-full px-4 py-4 text-xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-green-500 outline-none transition-colors"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button onClick={() => setShowTopupModal(false)} className="flex-1 px-4 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200/50">Cancel</button>
                                <button onClick={handleTopup} className="flex-1 px-4 py-4 bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 shadow-xl shadow-green-500/20 transition-all">Confirm Top-up</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change Tier Modal */}
                {showTierModal && selectedSchool && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                        <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Change Plan Tier</h3>
                            <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
                                Update the subscription level for <span className="font-bold text-slate-900">{selectedSchool.name}</span>
                            </p>
                            
                            <div className="grid grid-cols-1 gap-3 mb-8">
                                {(['Basic', 'Standard', 'Pro'] as const).map(tier => (
                                    <button
                                        key={tier}
                                        onClick={() => setSelectedTier(tier)}
                                        className={`px-6 py-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                            selectedTier === tier 
                                            ? 'border-purple-500 bg-purple-50 text-purple-900' 
                                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                        }`}
                                    >
                                        <span className="font-black uppercase tracking-widest text-xs">{tier} Plan</span>
                                        {selectedTier === tier && <CheckSquare className="w-5 h-5 text-purple-600" />}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex gap-3">
                                <button onClick={() => setShowTierModal(false)} className="flex-1 px-4 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200/50">Cancel</button>
                                <button onClick={handleUpdateTier} className="flex-1 px-4 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 shadow-xl shadow-purple-500/20 transition-all">Update Tier</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSchools;
