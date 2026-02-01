import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Trash, FileText, Loader2, Edit, ChevronRight, Zap, Save, MessageSquare, BarChart } from '../components/Icons';
import { LessonNote } from '../types';
import { db } from '../database';
import { showAlert } from '../utils/alerts';
import SupportChat from '../components/SupportChat';

const Dashboard: React.FC = () => {
  const [savedNotes, setSavedNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number; duration?: string } | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const currentUser = db.auth.getCurrentUser();
    setUser(currentUser);

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.subscriptionPlan === 'School' && currentUser.schoolId) {
      navigate('/teacher-dashboard');
      return;
    }

    const loadData = async () => {
      try {
        const notes = await db.notes.getUserNotes();
        setSavedNotes(notes);
        const usageData = await db.auth.getUsage();
        setUsage(usageData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (await showAlert.confirm('Delete Note', 'Are you sure you want to delete this lesson note?')) {
      try {
        await db.notes.delete(id);
        setSavedNotes(prev => prev.filter(note => note.id !== id));
        showAlert.success('Deleted', 'Lesson note removed successfully.');
      } catch (err) {
        showAlert.error('Delete Failed', 'Failed to delete note.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
      </div>
    );
  }

  const planName = user?.subscriptionPlan || 'Free Plan';

  return (
    <div className="min-h-screen dashboard-bg text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-10">
      <div className="max-w-7xl mx-auto p-4 lg:p-10 space-y-6 animate-in fade-in duration-500">

        {/* Desktop Layout (Hidden on Mobile) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">

          {/* Left Column: Integrated Subscription Card & Upgrade Banner */}
          <div className="lg:col-span-2 space-y-6">

            {/* Integrated Subscription & Usage Card */}
            <div className="glass-card rounded-[2.5rem] p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-10">
              {/* Left: Plan Details */}
              <div className="w-full md:w-auto text-center md:text-left space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Current Subscription</h3>
                  <p className="text-slate-400 font-bold">Free Plan</p>
                </div>

                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">₦0</span>
                  <span className="text-xl text-slate-400 font-bold">/ week</span>
                </div>

                <div className="inline-flex items-center gap-2 px-5 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-500/20">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-black uppercase tracking-[0.15em]">Inactive</span>
                </div>
              </div>

              {/* Center: Circular Gauge */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      className="stroke-slate-100 dark:stroke-white/5"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      stroke="url(#sub-grad)"
                      strokeWidth="12"
                      strokeDasharray={528}
                      strokeDashoffset={528 - (528 * (usage?.used || 3)) / (usage?.limit || 10)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="sub-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                      {usage?.used || 3} <span className="text-base text-slate-400 font-bold">of 10</span>
                    </div>
                    <div className="text-sm font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mt-1">used</div>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">7 generations left</p>
              </div>

              {/* Right: Monthly Usage Info */}
              <div className="w-full md:w-auto text-center md:text-right space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Monthly Usage</h3>
                <div className="flex items-baseline justify-center md:justify-end gap-2">
                  <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{usage?.used || 3}</span>
                  <span className="text-3xl text-slate-300 font-bold">/ 10</span>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Resets in 12 days</p>
              </div>
            </div>

            {/* Upgrade Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#111827] via-[#064e3b] to-[#065f46] rounded-[2.5rem] p-8 lg:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 group">
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-1 text-center md:text-left">
                  <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Upgrade to Pro</h3>
                  <p className="text-emerald-100/70 font-semibold lg:text-lg">Unlock unlimited generations</p>
                </div>
              </div>

              <Link to="/pricing" className="relative z-10 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-black rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 text-lg shadow-xl shadow-emerald-500/20 group">
                Upgrade
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            </div>
          </div>

          {/* Right Column: Saved Lesson Notes (Vertical Sidebar) */}
          <div className="lg:col-span-1 h-full">
            <div className="glass-card rounded-[2.5rem] p-8 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Saved Lesson Notes</h3>
                <span className="px-3 py-1 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-black rounded-full border border-brand-100 dark:border-brand-500/20 uppercase">
                  {savedNotes.length} Saved
                </span>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                {savedNotes.length > 0 ? (
                  savedNotes.slice(0, 5).map((note) => (
                    <div key={note.id} className="group pb-8 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="font-black text-brand-600 dark:text-brand-400 text-lg leading-tight group-hover:text-brand-500 transition-colors">
                          {note.topic}
                        </h4>
                        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate('/generator', { state: { editData: note } })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-600 dark:text-slate-400 transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => handleDelete(note.id!, e)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 transition-all">
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                          <BookOpen className="w-4 h-4 opacity-50" />
                          <span className="line-clamp-1">{note.subject}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-400 pl-6">Class: {note.classLevel}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6 opacity-60">
                          {new Date(note.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {note.classLevel}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center opacity-40">
                    <Save className="w-12 h-12 mb-4" />
                    <p className="font-bold italic">No notes saved</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout (Visible ONLY on Mobile) */}
        <div className="lg:hidden space-y-6">
          {/* Current Subscription Card */}
          <div className="glass-card rounded-[2rem] p-6 flex flex-row items-center justify-between">
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 tracking-tight">Current Subscription</h3>
                <p className="text-slate-400 font-bold text-sm">Free Plan</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">₦0</span>
                <span className="text-base text-slate-400 font-bold">/ week</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-500/20">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-black uppercase tracking-wider">Inactive</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" className="stroke-slate-100 dark:stroke-white/5" strokeWidth="8" fill="transparent" />
                  <circle cx="64" cy="64" r="56" stroke="url(#sub-grad-mob)" strokeWidth="8" strokeDasharray={352} strokeDashoffset={352 - (352 * (usage?.used || 3)) / (usage?.limit || 10)} strokeLinecap="round" fill="transparent" className="transition-all duration-1000" />
                  <defs>
                    <linearGradient id="sub-grad-mob" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-black text-slate-900 dark:text-white">{usage?.used || 3} <span className="text-[10px] text-slate-400">of 10</span></div>
                  <div className="text-[10px] uppercase font-black text-slate-400">used</div>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-2">7 generations left</p>
            </div>
          </div>

          {/* Monthly Usage Card */}
          <div className="glass-card rounded-[2rem] p-6 flex flex-row items-center justify-between">
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Monthly Usage</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{usage?.used || 3}</span>
                <span className="text-2xl text-slate-300 font-bold">/ 10</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase">Resets in 12 days</p>
            </div>
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" className="stroke-slate-100 dark:stroke-white/5" strokeWidth="6" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="url(#usage-grad-mob)" strokeWidth="6" strokeDasharray={251} strokeDashoffset={251 - (251 * (usage?.used || 3)) / (usage?.limit || 10)} strokeLinecap="round" fill="transparent" />
                <defs>
                  <linearGradient id="usage-grad-mob" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                <div className="w-1 h-5 bg-emerald-400/50 rounded-full"></div>
                <div className="w-1 h-8 bg-emerald-400 rounded-full"></div>
                <div className="w-1 h-4 bg-emerald-400/50 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Upgrade to Pro Banner Container for Mobile */}
          <Link to="/pricing" className="block relative overflow-hidden bg-gradient-to-br from-[#111827] via-[#064e3b] to-[#065f46] rounded-[1.5rem] p-6 shadow-2xl overflow-hidden group">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Upgrade to Pro</h3>
                  <p className="text-emerald-100/70 text-xs font-semibold">Unlock unlimited generations</p>
                </div>
              </div>
              <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-500/20 group-hover:bg-emerald-500 transition-all group-hover:text-[#064e3b] text-emerald-400">
                <ChevronRight className="w-5 h-5 font-black" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
          </Link>

          {/* Bottom Action Cards for Mobile */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/generator" className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-3 active:scale-95 transition-all">
              <Sparkles className="w-6 h-6 text-brand-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Generate Lesson</span>
            </Link>
            <Link to="/history" className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-3 active:scale-95 transition-all relative">
              <div className="relative">
                <Save className="w-6 h-6 text-emerald-500" />
                {savedNotes.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 font-bold">
                    {savedNotes.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Saved Notes</span>
            </Link>
          </div>
        </div>

        {/* Footer Section: Branding (Hidden on Mobile actions handled above) */}
        <div className="hidden lg:block glass-card rounded-[2.5rem] p-8 md:p-10 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tighter">TeachAide <span className="text-slate-400">AI</span></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
              <Link to="/generator" className="flex items-center gap-2 hover:text-brand-600 transition-colors">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Generate Lesson
              </Link>
              <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-white/10"></div>
              <Link to="/history" className="flex items-center gap-2 hover:text-brand-600 transition-colors group">
                <FileText className="w-4 h-4 text-brand-500" />
                <div className="relative">
                  Saved Notes
                  {savedNotes.length > 0 && (
                    <span className="absolute -top-2 -right-4 w-4 h-4 bg-emerald-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
                      {savedNotes.length}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          <p className="text-center text-slate-400 font-bold text-sm leading-relaxed max-w-3xl mx-auto opacity-70">
            Empowering Nigerian teachers with AI tools to save time and improve education quality.
          </p>
        </div>
      </div>

      {/* Floating Chat FAB */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-all hover:scale-110 active:scale-95 z-50 group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
        <MessageSquare className="w-7 h-7 relative z-10 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Support Chat Component */}
      {user && <SupportChat hideToggle={true} defaultOpen={showChat} />}
    </div>
  );
};

export default Dashboard;
