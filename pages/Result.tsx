
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate, Link, useNavigate } from 'react-router-dom';
import { LessonNote } from '../types';
import { Download, BookOpen, Copy, CheckCircle, Save, Loader2, Volume, Share, StopCircle, FileText } from '../components/Icons';
import { db } from '../database';

const Result: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { lessonNote: LessonNote } | null;
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cleanup speech when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  if (!state || !state.lessonNote) {
    return <Navigate to="/generator" replace />;
  }

  const { lessonNote } = state;

  const handlePrint = () => {
    window.print();
    setShowShareMenu(false);
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(lessonNote.lessonContent);
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
        if(window.confirm("You need to be logged in to save notes. Go to login page?")) {
            navigate('/login');
        }
        return;
      }

      setIsSaving(true);
      await db.notes.save(lessonNote);
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("Failed to save note. Please try again.");
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
                Topic: ${lessonNote.topic}.
                Sub-topic: ${lessonNote.subtopic}.
                Objectives: ${lessonNote.objectives.join('. ')}.
                Lesson Content: ${lessonNote.lessonContent}
              `;
              
              const utterance = new SpeechSynthesisUtterance(text);
              
              utterance.onend = () => setIsSpeaking(false);
              utterance.onerror = () => setIsSpeaking(false);
              
              window.speechSynthesis.speak(utterance);
              setIsSpeaking(true);
          }
      } else {
          alert("Text-to-Speech is not supported in this browser.");
      }
  };

  const handleShareNative = async () => {
      setShowShareMenu(false);
      if (navigator.share) {
          try {
              await navigator.share({
                  title: `Lesson Note: ${lessonNote.topic}`,
                  text: `Check out this lesson note for ${lessonNote.subject}.\n\n${lessonNote.lessonContent.substring(0, 100)}...`,
                  url: window.location.href
              });
          } catch (err) {
              console.log('Error sharing:', err);
          }
      } else {
          // Fallback
          handleCopyContent();
          alert("Link copied to clipboard");
      }
  };

  const handleDownloadTxt = () => {
      const element = document.createElement("a");
      const content = `SUBJECT: ${lessonNote.subject}
CLASS: ${lessonNote.classLevel}
TOPIC: ${lessonNote.topic}
SUB-TOPIC: ${lessonNote.subtopic}
DURATION: ${lessonNote.duration}

OBJECTIVES:
${lessonNote.objectives.map(o => '- ' + o).join('\n')}

LESSON CONTENT:
${lessonNote.lessonContent}

EVALUATION:
${lessonNote.evaluation.map(e => '- ' + e).join('\n')}

