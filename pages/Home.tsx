import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Zap, CheckCircle, FileText, Sparkles, BookOpen,
  Users, Calendar, Clipboard, Volume, Loader2, X, Star, ChevronRight
} from '../components/Icons';
import { db } from '../database';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization?: string;
  content: string;
  avatarUrl?: string;
  rating?: number;
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
    <div className="flex flex-col bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* Premium Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-10 lg:pt-32 pb-20 lg:pb-40">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#16A34A]/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 mx-auto lg:mx-0">
                <span className="flex h-2 w-2 rounded-full bg-[#16A34A]"></span>
                <span className="text-[#16A34A] text-[10px] lg:text-xs font-black uppercase tracking-widest leading-none">For Nigerian Teachers & Students</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] px-2 lg:px-0">
                Generate Lesson <span className="text-[#16A34A] relative inline-block">Notes <svg className="absolute -bottom-1 lg:-bottom-2 left-0 w-full h-2 lg:h-3 text-[#16A34A]/20" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 0 100 5" fill="none" stroke="currentColor" strokeWidth="10" /></svg></span> in <span className="text-[#16A34A]">Seconds</span>
              </h1>

              <p className="max-w-xl mx-auto lg:mx-0 text-base lg:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4 lg:px-0">
                Stop spending hours writing notes by hand. Create standard, Ministry‑compliant lesson notes, classwork, and exam questions instantly with AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 lg:gap-6 pt-4 px-4 sm:px-0">
                <Link
                  to={user ? "/generator" : "/login"}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 lg:px-10 py-4 lg:py-5 bg-[#16A34A] text-white text-base lg:text-lg font-black rounded-2xl shadow-2xl shadow-[#16A34A]/30 hover:shadow-[#16A34A]/50 hover:-translate-y-1 transition-all active:scale-95 group"
                >
                  Start Generating <ChevronRight className="ml-3 w-5 lg:w-6 h-5 lg:h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 lg:px-10 py-4 lg:py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-base lg:text-lg font-bold text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  View Pricing <ArrowRight className="ml-2 w-5 h-5 opacity-40" />
                </Link>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-slate-400">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-[#16A34A]">
                      {['A', 'M', 'J', 'S'][i - 1]}
                    </div>
                  ))}
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-white dark:border-slate-950 bg-[#16A34A] flex items-center justify-center font-bold text-[10px] text-white">
                    5k+
                  </div>
                </div>
                <p className="text-xs lg:text-sm font-bold tracking-tight">Trusted by 5,000+ educators nationwide</p>
              </div>
            </div>

            <div className="relative group animate-in fade-in zoom-in duration-1000 mt-10 lg:mt-0 px-4 lg:px-0">
              <div className="absolute inset-0 bg-[#16A34A]/10 blur-[60px] lg:blur-[100px] rounded-full group-hover:scale-110 transition-transform"></div>
              <img
                src="/hero-illustration.png"
                alt="Teacher with AI Tools"
                className="relative z-10 w-full h-auto drop-shadow-[0_20px_20px_rgba(22,163,74,0.15)] rounded-[2rem] lg:rounded-[3rem]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 lg:py-32 bg-[#F9FAFB] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-24 space-y-4">
            <h2 className="text-[#16A34A] font-black text-[10px] lg:text-xs uppercase tracking-[0.4em]">Features</h2>
            <p className="text-3xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
              Everything a Teacher Needs
            </p>
            <p className="max-w-2xl mx-auto text-slate-500 font-medium text-sm lg:text-lg italic px-4">The ultimate pedagogical toolset designed for the modern classroom.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12">
            {[
              { title: 'Instant Lesson Notes', desc: 'Generate full structured notes for any subject and class level instantly.', icon: FileText, color: 'bg-green-500' },
              { title: 'AI Assessments & Quizzes', desc: 'Create objective (MCQ) and theory questions for your students automatically.', icon: Clipboard, color: 'bg-blue-500' },
              { title: 'Class Management', desc: 'Store student details, manage subjects, and keep track of classroom notes.', icon: Users, color: 'bg-purple-500' },
              { title: 'Weekly Timetable', desc: 'Build and organize your teaching schedule and export it as a document.', icon: Calendar, color: 'bg-[#16A34A]' },
              { title: 'Audio Lessons (TTS)', desc: 'Listen to your lesson notes read aloud for better accessibility and review.', icon: Volume, color: 'bg-orange-500' },
              { title: 'Offline History', desc: 'Access your previously generated plans and notes even without an internet connection.', icon: BookOpen, color: 'bg-pink-500' },
            ].map((feature, idx) => (
              <div key={idx} className="group relative bg-white dark:bg-slate-900 p-8 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-black/20 hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className="mb-6 lg:mb-10 relative">
                  <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl ${feature.color} flex items-center justify-center text-white shadow-lg shadow-inherit/30 group-hover:rotate-6 transition-transform`}>
                    <feature.icon className="h-6 lg:h-8 w-6 lg:w-8" />
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-3 lg:mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section - Re-added and redesigned to match reference */}
      <section className="py-20 lg:py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-16 lg:mb-20">
            <div className="text-center md:text-left">
              <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Recent Updates</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">Insights and tips for Nigerian educators</p>
            </div>
            <Link to="/blog" className="px-6 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[#16A34A] hover:border-[#16A34A]/30 transition-all flex items-center gap-2">
              Read all Stories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <LatestPostsBlock />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#16A34A] py-20 lg:py-32 rounded-[3rem] lg:rounded-[6rem] mx-4 lg:mx-8 my-10 relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl lg:text-6xl font-black text-white mb-12 lg:mb-20 tracking-tight">Loved by Nigerian Teachers</h2>
          <TestimonialsBlock />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <h3 className="text-2xl lg:text-3xl font-black dark:text-white leading-tight">Ready to save hours of prep time?</h3>
          <p className="text-slate-500 font-medium italic">Join thousands of Nigerian teachers empowering their classrooms with AI.</p>
          <Link
            to={user ? "/generator" : "/signup"}
            className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-5 bg-[#16A34A] text-white text-xl font-black rounded-[2rem] shadow-2xl shadow-[#16A34A]/40 hover:shadow-[#16A34A]/60 hover:-translate-y-1 transition-all active:scale-95 group"
          >
            Start Generating Now <Zap className="ml-3 w-6 h-6 fill-white" />
          </Link>
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

  if (items === null) return <div className="flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-white opacity-50" /></div>;

  const displayItems = items.length > 0 ? items : [
    { id: '1', name: 'John Doe', role: 'Language Teacher', content: 'This is very amazing, I must confess. It has halved my prep time.', rating: 5 },
    { id: '2', name: 'Ayo Johnson', role: 'Principal', content: 'Transformative tool for our rural school teachers.', rating: 5 },
    { id: '3', name: 'Sarah Ahmed', role: 'Mathematics Lead', content: 'The curriculum accuracy is top-notch. High quality results always.', rating: 5 }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {displayItems.map((t) => (
        <div key={t.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-10 text-left hover:bg-white/20 transition-all group overflow-hidden relative">
          <div className="flex items-center gap-4 mb-6 lg:mb-8">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-white flex items-center justify-center text-[#16A34A] font-black text-xl lg:text-2xl shadow-xl">{t.name?.charAt(0)}</div>
            <div>
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 lg:w-4 h-3 lg:h-4 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-white font-black leading-none text-sm lg:text-base">{t.name}</p>
            </div>
          </div>
          <p className="text-white/90 text-base lg:text-lg font-medium italic mb-6 lg:mb-8 leading-relaxed">"{t.content}"</p>
          <div className="pt-6 border-t border-white/10">
            <p className="text-white/60 text-[10px] lg:text-xs font-bold uppercase tracking-widest">{t.role}</p>
          </div>
        </div>
      ))}
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
          if (mounted) setPosts(Array.isArray(data) ? data.slice(0, 3) : []);
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

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" /></div>;

  const displayPosts = posts.length > 0 ? posts : [
    {
      id: '1', title: 'Winter Lesson Notes', slug: 'winter-lesson-notes',
      summary: 'Discover how AI is revolutionizing classroom preparation this season.',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600', author: 'Teachaide Team', createdAt: '2026-01-24'
    },
    {
      id: '2', title: 'AI Assessments & Quizzes', slug: 'ai-assessment-quizzes',
      summary: 'Practical tips for creating students assessments automatically.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600', author: 'Teeking Hamzat', createdAt: '2026-01-24'
    },
    {
      id: '3', title: 'Class Management', slug: 'class-management-tips',
      summary: 'Manage your learners and subjects efficiently.',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600', author: 'Sarah Johnson', createdAt: '2026-01-24'
    }
  ];

  return (
    <div className="grid gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
      {displayPosts.map((post) => (
        <div key={post.id} className="group bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/10 hover:shadow-2xl transition-all hover:-translate-y-1">
          <Link to={`/blog/${post.slug}`} className="block h-56 overflow-hidden relative">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </Link>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center text-white font-black text-[10px]">{post.author.charAt(0)}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-[#16A34A] transition-colors">{post.title}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3">{post.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;