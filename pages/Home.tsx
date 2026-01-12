import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, CheckCircle, FileText, Sparkles, BookOpen, Users, Calendar, Clipboard, Volume, Loader2, X } from '../components/Icons';
import { db } from '../database';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization?: string;
  content: string;
  avatarUrl?: string;
}

interface BlogPostStub {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image: string;
  author: string;
  createdAt: string;
}

const Home: React.FC = () => {
  const user = db.auth.getCurrentUser();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold mb-6 border border-brand-100">
            For Nigerian Teachers & Students
          </span>
          <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 dark:text-slate-100 sm:text-5xl md:text-6xl mb-6">
            Generate Lesson Notes in <span className="text-brand-600">Seconds</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-300">
            Stop spending hours writing notes by hand. Create standard, Ministry-compliant lesson notes, classwork, and exam questions instantly with AI.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              to={user ? "/generator" : "/login"}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-brand-600 hover:bg-brand-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Start Generating <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center px-8 py-3 border border-slate-300 text-base font-medium rounded-full text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      </section>

      {/* Demo/Preview Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-4 text-xs font-mono text-slate-500">Lesson_Note_Preview.pdf</span>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-32 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 p-4 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-5/6"></div>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-20 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700"></div>
              </div>
              <div className="flex flex-col justify-center items-start space-y-4">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Standard Structure</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-5 h-5 text-brand-500 mr-2" />
                    Behavioural Objectives
                  </li>
                  <li className="flex items-center text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-5 h-5 text-brand-500 mr-2" />
                    Instructional Materials
                  </li>
                  <li className="flex items-center text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-5 h-5 text-brand-500 mr-2" />
                    Presentation Steps (Teacher/Pupil)
                  </li>
                  <li className="flex items-center text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-5 h-5 text-brand-500 mr-2" />
                    Evaluation & Assignments
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-brand-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything a Teacher Needs
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Instant Lesson Notes',
                desc: 'Generate full structured notes for any subject and class level instantly.',
                icon: FileText
              },
              {
                title: 'AI Assessments & Quizzes',
                desc: 'Create objective (MCQ) and theory questions for your students automatically.',
                icon: Clipboard
              },
              {
                title: 'Class Management',
                desc: 'Store student details, manage subjects, and keep track of classroom notes.',
                icon: Users
              },
              {
                title: 'Weekly Timetable',
                desc: 'Build and organize your teaching schedule and export it as a document.',
                icon: Calendar
              },
              {
                title: 'Audio Lessons (TTS)',
                desc: 'Listen to your lesson notes read aloud for better accessibility and review.',
                icon: Volume
              },
              {
                title: 'Offline History',
                desc: 'Access your previously generated plans and notes even without an internet connection.',
                icon: BookOpen
              },
            ].map((feature, idx) => (
              <div key={idx} className="relative group bg-white dark:bg-slate-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-brand-50 text-brand-600 ring-4 ring-white">
                    <feature.icon className="h-8 w-8" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Latest from our Blog</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Insights, teaching tips, and updates.</p>
            </div>
            <Link to="/blog" className="hidden sm:inline-flex items-center text-brand-600 font-medium hover:text-brand-700">
              View all posts <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <LatestPostsBlock />
          <div className="mt-8 text-center sm:hidden">
            <Link to="/blog" className="text-brand-600 font-medium hover:text-brand-700">View all posts &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-brand-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-12">Loved by Nigerian Teachers</h2>
          <TestimonialsBlock />
        </div>
      </section>
    </div>
  );
};

const TestimonialsBlock: React.FC = () => {
  const [items, setItems] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await db.testimonials.getActive();
        if (mounted) setItems(data || []);
      } catch (e) {
        if (mounted) setItems([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', organization: '', content: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.content || !formData.role) return;

    setSubmitting(true);
    try {
      await db.testimonials.submit(formData);
      alert('Thank you! Your testimonial has been submitted for review.');
      setShowModal(false);
      setFormData({ name: '', role: '', organization: '', content: '' });
    } catch (e) {
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items === null) {
    return <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>;
  }

  return (
    <div className="flex flex-col items-center">
      {!items || items.length === 0 ? (
        <div className="text-white text-sm mb-8">No testimonials yet — check back soon.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-12">
          {items.map((t) => (
            <div key={t.id} className="bg-brand-800 rounded-xl p-6 text-left border border-brand-700 flex gap-4 items-start">
              {t.avatarUrl ? (
                <img src={t.avatarUrl} alt={t.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold">{t.name?.charAt(0)}</div>
              )}
              <div>
                <p className="text-brand-100 italic mb-4">"{t.content}"</p>
                <p className="text-white font-bold">{t.name}{t.role ? `, ${t.role}` : ''}</p>
                {t.organization && <p className="text-brand-200 text-sm">{t.organization}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="px-8 py-3 bg-white text-brand-700 font-bold rounded-full shadow hover:bg-brand-50 transition-colors"
      >
        Share Your Story
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Share Your Experience</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Tell us how Teachaide has helped you.</p>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5"
                  placeholder="e.g. Adeola Johnson"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5"
                    placeholder="e.g. Principal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">School (Optional)</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5"
                    placeholder="e.g. Lagos High"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Story *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5"
                  placeholder="How has Teachaide impacted your work?"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Testimonial'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LatestPostsBlock: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostStub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/blog');
        if (response.ok) {
          const data = await response.json();
          if (mounted) {
            // Take only first 3
            setPosts(Array.isArray(data) ? data.slice(0, 3) : []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch posts');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPosts();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  // Fallback if no posts
  const displayPosts = posts.length > 0 ? posts : [
    {
      id: '1', title: 'Why Every Nigerian Teacher Needs AI Lesson Notes', slug: 'why-every-teacher-needs-ai',
      summary: 'Discover how AI is revolutionizing classroom preparation in Nigeria.',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600', author: 'Teachaide Team', createdAt: new Date().toISOString()
    },
    {
      id: '2', title: 'Maximizing Student Engagement with Technology', slug: 'student-engagement-tech',
      summary: 'Practical tips for using technology to keep students focused and interested.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600', author: 'Teeking Hamzat', createdAt: new Date().toISOString()
    },
    {
      id: '3', title: 'The Future of Education: 2025 and Beyond', slug: 'future-education-2025',
      summary: 'What trends should educators look out for in the coming years?',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600', author: 'Sarah Johnson', createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {displayPosts.map((post) => (
        <div key={post.id} className="flex flex-col rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
          <Link to={`/blog/${post.slug}`} className="block h-48 overflow-hidden group">
            <img
              src={post.image || `https://source.unsplash.com/random/800x600?education,${post.id}`}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600'; }}
            />
          </Link>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex-1">
              <Link to={`/blog/${post.slug}`} className="block">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                  {post.summary}
                </p>
              </Link>
            </div>
            <div className="mt-6 flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-slate-700 flex items-center justify-center">
                  <span className="font-bold text-brand-700 dark:text-brand-400 text-xs">{post.author.charAt(0)}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{post.author}</p>
                <div className="flex space-x-1 text-xs text-slate-500 dark:text-slate-400">
                  <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString()}</time>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;