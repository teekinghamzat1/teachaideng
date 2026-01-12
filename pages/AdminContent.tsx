import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { LessonNote } from '../types';
import { Search, FileText, CheckCircle, AlertTriangle, Eye, Loader2 } from '../components/Icons';
import { parseMarkdown } from '../utils/textUtils';

const AdminContent: React.FC = () => {
    const [notes, setNotes] = useState<LessonNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState<LessonNote | null>(null);

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        setLoading(true);
        const data = await db.admin.getAllNotes();
        setNotes(data);
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'Approved' | 'Flagged') => {
        await db.admin.updateNoteStatus(id, action);
        // Optimistic update
        setNotes(notes.map(n => n.id === id ? { ...n, status: action } : n));
        if (selectedNote?.id === id) {
            setSelectedNote(prev => prev ? ({ ...prev, status: action }) : null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex gap-6 relative">
            {/* List View */}
            <div className={`w-full lg:w-1/3 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-col overflow-hidden ${selectedNote ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Generated Content</h2>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-700 dark:text-slate-100" placeholder="Filter by topic..." />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div> :
                        notes.length === 0 ? <div className="p-8 text-center text-slate-500">No content generated.</div> :
                            notes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => setSelectedNote(note)}
                                    className={`p-4 cursor-pointer transition-colors border-l-4 ${selectedNote?.id === note.id ? 'bg-brand-50 border-brand-500' : 'border-transparent'} bg-white dark:bg-slate-800`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate pr-2">{note.topic}</h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${note.status === 'Flagged' ? 'bg-red-100 text-red-700' :
                                                note.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    note.status === 'Generated' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>{note.status || 'Pending'}</span>
                                            {note.source && (
                                                <span className={`text-[8px] px-1 rounded font-bold uppercase ${note.source === 'AIGenerated' ? 'text-purple-500 border border-purple-200' : 'text-blue-500 border border-blue-200'
                                                    }`}>
                                                    {note.source === 'AIGenerated' ? 'Auto-Gen' : 'Saved'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{note.subject} • {note.classLevel}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">{new Date(note.createdAt || '').toLocaleDateString()}</p>
                                </div>
                            ))}
                </div>
            </div>

            {/* Detail View */}
            <div className={`flex-1 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-col overflow-hidden absolute inset-0 lg:relative z-10 ${selectedNote ? 'flex' : 'hidden lg:flex'}`}>
                {selectedNote ? (
                    <>
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedNote.topic}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">ID: {selectedNote.id}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => selectedNote.id && handleAction(selectedNote.id, 'Approved')}
                                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                </button>
                                <button
                                    onClick={() => selectedNote.id && handleAction(selectedNote.id, 'Flagged')}
                                    className="flex items-center px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" /> Flag
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Content Preview</h3>
                                <div className="prose max-w-none text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 p-4 md:p-6 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedNote.lessonContent) }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Objectives</h3>
                                    <ul className="list-disc pl-4 text-sm text-slate-700 dark:text-slate-200 space-y-1">
                                        {selectedNote.objectives.map((o, i) => <li key={i}>{o}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Metadata</h3>
                                    <div className="text-sm text-slate-600 dark:text-slate-200 space-y-2">
                                        <p><span className="font-medium">Subject:</span> {selectedNote.subject}</p>
                                        <p><span className="font-medium">Class:</span> {selectedNote.classLevel}</p>
                                        <p><span className="font-medium">User ID:</span> {selectedNote.userId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a lesson note to review details.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminContent;