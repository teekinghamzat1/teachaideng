import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { AlertTriangle, CheckCircle, Clock, Filter, Eye, Search, User } from '../components/Icons';
import { showAlert } from '../utils/alerts';

const AdminErrors: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ severity: '', source: '', isResolved: 'false' });
    const [selectedError, setSelectedError] = useState<any>(null);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (filter.severity) filters.severity = filter.severity;
            if (filter.source) filters.source = filter.source;
            if (filter.isResolved !== 'all') filters.isResolved = filter.isResolved === 'true';

            const data = await db.admin.getErrorLogs(filters);
            setLogs(data.logs || []);
        } catch (error) {
            console.error("Failed to load error logs", error);
            showAlert.error("Error", "Failed to load error logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [filter]);

    const handleResolve = async (id: string, currentStatus: boolean) => {
        try {
            await db.admin.resolveError(id, !currentStatus);
            showAlert.success("Updated", `Error marked as ${!currentStatus ? 'resolved' : 'unresolved'}.`);
            loadLogs();
            if (selectedError?.id === id) setSelectedError({ ...selectedError, isResolved: !currentStatus });
        } catch (error) {
            showAlert.error("Failed", "Failed to update error status.");
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Error Logs</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor and debug issues faced by your users</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <select
                            value={filter.isResolved}
                            onChange={(e) => setFilter({ ...filter, isResolved: e.target.value })}
                            className="pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 appearance-none"
                        >
                            <option value="false">Unresolved Only</option>
                            <option value="true">Resolved Only</option>
                            <option value="all">All Status</option>
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            value={filter.severity}
                            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                            className="pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 appearance-none"
                        >
                            <option value="">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <button
                        onClick={loadLogs}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Refresh Logs"
                    >
                        <Search className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logs List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mx-auto mb-4"></div>
                            <p className="text-slate-500">Fetching logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Errors Found</h3>
                            <p className="text-slate-500 mt-1">Everything seems to be running smoothly!</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-sm">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Severity</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Error Message</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">User / Source</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            onClick={() => setSelectedError(log)}
                                            className={`cursor-pointer transition-colors ${selectedError?.id === log.id ? 'bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getSeverityColor(log.severity)}`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs truncate font-medium text-slate-900 dark:text-slate-100" title={log.message}>
                                                    {log.message}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">{log.path}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="text-slate-900 dark:text-slate-100">{log.user?.name || 'Guest'}</div>
                                                    <span className="mx-2 text-slate-300">•</span>
                                                    <div className="text-xs text-slate-500 uppercase">{log.source}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 flex items-center">
                                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-brand-600 hover:text-brand-800">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail View */}
                <div className="lg:col-span-1">
                    {selectedError ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 sticky top-24">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Error Details</h2>
                                <button
                                    onClick={() => setSelectedError(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                                    <button
                                        onClick={() => handleResolve(selectedError.id, selectedError.isResolved)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedError.isResolved
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md transform hover:-translate-y-0.5'}`}
                                    >
                                        {selectedError.isResolved ? (
                                            <><CheckCircle className="w-4 h-4" /> Resolved</>
                                        ) : (
                                            <>Mark as Resolved</>
                                        )}
                                    </button>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Severity & Source</label>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityColor(selectedError.severity)}`}>
                                            {selectedError.severity}
                                        </span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded uppercase">
                                            {selectedError.source}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Message</label>
                                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                        {selectedError.message}
                                    </p>
                                </div>

                                {selectedError.path && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Path / Location</label>
                                        <code className="text-xs bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded block truncate">{selectedError.path}</code>
                                    </div>
                                )}

                                {selectedError.user && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">User Context</label>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{selectedError.user.name}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{selectedError.user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedError.metadata && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Metadata</label>
                                        <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {selectedError.metadata}
                                        </div>
                                    </div>
                                )}

                                {selectedError.stack && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Stack Trace</label>
                                        <div className="bg-slate-900 text-red-300 p-3 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900">
                                            {selectedError.stack}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center">
                            <Eye className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-slate-600 dark:text-slate-400 font-bold">Inspect details</h3>
                            <p className="text-slate-400 text-sm mt-1">Select an error from the list to view its full context and stack trace.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Internal icon proxy if needed
const X: React.FC<any> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default AdminErrors;
