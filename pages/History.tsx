import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { LessonNote, Assessment } from '../types';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, Clipboard } from '../components/Icons';

const History: React.FC = () => {
    const [notes, setNotes] = useState<LessonNote[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<LessonNote[]>([]);
    const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('All');
    const [activeTab, setActiveTab] = useState<'notes' | 'assessments'>('notes');

    useEffect(() => {
        const load = async () => {
            const notesData = await db.notes.getUserNotes();
            const assessmentsData = await db.assessments.getUserAssessments();
            setNotes(notesData);
            setAssessments(assessmentsData);
            setFilteredNotes(notesData);
            setFilteredAssessments(assessmentsData);
        };
        load();
    }, []);

    useEffect(() => {
        // Filter notes
        let resNotes = notes;
        if (search) {
            const lower = search.toLowerCase();
            resNotes = resNotes.filter(n =>
                n.topic.toLowerCase().includes(lower) ||
                n.subject.toLowerCase().includes(lower) ||
                (n.subtopic && n.subtopic.toLowerCase().includes(lower))
            );
        }
        if (classFilter !== 'All') {
            resNotes = resNotes.filter(n => n.classLevel === classFilter);
        }
        setFilteredNotes(resNotes);

        // Filter assessments
        let resAssessments = assessments;
        if (search) {
            const lower = search.toLowerCase();
            resAssessments = resAssessments.filter(a =>
                a.topic.toLowerCase().includes(lower) ||
                a.subject.toLowerCase().includes(lower)
            );
        }
        if (classFilter !== 'All') {
            resAssessments = resAssessments.filter(a => a.classLevel === classFilter);
        }
        setFilteredAssessments(resAssessments);
    }, [search, classFilter, notes, assessments]);

    const displayItems = activeTab === 'notes' ? filteredNotes : filteredAssessments;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                <BookOpen className="w-8 h-8 mr-3 text-brand-600" />
                History
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'notes'
                        ? 'bg-brand-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                >
                    <BookOpen className="w-5 h-5 inline mr-2" />
                    Lesson Notes ({notes.length})
                </button>
                <button
                    onClick={() => setActiveTab('assessments')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'assessments'
                        ? 'bg-brand-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                >
                    <Clipboard className="w-5 h-5 inline mr-2" />
                    Assessments ({assessments.length})
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md leading-5 bg-white dark:bg-slate-700 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm text-slate-900 dark:text-slate-100"
                        placeholder="Search by topic or subject..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md leading-5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                    >
                        <option value="All">All Classes</option>
                        <option value="Primary 1">Primary 1</option>
                        <option value="Primary 2">Primary 2</option>
                        <option value="Primary 3">Primary 3</option>
                        <option value="Primary 4">Primary 4</option>
                        <option value="Primary 5">Primary 5</option>
                        <option value="Primary 6">Primary 6</option>
                        <option value="JSS 1">JSS 1</option>
                        <option value="JSS 2">JSS 2</option>
                        <option value="JSS 3">JSS 3</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'notes' && filteredNotes.map(note => (
                    <Link to="/result" state={{ lessonNote: note }} key={note.id} className="block group">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-semibold text-brand-700 truncate">{note.topic}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-300 mb-2">{note.subtopic}</p>
                            <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-300 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-100">{note.subject}</span>
                                <span className="text-slate-900 dark:text-slate-100">{note.classLevel}</span>
                            </div>
                        </div>
                    </Link>
                ))}
                {activeTab === 'assessments' && filteredAssessments.map(assessment => (
                    <div key={assessment.id} className="block group">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-semibold text-brand-700 truncate">{assessment.topic}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-300 mb-2">{assessment.questions?.length || 0} Questions</p>
                            <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-300 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-100">{assessment.subject}</span>
                                <span className="text-slate-900 dark:text-slate-100">{assessment.classLevel}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {displayItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No {activeTab === 'notes' ? 'lesson notes' : 'assessments'} found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;