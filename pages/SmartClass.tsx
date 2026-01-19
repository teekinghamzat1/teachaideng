import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../database';
import {
    Plus,
    Trash,
    CheckCircle,
    Zap,
    Loader2,
    Sparkles,
    ArrowRight,
    RotateCcw,
    Info,
    X,
    Lightbulb,
    ChevronDown
} from '../components/Icons';
import { showAlert } from '../utils/alerts';
import { Subject, ClassLevel } from '../types';
import { title } from 'process';

interface SmartClassDay {
    id: string;
    weekNumber: number;
    dayOfWeek: string;
    lessonType: string;
    topic?: string;
    subtopic?: string;
    originalTopic?: string;
    skills?: string;
    learningGoal?: string;
    resources?: string;
    isCompleted: boolean;
}

interface SmartClass {
    id: string;
    classLevel: string;
    subject: string;
    term: string;
    startWeek: number;
    days: SmartClassDay[];
}

const LESSON_TYPE_HINTS: Record<string, string> = {
    'Vocabulary Development': 'Teach new words before reading',
    'Comprehension': 'Read and discuss the passage',
    'Normal Lesson': 'Standard topic presentation and evaluation'
};

const WEEK_CONTEXTS: Record<number, string> = {
    1: 'Introduction & Foundations',
    2: 'Developing Understanding',
    3: 'Building Reading & Writing Skills',
    4: 'Expanding Vocabulary & Use',
    5: 'Reinforcing Language Rules',
    6: 'Mid-term Review & Deep Dive',
    7: 'Creative Expression Pass',
    8: 'Critical Thinking Focus',
    9: 'Advanced Composition Week',
    10: 'Term Synthesis & Mastery',
    11: 'Final Review & Revision',
    12: 'Examinations & Wrap Up'
};

interface Insight {
    title: string;
    message: string;
    actions: string[];
    tone: 'neutral' | 'positive' | 'gentle';
}

const generateWeeklyInsights = (days: SmartClassDay[], completedCount: number): Insight => {
    const total = days.length;
    if (total === 0) return { title: 'Ready?', message: 'Setup your week.', actions: [], tone: 'neutral' };

    const percent = (completedCount / total) * 100;

    // 1. Check for skipped days (Gap Detection)
    // Assuming days are sorted: Mon, Tue, Wed...
    let hasGap = false;
    let gapDay = '';
    for (let i = 0; i < days.length - 1; i++) {
        if (!days[i].isCompleted && days[i + 1].isCompleted) {
            hasGap = true;
            gapDay = days[i].dayOfWeek;
            break;
        }
    }

    if (hasGap) {
        return {
            title: 'Flexible Flow Detected',
            message: `Looks like you skipped ${gapDay}. That's perfectly fine.`,
            actions: [
                `Carry over key terms from ${gapDay} to today?`,
                `Briefly summarize ${gapDay} orally before starting.`
            ],
            tone: 'gentle'
        };
    }

    // 3. Anticipatory & Transition Intelligence (Quiet Foresight)
    const todayIndex = days.findIndex(d => !d.isCompleted);
    if (todayIndex > 0) {
        const prevDay = days[todayIndex - 1];
        const nextDay = days[todayIndex];

        // Transition Logic: Vocab -> Comprehension
        if (prevDay.lessonType === 'Vocabulary Development' && nextDay.lessonType === 'Comprehension') {
            return {
                title: 'Building Connections',
                message: 'This comprehension lesson works best if you reuse the vocabulary from the last class.',
                actions: ['Connect themes'],
                tone: 'neutral'
            };
        }

        // Transition Logic: Comprehension -> Grammar
        if (prevDay.lessonType === 'Comprehension' && nextDay.lessonType === 'Grammar') {
            return {
                title: 'Continuity Hint',
                message: 'Consider pulling grammar examples directly from the passage you just read.',
                actions: ['Use passage examples'],
                tone: 'neutral'
            };
        }
    }

    // 4. Delayed Week Nudge (Soft)
    // If it's late in the week (e.g., Fri/Sat real-time check would be ideal, but here we approximate by "end of list" uncompleted)
    // If we have < 40% completion and we are at the last 2 days
    if (percent < 40 && todayIndex >= days.length - 2) {
        return {
            title: 'Flexible Pacing',
            message: 'It’s okay to move at your own pace. You can merge lessons or carry themes forward.',
            actions: ['Merge lessons', 'Shift forward'],
            tone: 'gentle'
        };
    }

    // 5. Tomorrow Awareness (If today is done, focus on tomorrow)
    // If valid today exists (last completed), check next
    const lastCompletedIndex = days.slice().reverse().findIndex(d => d.isCompleted);
    if (lastCompletedIndex !== -1) {
        // reverse index calculation
        const actualIndex = days.length - 1 - lastCompletedIndex;
        const tomorrow = days[actualIndex + 1];
        if (tomorrow && !tomorrow.topic) {
            return {
                title: 'Looking Ahead',
                message: `Tomorrow is ${tomorrow.lessonType}. You might want to reuse today's theme.`,
                actions: ['Reuse theme'],
                tone: 'neutral'
            };
        }
    }

    // 6. Momentum Checks (Standard)
    if (percent === 0) {
        return {
            title: 'Fresh Start',
            message: 'Ready to kick off this week? The theme is set.',
            actions: [
                'Preview the vocabulary list first.',
                'Check if you need any visual aids.'
            ],
            tone: 'neutral'
        };
    }

    if (percent > 0 && percent < 60) {
        return {
            title: 'Building Momentum',
            message: 'You are making steady progress.',
            actions: [
                'Review yesterday\'s soft outcome.',
                'Connect today\'s topic to yesterday\'s lesson.'
            ],
            tone: 'neutral'
        };
    }

    if (percent >= 60 && percent < 100) {
        return {
            title: 'Almost There',
            message: 'Great flow this week. Just a few lessons left.',
            actions: [
                'Start preparing specifically for the weekly review.',
                'Check if any struggling students need a recap.'
            ],
            tone: 'positive'
        };
    }

    if (percent === 100) {
        return {
            title: 'Week Complete!',
            message: 'Excellent work. You have covered the core flow.',
            actions: [
                'Take a moment to note what worked well.'
            ],
            tone: 'positive'
        };
    }

    return { title: 'Teaching Flow', message: 'Continue at your pace.', actions: [], tone: 'neutral' };
};

