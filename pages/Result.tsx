
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate, Link, useNavigate } from 'react-router-dom';
import { LessonNote } from '../types';
import { Download, BookOpen, Copy, CheckCircle, Save, Loader2, Volume, Share, StopCircle, FileText, Mail, MessageCircle, X, Sparkles, User as UserIcon, Plus } from '../components/Icons';
import { db } from '../database';
import { generateRemark } from '../services/geminiService';
import { showAlert } from '../utils/alerts';
import { useBranding } from '../contexts/BrandingContext';
import { stripFormatting as stripMarkdown, parseMarkdown } from '../utils/textUtils';

const Result: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const branding = useBranding();
    const state = location.state as { lessonNote: LessonNote } | null;
    const [lessonNote, setLessonNote] = useState<LessonNote | null>(state?.lessonNote || null);

    const [isSaving, setIsSaving] = useState(false);
    const [isEmailing, setIsEmailing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    // AI Remark Generator State
    const [showRemarkGenerator, setShowRemarkGenerator] = useState(false);
    const [remarkInputs, setRemarkInputs] = useState({
        lessonOutcome: 'The lesson was highly successful and the students achieved the learning objectives.',
        students: [] as { name: string; observation: string }[],
        style: 'Professional'
    });
    const [newStudent, setNewStudent] = useState({ name: '', observation: '' });
    const [generatedRemark, setGeneratedRemark] = useState('');
    const [isGeneratingRemark, setIsGeneratingRemark] = useState(false);

    useEffect(() => {
        // Cleanup speech when component unmounts
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const [isCopied, setIsCopied] = useState(false);
    const [isSaved, setIsSaved] = useState(!!lessonNote?.id);

    useEffect(() => {
        // Close share menu when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setShowShareMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    if (!lessonNote) {
        return <Navigate to="/generator" replace />;
    }

    const handlePrint = () => {
        // Check if user is on free plan
        const user = db.auth.getCurrentUser();

        // Allow School plan users (invited teachers or owners) to export if they have an active plan
        // Logic: Free users cannot export. Paid/School users can.
        if (!user || user.subscriptionPlan === 'Free') {
            showAlert.confirm("Pro Feature", "Exporting documents is a Pro feature. Upgrade to Pro or School plan to export your notes.", "Go to Pricing")
                .then(confirmed => {
                    if (confirmed) navigate('/pricing');
                });
            return;
        }

        window.print();
        setShowShareMenu(false);
    };

    const handleCopyContent = async () => {
        try {
            await navigator.clipboard.writeText(stripMarkdown(lessonNote.lessonContent));
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleSave = async () => {
        try {
            // Check auth
            const user = db.auth.getCurrentUser();
            if (!user) {
                const confirmed = await showAlert.confirm("Login Required", "You need to be logged in to save notes. Go to login page?");
                if (confirmed) navigate('/login');
                return;
            }

            setIsSaving(true);
            const response = await db.notes.save(lessonNote);
            if (response.success && response.data) {
                setLessonNote(response.data);
                setIsSaved(true);

                if (response.message === 'Already saved') {
                    showAlert.info("Already Saved", "This lesson note is already in your history.");
                } else {
                    showAlert.success("Saved Successfully", "Note has been saved to your history.");
                }

                // Update navigation state so refresh works
                navigate(location.pathname, {
                    state: { lessonNote: response.data },
                    replace: true
                });
            }
        } catch (error) {
            console.error("Failed to save note:", error);
            showAlert.error("Save Failed", "Failed to save note. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSpeak = () => {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            } else {
                // Construct a readable flow of the lesson note for accessibility
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
        } else {
            showAlert.error("Not Supported", "Text-to-Speech is not supported in this browser.");
        }
    };

    const handleGenerateRemark = async () => {
        try {
            setIsGeneratingRemark(true);
            const result = await generateRemark({
                classLevel: lessonNote.classLevel,
                subject: lessonNote.subject,
                topic: lessonNote.topic,
                lessonOutcome: remarkInputs.lessonOutcome,
                students: remarkInputs.students,
                style: remarkInputs.style
            });

            setGeneratedRemark(result.remark);
        } catch (error: any) {
            console.error("Remark generation failed:", error);
            showAlert.error("Generation Failed", error.message || "Failed to generate remark.");
        } finally {
            setIsGeneratingRemark(false);
        }
    };

    const addStudentObservation = () => {
        if (!newStudent.name.trim()) return;
        setRemarkInputs({
            ...remarkInputs,
            students: [...remarkInputs.students, { ...newStudent }]
        });
        setNewStudent({ name: '', observation: '' });
    };

    const removeStudentObservation = (index: number) => {
        const updated = [...remarkInputs.students];
        updated.splice(index, 1);
        setRemarkInputs({ ...remarkInputs, students: updated });
    };
    const handleShareNative = async () => {
        setShowShareMenu(false);

        if (!lessonNote.id) {
            const confirmed = await showAlert.confirm("Save Required", "Notes must be saved to your account before they can be shared as a link. Save now?");
            if (confirmed) {
                // We need to wait for save to complete and update lessonNote
                try {
                    setIsSaving(true);
                    const response = await db.notes.save(lessonNote);
                    if (response.success && response.data) {
                        setLessonNote(response.data);
                        setIsSaved(true);

                        // Update navigation state
                        navigate(location.pathname, {
                            state: { lessonNote: response.data },
                            replace: true
                        });

                        // Continue sharing with the new ID
                        const shareUrl = `${window.location.origin}/share/${response.data.id}`;
                        if (navigator.share) {
                            await navigator.share({
                                title: `Lesson Note: ${stripMarkdown(response.data.topic)}`,
                                text: `Check out this lesson note for ${response.data.subject}.`,
                                url: shareUrl
                            });
                        } else {
                            await navigator.clipboard.writeText(shareUrl);
                            showAlert.success("Link Copied", "Sharing link has been copied to your clipboard.");
                        }
                    }
                } catch (error) {
                    console.error("Failed to save before sharing:", error);
                    showAlert.error("Save Failed", "Could not save note to generate share link.");
                } finally {
                    setIsSaving(false);
                }
            }
            return;
        }

        const shareUrl = `${window.location.origin}/share/${lessonNote.id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Lesson Note: ${stripMarkdown(lessonNote.topic)}`,
                    text: `Check out this lesson note for ${lessonNote.subject}.`,
                    url: shareUrl
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback
            try {
                await navigator.clipboard.writeText(shareUrl);
                showAlert.success("Link Copied", "Sharing link has been copied to your clipboard.");
            } catch (err) {
                console.error("Failed to copy share link:", err);
            }
        }
    };

    const handleCopyShareLink = async () => {
        setShowShareMenu(false);

        if (!lessonNote.id) {
            const confirmed = await showAlert.confirm("Save Required", "Notes must be saved to your account before they can be shared. Save now?");
            if (confirmed) {
                try {
                    setIsSaving(true);
                    const response = await db.notes.save(lessonNote);
                    if (response.success && response.data) {
                        setLessonNote(response.data);
                        setIsSaved(true);

                        // Update navigation state
                        navigate(location.pathname, {
                            state: { lessonNote: response.data },
                            replace: true
                        });

                        const shareUrl = `${window.location.origin}/share/${response.data.id}`;
                        await navigator.clipboard.writeText(shareUrl);
                        showAlert.success("Link Copied", "Sharing link has been copied to your clipboard.");
                    }
                } catch (error) {
                    console.error("Failed to save before copying link:", error);
                    showAlert.error("Save Failed", "Could not save note to generate share link.");
                } finally {
                    setIsSaving(false);
                }
            }
            return;
        }

        const shareUrl = `${window.location.origin}/share/${lessonNote.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            showAlert.success("Link Copied", "Sharing link has been copied to your clipboard.");
        } catch (err) {
            console.error("Failed to copy share link:", err);
            showAlert.error("Copy Failed", "Failed to copy link to clipboard.");
        }
    };

    const handleEmailMe = async () => {
        const user = db.auth.getCurrentUser();
        if (!user) {
            const confirmed = await showAlert.confirm("Login Required", "You need to be logged in to email notes. Go to login page?");
            if (confirmed) navigate('/login');
            return;
        }

        if (!lessonNote.id) {
            // Note needs to be saved first to have an ID
            const confirmed = await showAlert.confirm("Save Required", "Notes must be saved to your account before they can be emailed. Save now?");
            if (confirmed) {
                await handleSave();
            } else {
                return;
            }
        }

        // Check again after potential save
        if (!lessonNote.id) {
            return;
        }

        try {
            setIsEmailing(true);
            await db.notes.email(lessonNote.id);
            showAlert.success("Email Sent", "Lesson note has been sent to your email!");
            setShowShareMenu(false);
        } catch (error: any) {
            console.error("Failed to email note:", error);
            showAlert.error("Email Failed", error.message || "Failed to email note. Please try again.");
        } finally {
            setIsEmailing(false);
        }
    };

    const handleDownloadTxt = () => {
        // Check if user is on free plan
        const user = db.auth.getCurrentUser();
        if (!user || user.subscriptionPlan === 'Free') {
            showAlert.confirm("Pro Feature", "Exporting documents is a Pro feature. Upgrade to Pro or School plan to export your notes.", "Go to Pricing")
                .then(confirmed => {
                    if (confirmed) navigate('/pricing');
                });
            return;
        }

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
        setShowShareMenu(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0 print:m-0 print:w-full">

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 print:hidden">
                <Link to="/generator" className="text-brand-600 hover:text-brand-800 font-medium flex items-center transition-colors">
                    &larr; Generate Another
                </Link>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">

                    {/* TTS Button */}
                    <button
                        onClick={handleSpeak}
                        className={`p-2.5 rounded-lg border transition-all ${isSpeaking ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-800' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                    >
                        {isSpeaking ? <StopCircle className="w-5 h-5" /> : <Volume className="w-5 h-5" />}
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaved || isSaving}
                        className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors ${isSaved
                            ? 'border-brand-200 text-brand-700 bg-brand-50 cursor-default'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        {isSaving ? (
                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        ) : isSaved ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" /> Saved
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> Save Note
                            </>
                        )}
                    </button>

                    {/* Merged Share & Export Dropdown */}
                    <div className="relative inline-block text-left" ref={shareMenuRef}>
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                        >
                            <Share className="w-4 h-4 mr-2" />
                            Share / Export
                        </button>

                        {showShareMenu && (
                            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 divide-y divide-slate-100 dark:divide-slate-700 animate-in fade-in zoom-in-95 duration-100">
                                <div className="py-1">
                                    <button
                                        onClick={handleShareNative}
                                        className="group flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
                                    >
                                        <Share className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-500" />
                                        Share via...
                                    </button>
                                    <button
                                        onClick={handleCopyShareLink}
                                        className="group flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
                                    >
                                        <Copy className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-500" />
                                        Copy Sharing Link
                                    </button>
                                    <button
                                        onClick={handleEmailMe}
                                        disabled={isEmailing}
                                        className="group flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
                                    >
                                        {isEmailing ? <Loader2 className="w-4 h-4 mr-3 animate-spin text-brand-500" /> : <Mail className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-500" />}
                                        {isEmailing ? 'Sending...' : 'Email to me'}
                                    </button>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={handleDownloadTxt}
                                        className="group flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
                                    >
                                        <FileText className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-500" />
                                        Download Text File
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="group flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-3 text-slate-400 group-hover:text-brand-500" />
                                        Print / Save PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lesson Note Paper */}
            <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 min-h-[29.7cm] border border-slate-200 dark:border-slate-700 print:shadow-none print:border-none print:p-8 print:w-full print:min-h-0 print:rounded-none">

                {/* Header */}
                <div className="border-b-2 border-black dark:border-slate-100 pb-4 mb-6 text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-black dark:text-slate-100">Lesson Note</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 print:hidden">Generated by {branding.siteName}</p>
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
                                title="Copy content"
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
                            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(lessonNote.lessonContent) }} />
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
                                    {(lessonNote.presentation || []).map((step, idx) => (
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

                {/* AI Student Remark Generator Section */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 print:hidden">
                    <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-6 border border-brand-100 dark:border-brand-900/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-brand-900 dark:text-brand-100 flex items-center">
                                    <Sparkles className="w-5 h-5 mr-2 text-brand-600" />
                                    AI Student Remark Generator
                                </h3>
                                <p className="text-brand-700 dark:text-brand-300 text-sm mt-1">
                                    Generate personalized remarks for your students based on this lesson's topic.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRemarkGenerator(!showRemarkGenerator)}
                                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-all shadow-md flex items-center justify-center"
                            >
                                {showRemarkGenerator ? "Hide Generator" : "Try Generator"}
                            </button>
                        </div>

                        {showRemarkGenerator && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">How did the lesson go overall? (Required)</label>
                                        <textarea
                                            value={remarkInputs.lessonOutcome}
                                            onChange={(e) => setRemarkInputs({ ...remarkInputs, lessonOutcome: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all h-20"
                                            placeholder="e.g. Most students understood the core concept, but a few needed help with the activity."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tone Style</label>
                                            <select
                                                value={remarkInputs.style}
                                                onChange={(e) => setRemarkInputs({ ...remarkInputs, style: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                            >
                                                <option value="Professional">Professional</option>
                                                <option value="Encouraging">Encouraging</option>
                                                <option value="Concise">Concise</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center">
                                            <UserIcon className="w-4 h-4 mr-1.5" />
                                            Student-Specific Observations (Optional)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                            <input
                                                type="text"
                                                value={newStudent.name}
                                                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                                placeholder="Student Name"
                                                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={newStudent.observation}
                                                onChange={(e) => setNewStudent({ ...newStudent, observation: e.target.value })}
                                                placeholder="Observation (e.g. Mastered the topic)"
                                                className="md:col-span-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={addStudentObservation}
                                            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Add Student Observation
                                        </button>

                                        {remarkInputs.students.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {remarkInputs.students.map((s, i) => (
                                                    <div key={i} className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 animate-in zoom-in-90">
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            <strong className="text-brand-600">{s.name}</strong>: {s.observation}
                                                        </span>
                                                        <button onClick={() => removeStudentObservation(i)} className="ml-2 text-slate-400 hover:text-red-500">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <button
                                        onClick={handleGenerateRemark}
                                        disabled={isGeneratingRemark}
                                        className="px-8 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all shadow-lg flex items-center"
                                    >
                                        {isGeneratingRemark ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Analyzing Performance...
                                            </>
                                        ) : (
                                            <>
                                                <MessageCircle className="w-5 h-5 mr-2" />
                                                Generate Remark
                                            </>
                                        )}
                                    </button>
                                </div>

                                {generatedRemark && (
                                    <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-brand-200 dark:border-brand-800 relative group animate-in zoom-in-95 duration-500">
                                        <div className="absolute -top-3 left-6 px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">
                                            LESSON REMARK / EVALUATION
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-full">
                                                <FileText className="w-6 h-6 text-brand-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-800 dark:text-slate-100 text-lg leading-relaxed">
                                                    {generatedRemark}
                                                </p>

                                                <div className="mt-6 flex flex-wrap gap-3">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(generatedRemark);
                                                            showAlert.success("Copied", "Remark copied to clipboard.");
                                                        }}
                                                        className="flex items-center text-sm font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-lg transition-colors"
                                                    >
                                                        <Copy className="w-4 h-4 mr-2" />
                                                        Copy to Clipboard
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setRemarkInputs({ ...remarkInputs, students: [], lessonOutcome: '' });
                                                            setGeneratedRemark('');
                                                        }}
                                                        className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-700 px-4 py-2 transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};

export default Result;
