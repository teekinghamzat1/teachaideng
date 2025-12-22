import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { Timetable as TimetableType, TimetableSlot } from '../types';
import { Calendar, Save, Download } from '../components/Icons';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];

const Timetable: React.FC = () => {
    const navigate = useNavigate();
    const [timetable, setTimetable] = useState<TimetableType>({ id: '', userId: '', className: '', slots: [] });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!db.auth.getCurrentUser()) navigate('/login');
        loadTimetable();
    }, [navigate]);

    const loadTimetable = async () => {
        const data = await db.timetable.get();
        if (data) setTimetable(data);
    };

    const handleCellChange = (day: string, time: string, subject: string) => {
        const newSlots = timetable.slots.filter(s => !(s.day === day && s.time === time));
        if (subject.trim()) {
            newSlots.push({ day, time, subject });
        }
        setTimetable({ ...timetable, slots: newSlots });
    };

    const getSubject = (day: string, time: string) => {
        return timetable.slots.find(s => s.day === day && s.time === time)?.subject || '';
    };

    const handleSave = async () => {
        setSaving(true);
        await db.timetable.save(timetable);
        setSaving(false);
        alert('Timetable saved!');
    };

    const handleExport = () => {
        window.print();
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                    <Calendar className="w-8 h-8 mr-3 text-brand-600" />
                    Weekly Timetable
                </h1>
                <div className="flex gap-3">
                     <button onClick={handleSave} className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
                        <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={handleExport} className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto print:shadow-none print:border-none">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                            {DAYS.map(day => (
                                <th key={day} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {TIMES.map(time => (
                            <tr key={time}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 bg-slate-50">{time}</td>
                                {DAYS.map(day => (
                                    <td key={`${day}-${time}`} className="px-2 py-2 border-l border-slate-100 min-w-[140px]">
                                        <input 
                                            type="text" 
                                            className="w-full border-none focus:ring-0 text-sm text-center bg-transparent hover:bg-slate-50 focus:bg-white rounded p-1"
                                            placeholder="Subject..."
                                            value={getSubject(day, time)}
                                            onChange={(e) => handleCellChange(day, time, e.target.value)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <p className="mt-4 text-sm text-slate-500 text-center print:hidden">
                Tip: Use your browser's "Print to PDF" feature when clicking Export to save as a document.
            </p>
        </div>
    );
};

export default Timetable;