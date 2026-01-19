import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { BookOpen, Map, Trash, Plus, ChevronRight, CheckCircle, ChevronDown, Edit } from '../components/Icons';
import { showAlert } from '../utils/alerts';
import { Subject, ClassLevel } from '../types';

const AdminContentSchemes: React.FC = () => {
    const [schemes, setSchemes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingScheme, setEditingScheme] = useState<any | null>(null);

    // Filter states
    const [filterSubject, setFilterSubject] = useState("");
    const [filterClass, setFilterClass] = useState("");

    // Create / Edit Form State
    const [formData, setFormData] = useState({
        subject: '',
        classLevel: '',
        term: '1st',
        source: 'TeachAide Standard'
    });

    useEffect(() => {
        loadSchemes();
    }, [filterSubject, filterClass]);

    const loadSchemes = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterSubject) params.subject = filterSubject;
            if (filterClass) params.classLevel = filterClass;
            const res = await db.admin.referenceSchemes.getAll(params);
            setSchemes(res);
        } catch (error) {
            console.error(error);
            showAlert.error("Error", "Failed to load schemes");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await db.admin.referenceSchemes.create(formData);
            showAlert.success("Success", "Scheme created successfully");
            setIsCreating(false);
            loadSchemes();
        } catch (error: any) {
            showAlert.error("Error", error.message || "Failed to create scheme");
        }
    };

    const handleDelete = async (id: string) => {
        if (await showAlert.confirm("Delete Scheme", "Are you sure? This will delete the entire scheme of work and cannot be undone.")) {
            try {
                await db.admin.referenceSchemes.delete(id);
                setSchemes(schemes.filter(s => s.id !== id));
            } catch (error) {
                showAlert.error("Error", "Failed to delete");
            }
        }
    };

    const openEdit = async (id: string) => {
        try {
            const scheme = await db.admin.referenceSchemes.getOne(id);
            setEditingScheme(scheme);
        } catch (error) {
            showAlert.error("Error", "Failed to load scheme details");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {editingScheme ? (
                <SchemeEditor scheme={editingScheme} onBack={() => { setEditingScheme(null); loadSchemes(); }} />
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Schemes of Work</h1>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Create New Scheme
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4">
                        <select
                            className="p-2 border rounded-lg text-sm"
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                        >
                            <option value="">All Subjects</option>
                            {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            className="p-2 border rounded-lg text-sm"
                            value={filterClass}
                            onChange={e => setFilterClass(e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {Object.values(ClassLevel).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {schemes.map(scheme => (
                            <div key={scheme.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{scheme.subject}</h3>
                                        <p className="text-sm text-slate-500">{scheme.classLevel} • {scheme.term} Term</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(scheme.id)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors">
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(scheme.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400">
                                    Source: {scheme.source || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Create Modal */}
                    {isCreating && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl max-w-md w-full p-6">
                                <h2 className="text-xl font-bold mb-4">Create New Scheme</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Subject</label>
                                        <select
                                            className="w-full p-2 border rounded-lg"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        >
                                            <option value="">Select Subject</option>
                                            {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Class Level</label>
                                        <select
                                            className="w-full p-2 border rounded-lg"
                                            value={formData.classLevel}
                                            onChange={e => setFormData({ ...formData, classLevel: e.target.value })}
                                        >
                                            <option value="">Select Class</option>
                                            {Object.values(ClassLevel).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Term</label>
                                        <select
                                            className="w-full p-2 border rounded-lg"
                                            value={formData.term}
                                            onChange={e => setFormData({ ...formData, term: e.target.value })}
                                        >
                                            <option value="1st">1st Term</option>
                                            <option value="2nd">2nd Term</option>
                                            <option value="3rd">3rd Term</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                                        <button onClick={handleCreate} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Create</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Sub-component for Editing a Scheme (Weeks 1-12)
const SchemeEditor = ({ scheme, onBack }: { scheme: any, onBack: () => void }) => {
    const [activeWeek, setActiveWeek] = useState(1);
    const [weekData, setWeekData] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Initialize local state for the active week from the scheme prop
        // We find the week in scheme.weeks or default to empty
        const week = scheme.weeks.find((w: any) => w.weekNumber === activeWeek);
        if (week) {
            setWeekData(JSON.parse(JSON.stringify(week))); // deep copy
        } else {
            // Should usually allow creating if not exists, but backend creates 12 weeks on init
            setWeekData({ weekNumber: activeWeek, themeTitle: '', topics: [] });
        }
    }, [activeWeek, scheme]);

    const handleSaveWeek = async () => {
        if (!weekData) return;
        setSaving(true);
        try {
            const res = await db.admin.referenceSchemes.updateWeek(scheme.id, activeWeek, {
                themeTitle: weekData.themeTitle,
                topics: weekData.topics
            });
            showAlert.success("Saved", "Week plan updated");
            // Update local scheme state to reflect changes without full reload? 
            // For now, simpler to reload or just keep editing
            // To be proper, we should update the parent `scheme` object, but let's just rely on backend persistence
        } catch (error) {
            showAlert.error("Error", "Failed to save week");
        } finally {
            setSaving(false);
        }
    };

    const addTopic = () => {
        setWeekData({
            ...weekData,
            topics: [...weekData.topics, { id: undefined, topic: '', subtopics: '', lessonType: 'Normal Lesson' }]
        });
    };

    const removeTopic = (index: number) => {
        const newTopics = [...weekData.topics];
        newTopics.splice(index, 1);
        setWeekData({ ...weekData, topics: newTopics });
    };

    const updateTopic = (index: number, field: string, value: string) => {
        const newTopics = [...weekData.topics];
        newTopics[index] = { ...newTopics[index], [field]: value };
        setWeekData({ ...weekData, topics: newTopics });
    };

    if (!weekData) return <div>Loading...</div>;

    return (
        <div className="animate-in slide-in-from-right duration-300">
            <button onClick={onBack} className="mb-4 text-slate-500 hover:text-slate-900 flex items-center gap-2">
                &larr; Back to Schemes
            </button>
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{scheme.subject} - {scheme.classLevel}</h2>
                        <p className="text-sm text-slate-500">Term: {scheme.term}</p>
                    </div>
                    <button onClick={handleSaveWeek} disabled={saving} className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Week Changes'}
                    </button>
                </div>

                <div className="flex h-[600px]">
                    {/* Week Sidebar */}
                    <div className="w-48 border-r border-slate-100 bg-slate-50/50 overflow-y-auto">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                            <button
                                key={w}
                                onClick={() => setActiveWeek(w)}
                                className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-all ${activeWeek === w ? 'border-brand-600 bg-white text-brand-700 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                            >
                                Week {w}
                            </button>
                        ))}
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="mb-8">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Weekly Theme</label>
                            <input
                                type="text"
                                className="w-full text-lg font-bold border-b-2 border-slate-200 focus:border-brand-500 outline-none pb-2 bg-transparent"
                                placeholder="E.g. Introduction to Reading Skills"
                                value={weekData.themeTitle || ''}
                                onChange={e => setWeekData({ ...weekData, themeTitle: e.target.value })}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-900">Weekly Topics</h3>
                                <button onClick={addTopic} className="text-brand-600 text-sm font-bold flex items-center gap-1 hover:bg-brand-50 px-3 py-1 rounded-lg transition-colors">
                                    <Plus className="w-4 h-4" /> Add Topic
                                </button>
                            </div>

                            <div className="space-y-4">
                                {weekData.topics.map((topic: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 group">
                                        <div className="flex gap-4 mb-2">
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Topic / Lesson Type</label>
                                                <input
                                                    type="text"
                                                    placeholder="Main Topic (e.g. Grammar)"
                                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                    value={topic.topic}
                                                    onChange={e => updateTopic(idx, 'topic', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Subtopic / Specific Content</label>
                                                <input
                                                    type="text"
                                                    placeholder="Subtopic (e.g. Nouns)"
                                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                    value={topic.subtopics || ''}
                                                    onChange={e => updateTopic(idx, 'subtopics', e.target.value)}
                                                />
                                            </div>
                                            <button onClick={() => removeTopic(idx)} className="mt-6 text-slate-400 hover:text-red-500">
                                                <Trash className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-1/3">
                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Lesson Pattern</label>
                                                <select
                                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                    value={topic.lessonType || 'Normal Lesson'}
                                                    onChange={e => updateTopic(idx, 'lessonType', e.target.value)}
                                                >
                                                    <option value="Normal Lesson">Normal Lesson</option>
                                                    <option value="Vocabulary Development">Vocabulary</option>
                                                    <option value="Comprehension">Comprehension</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {weekData.topics.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-slate-400 text-sm">No topics added for this week yet.</p>
                                        <button onClick={addTopic} className="text-brand-600 font-bold text-sm mt-2">Add First Topic</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminContentSchemes;
