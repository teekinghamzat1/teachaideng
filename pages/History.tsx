import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { LessonNote, Assessment } from '../types';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, Clipboard, Zap, Edit, ChevronDown, CheckCircle } from '../components/Icons';

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

    const getIconForSubject = (subject: string) => {
        const s = subject.toLowerCase();
        if (s.includes('science')) return <Zap className="w-5 h-5 text-white" />;
        if (s.includes('english') || s.includes('composition') || s.includes('grammar')) return <Edit className="w-5 h-5 text-white" />;
        return <BookOpen className="w-5 h-5 text-white" />;
    };

    const getIconBg = (subject: string) => {
        const s = subject.toLowerCase();
        if (s.includes('science')) return 'bg-green-500 shadow-green-100 dark:shadow-green-900/20';
        if (s.includes('english')) return 'bg-blue-500 shadow-blue-100 dark:shadow-blue-900/20';
        return 'bg-[#16A34A] shadow-green-100 dark:shadow-green-900/20';
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 transition-colors duration-300 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">
                {/* Page Title */}
                <div className="flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-left duration-700">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#16A34A]" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">History</h1>
                </div>

                {/* Tab Switcher - Mobile Optimized */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`group px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-sm flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 ${activeTab === 'notes'
                            ? 'bg-[#16A34A] text-white shadow-xl shadow-[#16A34A]/20 sm:scale-105'
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'notes' ? 'text-white' : 'text-slate-400 group-hover:text-[#16A34A]'}`} />
                        <span className="truncate">Notes ({notes.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('assessments')}
                        className={`group px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-sm flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 ${activeTab === 'assessments'
                            ? 'bg-[#16A34A] text-white shadow-xl shadow-[#16A34A]/20 sm:scale-105'
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        <Clipboard className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'assessments' ? 'text-white' : 'text-slate-400 group-hover:text-[#16A34A]'}`} />
                        <span className="truncate">Assessments ({assessments.length})</span>
                    </button>
                </div>

                {/* Controls Area */}
                <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-3 sm:p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="relative flex-grow group">
                        <div className="absolute inset-y-0 left-0 pl-5 sm:pl-6 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-focus-within:text-[#16A34A] transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[1.8rem] text-sm sm:text-base text-slate-900 dark:text-white font-bold placeholder-slate-300 dark:placeholder-slate-600 focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all outline-none"
                            placeholder="Search topics..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="relative min-w-full md:min-w-[200px] group">
                        <div className="absolute inset-y-0 left-0 pl-5 sm:pl-6 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-focus-within:text-[#16A34A] transition-colors" />
                        </div>
                        <select
                            className="block w-full pl-12 sm:pl-14 pr-10 sm:pr-12 py-4 sm:py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[1.8rem] text-sm sm:text-base text-slate-900 dark:text-white font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-[#16A34A] focus:border-transparent outline-none transition-all shadow-sm"
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
                        <div className="absolute inset-y-0 right-0 pr-5 sm:pr-6 flex items-center pointer-events-none">
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300" />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    {activeTab === 'notes' && filteredNotes.map((note, idx) => (
                        <Link
                            to="/result"
                            state={{ lessonNote: note }}
                            key={note.id}
                            className="block group h-full"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="h-full bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-[#16A34A]/5 hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden group">
                                {/* Subtle Background Glow on Hover */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/5 blur-3xl rounded-full translate-x-12 -translate-y-12 group-hover:bg-[#16A34A]/10 transition-colors"></div>

                                <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${getIconBg(note.subject)}`}>
                                        {getIconForSubject(note.subject)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate leading-tight group-hover:text-[#16A34A] transition-colors">{note.topic}</h3>
                                        <p className="text-[10px] sm:text-sm font-bold text-slate-400 dark:text-slate-500 truncate mt-1 uppercase tracking-widest">{note.subtopic || 'General'}</p>
                                    </div>
                                </div>

                                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-50 dark:border-slate-800/50 flex justify-between items-center relative z-10">
                                    <span className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black text-[#16A34A] uppercase tracking-widest border border-slate-100 dark:border-slate-800">
                                        {note.subject}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
                                        {note.classLevel}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {activeTab === 'assessments' && filteredAssessments.map((assessment, idx) => (
                        <div
                            key={assessment.id}
                            className="block group h-full cursor-pointer hover:shadow-2xl transition-all duration-500"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="h-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-[#16A34A]/5 hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/5 blur-3xl rounded-full translate-x-12 -translate-y-12 group-hover:bg-[#16A34A]/10 transition-colors"></div>

                                <div className="flex items-start gap-4 relative z-10">
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 bg-purple-500 shadow-purple-100 dark:shadow-purple-900/20`}>
                                        <Clipboard className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white truncate leading-tight group-hover:text-[#16A34A] transition-colors">{assessment.topic}</h3>
                                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 truncate mt-1 uppercase tracking-widest">{assessment.questions?.length || 0} Questions</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex justify-between items-center relative z-10">
                                    <span className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest border border-slate-100 dark:border-slate-800">
                                        {assessment.subject}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
                                        {assessment.classLevel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {displayItems.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700">
                                <Search className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">No records found</h3>
                                <p className="text-slate-400 font-medium max-w-xs mx-auto">
                                    We couldn't find any {activeTab === 'notes' ? 'lesson notes' : 'assessments'} matching your current filters.
                                </p>
                            </div>
                            <button
                                onClick={() => { setSearch(''); setClassFilter('All'); }}
                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;