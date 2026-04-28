import React, { useState, useEffect, useRef } from 'react';
import { db } from '../database';
import { MessageSquare, X, Send, Loader2, Ticket, Clock, AlertCircle, Image as ImageIcon, XCircle } from './Icons';
import { requestNotificationPermission, showBrowserNotification } from '../utils/notificationUtils';
import { storage as localStorage } from '../utils/storage';

interface SupportChatProps {
    hideToggle?: boolean;
    defaultOpen?: boolean;
}

const SupportChat: React.FC<SupportChatProps> = ({ hideToggle = false, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [ticketData, setTicketData] = useState({ subject: '', description: '' });
    const [idleTime, setIdleTime] = useState(0);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const pollInterval = useRef<any>(null);
    const idleInterval = useRef<any>(null);
    const sessionRef = useRef<any>(null);
    const isOpenRef = useRef(isOpen);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        // Load existing session if any on mount
        const loadExistingSession = async () => {
            try {
                const sessions = await db.support.getUserSessions();
                const active = sessions.find((s: any) => s.status === 'active');
                if (active) {
                    setSession(active);
                    setUnreadCount(active.userUnreadCount || 0);
                    // Start polling immediately if we found an active session
                    startPolling();
                }
            } catch (e) { }
        };
        loadExistingSession();

        return () => {
            stopPolling();
            stopIdleTimer();
        };
    }, []);

    useEffect(() => {
        isOpenRef.current = isOpen;
        if (isOpen) {
            if (!session) {
                startSession();
            }
            startIdleTimer();
            setUnreadCount(0);
            requestNotificationPermission();
        } else {
            stopIdleTimer();
        }
    }, [isOpen]);

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    useEffect(() => {
        setIsOpen(defaultOpen);
    }, [defaultOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startSession = async () => {
        try {
            const data = await db.support.startSession();
            setSession(data);
            setMessages(data.messages || []);
            startPolling();
        } catch (err) {
            console.error('Failed to start support session', err);
        }
    };

    const startPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
        pollInterval.current = setInterval(async () => {
            const currentSession = sessionRef.current;
            if (currentSession) {
                try {
                    // Fetch messages. Mark as read only if window is open.
                    const data = await db.support.getMessages(currentSession.id, isOpenRef.current);

                    // Update unread count from sessions list periodically if closed
                    if (!isOpenRef.current) {
                        try {
                            const sessions = await db.support.getUserSessions();
                            const current = sessions.find((s: any) => s.id === currentSession.id);
                            if (current) {
                                setUnreadCount(current.userUnreadCount);
                            }
                        } catch (e) { }
                    } else {
                        setUnreadCount(0);
                    }

                    // Check if there are new messages from admin
                    const lastAdminMsg = [...data].reverse().find(m => m.senderRole === 'admin');
                    if (lastAdminMsg) {
                        setIdleTime(0); // Reset idle if admin replied
                    }

                    // Handle messages state and browser notifications
                    setMessages(prev => {
                        if (prev.length > 0 && data.length > prev.length) {
                            const newMessages = data.slice(prev.length);
                            const adminMsgs = newMessages.filter(m => m.senderRole === 'admin');

                            if (adminMsgs.length > 0) {
                                // Only notify if window is closed
                                if (!isOpenRef.current) {
                                    showBrowserNotification('New Message from Support', {
                                        body: adminMsgs[adminMsgs.length - 1].content,
                                        tag: 'support-chat'
                                    });
                                }
                            }
                        }
                        return data;
                    });
                } catch (e) { }
            }
        }, 3000);
    };

    const stopPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    const startIdleTimer = () => {
        if (idleInterval.current) clearInterval(idleInterval.current);
        idleInterval.current = setInterval(() => {
            setIdleTime(prev => prev + 1);
        }, 1000);
    };

    const stopIdleTimer = () => {
        if (idleInterval.current) clearInterval(idleInterval.current);
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
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
                    ...db.auth.getCurrentUser() ? { Authorization: `Bearer ${JSON.parse(localStorage.getItem('teachaide_session') || '{}').token}` } : {}
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
        const currentSession = sessionRef.current;
        if ((!input.trim() && !selectedImage) || !currentSession) return;

        const content = input || '📷 Image';
        const attachment = selectedImage;
        setInput('');
        setSelectedImage(null);
        setIdleTime(0);

        try {
            await db.support.sendMessage(currentSession.id, content, attachment || undefined);
            const data = await db.support.getMessages(currentSession.id);
            setMessages(data);
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setLoading(true);
        try {
            await db.support.convertToTicket(session.id, ticketData);
            setShowTicketForm(false);
            setIsOpen(false);
            setSession(null);
            alert('Your ticket has been submitted. We will reach out via email.');
        } catch (err) {
            console.error('Failed to create ticket', err);
        } finally {
            setLoading(false);
        }
    };

    // 15 minutes = 900 seconds
    const showTicketSuggestion = idleTime >= 900 && !showTicketForm;

    return (
        <>
            {/* Toggle Button */}
            {!hideToggle && !isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-700 transition-all hover:scale-110 z-50 group"
                >
                    <MessageSquare className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                    <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Chat with Support
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full h-full sm:w-[380px] sm:h-[600px] bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-brand-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Live Support</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] text-brand-100 italic">Online & Ready</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {!showTicketForm ? (
                        <>
                            {/* Messages */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50"
                            >
                                {messages.map((m: any) => (
                                    <div
                                        key={m.id}
                                        className={`flex ${m.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.senderRole === 'user'
                                            ? 'bg-green-600 text-white shadow-sm rounded-tr-none'
                                            : m.senderRole === 'system'
                                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 italic text-xs mx-auto text-center'
                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
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
                                            <div className={`text-[10px] mt-1 opacity-50 ${m.senderRole === 'user' ? 'text-right' : ''}`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {showTicketSuggestion && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
                                        <div className="flex items-start gap-2 mb-2">
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            <p>Our agents are currently busy. Since you've been waiting for a while, would you like to open a formal support ticket instead?</p>
                                        </div>
                                        <button
                                            onClick={() => setShowTicketForm(true)}
                                            className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors"
                                        >
                                            Open Support Ticket
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                                {['closed', 'ticketed'].includes(session?.status) ? (
                                    <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-center text-xs text-slate-500 font-medium">
                                        This chat session is {session?.status === 'ticketed' ? 'converted to a ticket' : 'closed'}.
                                    </div>
                                ) : (
                                    <>
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
                                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
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
                                                placeholder="Type your message..."
                                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!input.trim() && !selectedImage}
                                                className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </>
                    ) : (
                        /* Ticket Form */
                        <div className="flex-1 p-6 flex flex-col bg-white dark:bg-slate-900">
                            <div className="mb-6">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Ticket className="w-5 h-5 text-brand-600" />
                                    Open Support Ticket
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">Provide details and we'll get back to you via email within 24 hours.</p>
                            </div>

                            <form onSubmit={handleTicketSubmit} className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                                    <input
                                        required
                                        type="text"
                                        value={ticketData.subject}
                                        onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                                        placeholder="Briefly describe the issue"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                    <textarea
                                        required
                                        value={ticketData.description}
                                        onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                                        className="w-full flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm resize-none"
                                        placeholder="Provide more context..."
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowTicketForm(false)}
                                        className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold text-sm"
                                    >
                                        Back to Chat
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-700"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Ticket'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default SupportChat;
