import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../database';
import { Timetable as TimetableType, TimetableSlot } from '../types';
import { Calendar, Save, Download, Plus, Trash, Printer } from '../components/Icons';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../utils/alerts';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

interface PeriodConfig {
    id: string;
    label: string;
    duration: string;
    timeRange: string;
    isVertical: boolean;
    isSubject: boolean;
}

const Timetable: React.FC = () => {
    const navigate = useNavigate();
    const [timetable, setTimetable] = useState<TimetableType>({
        id: '',
        userId: '',
        className: '',
        boardName: '',
        title: '',
        configuration: JSON.stringify({
            periods: [
                { id: 'p1', label: 'REGISTRATION', duration: '10 MINS', timeRange: '8:00-8:10pm', isVertical: true, isSubject: false },
                { id: 'p2', label: '1st', duration: '30 MINS', timeRange: '8:10-8:40am', isVertical: false, isSubject: true },
                { id: 'p3', label: '2nd', duration: '30 MINS', timeRange: '8:40-9:10am', isVertical: false, isSubject: true },
                { id: 'p4', label: 'RECESS', duration: '5 MINS', timeRange: '9:10-9:15am', isVertical: true, isSubject: false },
                { id: 'p5', label: '3rd', duration: '30 MINS', timeRange: '9:15-9:45am', isVertical: false, isSubject: true },
                { id: 'p6', label: '4th', duration: '30 MINS', timeRange: '9:45-10:15am', isVertical: false, isSubject: true },
                { id: 'p7', label: 'RECESS', duration: '5 MINS', timeRange: '10:15-10:20am', isVertical: true, isSubject: false },
                { id: 'p8', label: '5th', duration: '30 MINS', timeRange: '10:20-10:50am', isVertical: false, isSubject: true },
                { id: 'p9', label: 'CLEAN-UP', duration: '30 MINS', timeRange: '10:50-11:00am', isVertical: true, isSubject: false }
            ]
        }),
        slots: []
    });
    const [saving, setSaving] = useState(false);

    const config = useMemo(() => {
        try {
            return JSON.parse(timetable.configuration || '{}');
        } catch (e) {
            return { periods: [] };
        }
    }, [timetable.configuration]);

    const periods: PeriodConfig[] = config.periods || [];

    useEffect(() => {
        if (!db.auth.getCurrentUser()) navigate('/login');
        loadTimetable();
    }, [navigate]);

    const loadTimetable = async () => {
        const data = await db.timetable.get();
        if (data) setTimetable(data);
    };

    const handleCellChange = (day: string, periodId: string, subject: string) => {
        const newSlots = [...timetable.slots.filter(s => !(s.day === day && s.time === periodId))];
        if (subject.trim()) {
            newSlots.push({ day, time: periodId, subject });
        }
        setTimetable({ ...timetable, slots: newSlots });
    };

    const getSubject = (day: string, periodId: string) => {
        return timetable.slots.find(s => s.day === day && s.time === periodId)?.subject || '';
    };

    const updateConfig = (newPeriods: PeriodConfig[]) => {
        setTimetable({
            ...timetable,
            configuration: JSON.stringify({ ...config, periods: newPeriods })
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await db.timetable.save(timetable);
            showAlert.success('Timetable Saved');
        } catch (e: any) {
            showAlert.error('Error', e.message);
        } finally {
            setSaving(false);
        }
    };

    const subjectTally = useMemo(() => {
        const tally: Record<string, number> = {};
        timetable.slots.forEach(slot => {
            const sub = slot.subject.trim();
            if (sub) {
                tally[sub] = (tally[sub] || 0) + 1;
            }
        });
        return Object.entries(tally).sort((a, b) => b[1] - a[1]);
    }, [timetable.slots]);

    const addPeriod = () => {
        const newPeriods = [...periods, {
            id: `p${Date.now()} `,
            label: 'New',
            duration: '30 MINS',
            timeRange: '00:00-00:00',
            isVertical: false,
            isSubject: true
        }];
        updateConfig(newPeriods);
    };

    const removePeriod = (id: string) => {
        updateConfig(periods.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-8 print:p-0">
            {/* Header / Controls */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
                        <Calendar className="w-8 h-8 mr-4 text-brand-600" />
                        Interactive Timetable
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">Design your weekly schedule to match your school's specific requirements.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                    >
                        <Printer className="w-5 h-5 mr-2" /> Print PDF
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-8 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Editable Formal Header */}
            <div className="text-center mb-10 space-y-4">
                <input
                    type="text"
                    value={timetable.boardName || ''}
                    onChange={e => setTimetable({ ...timetable, boardName: e.target.value })}
                    placeholder="ENTER BOARD / MINISTRY NAME (E.G. OGUN STATE UNIVERSAL BASIC EDUCATION BOARD)"
                    className="w-full text-center text-xl font-bold bg-transparent border-none focus:ring-2 focus:ring-brand-500 rounded p-1 placeholder:text-slate-300 uppercase"
                />
                <input
                    type="text"
                    value={timetable.title || ''}
                    onChange={e => setTimetable({ ...timetable, title: e.target.value })}
                    placeholder="ENTER TIMETABLE TITLE (E.G. TIME TABLE FOR POST COVID-19 PANDEMIC)"
                    className="w-full text-center text-lg font-semibold text-slate-700 dark:text-slate-300 bg-transparent border-none focus:ring-2 focus:ring-brand-500 rounded p-1 placeholder:text-slate-300 uppercase"
                />
            </div>

            {/* The Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                <table className="w-full border-collapse">
                    <thead>
                        {/* Row 1: Durations */}
                        <tr className="bg-slate-50 dark:bg-slate-900/50">
                            <th className="border border-slate-300 dark:border-slate-600 p-2 text-xs font-bold uppercase text-slate-500 bg-slate-100 dark:bg-slate-900 min-w-[100px]">Duration</th>
                            {periods.map(p => (
                                <th key={`dur - ${p.id} `} className="border border-slate-300 dark:border-slate-600 p-2">
                                    <input
                                        type="text"
                                        value={p.duration}
                                        onChange={e => {
                                            const np = [...periods];
                                            const idx = np.findIndex(x => x.id === p.id);
                                            np[idx].duration = e.target.value;
                                            updateConfig(np);
                                        }}
                                        className="w-full text-center text-[10px] font-bold bg-transparent border-none focus:ring-0 uppercase placeholder:text-slate-300"
                                        placeholder="MINS"
                                    />
                                </th>
                            ))}
                        </tr>
                        {/* Row 2: Time Ranges & Period Labels */}
                        <tr className="bg-slate-50 dark:bg-slate-900/50">
                            <th className="border border-slate-300 dark:border-slate-600 p-2 text-md font-extrabold uppercase bg-slate-100 dark:bg-slate-900">Days</th>
                            {periods.map(p => (
                                <th key={`label - ${p.id} `} className="border border-slate-300 dark:border-slate-600 p-2 group relative">
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            value={p.label}
                                            onChange={e => {
                                                const np = [...periods];
                                                const idx = np.findIndex(x => x.id === p.id);
                                                np[idx].label = e.target.value;
                                                updateConfig(np);
                                            }}
                                            className="w-full text-center text-sm font-bold bg-transparent border-none focus:ring-0 uppercase"
                                            placeholder="Period"
                                        />
                                        <input
                                            type="text"
                                            value={p.timeRange}
                                            onChange={e => {
                                                const np = [...periods];
                                                const idx = np.findIndex(x => x.id === p.id);
                                                np[idx].timeRange = e.target.value;
                                                updateConfig(np);
                                            }}
                                            className="w-full text-center text-[10px] text-slate-500 font-medium bg-transparent border-none focus:ring-0"
                                            placeholder="Time"
                                        />
                                    </div>
                                    <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-1 print:hidden">
                                        <button
                                            onClick={() => {
                                                const np = [...periods];
                                                const idx = np.findIndex(x => x.id === p.id);
                                                np[idx].isVertical = !np[idx].isVertical;
                                                np[idx].isSubject = !np[idx].isVertical;
                                                updateConfig(np);
                                            }}
                                            className="p-1 bg-brand-500 text-white rounded text-[8px]"
                                            title="Toggle Vertical/Subject"
                                        >
                                            {p.isVertical ? 'H' : 'V'}
                                        </button>
                                        <button
                                            onClick={() => removePeriod(p.id)}
                                            className="p-1 bg-red-500 text-white rounded"
                                        >
                                            <Trash className="w-3 h-3" />
                                        </button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(day => (
                            <tr key={day}>
                                <td className="border border-slate-300 dark:border-slate-600 p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 uppercase text-sm">
                                    {day}
                                </td>
                                {periods.map(p => {
                                    if (p.isVertical) {
                                        // Vertical spans are special: they only show once (or consistently across rows)
                                        // For simplicity in this structure, we'll render them in every row but with styling
                                        // to make them look connected if needed, or just centered.
                                        return (
                                            <td key={`${day} -${p.id} `} className="border border-slate-300 dark:border-slate-600 p-0 overflow-hidden bg-slate-100/50 dark:bg-slate-900/50">
                                                <div className="flex items-center justify-center p-2 min-h-[80px]">
                                                    <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                        {p.label}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={`${day} -${p.id} `} className="border border-slate-300 dark:border-slate-600 p-0 text-center">
                                            <textarea
                                                rows={2}
                                                value={getSubject(day, p.id)}
                                                onChange={e => handleCellChange(day, p.id, e.target.value)}
                                                className="w-full h-full min-h-[80px] p-2 text-center text-xs font-bold uppercase resize-none bg-transparent border-none focus:ring-2 focus:ring-brand-500/20"
                                                placeholder="—"
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Grid controls */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-700 flex justify-center print:hidden">
                    <button
                        onClick={addPeriod}
                        className="flex items-center px-4 py-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Column / Period
                    </button>
                </div>
            </div>

            {/* Subject Summary Tally */}
            {subjectTally.length > 0 && (
                <div className="mt-12 max-w-md print:mt-8">
                    <h3 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 inline-block">Subject Tally</h3>
                    <div className="space-y-2">
                        {subjectTally.map(([subject, count]) => (
                            <div key={subject} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-700 uppercase">{subject}</span>
                                <span className="font-bold text-slate-900">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="mt-8 text-sm text-slate-400 text-center print:hidden italic">
                Tip: Hover over column headers to toggle between subject slots and vertical labels (like Breaks).
            </p>
        </div>
    );
};

export default Timetable;