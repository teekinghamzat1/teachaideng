import React, { useState, useEffect, useRef } from 'react';
import { db } from '../database';
import {
    MessageSquare,
    Search,
    Send,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Ticket,
    AlertCircle,
    ChevronRight,
    Image as ImageIcon,
    Filter
} from '../components/Icons';

const AdminSupport: React.FC = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chats' | 'tickets'>('chats');
    const [filter, setFilter] = useState('active');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const pollInterval = useRef<any>(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Poll list
        return () => clearInterval(interval);
    }, [activeTab]);

    useEffect(() => {
        if (activeSession) {
            loadMessages();
            startPolling();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [activeSession]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadData = async () => {
        try {
            if (activeTab === 'chats') {
                const data = await db.support.admin.getAllSessions();
                setSessions(data);
            } else {
                const data = await db.support.admin.getTickets();
                setTickets(data);
            }
        } catch (e) {
            console.error('Failed to load support data', e);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        if (!activeSession) return;
        try {
            const data = await db.support.admin.getMessages(activeSession.id);
            setMessages(data);
        } catch (e) { }
    };

    const startPolling = () => {
        stopPolling();
        pollInterval.current = setInterval(loadMessages, 3000);
    };

    const stopPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: {
                    ...db.adminAuth.getCurrentUser() ? { Authorization: `Bearer ${JSON.parse(localStorage.getItem('teachaide_admin_session') || '{}').token}` } : {}
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            setSelectedImage(data.data.url);
        } catch (err) {
            console.error('Failed to upload image', err);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !selectedImage) || !activeSession) return;

        const content = input || '📷 Image';
        const attachment = selectedImage;
        setInput('');
        setSelectedImage(null);

        try {
            await db.support.admin.sendMessage(activeSession.id, content, attachment || undefined);
            loadMessages();
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleCloseSession = async (id: string) => {
        if (!confirm('Close this chat session?')) return;
        try {
            await db.support.admin.closeSession(id);
            setActiveSession(null);
            loadData();
        } catch (e) { }
    };

    const updateTicketStatus = async (id: string, status: string) => {
        try {
            await db.support.admin.updateTicket(id, { status });
            loadData();
        } catch (e) { }
    };

    const filteredSessions = sessions.filter(s => filter === 'all' || s.status === filter);

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:h-[calc(100vh-10rem)]">
            <div className={`flex justify-between items-center mb-4 ${activeSession ? 'hidden md:flex' : ''}`}>
                <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-brand-600" />
                        Support Center
                    </h1>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${activeTab === 'chats' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            Active Chats
                        </button>
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${activeTab === 'tickets' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            Tickets
                        </button>
                    </div>
                </div>

                {activeTab === 'chats' && (
                    <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-transparent text-sm border-none focus:ring-0 text-slate-600 dark:text-slate-300"
                        >
                            <option value="active">Active Only</option>
                            <option value="closed">Closed Only</option>
                            <option value="all">All Chats</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden relative">
                {/* Side List */}
                <div className="w-full lg:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
                        {loading ? (
                            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
                        ) : activeTab === 'chats' ? (
                            filteredSessions.length === 0 ? (
                                <p className="p-8 text-center text-sm text-slate-400 italic">No chats found</p>
                            ) : filteredSessions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setActiveSession(s)}
                                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 border-l-4 ${activeSession?.id === s.id ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-500' : 'border-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{s.user?.name || 'Unknown'}</h3>
                                        <span className="text-[10px] text-slate-400">{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate pr-4">{s.lastMessage}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {s.status}
                                        </span>
                                        {s.unreadCount > 0 && (
                                            <span className="bg-brand-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                                {s.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            tickets.length === 0 ? (
                                <p className="p-8 text-center text-sm text-slate-400 italic">No tickets found</p>
                            ) : tickets.map(t => (
                                <div
                                    key={t.id}
                                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{t.subject}</h3>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${t.status === 'open' ? 'bg-red-100 text-red-700' :
                                            t.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t.user?.name}</p>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => updateTicketStatus(t.id, 'resolved')}
                                            className="text-[10px] font-bold text-green-600 hover:underline"
                                        >
                                            Mark Resolved
                                        </button>
                                        <button
                                            onClick={() => updateTicketStatus(t.id, 'closed')}
                                            className="text-[10px] font-bold text-slate-400 hover:underline"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main View */}
                <div className={`flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden absolute inset-0 md:relative z-10 ${activeSession ? 'flex' : 'hidden md:flex'}`}>
                    {activeTab === 'chats' ? (
                        activeSession ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setActiveSession(null)}
                                            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700"
                                        >
                                            <ChevronRight className="w-5 h-5 rotate-180" />
                                        </button>
                                        <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold">
                                            {activeSession.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-slate-900 dark:text-slate-100">{activeSession.user?.name}</h2>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>{activeSession.user?.email}</span>
                                                <span className={`${activeSession.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>{activeSession.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleCloseSession(activeSession.id)}
                                                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
                                            >
                                                Close Session
                                            </button>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div
                                        ref={scrollRef}
                                        className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/20"
                                    >
                                        {messages.map(m => (
                                            <div
                                                key={m.id}
                                                className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${m.senderRole === 'admin'
                                                    ? 'bg-green-600 text-white shadow-sm rounded-tr-none'
                                                    : m.senderRole === 'system'
                                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 italic text-xs mx-auto text-center'
                                                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-600 rounded-tl-none'
                                                    }`}>
                                                    {m.attachment && (
                                                        <div className="mb-2">
                                                            <img
                                                                src={m.attachment}
                                                                alt="Attachment"
                                                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => window.open(m.attachment, '_blank')}
                                                                style={{ maxHeight: '200px' }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="whitespace-pre-wrap">{m.content}</div>
                                                    <div className="text-[9px] mt-1 opacity-50 flex justify-between gap-4">
                                                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {m.senderRole === 'user' && m.isRead && <span>Read</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer Input */}
                                    <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                        {selectedImage && (
                                            <div className="relative inline-block">
                                                <img
                                                    src={selectedImage}
                                                    alt="Preview"
                                                    className="max-h-32 rounded-lg border-2 border-brand-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedImage(null)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingImage}
                                                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                                title="Attach image"
                                            >
                                                {uploadingImage ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5" />
                                                )}
                                            </button>
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Type your response..."
                                                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!input.trim() && !selectedImage}
                                                className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all hover:scale-105"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                        )}
                            </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSupport;
