import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Sparkles, Trash, FileText, Loader2, Edit,
  ChevronRight, Zap, Save, BarChart, TrendingUp, Clock,
  Plus, Search, Download, Clipboard
} from '../components/Icons';
import { LessonNote, Assessment } from '../types';
import { db } from '../database';
import { showAlert } from '../utils/alerts';
import UpgradeCard from '../components/UpgradeCard';

const Dashboard: React.FC = () => {
  const [savedNotes, setSavedNotes] = useState<LessonNote[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [forecastFilter, setForecastFilter] = useState<'This Week' | 'Last Week'>('This Week');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const currentUser = db.auth.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // If school user, they have their own dashboard
    if (currentUser.subscriptionPlan === 'School' && currentUser.schoolId) {
      navigate('/teacher-dashboard');
      return;
    }

    try {
      const [notes, assessmentsData, usageData] = await Promise.all([
        db.notes.getUserNotes(),
        db.assessments.getUserAssessments(),
        db.auth.getUsage()
      ]);
      setSavedNotes(notes);
      setAssessments(assessmentsData);
      setUsage(usageData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'note' | 'assessment', e: React.MouseEvent) => {
    e.preventDefault();
    const title = type === 'note' ? 'Delete Note' : 'Delete Assessment';
    const message = type === 'note' ? 'Permanently remove this lesson note?' : 'Permanently remove this assessment?';

    if (await showAlert.confirm(title, message)) {
      try {
        if (type === 'note') {
          await db.notes.delete(id);
          setSavedNotes(prev => prev.filter(note => note.id !== id));
        } else {
          await db.assessments.delete(id);
          setAssessments(prev => prev.filter(a => a.id !== id));
        }
        showAlert.success('Deleted', 'Item removed.');
      } catch (err) {
        showAlert.error('Error', 'Failed to delete item.');
      }
    }
  };

  // --- Dynamic Stats ---
  const timeSavedValue = useMemo(() => {
    const hours = (savedNotes.length * 2) + (assessments.length * 1.5); // More realistic: 2h per note, 1.5h per assessment
    return hours > 0 ? `${hours}h` : '0h';
  }, [savedNotes, assessments]);

  const dailyGoalData = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const notesToday = savedNotes.filter(n => new Date(n.createdAt || '').toLocaleDateString() === today).length;
    const quizToday = assessments.filter(a => new Date(a.createdAt || '').toLocaleDateString() === today).length;
    const totalToday = notesToday + quizToday;
    const target = 5; // Default daily goal
    return {
      value: `${totalToday}/${target}`,
      progress: Math.min((totalToday / target) * 100, 100),
      subtitle: totalToday >= target ? 'Daily goal hit!' : `${target - totalToday} more to goal`
    };
  }, [savedNotes, assessments]);

  const statCards = [
    {
      title: 'Daily Progress',
      value: dailyGoalData.value,
      subtitle: dailyGoalData.subtitle,
      icon: TrendingUp,
      color: 'bg-teal-500/10 text-teal-600',
      type: 'goal',
      progress: dailyGoalData.progress
    },
    {
      title: 'Total Time Saved',
      value: timeSavedValue,
      subtitle: 'Estimated productivity boost',
      icon: Clock,
      color: 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20',
      type: 'chart'
    }
  ];

  // --- Dynamic Forecast Chart Data ---
  const forecastChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const startOfCurrentWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const targetWeekStart = new Date(startOfCurrentWeek);
    if (forecastFilter === 'Last Week') {
      targetWeekStart.setDate(targetWeekStart.getDate() - 7);
    }

    const dailyCounts = days.map((day, index) => {
      const targetDate = new Date(targetWeekStart);
      targetDate.setDate(targetDate.getDate() + index);
      const dateStr = targetDate.toLocaleDateString();

      const noteCount = savedNotes.filter(n => new Date(n.createdAt || '').toLocaleDateString() === dateStr).length;
      const quizCount = assessments.filter(a => new Date(a.createdAt || '').toLocaleDateString() === dateStr).length;

      return {
        label: day,
        primary: noteCount,
        secondary: quizCount,
        total: noteCount + quizCount
      };
    });

    const maxCount = Math.max(...dailyCounts.map(d => d.total + 1), 5); // Minimum 5 for scaling

    return dailyCounts.map(d => ({
      ...d,
      primaryHeight: (d.primary / maxCount) * 100,
      secondaryHeight: (d.secondary / maxCount) * 100
    }));
  }, [savedNotes, assessments, forecastFilter]);

  // --- Dynamic Activities ---
  const recentActivities = useMemo(() => {
    const combined = [
      ...savedNotes.map(n => ({
        time: new Date(n.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(n.createdAt || ''),
        action: 'Lesson Note generated for',
        target: n.topic,
        color: 'bg-brand-500'
      })),
      ...assessments.map(a => ({
        time: new Date(a.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(a.createdAt || ''),
        action: 'Assessment created for',
        target: a.topic,
        color: 'bg-teal-500'
      }))
    ];

    return combined
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4);
  }, [savedNotes, assessments]);

  // Combined history for the table
  const recentContent = useMemo(() => {
    const combined = [
      ...savedNotes.map(n => ({ ...n, contentType: 'Lesson Note' })),
      ...assessments.map(a => ({ ...a, contentType: 'Assessment' }))
    ];
    return combined.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }, [savedNotes, assessments]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-slate-500 font-bold">Welcome back, {user?.name.split(' ')[0]}!</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/generator"
            className="px-6 py-3 bg-white dark:bg-slate-950 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-black rounded-2xl flex items-center gap-2 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            New Lesson
          </Link>
          <Link
            to="/assessment"
            className="px-6 py-3 bg-brand-500 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Quiz
          </Link>
        </div>
      </div>

      <UpgradeCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2/3 Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Main Forecast Card (Dynamic) */}
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Lesson Generation Forecast</h3>
                <p className="text-slate-400 text-sm font-bold">Projected activity {forecastFilter.toLowerCase()}</p>
              </div>
              <select
                value={forecastFilter}
                onChange={(e) => setForecastFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-500 focus:ring-0 cursor-pointer"
              >
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>

            {/* Dynamic Forecast Chart */}
            <div className="h-64 mt-4 relative w-full flex items-end justify-between gap-4 pb-12">
              {/* Chart grid lines */}
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="absolute w-full h-px bg-slate-100 dark:bg-slate-800" style={{ bottom: `${i * 25 + 25}%` }} />
              ))}

              {/* Bars representing days */}
              {forecastChartData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 relative z-10 group/bar">
                  <div className="relative w-full flex flex-col justify-end h-48">
                    {/* Notes Bar */}
                    <div
                      className="w-2 md:w-3 mx-auto rounded-full bg-brand-500/80 group-hover/bar:bg-brand-500 transition-all duration-500"
                      style={{ height: `${day.primaryHeight}%` }}
                      title={`${day.primary} Lessons`}
                    />
                    {/* Quiz Bar */}
                    <div
                      className="w-2 md:w-3 mx-auto rounded-full bg-pink-500/40 group-hover/bar:bg-pink-500/60 transition-all duration-500 mt-1"
                      style={{ height: `${day.secondaryHeight}%` }}
                      title={`${day.secondary} Quizzes`}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.label}</span>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-6 mt-2 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quizzes</span>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          </div>

          {/* Activity Table (Dynamic Recent Content) */}
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Recent Content</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-900">
                    <th className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Topic</th>
                    <th className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                    <th className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                  {recentContent.length > 0 ? recentContent.slice(0, 5).map((item: any) => (
                    <tr key={item.id} className="group transition-colors">
                      <td className="py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${item.contentType === 'Assessment' ? 'bg-teal-500/10 text-teal-600' : 'bg-brand-500/10 text-brand-500'} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            {item.contentType === 'Assessment' ? <Clipboard className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">{item.topic}</p>
                            <p className="text-xs font-bold text-slate-400">{item.subject} • {item.classLevel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 text-center">
                        <span className={`px-3 py-1 ${item.contentType === 'Assessment' ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'} text-[10px] font-black rounded-full uppercase tracking-widest border border-current opacity-70`}>
                          {item.contentType}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(item.contentType === 'Assessment' ? '/assessment' : '/generator', { state: { editData: item } })}
                            className="p-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400 transition-all"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id!, item.contentType === 'Assessment' ? 'assessment' : 'note', e)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-red-500 transition-all"
                          >
                            <Trash className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-20 text-center">
                        <div className="opacity-30">
                          <FileText className="w-12 h-12 mx-auto mb-4" />
                          <p className="font-bold uppercase tracking-[0.2em]">No content generated yet</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {recentContent.length > 5 && (
              <Link to="/history" className="block text-center w-full mt-6 py-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-2xl text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] transition-all">
                View all generation history
              </Link>
            )}
          </div>
        </div>

        {/* Right 1/3 Column */}
        <div className="space-y-8">

          {/* Stat Cards - Vertical Stack (Dynamic) */}
          {statCards.map((card, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm group">
              <div className="flex items-center gap-5 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.color} shadow-lg shadow-current/5 group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-black text-lg">{card.title}</h3>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest line-clamp-1">{card.subtitle}</p>
                </div>
              </div>

              {card.type === 'goal' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{card.value}</span>
                    <span className="text-xs font-black text-teal-600 uppercase">Daily Goal</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: `${card.progress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{card.value}</span>
                  {/* Visual indication of productivity */}
                  <div className="w-24 h-10 flex items-end gap-1">
                    {[3, 5, 2, 8, 4, 6].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-brand-500/20 rounded-t-sm group-hover:bg-brand-500/40 transition-all"
                        style={{ height: `${h * 10}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Daily Activities (Dynamic Timeline) */}
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Recent Pulse</h3>
            <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-slate-100 dark:before:bg-slate-800/50 before:ml-1.5 pt-2">
              {recentActivities.length > 0 ? recentActivities.map((activity, i) => (
                <div key={i} className="flex gap-6 relative z-10">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[45px] pt-1">{activity.time}</span>
                  <div className="relative">
                    <div className={`w-4 h-4 rounded-full ${activity.color} ring-4 ring-white dark:ring-slate-950`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-tight">
                      {activity.action} <span className="text-slate-900 dark:text-white font-black">{activity.target}</span>
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-center py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No recent activity</p>
              )}
            </div>
            {/* Background elements */}
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 blur-[60px] rounded-full -ml-16 -mb-16"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
