import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, UserIcon as User, ArrowRight } from '../../components/Icons';
import SEO from '../../components/SEO';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    summary: string;
    image: string;
    author: string;
    createdAt: string;
}

const BlogHome: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock data fallback until API is live
    const mockPosts = [
        {
            id: '1',
            title: 'How to Create Engaging Lesson Notes with AI',
            slug: 'how-to-create-engaging-lesson-notes',
            summary: 'Learn the secrets of using AI to generate lesson notes that keep your students engaged and learning.',
            image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=600',
            author: 'Teachaide Team',
            createdAt: '2024-03-15'
        },
        {
            id: '2',
            title: 'The Future of Education in Nigeria',
            slug: 'future-of-education-nigeria',
            summary: 'Exploring how technology and AI are reshaping the classroom experience for teachers and students across Nigeria.',
            image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=600',
            author: 'Teeking Hamzat',
            createdAt: '2024-03-10'
        },
        {
            id: '3',
            title: 'Top 5 Tips for Classroom Management',
            slug: 'classroom-management-tips',
            summary: 'Effective strategies to manage your classroom and create a positive learning environment.',
            image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
            author: 'Sarah Johnson',
            createdAt: '2024-03-05'
        }
    ];

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Use full URL if fetch proxy isn't set up, or relative if it is. 
                // Assuming relative path works via proxy or same domain.
                const response = await fetch('/api/blog');
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setPosts(data);
                    } else {
                        setPosts(mockPosts);
                    }
                } else {
                    setPosts(mockPosts);
                }
            } catch (error) {
                console.error('Failed to fetch posts', error);
                setPosts(mockPosts);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title="Blog"
                description="Insights, tips, and updates for modern Nigerian educators. Learn how to use AI to improve your teaching."
            />
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Teachaide <span className="text-brand-600">Blog</span>
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-slate-500 dark:text-slate-400">
                        Insights, tips, and updates for modern Nigerian educators.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <div key={post.id} className="flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow duration-300">
                                <div className="flex-shrink-0 relative h-48 w-full group">
                                    <Link to={`/blog/${post.slug}`}>
                                        <img
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            src={post.image || `https://source.unsplash.com/random/800x600?education,${post.id}`}
                                            alt={post.title}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-0 transition-opacity" />
                                    </Link>
                                </div>
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                                            Article
                                        </p>
                                        <Link to={`/blog/${post.slug}`} className="block mt-2">
                                            <p className="text-xl font-semibold text-slate-900 dark:text-white hover:text-brand-600 transition-colors">
                                                {post.title}
                                            </p>
                                            <p className="mt-3 text-base text-slate-500 dark:text-slate-400 line-clamp-3">
                                                {post.summary}
                                            </p>
                                        </Link>
                                    </div>
                                    <div className="mt-6 flex items-center">
                                        <div className="flex-shrink-0">
                                            <span className="sr-only">{post.author}</span>
                                            <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-slate-700 flex items-center justify-center">
                                                <User className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {post.author}
                                            </p>
                                            <div className="flex space-x-1 text-sm text-slate-500 dark:text-slate-400">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                <time dateTime={post.createdAt}>
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogHome;
