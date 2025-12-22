import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../database';
import { Subject, ClassLevel, LessonNote } from '../types';
import { generateLessonNote } from '../services/geminiService';
import { Loader2, Sparkles, WifiOff } from '../components/Icons';

const Generator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [subjects, setSubjects] = useState<string[]>(Object.values(Subject));
  const [classLevels, setClassLevels] = useState<string[]>(Object.values(ClassLevel));
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    classLevel: '',
    topic: '',
    subtopic: '',
    duration: '40 minutes'
  });

  useEffect(() => {
    // Network listeners
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    // Fetch curriculum and usage
    const loadCurriculum = async () => {
      try {
        const data = await db.admin.getCurriculum();
        if (data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects);
          setFormData(prev => ({ ...prev, subject: data.subjects[0] }));
        } else {
          setFormData(prev => ({ ...prev, subject: Object.values(Subject)[0] }));
        }

        if (data.classLevels && data.classLevels.length > 0) {
          setClassLevels(data.classLevels);
          setFormData(prev => ({ ...prev, classLevel: data.classLevels[0] }));
        } else {
          setFormData(prev => ({ ...prev, classLevel: Object.values(ClassLevel)[0] }));
        }

      } catch (e) {
        console.error('Failed to load curriculum', e);
        // Fallback to defaults if fetch fails
        setSubjects(Object.values(Subject));
        setClassLevels(Object.values(ClassLevel));
        setFormData(prev => ({ ...prev, topic: '' }));
      }
    };



    const checkUsage = async () => {
      try {
        const user = db.auth.getCurrentUser();
        if (user) {
          const stats = await db.auth.getUsage();
          // Only set usage if we got valid stats
          if (stats) setUsage(stats);
        }
      } catch (e) {
        console.error('Failed to load usage stats', e);
      }
    };

    loadCurriculum();
    checkUsage();

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [location.state]);

  // Centralized generation function used by submit and regenerate
  const proceedGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = db.auth.getCurrentUser();
      const userPlan = currentUser?.subscriptionPlan || 'Free';
      const limitReached = false;

      const result = await generateLessonNote(
        formData.topic,
        formData.subject,
        formData.classLevel,
        formData.duration,
        formData.subtopic,
        userPlan,
        limitReached
      );
      // Save generated result to shared cache (best-effort)
      try {
        await db.shared.saveGenerated('lesson', formData.subject, formData.classLevel, formData.topic, result);
      } catch (saveErr) {
        console.warn('Failed to save to shared cache', saveErr);
      }
      // Navigate to result page with the data
      navigate('/result', { state: { lessonNote: result } });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate lesson note. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    if (!navigator.onLine) {
      setError("You are currently offline. Please connect to the internet to generate a lesson note.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, check server-side shared cache for existing generated content
      try {
        const matches = await db.shared.findGenerated('lesson', formData.subject, formData.classLevel, formData.topic);
        if (matches && Array.isArray(matches) && matches.length > 0) {
          // Automatically use the best cached match (no choice)
          const best = matches[0];
          try {
            await db.shared.incrementUsage(best.id);
          } catch (e) {
            console.warn('Failed to increment usage for cached entry', e);
          }

          // Ensure we pass parsed content if stored as JSON string
          let contentToUse: any = best.content;
          if (typeof contentToUse === 'string') {
            try {
              contentToUse = JSON.parse(contentToUse);
            } catch (e) {
              // not JSON, keep as-is
            }
          }

          navigate('/result', { state: { lessonNote: contentToUse } });
          setLoading(false);
          return;
        }
      } catch (cacheErr) {
        // ignore cache errors and continue to generate
        console.warn('Cache lookup failed', cacheErr);
      }
      const currentUser = db.auth.getCurrentUser();
      const userPlan = currentUser?.subscriptionPlan || 'Free';
      // Mock limit check (could be real DB check later)
      const limitReached = false;

      const result = await generateLessonNote(
        formData.topic,
        formData.subject,
        formData.classLevel,
        formData.duration,
        formData.subtopic,
        userPlan,
        limitReached
      );
      // Save generated result to shared cache (best-effort)
      try {
        await db.shared.saveGenerated('lesson', formData.subject, formData.classLevel, formData.topic, result);
      } catch (saveErr) {
        console.warn('Failed to save to shared cache', saveErr);
      }
      // Navigate to result page with the data
      navigate('/result', { state: { lessonNote: result } });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate lesson note. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="bg-brand-600 px-6 py-6 sm:px-10">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-brand-200" />
            Create New Lesson Note
          </h2>
          <p className="text-brand-100 mt-2">
            Fill in the details below to generate a comprehensive lesson note.
          </p>
        </div>

        <div className="px-6 py-8 sm:px-10">

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg relative flex items-start" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!isOnline && !error && (
            <div className="mb-6 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg relative flex items-center">
              <WifiOff className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-300" />
              <span>You are offline. Generation requires an internet connection.</span>
            </div>
          )}

          {usage && (
            <div className={`mb-6 border px-4 py-3 rounded-lg relative flex items-center justify-between ${usage.remaining === 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <div className="flex items-center">
                <span className="font-semibold mr-2">
                  {usage.limit > 100 ? 'Plan Usage:' : (usage.remaining === 0 ? 'Monthly Limit Reached' : 'Free Plan Usage:')}
                </span>
                <span>
                  {usage.limit > 100 ? 'Unlimited' : `${usage.used} / ${usage.limit} generated this month`}
                </span>
              </div>
              {usage.remaining === 0 && usage.limit <= 100 && (
                <button onClick={() => navigate('/pricing')} className="text-sm font-bold underline hover:no-underline">Upgrade Now</button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Subject</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg border bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="classLevel" className="block text-sm font-medium text-slate-700">Class</label>
                <select
                  id="classLevel"
                  name="classLevel"
                  value={formData.classLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg border bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
                >
                  {classLevels.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-slate-700">Topic Area / Main Subject</label>
              <div className="mt-1">
                <input
                  type="text"
                  name="topic"
                  id="topic"
                  required
                  className="shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-slate-300 rounded-lg py-3 px-4 border bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
                  placeholder="e.g., Noun, Solar System, Fractions"
                  value={formData.topic}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="subtopic" className="block text-sm font-medium text-slate-700">Sub-topic (Optional)</label>
              <div className="mt-1">
                <input
                  type="text"
                  name="subtopic"
                  id="subtopic"
                  className="shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-slate-300 rounded-lg py-3 px-4 border bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
                  placeholder="e.g., Types of Nouns, The Planets, Addition of Fractions"
                  value={formData.subtopic}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-slate-700">Duration</label>
              <div className="mt-1">
                <input
                  type="text"
                  name="duration"
                  id="duration"
                  className="shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-slate-300 rounded-lg py-3 px-4 border bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
                  placeholder="e.g., 40 minutes"
                  value={formData.duration}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !isOnline}
                className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all ${(loading || !isOnline) ? 'opacity-75 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : 'hover:shadow-lg hover:-translate-y-0.5'
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="anie-spin -ml-1 mr-3 h-6 w-6 text-white" />
                    Generating Note...
                  </>
                ) : !isOnline ? (
                  'Unavailable Offline'
                ) : (
                  'Generate Lesson Note'
                )}
              </button>
            </div>
          </form>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-300 text-center">
            By generating content, you agree to our Terms of Service. AI content should be reviewed before use.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Generator;