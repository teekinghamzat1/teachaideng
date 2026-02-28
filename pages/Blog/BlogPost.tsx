import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, UserIcon as User, Sparkles, BookOpen } from '../../components/Icons';
import SEO from '../../components/SEO';

// Social Icons Components
const Facebook = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
);

const Twitter = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-12.7 12.5a9.9 9.9 0 0 1-8.2-5.2s.5.1.9.1c2.8 0 4.9-2 5.6-3.7-2.1-.1-3.7-1.4-4.2-3 .5 0 1 0 1.2.1-1.6-.5-2.6-2-2.6-4.2.5.3 1.1.5 1.7.5-3-2.1-2.9-6.3.2-8 3.5 4.3 8.8 5 11.2 5.1-1-4.2 4.6-7 7.7-4.2 1.9.8 1.5 2.6 1.3 2.9h0z"></path>
    </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
        <rect x="2" y="9" width="4" height="12"></rect>
        <circle cx="4" cy="4" r="2"></circle>
    </svg>
);

interface BlogPostData {
    id: string;
    title: string;
    slug: string;
    content: string; // We will use a special marker {{CTA}} to insert the CTA card
    summary: string;
    image: string;
    author: string;
    createdAt: string;
    readTime?: string;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
}

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPostData | null>(null);
    const [loading, setLoading] = useState(true);

    // Mock data for fallback
    const mockPosts: Record<string, BlogPostData> = {
        'how-ai-is-changing-lesson-planning': {
            id: '1',
            title: 'How AI Is Changing Lesson Planning for Teachers in Nigeria',
            slug: 'how-ai-is-changing-lesson-planning',
            summary: 'Lesson planning has always been an important part of teaching. But for many teachers in Nigeria, it is also one of the most stressful and time-consuming tasks.',
            content: `
                <p class="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                    Lesson planning has always been an important part of teaching. But for many teachers in Nigeria, it is also one of the most stressful and time-consuming tasks.
                </p>

                {{CTA}}

                <div class="mt-12">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white m-0">The Traditional Way of Lesson Planning</h2>
                    </div>
                </div>
                
                <p class="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    Traditionally, lesson planning involves:
                </p>
                
                <ul class="space-y-4 mb-8">
                    <li class="flex items-start gap-3">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                        <span class="text-slate-700 dark:text-slate-300 font-medium"><strong>Writing lesson notes</strong>, objectives, and class activities in minutes</span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                        <span class="text-slate-700 dark:text-slate-300 font-medium">Preparing class activities</span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5"></span>
                        <span class="text-slate-700 dark:text-slate-300 font-medium"><strong>Writing evaluations</strong> and classroom lesson notes</span>
                    </li>
                </ul>

                <p class="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    This manual process often takes hours, leaving teachers exhausted before they even step into the classroom. With large class sizes and administrative duties, finding time to create engaging, personalized lessons becomes a daily struggle.
                </p>
            `,
            image: '/images/blog-hero-classroom.jpg', // Placeholder, using a generic one in code
            author: 'TeachAide Team',
            createdAt: '2026-02-01',
            readTime: '4 min read',
            tags: ['AI', 'Lesson Planning']
        },
        // Legacy mock posts just in case link is different
        'how-to-create-engaging-lesson-notes': {
            id: '2',
            title: 'How AI Is Changing Lesson Planning for Teachers in Nigeria', // Reusing title for demo if slug matches
            slug: 'how-to-create-engaging-lesson-notes',
            summary: 'Learn the secrets of using AI to generate lesson notes...',
            content: `
               <p class="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                    Lesson planning has always been an important part of teaching. But for many teachers in Nigeria, it is also one of the most stressful and time-consuming tasks.
                </p>

                {{CTA}}

                <div class="mt-12">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-white m-0">The Traditional Way of Lesson Planning</h2>
                    </div>
                </div>
            `,
            image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=1200',
            author: 'TeachAide Team',
            createdAt: '2026-02-01',
            readTime: '4 min read',
            tags: ['AI', 'Lesson Planning']
        }
    };

    const [relatedPosts, setRelatedPosts] = useState<any[]>([]);

    useEffect(() => {
        // Fetch related posts (latest posts excluding current one)
        const fetchRelatedPosts = async () => {
            try {
                const response = await fetch('/api/blog');
                if (response.ok) {
                    const data = await response.json();
                    // Filter out current post (by slug or ID if available) and take top 3
                    const filtered = data
                        .filter((p: any) => p.slug !== slug)
                        .slice(0, 3)
                        .map((p: any) => ({
                            id: p.id,
                            title: p.title,
                            date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            image: p.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
                            slug: p.slug // Ensure we have slug for the link
                        }));

                    if (filtered.length > 0) {
                        setRelatedPosts(filtered);
                    } else {
                        // Fallback to dummies if no other posts exist
                        setRelatedPosts([
                            {
                                id: '1',
                                title: 'AI Lesson Planning Tools for Teachers',
                                date: 'Jan 15, 2026',
                                image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=600',
                                slug: '#'
                            },
                            {
                                id: '2',
                                title: 'How to Write Lesson Notes Easily',
                                date: 'Jan 7, 2026',
                                image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=600',
                                slug: '#'
                            },
                        ]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch related posts', error);
            }
        };

        fetchRelatedPosts();
    }, [slug]);



    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                // First try to fetch real data from the API
                const response = await fetch(`/api/blog/slug/${slug}`);
                if (response.ok) {
                    const data = await response.json();

                    // Transform API data to match our UI requirements if needed
                    // For example, if API doesn't return content with the {{CTA}} tag, we might want to inject it
                    // But for now, let's just use the real content
                    setPost({
                        ...data,
                        // Ensure we have at least defaults for new fields if API doesn't provide them yet
                        readTime: data.readTime || '5 min read',
                        tags: data.tags || (data.category ? [data.category] : ['Education'])
                    });
                } else {
                    // Only fallback to mock if API returns error (e.g. 404)
                    console.log('Blog post not found in API, checking mocks...');
                    if (slug && mockPosts[slug]) {
                        setPost(mockPosts[slug]);
                    } else if (slug && (slug.includes('ai') || slug.includes('lesson'))) {
                        // Keep the design showcase for specific keywords if direct match fails
                        setPost(mockPosts['how-ai-is-changing-lesson-planning']);
                    } else {
                        setPost(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching blog post:', error);
                // Fallback on network error
                if (slug && mockPosts[slug]) {
                    setPost(mockPosts[slug]);
                } else {
                    setPost(null);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-[#F8F9FA] dark:bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
    );

    if (!post) return null;

    // Split content to insert CTA (ensure content is a string)
    const safeContent = post.content || '';
    const contentParts = safeContent.split('{{CTA}}');

    return (
        <div className="bg-[#F8F9FA] dark:bg-slate-900 min-h-screen font-sans">
            <SEO
                title={post.metaTitle || post.title}
                description={post.metaDescription || post.summary}
                keywords={post.keywords}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header / Nav */}
                <div className="flex justify-between items-center mb-8">
                    <Link to="/blog" className="inline-flex items-center text-green-700 dark:text-green-400 font-medium hover:opacity-80 transition-opacity">
                        <ArrowLeft className="h-5 w-5 mr-2" /> Back to Blog
                    </Link>

                    <div className="flex items-center gap-4">
                        <span className="text-slate-500 text-sm font-medium">Share</span>
                        <div className="flex items-center gap-3">
                            <button className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                                <Facebook className="w-5 h-5" />
                            </button>
                            <button className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </button>
                            <button className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hero Image */}
                <div className="w-full aspect-[2/1] md:aspect-[2.4/1] bg-slate-200 rounded-[32px] overflow-hidden shadow-sm mb-10">
                    <img
                        src={(post.image && post.image.startsWith('http')) ? post.image : 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=2400'}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Title Section */}
                <div className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-10">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-slate-600 dark:text-slate-400 text-sm md:text-base">
                        <div className="flex items-center">
                            <User className="h-5 w-5 mr-2 text-slate-400" />
                            <span>{post.author}</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-slate-400" />
                            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {post.readTime && (
                            <div className="flex items-center">
                                <span className="w-1 h-1 rounded-full bg-slate-300 mr-4"></span>
                                <span>{post.readTime}</span>
                            </div>
                        )}

                        {post.tags && post.tags.length > 0 && (
                            <div className="flex items-center gap-2 ml-2">
                                {post.tags.map(tag => (
                                    <span key={tag} className={`px-3 py-1 rounded-md text-xs font-bold ${tag === 'AI' ? 'bg-slate-200 text-slate-700' : 'bg-[#E0E7DE] text-[#2F4F31]'
                                        }`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-slate-800/50 rounded-[32px] p-8 md:p-12 mb-16 shadow-sm border border-slate-100 dark:border-slate-800">
                    {contentParts[0] && (
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-li:text-slate-600 dark:prose-li:text-slate-300"
                            dangerouslySetInnerHTML={{ __html: contentParts[0] }}
                        />
                    )}

                    {/* Embedded CTA Card */}
                    <div className="my-10 bg-[#F5F9F6] dark:bg-slate-800 rounded-2xl p-8 border border-[#E8EFEC] dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded bg-[#1A7F48] flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white m-0">Plan lessons faster with TeachAide AI</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
                            Generate lesson notes, objectives, and class activities in minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Link to="/signup" className="px-6 py-3 bg-[#1A7F48] hover:bg-[#15663A] text-white font-bold rounded-lg transition-colors shadow-sm">
                                Try TeachAide
                            </Link>
                            <Link to="/how-it-works" className="px-4 py-3 text-[#1A7F48] dark:text-green-400 font-medium hover:underline">
                                See how it works
                            </Link>
                        </div>
                    </div>

                    {contentParts[1] && (
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-li:text-slate-600 dark:prose-li:text-slate-300"
                            dangerouslySetInnerHTML={{ __html: contentParts[1] }}
                        />
                    )}
                </div>

                {/* Related Posts */}
                <div className="mt-20">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-full bg-[#E0E7DE] flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#1A7F48]" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Start teaching smarter this week</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedPosts.map(related => (
                            <Link key={related.id} to={`/blog/${related.slug || related.id}`} className="group block">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-800 h-full flex flex-col">
                                    <div className="aspect-[1.6/1] overflow-hidden">
                                        <img
                                            src={related.image}
                                            alt={related.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-auto line-clamp-2 group-hover:text-[#1A7F48] transition-colors">{related.title}</h3>
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <span className="text-sm text-slate-500">{related.date}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BlogPost;