ASSIGNMENT:
${lessonNote.assignment}
`;
      const file = new Blob([content], {type: 'text/plain'});
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
                            className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors ${
                                isSaved 
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
              {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Note'}
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
                                Share Link
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
        <div className="border-b-2 border-black pb-4 mb-6 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-black dark:text-slate-100">Lesson Note</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 print:hidden">Generated by TeachAide AI</p>
        </div>

        {/* Meta Data Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
            <div className="flex border-b border-slate-300 pb-1">
                <span className="font-bold w-24 text-slate-900 dark:text-slate-100">Subject:</span>
                <span className="text-slate-800 dark:text-slate-100">{lessonNote.subject}</span>
            </div>
             <div className="flex border-b border-slate-300 pb-1">
                <span className="font-bold w-24 text-slate-900 dark:text-slate-100">Class:</span>
                <span className="text-slate-800 dark:text-slate-100">{lessonNote.classLevel}</span>
            </div>
             <div className="flex border-b border-slate-300 pb-1">
                <span className="font-bold w-24 text-slate-900">Topic:</span>
                <span className="text-slate-800">{lessonNote.topic}</span>
            </div>
            <div className="flex border-b border-slate-300 pb-1">
                <span className="font-bold w-24 text-slate-900">Sub-Topic:</span>
                <span className="text-slate-800">{lessonNote.subtopic}</span>
            </div>
             <div className="flex border-b border-slate-300 pb-1">
                <span className="font-bold w-24 text-slate-900">Duration:</span>
                <span className="text-slate-800">{lessonNote.duration}</span>
            </div>
            <div className="flex border-b border-slate-300 pb-1">
                <span className="font-bold w-32 text-slate-900">Date:</span>
                <span className="text-slate-800">{lessonNote.date || new Date().toLocaleDateString()}</span>
            </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
            
            <section>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase mb-2 border-l-4 border-black pl-3 bg-slate-50 dark:bg-slate-800 py-1">Behavioural Objectives</h3>
                <p className="mb-2 text-slate-700 dark:text-slate-300">By the end of the lesson, pupils should be able to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-800">
                    {lessonNote.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                    ))}
                </ul>
            </section>

             <section>
                <h3 className="font-bold text-lg text-slate-900 uppercase mb-2 border-l-4 border-black pl-3 bg-slate-50 py-1">Reference Materials</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-800">
                    {lessonNote.references && lessonNote.references.length > 0 ? (
                        lessonNote.references.map((ref, i) => <li key={i}>{ref}</li>)
                    ) : (
                        <li className="text-slate-400 italic">No specific references provided.</li>
                    )}
                </ul>
            </section>

            <section>
                <h3 className="font-bold text-lg text-slate-900 uppercase mb-2 border-l-4 border-black pl-3 bg-slate-50 py-1">Instructional Materials</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-800">
                    {lessonNote.instructionalMaterials.map((mat, i) => (
                        <li key={i}>{mat}</li>
                    ))}
                </ul>
            </section>

             <section>
                <h3 className="font-bold text-lg text-slate-900 uppercase mb-2 border-l-4 border-black pl-3 bg-slate-50 py-1">Previous Knowledge</h3>
                <p className="text-slate-800 ml-2 whitespace-pre-wrap break-words">{lessonNote.previousKnowledge}</p>
            </section>

            <section>
                <h3 className="font-bold text-lg text-slate-900 uppercase mb-2 border-l-4 border-black pl-3 bg-slate-50 py-1">Introduction</h3>
                <p className="text-slate-800 ml-2 whitespace-pre-wrap break-words">{lessonNote.introduction}</p>
            </section>

            <section>
                <div className="flex justify-between items-center mb-2 border-l-4 border-black pl-3 bg-slate-50 py-1">
                    <h3 className="font-bold text-lg text-slate-900 uppercase">Lesson Content</h3>
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
                <div className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-loose p-4 bg-slate-50/50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 break-words">
                    {lessonNote.lessonContent}
                </div>
            </section>

            <section>
                <h3 className="font-bold text-lg text-slate-900 uppercase mb-4 border-l-4 border-black pl-3 bg-slate-50 py-1">Presentation</h3>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-slate-900 sm:pl-6 w-20">Step</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-slate-900">Teacher's Activity</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-slate-900">Pupil's Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white dark:bg-slate-900">
                            {lessonNote.presentation.map((step, idx) => (
                                <tr key={idx}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 dark:text-slate-100 sm:pl-6 align-top">{step.step}</td>
                                    <td className="whitespace-normal px-3 py-4 text-sm text-slate-700 dark:text-slate-300 align-top">{step.teacherActivity}</td>
                                    <td className="whitespace-normal px-3 py-4 text-sm text-slate-700 dark:text-slate-300 align-top">{step.pupilActivity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h3 className="font-bold text-lg text-slate-900 uppercase mb-2 border-l-4 border-black pl-3 bg-slate-50 py-1">Evaluation</h3>
                <ul className="list-decimal list-inside space-y-1 ml-2 text-slate-800">
                    {lessonNote.evaluation.map((qs, i) => (
                        <li key={i}>{qs}</li>
                    ))}
                </ul>
            </section>

            <section>
                <h3 className="font-bold text-lg text-slate-900 uppercase mb-2 border-l-4 border-black pl-3 bg-slate-50 py-1">Conclusion</h3>
                <p className="text-slate-800 ml-2 whitespace-pre-wrap break-words">{lessonNote.conclusion}</p>
            </section>

            <section>
                <h3 className="font-bold text-lg text-slate-900 uppercase mb-2 border-l-4 border-black pl-3 bg-slate-50 py-1">Assignment</h3>
                <p className="text-slate-800 ml-2 whitespace-pre-wrap break-words">{lessonNote.assignment}</p>
            </section>
        </div>
      </div>
    </div>
  );
};

export default Result;
