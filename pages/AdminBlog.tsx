import React, { useState, useEffect } from 'react';
import { db } from '../database'; // Using db helper for auth headers if needed, or straight fetch
import {
    Edit, Trash, Plus, CheckCircle, X, Search, FileText, Eye, EyeOff
} from '../components/Icons';
import { showAlert } from '../utils/alerts';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    image: string;
    author: string;
    published: boolean;
    createdAt: string;
}

const AdminBlog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const token = db.auth.getToken();
            const response = await fetch('/api/blog/admin/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            } else {
                console.error('Failed to fetch posts');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showAlert.confirm('Delete Post?', 'Are you sure you want to delete this post? This cannot be undone.', 'Yes, Delete It');
        if (confirmed) {
            try {
                const token = db.auth.getToken();
                const response = await fetch(`/api/blog/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
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
            const token = db.auth.getToken();
            const url = isEditing ? `/api/blog/${currentPost.id}` : '/api/blog';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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

    const openEdit = (post: BlogPost) => {
        setCurrentPost(post);
        setIsEditing(true);
        setShowModal(true);
    };

    const openNew = () => {
        setCurrentPost({ published: false, author: 'Teachaide Team' });
        setIsEditing(false);
        setShowModal(true);
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Create, edit, and manage blog articles</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Post
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Article</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Author</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading posts...</td>
                                </tr>
                            ) : filteredPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No posts found</td>
                                </tr>
                            ) : (
                                filteredPosts.map((post) => (
                                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {post.image && (
                                                    <img src={post.image} alt="" className="w-10 h-10 rounded object-cover mr-3 bg-slate-200" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white truncate max-w-xs">{post.title}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{post.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {post.published ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{post.author}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => window.open(`/blog/${post.slug}`, '_blank')} className="text-slate-400 hover:text-brand-600" title="View Live">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => openEdit(post)} className="text-slate-400 hover:text-blue-600" title="Edit">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(post.id)} className="text-slate-400 hover:text-red-600" title="Delete">
                                                <Trash className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {isEditing ? 'Edit Post' : 'New Blog Post'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentPost.title || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug (URL)</label>
                                    <input
                                        type="text"
                                        placeholder="auto-generated-if-empty"
                                        value={currentPost.slug || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, slug: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summary (Meta Description)</label>
                                <textarea
                                    rows={2}
                                    value={currentPost.summary || ''}
                                    onChange={e => setCurrentPost({ ...currentPost, summary: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Content (HTML/Markdown supported)
                                </label>
                                <textarea
                                    rows={12}
                                    required
                                    value={currentPost.content || ''}
                                    onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                                    className="w-full font-mono text-sm rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-slate-300"
                                    placeholder="<h2>Write your article here...</h2>"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cover Image URL</label>
                                    <input
                                        type="text"
                                        value={currentPost.image || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, image: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Author Name</label>
                                    <input
                                        type="text"
                                        value={currentPost.author || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, author: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="published"
                                    checked={currentPost.published || false}
                                    onChange={e => setCurrentPost({ ...currentPost, published: e.target.checked })}
                                    className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5"
                                />
                                <label htmlFor="published" className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">
                                    Publish this post immediately
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 shadow-md transition"
                                >
                                    {isEditing ? 'Update Post' : 'Create Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBlog;
