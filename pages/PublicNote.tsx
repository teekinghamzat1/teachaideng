
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LessonNote, PresentationStep } from '../types';
import { db } from '../database';
import { Download, Volume, StopCircle, FileText, CheckCircle, Copy, Loader2 } from '../components/Icons';
import { stripFormatting as stripMarkdown } from '../utils/textUtils';
import { useBranding } from '../contexts/BrandingContext';

const PublicNote: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const branding = useBranding();
    const [lessonNote, setLessonNote] = useState<LessonNote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchNote = async () => {
            if (!id) return;
            try {
                const note = await db.notes.getPublicNote(id);
                setLessonNote(note);
            } catch (err: any) {
                console.error('Error fetching public note:', err);
                setError(err.message || 'Note not found or could not be loaded.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchNote();
    }, [id]);

    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleCopyContent = async () => {
        if (!lessonNote) return;
        try {
            await navigator.clipboard.writeText(stripMarkdown(lessonNote.lessonContent));
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleSpeak = () => {
        if (!lessonNote) return;
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            } else {
                const text = `
                Subject: ${lessonNote.subject}.
                Class: ${lessonNote.classLevel}.
                Topic: ${stripMarkdown(lessonNote.topic)}.
                Sub-topic: ${stripMarkdown(lessonNote.subtopic)}.
                Objectives: ${(lessonNote.objectives || []).map(o => stripMarkdown(o)).join('. ')}.
                Lesson Content: ${stripMarkdown(lessonNote.lessonContent)}
              `;
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
                setIsSpeaking(true);
            }
        }
    };

    const handleDownloadTxt = () => {
        if (!lessonNote) return;
        const element = document.createElement("a");
        const content = `SUBJECT: ${lessonNote.subject}
CLASS: ${lessonNote.classLevel}
TOPIC: ${stripMarkdown(lessonNote.topic)}
SUB-TOPIC: ${stripMarkdown(lessonNote.subtopic)}
DURATION: ${lessonNote.duration}

OBJECTIVES:
${(lessonNote.objectives || []).map(o => '- ' + stripMarkdown(o)).join('\n')}

LESSON CONTENT:
${stripMarkdown(lessonNote.lessonContent)}

EVALUATION:
${(lessonNote.evaluation || []).map(e => '- ' + stripMarkdown(e)).join('\n')}

ASSIGNMENT:
${stripMarkdown(lessonNote.assignment)}
`;
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${lessonNote.topic.replace(/\s+/g, '_')}_Lesson_Note.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-brand-600 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 animate-pulse">Loading shared lesson note...</p>
            </div>
        );
    }

    if (error || !lessonNote) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Note Not Found</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">{error || "This lesson note may have been deleted or the link is incorrect."}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                    >
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0 print:m-0 print:w-full">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 print:hidden">
                <Link to="/" className="text-brand-600 hover:text-brand-800 font-medium flex items-center transition-colors">
                    &larr; Back to Home
                </Link>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
                    <button
                        onClick={handleSpeak}
                        className={`p-2.5 rounded-lg border transition-all ${isSpeaking ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 border-red-200 dark:border-red-700' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border-slate-300 dark:border-slate-700'}`}
                        title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                    >
                        {isSpeaking ? <StopCircle className="w-5 h-5" /> : <Volume className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={handleDownloadTxt}
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <FileText className="w-4 h-4 mr-2" /> Download
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 bg-slate-900 dark:bg-slate-700 border border-transparent text-sm font-medium rounded-lg text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" /> Print / PDF
                    </button>
                </div>
            </div>

            {/* Lesson Note Paper */}
            <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 min-h-[29.7cm] border border-slate-200 dark:border-slate-700 print:shadow-none print:border-none print:p-8 print:w-full">
                {/* Header */}
                <div className="border-b-2 border-black dark:border-slate-100 pb-4 mb-6 text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-black dark:text-slate-100">Lesson Note</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 print:hidden">Shared via {branding.siteName}</p>
                </div>

                {/* Meta Data Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
                    <div className="flex border-b border-slate-300 dark:border-slate-700 pb-1">
                        <span className="font-bold w-24 text-slate-900 dark:text-slate-100">Subject:</span>
                        <span className="text-slate-800 dark:text-slate-300">{lessonNote.subject}</span>
                    </div>
                    <div className="flex border-b border-slate-300 dark:border-slate-700 pb-1">
                        <span className="font-bold w-24 text-slate-900 dark:text-slate-100">Class:</span>
                        <span className="text-slate-800 dark:text-slate-300">{lessonNote.classLevel}</span>
                    </div>
                    <div className="flex border-b border-slate-300 dark:border-slate-700 pb-1">
                        <span className="font-bold w-24 text-slate-900 dark:text-slate-100">Topic:</span>
                        <span className="text-slate-800 dark:text-slate-300">{stripMarkdown(lessonNote.topic)}</span>
                    </div>
                    <div className="flex border-b border-slate-300 dark:border-slate-700 pb-1">
                        <span className="font-bold w-24 text-slate-900 dark:text-slate-100">Sub-Topic:</span>
                        <span className="text-slate-800 dark:text-slate-300">{stripMarkdown(lessonNote.subtopic)}</span>
                    </div>
                    <div className="flex border-b border-slate-300 dark:border-slate-700 pb-1">
                        <span className="font-bold w-24 text-slate-900 dark:text-slate-100">Duration:</span>
                        <span className="text-slate-800 dark:text-slate-300">{lessonNote.duration}</span>
                    </div>
                    <div className="flex border-b border-slate-300 dark:border-slate-700 pb-1">
                        <span className="font-bold w-32 text-slate-900 dark:text-slate-100">Date:</span>
                        <span className="text-slate-800 dark:text-slate-300">
                            {lessonNote.date && !isNaN(new Date(lessonNote.date).getTime())
                                ? new Date(lessonNote.date).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">
                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Behavioural Objectives</h3>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-slate-800 dark:text-slate-300">
                            {(lessonNote.objectives || []).map((obj, i) => (
                                <li key={i}>{stripMarkdown(obj)}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Reference Materials</h3>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-slate-800 dark:text-slate-300">
                            {lessonNote.references && lessonNote.references.length > 0 ? (
                                lessonNote.references.map((ref, i) => <li key={i}>{ref}</li>)
                            ) : (
                                <li className="text-slate-400 dark:text-slate-500 italic">No specific references provided.</li>
                            )}
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Instructional Materials</h3>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-slate-800 dark:text-slate-300">
                            {(lessonNote.instructionalMaterials || []).map((mat, i) => (
                                <li key={i}>{mat}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Previous Knowledge</h3>
                        <p className="text-slate-800 dark:text-slate-300 ml-2 whitespace-pre-wrap break-words">{lessonNote.previousKnowledge}</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Introduction</h3>
                        <p className="text-slate-800 dark:text-slate-300 ml-2 whitespace-pre-wrap break-words">{stripMarkdown(lessonNote.introduction)}</p>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase">Lesson Content</h3>
                            <button
                                onClick={handleCopyContent}
                                className="flex items-center text-xs font-medium text-brand-600 hover:text-brand-800 focus:outline-none print:hidden mr-2"
                            >
                                {isCopied ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-1 text-green-600" /> <span className="text-green-600">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-1" /> Copy Content
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="text-slate-800 dark:text-slate-100 leading-loose p-4 bg-slate-50/50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 break-words lesson-content-html">
                            <div dangerouslySetInnerHTML={{ __html: lessonNote.lessonContent.replace(/\n/g, '<br/>') }} />
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-4 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Presentation</h3>
                        <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg">
                            <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                                <thead className="bg-slate-100 dark:bg-slate-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-slate-900 dark:text-slate-100 sm:pl-6 w-20">Step</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-slate-900 dark:text-slate-100">Teacher's Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                    {(lessonNote.presentation || []).map((step: PresentationStep, idx) => (
                                        <tr key={idx}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 dark:text-slate-100 sm:pl-6 align-top">{step.step}</td>
                                            <td className="whitespace-normal px-3 py-4 text-sm text-slate-700 dark:text-slate-300 align-top">{stripMarkdown(step.teacherActivity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Evaluation</h3>
                        <ul className="list-decimal list-inside space-y-1 ml-2 text-slate-800 dark:text-slate-300">
                            {(lessonNote.evaluation || []).map((qs, i) => (
                                <li key={i}>{stripMarkdown(qs)}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Conclusion</h3>
                        <p className="text-slate-800 dark:text-slate-300 ml-2 whitespace-pre-wrap break-words">{stripMarkdown(lessonNote.conclusion)}</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black dark:border-slate-100 pl-3 bg-slate-50 dark:bg-slate-800 py-1">Assignment</h3>
                        <p className="text-slate-800 dark:text-slate-300 ml-2 whitespace-pre-wrap break-words">{stripMarkdown(lessonNote.assignment)}</p>
                    </section>
                </div>

                {/* Visual Branding for Shared View */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center print:hidden">
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Powerful lesson planning made simple.</p>
                    <Link
                        to="/register"
                        className="text-brand-600 font-bold hover:text-brand-700 flex items-center justify-center gap-2"
                    >
                        Create your own with {branding.siteName} &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PublicNote;
