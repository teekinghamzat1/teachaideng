import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { Student } from '../types';
import { Users, Save, Trash, UserIcon, BookOpen, FileText } from '../components/Icons';
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

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                <Users className="w-8 h-8 mr-3 text-brand-600" />
                Class Management
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Student Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-24">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
                            <Save className="w-5 h-5 mr-2 text-brand-500" />
                            Add New Student
                        </h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border text-slate-900 dark:text-slate-100"
                                    placeholder="e.g. Samuel Okon"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Age</label>
                                    <input
                                        type="number"
                                        required
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border"
                                        placeholder="10"
                                        value={newAge}
                                        onChange={e => setNewAge(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Gender</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border"
                                        value={newGender}
                                        onChange={e => setNewGender(e.target.value)}
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Subjects / Class</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border"
                                    placeholder="e.g. Mathematics, JSS 2"
                                    value={newSubject}
                                    onChange={e => setNewSubject(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Teacher's Notes (Optional)</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 px-3 py-2 border"
                                    rows={3}
                                    placeholder="Observations, strengths, areas for improvement..."
                                    value={newNotes}
                                    onChange={e => setNewNotes(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                            >
                                <Save className="w-4 h-4 mr-2" /> Add Student
                            </button>
                        </form>
                    </div>
                </div>

                {/* Student List */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[400px]">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Class List</h3>
                            <span className="text-xs font-medium bg-brand-100 text-brand-800 px-2.5 py-0.5 rounded-full border border-brand-200">{students.length} Students</span>
                        </div>

                        {students.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No students yet</h3>
                                <p className="text-slate-500 mt-1 max-w-xs">Add students on the left to start managing your class records.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-200">
                                {students.map(student => (
                                    <li key={student.id} className="p-6 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0">
                                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm ${student.gender === 'Female' ? 'bg-pink-500' : 'bg-blue-500'
                                                        }`}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-semibold text-slate-900 truncate">{student.name}</p>
                                                    <div className="flex items-center text-sm text-slate-500 mt-1 space-x-3">
                                                        <span className="flex items-center">
                                                            <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                            {student.gender}, {student.age} yrs
                                                        </span>
                                                        <span className="text-slate-300">|</span>
                                                        <span className="flex items-center text-brand-600 font-medium">
                                                            <BookOpen className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                                            {student.subject}
                                                        </span>
                                                    </div>

                                                    {student.notes && (
                                                        <div className="mt-3 bg-yellow-50 rounded-md p-3 border border-yellow-100">
                                                            <div className="flex items-start">
                                                                <FileText className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{student.notes}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(student.id)}
                                                className="text-slate-300 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove Student"
                                            >
                                                <Trash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassManager;