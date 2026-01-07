import React, { useState, useEffect } from 'react';
import { db, getAnyAuthHeader } from '../database'; // Using db helper for auth headers if needed, or straight fetch
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

const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600"></div>;

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminBlog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
    const [showModal, setShowModal] = useState(false);

    // Image Upload State
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/blog/admin/all', {
                headers: getAnyAuthHeader()
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
        setCurrentPost(post);
        setIsEditing(true);
        setShowModal(true);
    };

    const openNew = () => {
        setCurrentPost({ published: false, author: 'Teachaide Team', content: '' });
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
                {/* Search Bar - Same as before */}
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

                {/* Table - Same as before */}
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

            {/* Edit/Create Modal - UPDATED */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10 shrink-0">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {isEditing ? 'Edit Post' : 'New Blog Post'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentPost.title || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug (URL)</label>
                                    <input
                                        type="text"
                                        placeholder="auto-generated-if-empty"
                                        value={currentPost.slug || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, slug: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-brand-500"
                                    />
                                </div>
                            </div>

                            {/* Image Upload Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cover Image</label>

                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${currentPost.image ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleImageUpload(e.dataTransfer.files);
                                    }}
                                >
                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-10 font-medium text-brand-600">
                                            <LoadingSpinner />
                                            <span className="ml-2">Uploading...</span>
                                        </div>
                                    )}

                                    {currentPost.image ? (
                                        <div className="relative group">
                                            <img src={currentPost.image} alt="Preview" className="h-48 mx-auto object-cover rounded shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPost(p => ({ ...p, image: '' }))}
                                                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="mx-auto h-12 w-12 text-slate-400">
                                                <FileText className="h-12 w-12" />
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-700 rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500">
                                                    <span>Upload a file</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} />
                                                </label>
                                                <span className="pl-1">or drag and drop</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF up to 5MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summary (Meta Description)</label>
                                <textarea
                                    rows={2}
                                    value={currentPost.summary || ''}
                                    onChange={e => setCurrentPost({ ...currentPost, summary: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-brand-500"
                                />
                            </div>

                            <div className="min-h-[300px]">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                                <div className="bg-white dark:bg-slate-700 rounded-lg overflow-hidden text-slate-900 dark:text-white">
                                    <ReactQuill
                                        theme="snow"
                                        value={currentPost.content || ''}
                                        onChange={(value) => setCurrentPost({ ...currentPost, content: value })}
                                        className="h-64 mb-12 text-slate-900 dark:text-white"
                                        placeholder="Write something amazing..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Author Name</label>
                                    <input
                                        type="text"
                                        value={currentPost.author || ''}
                                        onChange={e => setCurrentPost({ ...currentPost, author: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-brand-500"
                                    />
                                </div>
                                <div className="flex items-center mt-6">
                                    <input
                                        type="checkbox"
                                        id="published"
                                        checked={currentPost.published || false}
                                        onChange={e => setCurrentPost({ ...currentPost, published: e.target.checked })}
                                        className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5 mr-3"
                                    />
                                    <label htmlFor="published" className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                                        Publish this post immediately
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 shrink-0">
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
