import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, UserIcon as User } from '../../components/Icons';

interface BlogPostData {
    id: string;
    title: string;
    slug: string;
    content: string;
    summary: string;
    image: string;
    author: string;
    createdAt: string;
}

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPostData | null>(null);
    const [loading, setLoading] = useState(true);

    // Mock data for fallback
    const mockPosts: Record<string, BlogPostData> = {
        'how-to-create-engaging-lesson-notes': {
            id: '1',
            title: 'How to Create Engaging Lesson Notes with AI',
            slug: 'how-to-create-engaging-lesson-notes',
            summary: 'Learn the secrets of using AI to generate lesson notes...',
            content: `
        <p class="mb-4">Creating lesson notes can be a tedious task for many teachers. However, with the advent of AI tools like TeachAide, this process has become significantly streamlined.</p>
        <h2 class="text-2xl font-bold mt-8 mb-4">Why Use AI?</h2>
        <p class="mb-4">AI helps in structuring content, ensuring curriculum alignment, and generating creative examples that resonate with students.</p>
        <h2 class="text-2xl font-bold mt-8 mb-4">Tips for Success</h2>
        <ul class="list-disc pl-6 mb-4 space-y-2">
          <li>Be specific with your topics.</li>
          <li>Review the generated content for context.</li>
          <li>Add your personal teaching flair.</li>
        </ul>
        <p>Start streamlining your workflow today!</p>
      `,
            image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=1200',
            author: 'Teachaide Team',
            createdAt: '2024-03-15'
        },
        'future-of-education-nigeria': {
            id: '2',
            title: 'The Future of Education in Nigeria',
            slug: 'future-of-education-nigeria',
            summary: 'Exploring how technology and AI are reshaping the classroom experience.',
            content: `
        <p class="mb-4">Education in Nigeria is undergoing a massive transformation. Digital literacy is becoming as fundamental as reading and writing.</p>
        <h2 class="text-2xl font-bold mt-8 mb-4">Technological Integration</h2>
        <p class="mb-4">Schools are increasingly adopting smart boards, tablets, and AI assistants to enhance the learning experience.</p>
      `,
            image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=1200',
            author: 'Teeking Hamzat',
            createdAt: '2024-03-10'
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await fetch(`/api/blog/slug/${slug}`);
                if (response.ok) {
                    const data = await response.json();
                    setPost(data);
                } else {
                    // Fallback to mock
                    if (slug && mockPosts[slug]) {
                        setPost(mockPosts[slug]);
                    } else {
                        // Simulated "Not Found" or generic placeholder
                        setPost(null);
                    }
                }
            } catch (error) {
                if (slug && mockPosts[slug]) setPost(mockPosts[slug]);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchPost();
    }, [slug]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
    );

    if (!post) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Post Not Found</h2>
                <Link to="/blog" className="text-brand-600 hover:text-brand-500">Return to Blog</Link>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link to="/blog" className="inline-flex items-center text-brand-600 dark:text-brand-400 hover:underline">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
                    </Link>
                </div>

                <article className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="h-64 sm:h-96 w-full relative">
                        <img
                            src={post.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200'}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
                            <div className="p-8">
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                    {post.title}
                                </h1>
                                <div className="flex flex-wrap items-center text-white/90 gap-6">
                                    <div className="flex items-center">
                                        <User className="h-5 w-5 mr-2" />
                                        <span className="font-medium">{post.author}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 sm:p-12">
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </div>
                </article>
            </div>
        </div>
    );
};

export default BlogPost;
