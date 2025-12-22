import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { Curriculum } from '../types';
import { BookOpen, Trash, CheckCircle } from '../components/Icons';
import { showAlert } from '../utils/alerts';

const AdminCurriculum: React.FC = () => {
    const [data, setData] = useState<Curriculum>({ subjects: [], classLevels: [] });
    const [newSubject, setNewSubject] = useState('');
    const [newClass, setNewClass] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await db.admin.getCurriculum();
                setData(res || { subjects: [], classLevels: [] });
            } catch (e) {
                console.error('Failed to load curriculum', e);
            }
        };
        load();
    }, []);

    const save = async (newData: Curriculum) => {
        try {
            // Optimistic update
            setData(newData);
            await db.admin.saveCurriculum(newData);
        } catch (error: any) {
            showAlert.error('Save Failed', error.message || 'Failed to save curriculum');
            // Revert on failure (could improve by re-fetching)
            const res = await db.admin.getCurriculum();
            setData(res);
        }
    };

    const addSubject = async () => {
        if (newSubject && !data.subjects.includes(newSubject)) {
            await save({ ...data, subjects: [...data.subjects, newSubject] });
            setNewSubject('');
        }
    };

    const removeSubject = async (sub: string) => {
        if (await showAlert.confirm('Remove Subject', `Are you sure you want to delete the subject "${sub}"?`)) {
            await save({ ...data, subjects: data.subjects.filter(s => s !== sub) });
        }
    };

    const addClass = async () => {
        if (newClass && !data.classLevels.includes(newClass)) {
            await save({ ...data, classLevels: [...data.classLevels, newClass] });
            setNewClass('');
        }
    };

    const removeClass = async (cls: string) => {
        if (await showAlert.confirm('Remove Class', `Are you sure you want to delete the class "${cls}"?`)) {
            await save({ ...data, classLevels: data.classLevels.filter(c => c !== cls) });
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Curriculum Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Subjects */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-brand-600" />
                        Subjects
                    </h2>
                    <div className="flex gap-2 mb-6">
                        <input
                            className="flex-1 rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm"
                            placeholder="Add new subject..."
                            value={newSubject}
                            onChange={e => setNewSubject(e.target.value)}
                        />
                        <button onClick={addSubject} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">Add</button>
                    </div>
                    <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {data.subjects.map(s => (
                            <li key={s} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                <span className="text-sm font-medium text-slate-700">{s}</span>
                                <button onClick={() => removeSubject(s)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Classes */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                        Class Levels
                    </h2>
                    <div className="flex gap-2 mb-6">
                        <input
                            className="flex-1 rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm"
                            placeholder="Add new class level..."
                            value={newClass}
                            onChange={e => setNewClass(e.target.value)}
                        />
                        <button onClick={addClass} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
                    </div>
                    <ul className="space-y-2">
                        {data.classLevels.map(c => (
                            <li key={c} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                <span className="text-sm font-medium text-slate-700">{c}</span>
                                <button onClick={() => removeClass(c)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminCurriculum;