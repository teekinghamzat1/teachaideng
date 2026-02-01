import React, { useState, useEffect } from 'react';
import { db } from '../database';
import {
    Mail,
    Send,
    Users,
    AlertCircle,
    CheckCircle,
    Loader2,
    Info,
    LayoutDashboard,
    Globe,
    History,
    Calendar,
    ChevronRight,
    Search
} from '../components/Icons';

const AdminMassEmail: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [targetGroup, setTargetGroup] = useState('all');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [fetchingHistory, setFetchingHistory] = useState(true);
    const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setFetchingHistory(true);
        try {
            const data = await db.admin.getMassEmailHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load mass email history', err);
        } finally {
            setFetchingHistory(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !body) return;

        setLoading(true);
        setStatus(null);

        try {
            await db.admin.sendMassEmail({ subject, body, targetGroup });
            setStatus({
                type: 'success',
                message: 'Mass email process started. Emails will be delivered in the background.'
            });
            setSubject('');
            setBody('');
            loadHistory(); // Refresh history
        } catch (err: any) {
            setStatus({
                type: 'error',
                message: err.message || 'Failed to start mass email process.'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item =>
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.body.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Mail className="w-8 h-8 text-brand-600" />
                        Mass Email Communicator
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Send personalized updates and track your campaign history.</p>
                </div>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'compose' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Send className="w-4 h-4" />
                        Compose
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <History className="w-4 h-4" />
                        History
                        {history.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'history' ? 'bg-white text-brand-600' : 'bg-brand-600 text-white'}`}>
                                {history.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'compose' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 rounded-2xl p-4 flex gap-4 items-start">
                        <Info className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-brand-800 dark:text-brand-300">
                            <p className="font-bold mb-1">Important: Deliverability & Anti-Spam</p>
                            <p>To ensure high deliverability and avoid being flagged as spam, emails are sent in batches with a delay. Please ensure your SMTP configuration is correct and you have permission to email these users.</p>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-xl flex gap-3 items-center ${status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                            : 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                            }`}>
                            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <p className="text-sm font-medium">{status.message}</p>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Recipients</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { id: 'all', label: 'All Users', icon: Users },
                                        { id: 'free', label: 'Free Users', icon: LayoutDashboard },
                                        { id: 'pro', label: 'Pro Users', icon: Globe },
                                        { id: 'school', label: 'Schools', icon: AlertCircle }
                                    ].map((group) => (
                                        <button
                                            key={group.id}
                                            type="button"
                                            onClick={() => setTargetGroup(group.id)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${targetGroup === group.id
                                                ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-none'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-500'
                                                }`}
                                        >
                                            <group.icon className="w-4 h-4" />
                                            {group.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Subject</label>
                                <input
                                    id="subject"
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Exciting New Features are Here!"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="body" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Message Body (HTML Supported)</label>
                                <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider font-bold">Use &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, etc. for formatting</div>
                                <textarea
                                    id="body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full h-80 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all font-mono text-sm leading-relaxed"
                                    required
                                />
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" />
                                    Available Placeholders
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <div className="group relative">
                                        <span className="text-xs font-mono bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border dark:border-slate-700 shadow-sm cursor-help hover:border-brand-500 transition-colors">{'${user.name}'}</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Recipients full name</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || !subject || !body}
                                className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-700 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-brand-200 dark:shadow-none"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Starting Process...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Send Mass Email
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search email history by subject or content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                        />
                    </div>

                    {fetchingHistory ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Retrieving mission history...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No emails found</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                {searchTerm ? `We couldn't find any emails matching "${searchTerm}"` : "You haven't sent any mass emails yet. Start your first campaign to see it here!"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredHistory.map((item) => (
                                <EmailCampaignCard
                                    key={item.id}
                                    campaign={item}
                                    onReuse={(campaign) => {
                                        setSubject(campaign.subject);
                                        setBody(campaign.body);
                                        setTargetGroup(campaign.targetGroup);
                                        setActiveTab('compose');
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Helper component for sparkles if not in Icons.tsx (already checked, it's there)
const Sparkles = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

// Email Campaign Card with Tracking
const EmailCampaignCard: React.FC<{ campaign: any; onReuse: (campaign: any) => void }> = ({ campaign, onReuse }) => {
    const [showRecipients, setShowRecipients] = useState(false);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [recipientFilter, setRecipientFilter] = useState<string>('');
    const [loadingRecipients, setLoadingRecipients] = useState(false);

    const loadRecipients = async (status?: string) => {
        setLoadingRecipients(true);
        try {
            const data = await db.admin.getMassEmailRecipients(campaign.id, status);
            setRecipients(data);
            setRecipientFilter(status || '');
            setShowRecipients(true);
        } catch (err) {
            console.error('Failed to load recipients:', err);
        } finally {
            setLoadingRecipients(false);
        }
    };

    const calculatePercentage = (count: number, total: number) => {
        return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            case 'opened': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            case 'pending': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
            <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${campaign.targetGroup === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                campaign.targetGroup === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                    campaign.targetGroup === 'school' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                                }`}>
                                {campaign.targetGroup}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(campaign.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate mb-1">{campaign.subject}</h3>
                        <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: campaign.body.replace(/<[^>]*>/g, '').substring(0, 200) + '...' }}></div>
                    </div>
                    <button
                        onClick={() => onReuse(campaign)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 transition-all"
                        title="Reuse this email"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Tracking Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                        <div className="text-lg font-black text-slate-900 dark:text-white">{campaign.recipientCount}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Total</div>
                    </div>

                    <button
                        onClick={() => loadRecipients('sent')}
                        className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        <Send className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                        <div className="text-lg font-black text-blue-600">{campaign.sentCount || 0}</div>
                        <div className="text-[10px] text-blue-600 uppercase font-bold">
                            Sent ({calculatePercentage(campaign.sentCount || 0, campaign.recipientCount)}%)
                        </div>
                    </button>

                    <button
                        onClick={() => loadRecipients('opened')}
                        className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                        <Mail className="w-4 h-4 text-green-600 mx-auto mb-1" />
                        <div className="text-lg font-black text-green-600">{campaign.openedCount || 0}</div>
                        <div className="text-[10px] text-green-600 uppercase font-bold">
                            Opened ({calculatePercentage(campaign.openedCount || 0, campaign.sentCount || 1)}%)
                        </div>
                    </button>

                    <button
                        onClick={() => loadRecipients('failed')}
                        className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <AlertCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                        <div className="text-lg font-black text-red-600">{campaign.failedCount || 0}</div>
                        <div className="text-[10px] text-red-600 uppercase font-bold">
                            Failed ({calculatePercentage(campaign.failedCount || 0, campaign.recipientCount)}%)
                        </div>
                    </button>

                    <button
                        onClick={() => loadRecipients()}
                        className="text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Info className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                        <div className="text-lg font-black text-slate-900 dark:text-white">All</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">View All</div>
                    </button>
                </div>
            </div>

            {/* Recipients Modal */}
            {showRecipients && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-900 dark:text-white">
                            {recipientFilter ? `${recipientFilter.charAt(0).toUpperCase() + recipientFilter.slice(1)} Recipients` : 'All Recipients'}
                            <span className="ml-2 text-sm text-slate-500">({recipients.length})</span>
                        </h4>
                        <button
                            onClick={() => setShowRecipients(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            ✕
                        </button>
                    </div>

                    {loadingRecipients ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                            {recipients.length > 0 ? recipients.map((recipient) => (
                                <div key={recipient.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">{recipient.userName}</div>
                                        <div className="text-xs text-slate-500">{recipient.userEmail}</div>
                                        {recipient.errorMessage && (
                                            <div className="text-xs text-red-600 mt-1">{recipient.errorMessage}</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(recipient.status)}`}>
                                            {recipient.status}
                                        </span>
                                        <div className="text-[10px] text-slate-400">
                                            {recipient.openedAt
                                                ? new Date(recipient.openedAt).toLocaleTimeString()
                                                : recipient.sentAt
                                                    ? new Date(recipient.sentAt).toLocaleTimeString()
                                                    : recipient.failedAt
                                                        ? new Date(recipient.failedAt).toLocaleTimeString()
                                                        : '-'}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-500 text-sm">No recipients found in this category.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminMassEmail;
