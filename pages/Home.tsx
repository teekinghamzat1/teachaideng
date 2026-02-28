import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Zap, CheckCircle, FileText, Sparkles, BookOpen,
  Users, Calendar, Clipboard, Volume, Loader2, X, Star, ChevronRight
} from '../components/Icons';
import { db } from '../database';
import { useBranding } from '../contexts/BrandingContext';

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
  const branding = useBranding();

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
                    {branding.userCount > 1000 ? `${(branding.userCount / 1000).toFixed(0)}k+` : (branding.userCount || 0)}
                  </div>
                </div>
                <p className="text-xs lg:text-sm font-bold tracking-tight">Trusted by {branding.userCount > 1000 ? `${(branding.userCount / 1000).toFixed(0)}k+` : (branding.userCount || 0).toLocaleString()}+ educators nationwide</p>
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
      <section className="bg-gradient-to-br from-[#16A34A] via-[#15803d] to-[#14532d] py-24 lg:py-40 rounded-[3rem] lg:rounded-[6rem] mx-4 lg:mx-8 my-12 relative overflow-hidden text-center shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 blur-[120px] rounded-full -ml-48 -mb-48"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/10 border border-white/20 mb-8">
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span className="text-white text-[10px] lg:text-xs font-black uppercase tracking-widest leading-none">Wall of Love</span>
          </div>
          <h2 className="text-4xl lg:text-7xl font-black text-white mb-16 lg:mb-24 tracking-tight leading-tight">
            Voices from the <br className="hidden lg:block" /> Nigerian Classroom
          </h2>
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
  const [activeIndex, setActiveIndex] = useState(0);

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
    { id: '1', name: 'John Doe', role: 'Language Teacher', organization: 'Lagos Grammar School', content: 'This is very amazing, I must confess. It has halved my prep time and allowed me to focus more on student engagement.', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { id: '2', name: 'Ayo Johnson', role: 'Principal', organization: 'TeachAide Academy', content: 'Transformative tool for our rural school teachers. The quality of lesson notes generated is consistent and high-standard.', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { id: '3', name: 'Sarah Ahmed', role: 'Mathematics Lead', organization: 'Smart Class Intl', content: 'The curriculum accuracy is top-notch. High quality results always. My teachers are now much more productive than ever before.', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { id: '4', name: 'Dr. Emeka Obi', role: 'Proprietor', organization: 'Grace Schools', content: 'We integrated TeachAide into our school system and saw an immediate improvement in teacher morale and classroom delivery.', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { id: '5', name: 'Funke Adebayo', role: 'Senior Tutor', organization: 'Excellence College', content: 'Generating assessment questions used to take a whole weekend. Now I do it in five minutes. Simply revolutionary for Nigeria!', rating: 5, avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' }
  ];

  const current = displayItems[activeIndex] || displayItems[0];

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto px-4">
      {/* Testimonial Card */}
      <div
        key={activeIndex}
        className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] lg:rounded-[4rem] p-10 lg:p-24 shadow-2xl shadow-black/20 mb-12 animate-in fade-in zoom-in duration-700 relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-2 h-full bg-[#16A34A] opacity-20"></div>

        <div className="relative z-10 space-y-12">
          {/* Testimonial Quote */}
          <p className="text-2xl lg:text-4xl font-extrabold text-slate-800 dark:text-white leading-[1.3] lg:leading-[1.4] tracking-tight">
            “{current.content}”
          </p>

          {/* Author Details */}
          <div className="space-y-2">
            <h4 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {current.name}
            </h4>
            <p className="text-sm lg:text-base font-bold text-slate-400 dark:text-brand-400/60 uppercase tracking-widest">
              {current.role}{current.organization ? `, ${current.organization}` : ''}
            </p>
          </div>
        </div>

        {/* Decorative Quote Icon */}
        <div className="absolute top-10 right-10 lg:top-16 lg:right-16 opacity-[0.03] dark:opacity-[0.05]">
          <svg className="w-24 lg:w-40 h-24 lg:h-40 text-slate-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V5C14.017 4.44772 14.4647 4 15.017 4H19.017C21.2261 4 23.017 5.79086 23.017 8V15C23.017 18.3137 20.3307 21 17.017 21H14.017ZM1.017 21L1.017 18C1.017 16.8954 1.91243 16 3.017 16H6.017C6.56928 16 7.017 15.5523 7.017 15V9C7.017 8.44772 6.56928 8 6.017 8H2.017C1.46472 8 1.017 7.55228 1.017 7V5C1.017 4.44772 1.46472 4 2.017 4H6.017C8.22614 4 10.017 5.79086 10.017 8V15C10.017 18.3137 7.33065 21 4.017 21H1.017Z" />
          </svg>
        </div>
      </div>

      {/* Avatar Navigation */}
      <div className="flex items-center justify-center gap-4 lg:gap-6">
        {displayItems.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setActiveIndex(idx)}
            className={`relative transition-all duration-500 rounded-full overflow-hidden border-4 ${activeIndex === idx
              ? 'w-16 h-16 lg:w-24 lg:h-24 border-white shadow-xl shadow-black/20 scale-110'
              : 'w-12 h-12 lg:w-16 lg:h-16 border-white/20 hover:border-white/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
              }`}
          >
            {item.avatarUrl ? (
              <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center font-black text-brand-600">
                {item.name.charAt(0)}
              </div>
            )}
            {activeIndex === idx && (
              <div className="absolute inset-0 ring-4 ring-inset ring-[#16A34A]/20"></div>
            )}
          </button>
        ))}
      </div>
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