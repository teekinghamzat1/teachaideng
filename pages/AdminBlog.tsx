import React, { useState, useEffect } from 'react';
import { db, getAnyAuthHeader } from '../database';
import {
    Edit, Trash, Plus, CheckCircle, X, Search, FileText, Eye, EyeOff
} from '../components/Icons';
import { showAlert } from '../utils/alerts';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useDebounce } from '../hooks/useDebounce';
import { generateSEOSummary } from '../services/geminiService';
import { Sparkles } from '../components/Icons';

const LoadingSpinner = () => (
    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
);

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    image: string;
    author: string;
    published: boolean;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    category?: string;
    createdAt: string;
}

interface TopicQueueItem {
    id: string;
    topic: string;
    audience: string;
    category: string;
    priority: number;
    status: string;
    errorLog?: string;
    createdAt: string;
}

const AdminBlog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'queue'>('all');
    const [topics, setTopics] = useState<TopicQueueItem[]>([]);
    const [newTopic, setNewTopic] = useState({ topic: '', audience: 'Teachers', category: 'General', priority: 0 });
    const [isAddingTopic, setIsAddingTopic] = useState(false);

    // Autosave State
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [schedule, setSchedule] = useState('0 7,13,19 * * *');
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);

    const debouncedPost = useDebounce(currentPost, 2000);

    useEffect(() => {
        fetchPosts();
        fetchTopics();
        fetchSchedule();
    }, []);

    // Autosave logic
    useEffect(() => {
        if (showModal && isEditing && debouncedPost.id && hasUnsavedChanges) {
            autoSave();
        }
    }, [debouncedPost]);

    const autoSave = async () => {
        if (!currentPost.title || !currentPost.content) return;

        try {
            setIsSaving(true);
            const response = await fetch(`/api/blog/${currentPost.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAnyAuthHeader()
                },
                body: JSON.stringify(currentPost)
            });

            if (response.ok) {
                setLastSaved(new Date());
                setHasUnsavedChanges(false);
                const postsRes = await fetch('/api/blog/admin/all', {
                    headers: getAnyAuthHeader()
                });
                if (postsRes.ok) {
                    const data = await postsRes.json();
                    setPosts(data);
                }
            }
        } catch (error) {
            console.error('Autosave failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/blog/admin/all', {
                headers: getAnyAuthHeader()
            });
            if (response.ok) {
                const data = await response.json();
                setPosts(Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []));
            } else {
                console.error('Failed to fetch posts');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopics = async () => {
        try {
            const res = await fetch('/api/topics', { headers: getAnyAuthHeader() });
            if (res.ok) {
                const data = await res.json();
                setTopics(Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSchedule = async () => {
        try {
            const res = await fetch('/api/topics/schedule', { headers: getAnyAuthHeader() });
            if (res.ok) {
                const data = await res.json();
                setSchedule(data.schedule);
            }
        } catch (error) { console.error(error); }
    };

    const handleSaveSchedule = async () => {
        if (!schedule || schedule.split(' ').length < 5) {
            showAlert.error('Invalid Format', 'Please use a valid cron string.');
            return;
        }

        try {
            setIsSavingSchedule(true);
            const res = await fetch('/api/topics/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAnyAuthHeader() },
                body: JSON.stringify({ schedule })
            });
            if (res.ok) {
                showAlert.success('Schedule updated!');
            }
        } catch (error) { showAlert.error('An error occurred'); }
        finally { setIsSavingSchedule(false); }
    };

    const triggerWorker = async () => {
        try {
            const res = await fetch('/api/topics/trigger', {
                method: 'POST',
                headers: getAnyAuthHeader()
            });
            if (res.ok) {
                showAlert.success('Draft generation started!', 'Check drafts in a minute.');
                setTimeout(fetchPosts, 10000); // refresh after some time
            }
        } catch (error) { showAlert.error('An error occurred'); }
    }

    const handleAddTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsAddingTopic(true);
            const res = await fetch('/api/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAnyAuthHeader() },
                body: JSON.stringify(newTopic)
            });
            if (res.ok) {
                showAlert.success('Topic queued!');
                setNewTopic({ topic: '', audience: 'Teachers', category: 'General', priority: 0 });
                fetchTopics();
            } else {
                showAlert.error('Failed to queue topic');
            }
        } catch (error) {
            showAlert.error('An error occurred');
        } finally {
            setIsAddingTopic(false);
        }
    };

    const handleDeleteTopic = async (id: string) => {
        try {
            const confirmed = await showAlert.confirm('Delete Topic?', 'Remove this topic from the queue?', 'Delete');
            if (confirmed) {
                const res = await fetch(`/api/topics/${id}`, {
                    method: 'DELETE',
                    headers: getAnyAuthHeader()
                });
                if (res.ok) {
                    showAlert.success('Topic removed');
                    fetchTopics();
                }
            }
        } catch (error) {
            showAlert.error('An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showAlert.confirm('Delete Post?', 'Are you sure you want to delete this post? This cannot be undone.', 'Yes, Delete It');
        if (confirmed) {
            try {
                const response = await fetch(`/api/blog/${id}`, {
                    method: 'DELETE',
                    headers: getAnyAuthHeader()
                });

                if (response.ok) {
                    showAlert.success('Post deleted successfully');
                    setPosts(posts.filter(p => p.id !== id));
                } else {
                    showAlert.error('Failed to delete post');
                }
            } catch (error) {
                showAlert.error('An error occurred');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing ? `/api/blog/${currentPost.id}` : '/api/blog';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAnyAuthHeader()
                },
                body: JSON.stringify(currentPost)
            });

            if (response.ok) {
                showAlert.success(isEditing ? 'Post updated successfully' : 'Post created successfully');
                setShowModal(false);
                fetchPosts();
                setCurrentPost({});
            } else {
                const err = await response.json();
                showAlert.error(err.message || 'Failed to save post');
            }
        } catch (error) {
            showAlert.error('An error occurred');
        }
    };

    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: getAnyAuthHeader(),
                body: formData
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setCurrentPost(prev => ({ ...prev, image: data.data.url }));
                showAlert.success('Image uploaded!');
            } else {
                showAlert.error('Upload failed');
            }
        } catch (error) {
            console.error(error);
            showAlert.error('Upload error');
        } finally {
            setUploadingImage(false);
        }
    };

    const openEdit = (post: BlogPost) => {
        setCurrentPost({ ...post });
        setIsEditing(true);
        setShowModal(true);
        setHasUnsavedChanges(false);
        setLastSaved(null);
    };

    const handleGenerateSummary = async () => {
        if (!currentPost.title || !currentPost.content) {
            showAlert.error('Draft Required', 'Please provide a title and some content first.');
            return;
        }

        setIsGeneratingSummary(true);
        try {
            // Strip HTML tags for context
            const div = document.createElement('div');
            div.innerHTML = currentPost.content;
            const plainText = div.textContent || div.innerText || '';

            const summary = await generateSEOSummary(currentPost.title, plainText);
            setCurrentPost({ ...currentPost, summary });
            setHasUnsavedChanges(true);
            showAlert.success('Generated', 'Catchy summary is ready!');
        } catch (err) {
            showAlert.error('AI Error', 'Failed to generate summary. Please try again.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const openNew = () => {
        setCurrentPost({
            published: false,
            author: 'Teachaide Team',
            content: '',
            keywords: 'lesson notes, ai lesson note generator, teacher ai, edtech'
        });
        setHasUnsavedChanges(false);
        setIsEditing(false);
        setShowModal(true);
    };

    const filteredPosts = (posts || []).filter(post => {
        if (!post) return false;
        const title = post.title || '';
        const slug = post.slug || '';
        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            slug.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'published') return matchesSearch && post.published;
        if (activeTab === 'drafts') return matchesSearch && !post.published;
        return matchesSearch;
    });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-100 dark:border-slate-700/60">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Blog Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Create, edit, and organize your amazing articles.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Premium segmented control */}
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl shadow-inner w-full sm:w-auto overflow-x-auto">
                        {['all', 'published', 'drafts', 'queue'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-300 ease-out ${activeTab === tab
                                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                {tab}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab
                                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                    {tab === 'all' ? posts.length : tab === 'published' ? posts.filter(p => p.published).length : tab === 'drafts' ? posts.filter(p => !p.published).length : topics.length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={openNew}
                        className="group flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                        Write Article
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-6">

                {activeTab === 'queue' ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Topic Queue</h2>
                                <p className="text-sm text-slate-500">Add topics for the AI worker to generate automatically.</p>
                            </div>
                            <button onClick={triggerWorker} className="px-5 py-2.5 bg-brand-600 dark:bg-brand-500 text-white rounded-xl text-sm font-black shadow-lg shadow-brand-500/20 hover:scale-105 transition-all">
                                <Sparkles className="w-4 h-4 inline mr-2" />
                                Trigger Worker
                            </button>
                        </div>

                        {/* Schedule Settings */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Automation Schedule</h3>
                            <div className="flex flex-col md:flex-row items-end gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cron Schedule (Min Hour Day Month DayOfWeek)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            value={schedule}
                                            onChange={e => setSchedule(e.target.value)}
                                            placeholder="0 7,13,19 * * *"
                                            className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner focus:ring-2 focus:ring-brand-500"
                                        />
                                        <button
                                            onClick={handleSaveSchedule}
                                            disabled={isSavingSchedule}
                                            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition disabled:opacity-50"
                                        >
                                            {isSavingSchedule ? '...' : 'Update'}
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl text-[10px] text-slate-400 font-bold border border-slate-100 dark:border-slate-700">
                                    <p className="mb-1">TIPS:</p>
                                    <p>• 0 7,19 * * * (7AM & 7PM)</p>
                                    <p>• 0 9 * * 1 (Every Monday at 9AM)</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleAddTopic} className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Topics (one per line or comma separated)</label>
                                    <textarea 
                                        required 
                                        rows={4}
                                        placeholder="E.g. Classroom Management&#10;Innovative Teaching&#10;Student Engagement" 
                                        value={newTopic.topic} 
                                        onChange={e => setNewTopic({ ...newTopic, topic: e.target.value })} 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 shadow-inner" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Audience</label>
                                    <input placeholder="E.g. Primary Teachers" value={newTopic.audience} onChange={e => setNewTopic({ ...newTopic, audience: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 shadow-inner" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blog Category</label>
                                    <input placeholder="E.g. Teaching Practice" value={newTopic.category} onChange={e => setNewTopic({ ...newTopic, category: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 shadow-inner" />
                                </div>
                            </div>
                            <button type="submit" disabled={isAddingTopic} className="w-full bg-brand-600 text-white rounded-xl px-6 py-3 text-sm font-black hover:bg-brand-700 disabled:opacity-50 transition shadow-lg shadow-brand-500/20">
                                {isAddingTopic ? 'Adding Topics...' : 'Add Topics to Queue'}
                            </button>
                        </form>

                        <div className="space-y-3">
                            {topics.length === 0 && <p className="text-center text-slate-500 py-8">No topics in queue. Add some above!</p>}
                            {topics.map(t => (
                                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white">{t.topic}</h4>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${t.status === 'QUEUED' ? 'bg-blue-100 text-blue-700' : t.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' : t.status === 'USED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Audience: {t.audience} &bull; Category: {t.category}</p>
                                        {t.errorLog && <p className="text-xs text-red-500 mt-1 line-clamp-1">{t.errorLog}</p>}
                                    </div>
                                    <div className="mt-3 sm:mt-0 flex items-center gap-2">
                                        <button onClick={() => handleDeleteTopic(t.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Search Bar */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search posts by title or slug..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-11 pr-4 py-4 rounded-2xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-brand-500 transition-all text-sm font-medium placeholder:font-normal"
                            />
                        </div>

                        {/* Posts Grid / List */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                <LoadingSpinner />
                                <p className="mt-4 text-slate-500 font-medium">Loading your masterpieces...</p>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No posts found</h3>
                                <p className="text-slate-500 text-sm mb-6 max-w-sm text-center">We couldn't find anything matching your current filters. Try adjusting your search term.</p>
                                <button onClick={openNew} className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">Start writing now &rarr;</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredPosts.map((post) => (
                                    <div key={post.id} className="group bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
                                        <div className="relative w-full h-48 mb-5 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                                            {post.image ? (
                                                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full opacity-50">
                                                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 flex gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md ${post.published ? 'bg-green-500/90 text-white shadow-sm' : 'bg-yellow-500/90 text-white shadow-sm'
                                                    }`}>
                                                    {post.published ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-2 group-hover:text-brand-600 transition-colors">{post.title}</h3>
                                                <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-1">{post.slug}</p>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{post.summary || 'No summary provided.'}</p>
                                            </div>

                                            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-300">{post.author}</span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <button onClick={() => window.open(`/blog/${post.slug}`, '_blank')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="View Live">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openEdit(post)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(post.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Premium Sliding Drawer Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowModal(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right transform transition-transform duration-300 border-l border-slate-200 dark:border-slate-800">
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                    {isEditing ? 'Editing Document' : 'New Masterpiece'}
                                </h2>
                                {isEditing && (
                                    <div className="flex items-center gap-2 mt-1.5 h-5">
                                        {isSaving ? (
                                            <span className="text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full flex items-center gap-1.5 font-bold">
                                                <div className="w-2.5 h-2.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                                Auto-saving
                                            </span>
                                        ) : lastSaved ? (
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 items-center">
                                <button
                                    onClick={(e) => handleSave(e as any)}
                                    className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-lg shadow-slate-900/20 dark:shadow-white/10"
                                >
                                    {isEditing ? 'Save & Close' : 'Publish Initial'}
                                </button>
                                <button onClick={() => setShowModal(false)} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Form */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            <form className="space-y-10 max-w-3xl mx-auto pb-12">
                                {/* Core Info */}
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-brand-500 transition-colors">Article Title</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="E.g. The Future of AI in Classrooms"
                                            value={currentPost.title || ''}
                                            onChange={e => {
                                                setCurrentPost({ ...currentPost, title: e.target.value });
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="w-full text-2xl md:text-3xl font-bold bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 px-0 py-2 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 focus:border-brand-500 transition-colors"
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-brand-500 transition-colors">Friendly URL Slug</label>
                                        <div className="flex items-center">
                                            <span className="text-slate-400 font-medium mr-2">teachaide.ng/blog/</span>
                                            <input
                                                type="text"
                                                placeholder="my-awesome-post"
                                                value={currentPost.slug || ''}
                                                onChange={e => {
                                                    setCurrentPost({ ...currentPost, slug: e.target.value });
                                                    setHasUnsavedChanges(true);
                                                }}
                                                className="flex-1 bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 px-0 py-2 text-brand-600 dark:text-brand-400 font-semibold focus:ring-0 focus:border-brand-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-brand-500 transition-colors">Category</label>
                                        <input
                                            type="text"
                                            placeholder="E.g. Teaching Practice"
                                            value={currentPost.category || ''}
                                            onChange={e => {
                                                setCurrentPost({ ...currentPost, category: e.target.value });
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="w-full bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 px-0 py-2 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 focus:border-brand-500 transition-colors font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Rich Text Editor */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">The Content</label>
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-white dark:bg-slate-800">
                                        <ReactQuill
                                            theme="snow"
                                            value={currentPost.content || ''}
                                            onChange={(value) => {
                                                setCurrentPost({ ...currentPost, content: value });
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="h-[400px] border-none text-slate-900 dark:text-white prose dark:prose-invert max-w-none [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-900/50 [&_.ql-container]:border-0 [&_.ql-editor]:text-base"
                                            placeholder="Write your brilliant thoughts here..."
                                        />
                                    </div>
                                </div>

                                {/* Media & Meta Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    {/* Image Upload */}
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Hero Image</label>
                                        <div
                                            className={`relative h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all overflow-hidden group cursor-pointer ${currentPost.image ? 'border-brand-500/50 bg-black' : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 hover:bg-white dark:hover:bg-slate-800'}`}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                handleImageUpload(e.dataTransfer.files);
                                            }}
                                        >
                                            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} />

                                            {uploadingImage && (
                                                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center z-30">
                                                    <LoadingSpinner />
                                                    <span className="mt-3 font-bold text-brand-600">Uploading magic...</span>
                                                </div>
                                            )}

                                            {currentPost.image ? (
                                                <>
                                                    <img src={currentPost.image} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                                                        <span className="text-white font-bold bg-black/50 px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm">Click to replace</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentPost(p => ({ ...p, image: '' })); }}
                                                        className="absolute top-3 right-3 z-30 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="space-y-2 pointer-events-none p-4">
                                                    <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center transition-transform group-hover:-translate-y-1">
                                                        <FileText className="h-5 w-5 text-slate-500" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload or drag</p>
                                                    <p className="text-xs text-slate-500">1200x630px recommended</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Publishing Options */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Post Visibility</label>
                                            <label className="relative flex items-center p-4 cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-400 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={currentPost.published || false}
                                                    onChange={e => {
                                                        setCurrentPost({ ...currentPost, published: e.target.checked });
                                                        setHasUnsavedChanges(true);
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[18px] after:left-[18px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                                                <span className="ml-4 text-sm font-bold text-slate-900 dark:text-white">Published to Public</span>
                                            </label>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Author Identity</label>
                                            <input
                                                type="text"
                                                value={currentPost.author || ''}
                                                onChange={e => {
                                                    setCurrentPost({ ...currentPost, author: e.target.value });
                                                    setHasUnsavedChanges(true);
                                                }}
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced SEO Accordion or Section */}
                                <div className="space-y-5 pt-8 border-t border-slate-200 dark:border-slate-800">
                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        ✨ Optimization & SEO
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="space-y-1 group">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 group-focus-within:text-brand-500 transition-colors">Excerpt / Card Summary</label>
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateSummary}
                                                    disabled={isGeneratingSummary}
                                                    className="flex items-center gap-1.5 text-[11px] font-black text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors uppercase tracking-wider"
                                                >
                                                    {isGeneratingSummary ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                                            Writing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            Auto-generate
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={currentPost.summary || ''}
                                                onChange={e => {
                                                    setCurrentPost({ ...currentPost, summary: e.target.value });
                                                    setHasUnsavedChanges(true);
                                                }}
                                                placeholder="A brief catchy description for the blog list..."
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                                            />
                                        </div>

                                        <div className="space-y-1 group">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 group-focus-within:text-brand-500 transition-colors">SEO Meta Title</label>
                                            <input
                                                type="text"
                                                value={currentPost.metaTitle || ''}
                                                onChange={e => {
                                                    setCurrentPost({ ...currentPost, metaTitle: e.target.value });
                                                    setHasUnsavedChanges(true);
                                                }}
                                                placeholder="Defaults to article title if blank"
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                                            />
                                        </div>

                                        <div className="space-y-1 group">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 group-focus-within:text-brand-500 transition-colors">Keywords</label>
                                            <input
                                                type="text"
                                                value={currentPost.keywords || ''}
                                                onChange={e => {
                                                    setCurrentPost({ ...currentPost, keywords: e.target.value });
                                                    setHasUnsavedChanges(true);
                                                }}
                                                placeholder="lesson planning, edtech, AI tools"
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}} />
        </div>
    );
};

export default AdminBlog;
