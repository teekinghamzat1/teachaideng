import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { Student } from '../types';
import { Users, Trash, UserIcon, BookOpen, FileText, Search, Plus, ChevronDown } from '../components/Icons';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../utils/alerts';

const ClassManager: React.FC = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);

    // Form State
    const [newName, setNewName] = useState('');
    const [newAge, setNewAge] = useState('');
    const [newGender, setNewGender] = useState('Male');
    const [newSubject, setNewSubject] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!db.auth.getCurrentUser()) navigate('/login');
        loadStudents();
    }, [navigate]);

    const loadStudents = async () => {
        const list = await db.students.getAll();
        setStudents(list);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newSubject) return;

        await db.students.save({
            id: '',
            userId: '',
            name: newName,
            age: Number(newAge),
            gender: newGender,
            subject: newSubject,
            notes: newNotes
        });

        // Reset form
        setNewName('');
        setNewAge('');
        setNewGender('Male');
        setNewSubject('');
        setNewNotes('');

        showAlert.success('Student Added', 'New student record has been created.');
        loadStudents();
    };

    const handleDelete = async (id: string) => {
        if (await showAlert.confirm("Remove Student", "Are you sure you want to delete this student's record?")) {
            await db.students.delete(id);
            showAlert.success('Removed', 'Student record deleted.');
            loadStudents();
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-left duration-700">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#16A34A]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Class Management</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Left Column: Add Student Form */}
                <div className="lg:col-span-4">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/50 dark:border-slate-800/50 lg:sticky lg:top-24">
                        <div className="flex items-center gap-3 mb-6 sm:mb-8">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#16A34A]/10 rounded-xl flex items-center justify-center text-[#16A34A]">
                                <Plus className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Add New Student</h2>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all"
                                    placeholder="e.g. Samuel Okon"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all"
                                        placeholder="10"
                                        value={newAge}
                                        onChange={e => setNewAge(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold appearance-none outline-none transition-all"
                                            value={newGender}
                                            onChange={e => setNewGender(e.target.value)}
                                        >
                                            <option>Male</option>
                                            <option>Female</option>
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subjects / Class</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all"
                                    placeholder="e.g. Mathematics, JSS 2"
                                    value={newSubject}
                                    onChange={e => setNewSubject(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Teacher's Notes (Optional)</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all resize-none"
                                    rows={3}
                                    placeholder="Observations, strengths, areas for improvement..."
                                    value={newNotes}
                                    onChange={e => setNewNotes(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full h-14 sm:h-16 bg-[#16A34A] text-white font-black rounded-2xl shadow-xl shadow-[#16A34A]/20 hover:shadow-[#16A34A]/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-base sm:text-lg"
                            >
                                <Plus className="w-5 h-5 sm:w-6 sm:h-6" /> Add Student
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Class List */}
                <div className="lg:col-span-8">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden min-h-[400px] sm:min-h-[600px] flex flex-col">
                        {/* List Header */}
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 sm:gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Class List</h3>
                                    <span className="bg-[#16A34A]/10 text-[#16A34A] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-[#16A34A]/20">
                                        {students.length} Students
                                    </span>
                                </div>
                            </div>

                            <div className="relative w-full md:w-80 group">
                                <div className="absolute inset-y-0 left-0 pl-5 sm:pl-6 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-focus-within:text-[#16A34A] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-sm sm:text-base text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all shadow-sm"
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow flex flex-col p-5 sm:p-8">
                            {filteredStudents.length === 0 ? (
                                <div className="flex-grow flex flex-col items-center justify-center py-12 sm:py-20 text-center space-y-6 sm:space-y-8">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 dark:bg-slate-800 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-inner">
                                        <Users className="w-12 h-12 sm:w-16 sm:h-16" />
                                    </div>
                                    <div className="space-y-2 sm:space-y-3 px-4">
                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">No students yet</h3>
                                        <p className="text-slate-400 font-bold max-w-[280px] sm:max-w-sm mx-auto leading-relaxed uppercase text-[9px] sm:text-xs tracking-widest opacity-80">
                                            Add students on the left to start managing your class records.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredStudents.map(student => (
                                        <div key={student.id} className="group bg-[#F9FAFB] dark:bg-slate-800/40 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 hover:border-[#16A34A]/30 transition-all relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#16A34A]/5 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>

                                            <div className="flex items-start justify-between relative z-10">
                                                <div className="flex gap-3 sm:gap-4">
                                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-lg ${student.gender === 'Female' ? 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-200' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                                                        }`}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate group-hover:text-[#16A34A] transition-colors">{student.name}</h4>
                                                        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 font-bold">
                                                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest">{student.gender}</span>
                                                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-200"></span>
                                                            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest underline decoration-2 decoration-[#16A34A]/30 underline-offset-4">{student.age} Yrs</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-300 hover:text-red-500 hover:border-red-100 flex items-center justify-center transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                                                <span className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg text-[9px] font-black text-[#16A34A] uppercase tracking-widest border border-[#16A34A]/10">
                                                    {student.subject}
                                                </span>
                                            </div>

                                            {student.notes && (
                                                <div className="mt-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-50 dark:border-slate-800/50 relative z-10">
                                                    <div className="flex gap-3">
                                                        <FileText className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                                                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">{student.notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassManager;