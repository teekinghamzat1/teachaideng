import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { generateAssessment } from '../services/geminiService';
import { Assessment, Subject, ClassLevel } from '../types';
import {
    Loader2, Clipboard, Save, CheckCircle, Share, WifiOff, Star, Send,
    ChevronRight, ArrowLeft, BookOpen, Users, Zap, Clock, Search, Edit3,
    SettingsIcon as Settings, AlertCircle, Sparkles, FileText, CheckSquare
} from '../components/Icons';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from '../components/FeedbackModal';
import { showAlert } from '../utils/alerts';
import { stripFormatting } from '../utils/textUtils';

const AssessmentGenerator: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Assessment | null>(null);
    const [formData, setFormData] = useState({
        topic: '',
        subject: Subject.Mathematics as string,
        classLevel: ClassLevel.Primary1 as string,
        questionCount: 5
    });
    const [saved, setSaved] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showFeedback, setShowFeedback] = useState(false);
    const [subjects, setSubjects] = useState<string[]>(Object.values(Subject));
    const [classLevels, setClassLevels] = useState<string[]>(Object.values(ClassLevel));
    const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
    const [activeInput, setActiveInput] = useState<string | null>(null);

    useEffect(() => {
        const user = db.auth.getCurrentUser();
        if (!user) navigate('/login');

        const loadCurriculum = async () => {
            try {
                const data = await db.admin.getCurriculum();
                if (data.subjects && data.subjects.length > 0) setSubjects(data.subjects);
                if (data.classLevels && data.classLevels.length > 0) setClassLevels(data.classLevels);
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

        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, [navigate]);

    useEffect(() => {
        if (result && !sessionStorage.getItem('feedback_prompted')) {
            const timer = setTimeout(() => {
                setShowFeedback(true);
                sessionStorage.setItem('feedback_prompted', 'true');
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [result]);

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!navigator.onLine) {
            showAlert.warning("Offline", "You are offline. Please connect to the internet to generate assessments.");
            return;
        }

        setLoading(true);
        setSaved(false);
        try {
            // Check cache
            try {
                const matches = await db.shared.findGenerated('assessment', formData.subject.trim(), formData.classLevel.trim(), formData.topic.trim());
                if (matches && matches.length > 0) {
                    const best = matches[0];
                    const currentUser = db.auth.getCurrentUser();
                    if (best.createdById === currentUser?.id) {
                        const confirmViewOld = await showAlert.confirm("Previously Generated", "View existing assessment or generate new?", "View Existing");
                        if (confirmViewOld) {
                            try { await db.shared.incrementUsage(best.id); } catch (e) { }
                            let contentToUse = typeof best.content === 'string' ? JSON.parse(best.content) : best.content;
                            setResult(contentToUse);
                            setLoading(false);
                            return;
                        }
                    }
                }
            } catch (e) { }

            const data = await generateAssessment(formData.topic, formData.classLevel, formData.subject, formData.questionCount);
            setResult(data);
        } catch (error: any) {
            showAlert.error("Generation Failed", error.message || "Failed to generate assessment");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        await db.assessments.save(result);
        setSaved(true);
        showAlert.success("Stored", "Quiz added to your historical vault");
    };

    const handleShare = () => {
        const text = result?.questions.map((q, i) => `${i + 1}. ${stripFormatting(q.question)}\n`).join('');
        navigator.clipboard.writeText(text || '');
        showAlert.success("Copied", "Quiz questions copied to clipboard!");
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const renderProgress = () => {
        const steps = [
            { id: 1, label: 'Metadata' },
            { id: 2, label: 'Content' },
            { id: 3, label: 'Preview' }
        ];

        return (
            <div className="flex items-center justify-between mb-8 px-2 max-w-sm mx-auto">
                {steps.map((s, i) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center relative gap-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s.id ? 'bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/20' :
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
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 transition-colors duration-300 pb-20 overflow-x-hidden">
            <main className="max-w-4xl mx-auto px-4 pt-10 sm:px-6 lg:px-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-2">
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Quiz Generator</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Create rigorous assessments in seconds</p>
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

                    {!result ? (
                        <>
                            {step === 1 && (
                                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center text-base">1</span>
                                            📘 Quiz Context
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Subject</label>
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

                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Class Level</label>
                                                <select
                                                    value={formData.classLevel}
                                                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all outline-none font-bold appearance-none cursor-pointer"
                                                >
                                                    {classLevels.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-400 opacity-60">
                                                    Nigerian Curriculum Aligned
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button onClick={nextStep} className="w-full py-5 bg-[#16A34A] text-white rounded-[1.5rem] font-black text-xl shadow-xl shadow-[#16A34A]/20 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
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
                                                🎯 Quiz Focus
                                            </h2>
                                            <div className="w-12 h-12"></div>
                                        </header>

                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Main Topic</label>
                                                <div className="relative group overflow-hidden rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 transition-all focus-within:border-[#16A34A]">
                                                    <input
                                                        type="text"
                                                        value={formData.topic}
                                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                                        placeholder="e.g., Photosynthesis in Plants"
                                                        className="w-full bg-slate-50 dark:bg-slate-800 px-8 py-6 text-xl lg:text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-all outline-none"
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

                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Complexity & Flow</label>
                                                    <span className="px-4 py-1.5 bg-[#16A34A] text-white rounded-full text-xs font-black">{formData.questionCount} Questions</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {[5, 10, 15].map(q => (
                                                        <button
                                                            key={q}
                                                            onClick={() => setFormData({ ...formData, questionCount: q })}
                                                            className={`py-4 rounded-2xl border-2 font-black transition-all ${formData.questionCount === q ? 'bg-[#16A34A]/5 border-[#16A34A] text-[#16A34A]' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-[#16A34A]/30'}`}
                                                        >
                                                            {q} Qs
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={loading || !isOnline || !formData.topic}
                                            className="w-full py-5 lg:py-7 bg-[#16A34A] text-white rounded-[2rem] font-black text-2xl shadow-2xl shadow-[#16A34A]/40 hover:shadow-[#16A34A]/50 hover:-translate-y-1.5 transition-all active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-8 h-8 animate-spin" />
                                                    <span>Crafting Quiz...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-8 h-8 transition-transform group-hover:rotate-12" />
                                                    Generate Assessment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-full w-fit">
                                        <CheckCircle className="w-3 h-3 text-[#16A34A]" />
                                        <span className="text-[10px] font-black text-[#16A34A] uppercase tracking-widest">Generation Success</span>
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{formData.topic} Quiz</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{formData.subject} · {formData.classLevel} · {result.questions.length} Questions</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setResult(null)} className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-[#16A34A] rounded-[1.25rem] transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
                                    <button onClick={handleShare} className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-[#16A34A] rounded-[1.25rem] transition-all shadow-sm"><Share className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {result.questions.map((q, idx) => (
                                    <div key={idx} className="group bg-[#F9FAFB] dark:bg-slate-800/40 rounded-[2rem] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 hover:border-[#16A34A]/30 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <span className="text-8xl font-black">{idx + 1}</span>
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-xs font-black text-slate-500 border border-slate-100 dark:border-slate-800">{idx + 1}</span>
                                                <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white leading-snug">{q.question}</p>
                                            </div>

                                            {q.type === 'MCQ' && q.options && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 ${opt === q.correctAnswer ? 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A]' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                                            <span className="w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center border border-slate-200 dark:border-slate-700">{String.fromCharCode(65 + i)}</span>
                                                            <span className="font-bold text-sm">{opt}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="pl-11 pt-2">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] text-white rounded-full w-fit text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#16A34A]/20">
                                                    <CheckCircle className="w-3 h-3" /> Correct Answer: {q.correctAnswer}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">End of Assessment Sync</p>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <button onClick={() => setResult(null)} className="flex-1 md:flex-none px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 transition-all">Discard</button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saved}
                                        className={`flex-1 md:flex-none px-10 py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all ${saved ? 'bg-slate-400 cursor-default shadow-none' : 'bg-[#16A34A] shadow-[#16A34A]/20 hover:shadow-[#16A34A]/30 hover:-translate-y-1'}`}
                                    >
                                        {saved ? <><CheckCircle className="w-5 h-5" /> Saved to Vault</> : <><Save className="w-5 h-5" /> Store in History</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
        </div>
    );
};

export default AssessmentGenerator;