const SmartClass: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [smartClasses, setSmartClasses] = useState<SmartClass[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [subjects, setSubjects] = useState<string[]>(Object.values(Subject));
    const [classLevels, setClassLevels] = useState<string[]>(Object.values(ClassLevel));
    const [editingTopic, setEditingTopic] = useState<string | null>(null);
    const [tempTopic, setTempTopic] = useState<string>("");
    const [tempSubtopic, setTempSubtopic] = useState<string>("");
    const [overrideMessage, setOverrideMessage] = useState<string | null>(null);
    const [weekReflection, setWeekReflection] = useState<string>("");
    const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
    const [activeClassIndex, setActiveClassIndex] = useState(0);
    const [showClassSwitcher, setShowClassSwitcher] = useState(false);

    const [formData, setFormData] = useState({
        classLevel: '',
        subject: '',
        term: '1st',
        startWeek: 1
    });

    const fetchSmartClasses = async () => {
        setLoading(true);
        try {
            const data = await db.smartClass.getAll();
            setSmartClasses(data);

            // Fetch curriculum
            const curriculum = await db.admin.getCurriculum();
            if (curriculum.subjects?.length > 0) setSubjects(curriculum.subjects);
            if (curriculum.classLevels?.length > 0) setClassLevels(curriculum.classLevels);

            // Set defaults if lists are available
            if (!formData.subject && curriculum.subjects?.length > 0) {
                setFormData(prev => ({ ...prev, subject: curriculum.subjects[0] }));
            }
            if (!formData.classLevel && curriculum.classLevels?.length > 0) {
                setFormData(prev => ({ ...prev, classLevel: curriculum.classLevels[0] }));
            }
        } catch (error) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSmartClasses();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.classLevel || !formData.subject) {
            showAlert.error('Error', 'Please fill all required fields');
            return;
        }

        setCreating(true);
        try {
            await db.smartClass.create(formData);
            showAlert.success('Success', 'Smart Class created successfully!');
            setShowCreateModal(false);
            fetchSmartClasses();
        } catch (error) {
            showAlert.error('Error', 'Failed to create Smart Class');
        } finally {
            setCreating(false);
        }
    };

    const handleUnmarkComplete = async (dayId: string) => {
        try {
            await db.smartClass.unmarkComplete(dayId);
            fetchSmartClasses();
            // showAlert.success('Success', 'Lesson reset');
        } catch (error) {
            showAlert.error('Error', 'Failed to reset');
        }
    };

    const handleUpdateTopic = async (dayId: string) => {
        try {
            await db.smartClass.updateDayTopic(dayId, tempTopic, tempSubtopic);

            // Optimistic update
            const updatedClasses = smartClasses.map(sc => {
                if (sc.id !== currentClass.id) return sc;
                return {
                    ...sc,
                    days: sc.days.map(day =>
                        day.id === dayId ? { ...day, topic: tempTopic, subtopic: tempSubtopic } : day
                    )
                };
            });
            setSmartClasses(updatedClasses);

            setEditingTopic(null);
            setOverrideMessage("Your plan has been updated. TeachAide will follow your topic.");
            setTimeout(() => setOverrideMessage(null), 3000);
        } catch (error) {
            showAlert.error('Error', 'Failed to update topic');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await showAlert.confirm('Delete Smart Class', 'Are you sure you want to delete this teaching plan?')) return;
        try {
            await db.smartClass.delete(id);
            fetchSmartClasses();
        } catch (error) {
            showAlert.error('Error', 'Failed to delete');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600 mb-4" />
                <p className="text-slate-500">Loading your teaching plan...</p>
            </div>
        );
    }



    // ... existing code ...

    const currentClass = smartClasses[activeClassIndex] || smartClasses[0];

    // ...

    const renderCreateModal = () => (
        <Modal onClose={() => setShowCreateModal(false)} title="Setup Smart Class">
            <form onSubmit={handleCreate} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                    <select
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    >
                        {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <p className="mt-1.5 text-xs text-slate-500 italic">Try "English" for a guided weekly pattern.</p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Class Level</label>
                    <select
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                        value={formData.classLevel}
                        onChange={e => setFormData({ ...formData, classLevel: e.target.value })}
                    >
                        {classLevels.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Term</label>
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                            value={formData.term}
                            onChange={e => setFormData({ ...formData, term: e.target.value })}
                        >
                            <option value="1st">1st Term</option>
                            <option value="2nd">2nd Term</option>
                            <option value="3rd">3rd Term</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Week</label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"
                            value={formData.startWeek || ''}
                            onChange={e => {
                                const val = parseInt(e.target.value);
                                setFormData({ ...formData, startWeek: isNaN(val) ? 1 : val });
                            }}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors flex items-center justify-center"
                >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                    Generate Teaching Plan
                </button>
            </form>
        </Modal>
    );

    if (smartClasses.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-brand-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Welcome to Smart Class</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                        Organize your term. We'll help you create a weekly teaching pattern so you never have to wonder what to teach next.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:-translate-y-1"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Create Your First Smart Class
                    </button>
                </div>
                {showCreateModal && renderCreateModal()}
            </div>
        );
    }

    // Groupping days by week for display
    const weeks: Record<number, SmartClassDay[]> = {};
    currentClass.days.forEach(day => {
        if (!weeks[day.weekNumber]) weeks[day.weekNumber] = [];
        weeks[day.weekNumber].push(day);
    });

    const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);
    const activeWeekNumber = weekNumbers[activeTab] || weekNumbers[0];

    const DAY_ORDER: Record<string, number> = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
    };

    const activeDays = (weeks[activeWeekNumber] || []).sort((a, b) =>
        (DAY_ORDER[a.dayOfWeek] || 99) - (DAY_ORDER[b.dayOfWeek] || 99)
    );
    const completedCount = activeDays.filter(d => d.isCompleted).length;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6 bg-brand-50 border border-brand-100 dark:bg-brand-900/20 dark:border-brand-900/30 p-4 rounded-2xl flex items-center gap-3">
                <Info className="w-5 h-5 text-brand-600" />
                <p className="text-sm text-brand-800 dark:text-brand-300">
                    Already have a scheme of work? You can still use the <button onClick={() => navigate('/generator')} className="font-bold underline">normal generator</button>.
                </p>
            </div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-brand-600" /> Smart Class
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {currentClass.classLevel} • {currentClass.subject} • {currentClass.term} Term
                    </p>
                </div>
                <div className="flex gap-2 relative">
                    <button
                        onClick={() => setShowClassSwitcher(!showClassSwitcher)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        Switch Class <ChevronDown className="w-4 h-4" />
                    </button>

                    {showClassSwitcher && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                            {smartClasses.map((sc, idx) => (
                                <button
                                    key={sc.id}
                                    onClick={() => {
                                        setActiveClassIndex(idx);
                                        setShowClassSwitcher(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between ${idx === activeClassIndex ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}
                                >
                                    <span className="font-semibold">{sc.subject}</span>
                                    <span className="text-xs text-slate-500">{sc.classLevel}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setShowClassSwitcher(false);
                                    setShowCreateModal(true);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold border-t border-slate-100 dark:border-slate-700 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Create New Class
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => handleDelete(currentClass.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Week Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 mb-6 no-scrollbar">
                {weekNumbers.map((wn, idx) => (
                    <button
                        key={wn}
                        onClick={() => setActiveTab(idx)}
                        className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === idx
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-brand-300'
                            }`}
                    >
                        Week {wn}
                    </button>
                ))}
            </div>

            {/* Week Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Week {activeWeekNumber} <span className="text-slate-400 font-normal">|</span> {WEEK_CONTEXTS[activeWeekNumber] || 'Curriculum Flow'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Progress: {completedCount}/{activeDays.length} lessons taught this week
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-600 transition-all duration-500"
                            style={{ width: `${(completedCount / activeDays.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div >

            {/* Weekly Intelligence Engine */}
            < div className={`mb-8 p-5 rounded-2xl border flex flex-col sm:flex-row gap-5 transition-all
                ${(generateWeeklyInsights(activeDays, completedCount).tone === 'positive' ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30' :
                    generateWeeklyInsights(activeDays, completedCount).tone === 'gentle' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' :
                        'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700')}`}>
                <div className="shrink-0 pt-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${(generateWeeklyInsights(activeDays, completedCount).tone === 'positive' ? 'bg-indigo-100 text-indigo-600' :
                            generateWeeklyInsights(activeDays, completedCount).tone === 'gentle' ? 'bg-amber-100 text-amber-600' :
                                'bg-slate-200 text-slate-500')}`}>
                        <Lightbulb className="w-5 h-5" />
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1">
                        {generateWeeklyInsights(activeDays, completedCount).title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm leading-relaxed">
                        {generateWeeklyInsights(activeDays, completedCount).message}
                    </p>
                    {generateWeeklyInsights(activeDays, completedCount).actions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {generateWeeklyInsights(activeDays, completedCount).actions.map((action, i) => {
                                const isDone = completedActions.has(action);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const next = new Set(completedActions);
                                            if (next.has(action)) next.delete(action);
                                            else next.add(action);
                                            setCompletedActions(next);
                                        }}
                                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none
                                            ${isDone
                                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm'}`}
                                    >
                                        {isDone ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <div className="w-3.5 h-3.5 mr-1.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                                        <span className={isDone ? 'line-through opacity-75' : ''}>{action}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div >

            {
                overrideMessage && (
                    <div className="mb-6 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl flex items-center shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="mr-3 bg-indigo-100 dark:bg-indigo-800 rounded-full p-1">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-medium">{overrideMessage}</p>
                    </div>
                )
            }

            {/* Optional Weekly Reflection (Only if 100% complete) */}
            {
                completedCount === activeDays.length && activeDays.length > 0 && (
                    <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-sm font-medium text-slate-500 mb-3">Optional Reflection (Private)</p>
                        <input
                            type="text"
                            placeholder="Anything that worked well this week?"
                            className="w-full max-w-md p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-100 outline-none transition-all mx-auto"
                            value={weekReflection}
                            onChange={e => setWeekReflection(e.target.value)}
                        />
                    </div>
                )
            }

            {/* Days Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {activeDays.map(day => (
                        <div key={day.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${day.isCompleted
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                                    }`}>
                                    {day.dayOfWeek.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-extrabold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider">{day.dayOfWeek}</h4>
                                    </div>

                                    {editingTopic === day.id ? (
                                        <div className="flex flex-col gap-2 mt-1 w-full relative group">
                                            <div className="absolute inset-x-0 -top-2 -bottom-2 bg-white dark:bg-slate-900 rounded-xl border border-brand-200 dark:border-brand-700 shadow-lg z-10 p-2 space-y-2">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Topic</label>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="e.g. Grammar"
                                                        className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                                        value={tempTopic}
                                                        onChange={e => setTempTopic(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Subtopic</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Nouns"
                                                            className="flex-1 p-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                                                            value={tempSubtopic}
                                                            onChange={e => setTempSubtopic(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleUpdateTopic(day.id)}
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateTopic(day.id)}
                                                            className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Placeholder to maintain height */}
                                            <div className="h-24 opacity-0"></div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => {
                                                setEditingTopic(day.id);
                                                setTempTopic(day.topic || "");
                                                setTempSubtopic(day.subtopic || "");
                                            }}
                                            className="group cursor-pointer space-y-2"
                                        >
                                            <div>
                                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Topic</h5>
                                                <p className={`text-base font-bold ${day.topic ? 'text-slate-900 dark:text-white' : 'text-slate-300 italic'}`}>
                                                    {day.topic || "Tap to set topic..."}
                                                </p>
                                            </div>
                                            <div>
                                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subtopic</h5>
                                                <p className={`text-sm font-medium ${day.subtopic ? 'text-brand-600 dark:text-brand-400' : 'text-slate-300 italic'}`}>
                                                    {day.subtopic || "Tap to set subtopic..."}
                                                </p>
                                            </div>

                                            {day.originalTopic && day.originalTopic !== day.topic && (
                                                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <Sparkles className="w-2.5 h-2.5" /> Suggested: {day.originalTopic}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {day.isCompleted ? (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl font-semibold text-sm">
                                            <CheckCircle className="w-4 h-4" /> Completed
                                        </div>
                                        <button
                                            onClick={() => handleUnmarkComplete(day.id)}
                                            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Reset
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            const context = [
                                                `Role: Week ${day.weekNumber} of a ${currentClass.term} term plan for ${currentClass.subject} (${currentClass.classLevel}).`,
                                                `Topic: ${day.topic}.${day.subtopic ? ` Subtopic: ${day.subtopic}.` : ''}`,
                                                day.originalTopic && day.topic !== day.originalTopic ? `(Background: Official curriculum suggested "${day.originalTopic}")` : '',
                                                day.skills ? `Focus Skills: ${day.skills}.` : '',
                                                day.learningGoal ? `Expected Outcome: ${day.learningGoal}.` : '',
                                                day.resources ? `Reference Resources: ${day.resources}.` : ''
                                            ].filter(Boolean).join(' ');

                                            const smartHint = encodeURIComponent(context);
                                            // Mapping Smart Class data to Generator fields:
                                            // Topic -> Main Topic (e.g. Grammar)
                                            // Subtopic -> Specific (e.g. Nouns)
                                            // Ensure we pass the user's latest edits
                                            const params = new URLSearchParams({
                                                smartClassId: currentClass.id,
                                                dayId: day.id,
                                                subject: currentClass.subject,
                                                classLevel: currentClass.classLevel,
                                                lessonType: day.lessonType,
                                                topic: day.topic || day.lessonType, // If no topic set, fallback to lessonType? Or usually topic IS set. user wants Topic.
                                                subtopic: day.subtopic || '',
                                                smartHint
                                            });
                                            navigate(`/generator?${params.toString()}`);
                                        }}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        Generate Note <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {showCreateModal && renderCreateModal()}
        </div>
    );
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{title}</h3>
                {children}
            </div>
        </div>
    );
}

export default SmartClass;
