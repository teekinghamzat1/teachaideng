import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { generateAssessment } from '../services/geminiService';
import { Assessment, Subject, ClassLevel } from '../types';
import { Loader2, Clipboard, Save, CheckCircle, Share, WifiOff } from '../components/Icons';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../utils/alerts';
import { stripFormatting } from '../utils/textUtils';

const AssessmentGenerator: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Assessment | null>(null);
    const [formData, setFormData] = useState({
        topic: '',
        subject: Subject.Mathematics,
        classLevel: ClassLevel.Primary1,
        questionCount: 5
    });
    const [saved, setSaved] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [subjects, setSubjects] = useState<string[]>(Object.values(Subject));
    const [classLevels, setClassLevels] = useState<string[]>(Object.values(ClassLevel));

    useEffect(() => {
        if (!db.auth.getCurrentUser()) navigate('/login');

        const loadCurriculum = async () => {
            try {
                const data = await db.admin.getCurriculum();
                if (data.subjects && data.subjects.length > 0) {
                    setSubjects(data.subjects);
                    setFormData(prev => ({ ...prev, subject: data.subjects[0] as unknown as Subject }));
                }
                if (data.classLevels && data.classLevels.length > 0) {
                    setClassLevels(data.classLevels);
                    setFormData(prev => ({ ...prev, classLevel: data.classLevels[0] as unknown as ClassLevel }));
                }
            } catch (e) {
                console.error('Failed to load curriculum', e);
                setSubjects(Object.values(Subject));
                setClassLevels(Object.values(ClassLevel));
            }
        };
        loadCurriculum();

        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, [navigate]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!navigator.onLine) {
            showAlert.warning("Offline", "You are offline. Please connect to the internet to generate assessments.");
            return;
        }

        setLoading(true);
        setSaved(false);
        try {
            // First, check shared cache
            try {
                const matches = await db.shared.findGenerated(
                    'assessment',
                    formData.subject.trim(),
                    formData.classLevel.trim(),
                    formData.topic.trim()
                );
                if (matches && Array.isArray(matches) && matches.length > 0) {
                    const best = matches[0];
                    const currentUser = db.auth.getCurrentUser();
                    const isOwner = best.createdById === currentUser?.id;

                    if (isOwner) {
                        const confirmViewOld = await showAlert.confirm(
                            "Previously Generated",
                            "You already generated an assessment for this topic. Would you like to view it for free or generate a new one?",
                            "View Existing"
                        );

                        if (confirmViewOld) {
                            try { await db.shared.incrementUsage(best.id); } catch (e) { }
                            let contentToUse = best.content;
                            if (typeof contentToUse === 'string') contentToUse = JSON.parse(contentToUse);
                            setResult(contentToUse);
                            setLoading(false);
                            return;
                        }
                    }
                }
            } catch (cacheErr) {
                console.warn('Cache lookup failed', cacheErr);
            }

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
    };

    const handleShare = () => {
        const text = result?.questions.map((q, i) => `${i + 1}. ${stripFormatting(q.question)}\n`).join('');
        navigator.clipboard.writeText(text || '');
        showAlert.success("Copied", "Assessment questions copied to clipboard!");
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                <Clipboard className="w-8 h-8 mr-3 text-brand-600" />
                Assessment Generator
            </h1>

            {!result ? (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    {!isOnline && (
                        <div className="mb-6 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg relative flex items-center">
                            <WifiOff className="w-5 h-5 mr-2 text-slate-500" />
                            <span>You are offline. Quiz generation requires an internet connection.</span>
                        </div>
                    )}

                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Subject</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 dark:text-slate-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value as Subject })}
                                >
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Class</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 dark:text-slate-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border"
                                    value={formData.classLevel}
                                    onChange={e => setFormData({ ...formData, classLevel: e.target.value as ClassLevel })}
                                >
                                    {classLevels.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Topic</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border"
                                placeholder="e.g. Area of Triangles"
                                value={formData.topic}
                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Number of Questions</label>
                            <select
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border"
                                value={formData.questionCount}
                                onChange={e => setFormData({ ...formData, questionCount: Number(e.target.value) })}
                            >
                                <option value="5">5 Questions</option>
                                <option value="10">10 Questions</option>
                                <option value="15">15 Questions</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !isOnline}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${(loading || !isOnline) ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'
                                }`}
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Generate Assessment"}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{formData.topic} Quiz</h2>
                            <p className="text-sm text-slate-500">{formData.subject} - {formData.classLevel}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setResult(null)} className="text-sm text-slate-500 hover:text-brand-600 underline">Create New</button>
                            <button onClick={handleShare} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full" title="Share/Export"><Share className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {result.questions && Array.isArray(result.questions) && result.questions.length > 0 ? (
                            result.questions.map((q, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg">
                                    <p className="font-medium text-slate-900 mb-2">{idx + 1}. {q?.question || 'Untitled Question'}</p>
                                    {q?.type === 'MCQ' && q?.options && Array.isArray(q.options) && (
                                        <ul className="pl-4 list-[upper-alpha] space-y-1 text-slate-700">
                                            {q.options.map((opt, i) => <li key={i}>{opt}</li>)}
                                        </ul>
                                    )}
                                    <div className="mt-3 text-xs text-green-700 bg-green-50 inline-block px-2 py-1 rounded">
                                        Answer: {q?.correctAnswer || 'Not provided'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-slate-500 mb-4">No questions were generated successfully. Please try again.</p>
                                <button
                                    onClick={() => setResult(null)}
                                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                                >
                                    Try Another Topic
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-4 border-t flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saved}
                            className={`flex items-center px-4 py-2 border text-sm font-medium rounded-lg shadow-sm focus:outline-none transition-colors ${saved
                                ? 'border-brand-200 text-brand-700 bg-brand-50 cursor-default'
                                : 'border-transparent text-white bg-brand-600 hover:bg-brand-700'
                                }`}
                        >
                            {saved ? <><CheckCircle className="w-4 h-4 mr-2" /> Saved</> : <><Save className="w-4 h-4 mr-2" /> Save to History</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentGenerator;