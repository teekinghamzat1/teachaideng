import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../database';
import { Subject, ClassLevel, LessonNote } from '../types';
import { generateLessonNote } from '../services/geminiService';
import { showAlert } from '../utils/alerts';
import {
  Loader2, Sparkles, WifiOff, ChevronRight, ArrowLeft,
  BookOpen, Users, Zap, Clock, CheckCircle, Info as HelpCircle,
  Grid as Layout, Shield, Bell, SettingsIcon as Settings, Search, Edit as Edit3,
  AlertCircle, FileText
} from '../components/Icons';

const Generator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
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
    duration: '40 minutes',
    lessonType: 'Normal Lesson',
    includeEvaluation: true,
    includeTeachingAids: true,
    nigerianCurriculum: true
  });

  const [activeInput, setActiveInput] = useState<string | null>(null);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    const queryParams = new URLSearchParams(location.search);
    const scSubject = queryParams.get('subject');
    const scClass = queryParams.get('classLevel');
    const scType = queryParams.get('lessonType');
    const scTopic = queryParams.get('topic');
    const scSubtopic = queryParams.get('subtopic');

    const loadCurriculum = async () => {
      try {
        const data = await db.admin.getCurriculum();
        if (data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects);
          if (!scSubject) setFormData(prev => ({ ...prev, subject: data.subjects[0] }));
        }
        if (data.classLevels && data.classLevels.length > 0) {
          setClassLevels(data.classLevels);
          if (!scClass) setFormData(prev => ({ ...prev, classLevel: data.classLevels[0] }));
        }
      } catch (e) {
        console.error('Failed to load curriculum', e);
      }
    };

    const checkUsage = async () => {
      try {
        const user = db.auth.getCurrentUser();
        if (user) {
          const stats = await db.auth.getUsage(user.schoolId);
          if (stats) setUsage(stats);
        }
      } catch (e) {
        console.error('Failed to load usage stats', e);
      }
    };

    loadCurriculum();
    checkUsage();

    if (scSubject || scClass || scType || scTopic) {
      setFormData(prev => ({
        ...prev,
        subject: scSubject || prev.subject,
        classLevel: scClass || prev.classLevel,
        lessonType: scType || prev.lessonType,
        topic: scTopic || prev.topic,
        subtopic: scSubtopic || prev.subtopic
      }));
    }

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [location.search]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      // Shared cache lookup
      try {
        const matches = await db.shared.findGenerated(
          'lesson',
          formData.subject.trim(),
          formData.classLevel.trim(),
          formData.topic.trim(),
          formData.subtopic.trim()
        );
        if (matches && matches.length > 0) {
          const best = matches[0];
          const currentUser = db.auth.getCurrentUser();
          if (best.createdById === currentUser?.id) {
            const confirmViewOld = await showAlert.confirm(
              "Previously Generated",
              "You've already generated a note for this topic. View existing or generate new?",
              "View Existing"
            );
            if (confirmViewOld) {
              await db.shared.incrementUsage(best.id);
              let content = typeof best.content === 'string' ? JSON.parse(best.content) : best.content;
              navigate('/result', { state: { lessonNote: content } });
              return;
            }
          }
        }
      } catch (e) { console.warn(e); }

      const currentUser = db.auth.getCurrentUser();
      const result = await generateLessonNote(
        formData.topic,
        formData.subject,
        formData.classLevel,
        formData.duration,
        formData.subtopic,
        formData.lessonType,
        currentUser?.subscriptionPlan || 'Free',
        false,
        new URLSearchParams(location.search).get('smartHint') || "",
        formData.includeEvaluation,
        formData.includeTeachingAids,
        formData.nigerianCurriculum
      );

      try {
        await db.shared.saveGenerated('lesson', formData.subject, formData.classLevel, formData.topic, result);
      } catch (e) { console.warn(e); }

      navigate('/result', { state: { lessonNote: result } });
    } catch (err: any) {
      setError(err.message || "Failed to generate lesson note.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.subject || !formData.classLevel) return;
    } else if (step === 2) {
      if (!formData.topic) return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const renderProgress = () => {
    const steps = [
      { id: 1, label: 'Basics' },
      { id: 2, label: 'Focus' },
      { id: 3, label: 'Time' },
      { id: 4, label: 'Review' }
    ];

    return (
      <div className="flex items-center justify-between mb-8 px-2 max-w-md mx-auto">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center relative gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step > s.id ? 'bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/20' :
                  step === s.id ? 'bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/20' :
                    'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step === s.id ? 'text-[#16A34A]' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mb-6 mx-2 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-[#16A34A] transition-all duration-500"
                  style={{ width: step > s.id ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const getTopicSuggestions = () => {
    const s = formData.subject.toLowerCase();
    if (s.includes('english')) return ['Types of Nouns', 'Figure of Speech', 'Direct and Indirect Speech', 'Narrative Writing'];
    if (s.includes('math')) return ['Fractions', 'Algebraic Expressions', 'Calculus Basics', 'Quadratic Equations'];
    if (s.includes('science') || s.includes('biology')) return ['Photosynthesis', 'The Solar System', 'Cell Biology', 'Human Anatomy'];
    if (s.includes('civic') || s.includes('social')) return ['National Values', 'Human Rights', 'Democracy', 'Environmental Pollution'];
    if (s.includes('chemistry')) return ['Atomic Structure', 'Acids and Bases', 'Chemical Equilibrium', 'Organic Chemistry'];
    if (s.includes('physics')) return ['Newton\'s Laws', 'Wave Motion', 'Electric Circuits', 'Quantum Mechanics'];
    return ['Types of Nouns', 'The Solar System', 'Human Rights']; // Fallback
  };

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto space-y-8 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Create Lesson Note</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Empower your classroom with AI‑generated pedagogy</p>
          </div>
          {usage && (
            <div className="self-start md:self-center flex items-center gap-2 px-4 py-2 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-full">
              <div className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-[#16A34A] uppercase tracking-widest">
                {usage.limit > 100 ? 'Unlimited Plan' : `${usage.remaining} Credits Left`}
              </span>
            </div>
          )}
        </div>

        {renderProgress()}

        <div className="glass-card rounded-[2.5rem] p-6 lg:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A34A]/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>

          {error && (
            <div className="mb-8 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center text-base">1</span>
                  📘 What are you teaching?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                    <div className="grid grid-cols-1 gap-3">
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all outline-none font-bold appearance-none cursor-pointer"
                      >
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {subjects.slice(0, 4).map(s => (
                          <button
                            key={s}
                            onClick={() => setFormData({ ...formData, subject: s })}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${formData.subject === s ? 'bg-[#16A34A] text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-[#16A34A]'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Class Level</label>
                    <div className="grid grid-cols-1 gap-3">
                      <select
                        value={formData.classLevel}
                        onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all outline-none font-bold appearance-none cursor-pointer"
                      >
                        {classLevels.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {['Primary 1', 'JSS 1', 'SSS 1'].map(c => (
                          <button
                            key={c}
                            onClick={() => setFormData({ ...formData, classLevel: c })}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${formData.classLevel === c ? 'bg-[#16A34A] text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-[#16A34A]'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Lesson Type</label>
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {[
                      { id: 'Normal Lesson', label: 'Ordinary', icon: <BookOpen className="w-5 h-5" /> },
                      { id: 'Revision', label: 'Revision', icon: <Zap className="w-5 h-5" /> },
                      { id: 'Practical', label: 'Practical', icon: <Layout className="w-5 h-5" /> }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setFormData({ ...formData, lessonType: type.id })}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group ${formData.lessonType === type.id ? 'bg-[#16A34A]/5 border-[#16A34A] dark:bg-[#16A34A]/10' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-[#16A34A]/50'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.lessonType === type.id ? 'bg-[#16A34A] text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 group-hover:text-[#16A34A]'}`}>
                          {type.icon}
                        </div>
                        <span className={`text-sm font-bold truncate ${formData.lessonType === type.id ? 'text-[#16A34A]' : 'text-slate-500'}`}>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={nextStep}
                  className="w-full py-5 bg-[#16A34A] text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-[#16A34A]/20 hover:shadow-2xl hover:shadow-[#16A34A]/30 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Continue <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-6">
                <header className="flex items-center justify-between">
                  <button onClick={prevStep} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 shadow-sm hover:text-[#16A34A] transition-all"><ArrowLeft className="w-6 h-6" /></button>
                  <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center text-base">2</span>
                    🎯 What is the lesson about?
                  </h2>
                  <div className="w-12 h-12"></div>
                </header>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Main Topic</label>
                    <div className={`relative group transition-all duration-300 ${activeInput === 'topic' ? 'scale-[1.02]' : ''}`}>
                      <input
                        type="text"
                        value={formData.topic}
                        onFocus={() => setActiveInput('topic')}
                        onBlur={() => setActiveInput(null)}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        placeholder="e.g., Photosynthesis in Plants"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-8 py-6 text-xl lg:text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:border-[#16A34A] focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <Search className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {getTopicSuggestions().map(t => (
                        <button
                          key={t}
                          onClick={() => setFormData({ ...formData, topic: t })}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm border-2 ${formData.topic === t ? 'bg-[#16A34A] text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:border-[#16A34A] hover:text-[#16A34A]'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Sub‑topic (Optional)</label>
                    <input
                      type="text"
                      value={formData.subtopic}
                      onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                      placeholder="e.g., Light and Dark reactions"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-lg font-bold text-slate-800 dark:text-white focus:border-[#16A34A] transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={nextStep}
                  disabled={!formData.topic}
                  className="w-full py-5 bg-[#16A34A] text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-[#16A34A]/20 hover:shadow-2xl hover:shadow-[#16A34A]/30 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                >
                  Continue <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-6">
                <header className="flex items-center justify-between">
                  <button onClick={prevStep} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 shadow-sm hover:text-[#16A34A] transition-all"><ArrowLeft className="w-6 h-6" /></button>
                  <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center text-base">3</span>
                    ⏱️ Time & Preferences
                  </h2>
                  <div className="w-12 h-12"></div>
                </header>

                <div className="space-y-10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Lesson Duration</label>
                      <span className="px-4 py-1.5 bg-[#16A34A] text-white rounded-full text-xs font-black">{formData.duration}</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="5"
                      value={formData.duration.split(' ')[0]}
                      onChange={(e) => setFormData({ ...formData, duration: `${e.target.value} minutes` })}
                      className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#16A34A]"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                      <span>20m</span>
                      <span>40m</span>
                      <span>60m</span>
                      <span>80m</span>
                      <span>120m</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'includeEvaluation', label: 'Evaluation Questions', desc: 'Add assessment tasks to the note' },
                      { id: 'includeTeachingAids', label: 'Teaching Aids', desc: 'List required instructional materials' },
                      { id: 'nigerianCurriculum', label: 'Nigerian Curriculum Alignment', desc: 'Optimize for NERDC standards' }
                    ].map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setFormData(prev => ({ ...prev, [opt.id as any]: !(prev as any)[opt.id] }))}
                        className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer ${(formData as any)[opt.id] ? 'bg-[#16A34A]/5 border-[#16A34A]/30' : 'bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'}`}
                      >
                        <div className="space-y-1">
                          <h4 className={`font-bold ${(formData as any)[opt.id] ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{opt.label}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-500">{opt.desc}</p>
                        </div>
                        <div className={`relative w-14 h-8 rounded-full transition-all duration-300 ${(formData as any)[opt.id] ? 'bg-[#16A34A]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${(formData as any)[opt.id] ? 'left-7' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={nextStep}
                  className="w-full py-5 bg-[#16A34A] text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-[#16A34A]/20 hover:shadow-2xl hover:shadow-[#16A34A]/30 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Review Details <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-8">
                <header className="flex items-center justify-between">
                  <button onClick={prevStep} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 shadow-sm hover:text-[#16A34A] transition-all"><ArrowLeft className="w-6 h-6" /></button>
                  <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center text-base">4</span>
                    📄 Final Review
                  </h2>
                  <div className="w-12 h-12"></div>
                </header>

                <div className="bg-[#F9FAFB] dark:bg-slate-800/50 rounded-[2.5rem] p-8 lg:p-12 border border-slate-200/50 dark:border-slate-800 space-y-8 relative overflow-hidden group hover:border-[#16A34A]/30 transition-all">
                  <div className="absolute top-0 right-0 p-8 transform group-hover:rotate-12 transition-transform opacity-10">
                    <FileText className="w-32 h-32 text-[#16A34A]" />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-[0.3em]">Ready for Sync</p>
                    <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{formData.topic}</h3>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {[
                      { label: 'Subject', value: formData.subject, icon: <BookOpen className="w-4 h-4" /> },
                      { label: 'Class', value: formData.classLevel, icon: <Users className="w-4 h-4" /> },
                      { label: 'Duration', value: formData.duration, icon: <Clock className="w-4 h-4" /> },
                      { label: 'Type', value: formData.lessonType, icon: <Layout className="w-4 h-4" /> }
                    ].map(item => (
                      <div key={item.label} className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          {item.icon} {item.label}
                        </span>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    {['Evaluation', 'Teaching Aids', 'NERDC Standard'].map((tag, i) => (
                      <div key={tag} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        <CheckCircle className="w-4 h-4 text-[#16A34A]" /> {tag}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => handleSubmit()}
                  disabled={loading || !isOnline}
                  className="w-full py-5 lg:py-7 bg-[#16A34A] text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-[#16A34A]/40 hover:shadow-[#16A34A]/50 hover:-translate-y-1.5 transition-all active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                  {loading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span>Optimizing Pedagogy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                      Generate Lesson Note
                    </>
                  )}
                </button>
                <p className="mt-6 text-center text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Generating high‑quality pedagogical content<br />optimized for {formData.classLevel}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Empty State Illustration Equivalent */}
        {step === 1 && !formData.topic && (
          <div className="py-12 text-center space-y-6 opacity-30 animate-in fade-in duration-1000 delay-500">
            <div className="w-24 h-24 bg-[#16A34A]/10 rounded-[2rem] flex items-center justify-center mx-auto">
              <Edit3 className="w-12 h-12 text-[#16A34A]" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold dark:text-white">Let’s create your first lesson note in seconds.</p>
              <p className="text-sm font-medium">Nigerian curriculum aligned, WAEC & NECO optimized.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Generator;