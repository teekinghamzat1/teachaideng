import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Trash, FileText, Loader2, Edit } from '../components/Icons';
import { LessonNote } from '../types';
import { db } from '../database';
import { showAlert } from '../utils/alerts';

const Dashboard: React.FC = () => {
  const [savedNotes, setSavedNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null); // State to hold user info
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [stats, setStats] = useState<any | null>(null); // State to hold admin stats

  useEffect(() => {
    const currentUser = db.auth.getCurrentUser();
    setUser(currentUser); // Set user state

    // Check if user is logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadNotes = async () => {
      try {
        const notes = await db.notes.getUserNotes();
        setSavedNotes(notes);
      } catch (error) {
        console.error("Failed to load notes", error);
      } finally {
        setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        // Only fetch stats if user is a System Admin
        if (currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin') {
          const statsData = await db.admin.getStats();
          setStats(statsData);
        }
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    };

    const checkUsage = async () => {
      try {
        if (currentUser) {
          const usageData = await db.auth.getUsage(currentUser.schoolId);
          setUsage(usageData);
        }
      } catch (e) {
        console.error('Failed to load usage stats', e);
      }
    };

    loadNotes();
    loadStats();
    checkUsage();
  }, [navigate]); // Depend on navigate, as it's used for redirection

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (await showAlert.confirm('Delete Note', 'Are you sure you want to delete this lesson note?')) {
      try {
        await db.notes.delete(id);
        const updatedNotes = savedNotes.filter(note => note.id !== id);
        setSavedNotes(updatedNotes);
        showAlert.success('Deleted', 'Lesson note removed successfully.');
      } catch (err) {
        console.error("Failed to delete note", err);
        showAlert.error('Delete Failed', 'Failed to delete note.');
      }
    }
  };

  const handleEdit = (note: LessonNote, e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/generator', { state: { editData: note } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100 sm:text-3xl sm:truncate">
            My Dashboard
          </h2>
          <p className="mt-1 text-slate-500 dark:text-slate-300">Manage your saved lesson notes.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/generator"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create New Note
          </Link>
        </div>
      </div>

      {/* Subscription Plan Card */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Current Subscription</h3>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold">
              {user?.subscriptionPlan || 'Free'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-75 mb-1 dark:text-slate-300">Plan Price</p>
              <p className="text-3xl font-bold">
                {user?.subscriptionPlan === 'Pro' ? '₦2,500' : user?.subscriptionPlan === 'School' ? '₦20,000' : '₦0'}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {user?.subscriptionPlan === 'Free' ? 'per week' : user?.subscriptionPlan === 'School' ? 'per term' : 'per month'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-75 mb-1 dark:text-slate-300">Status</p>
              <div className="flex items-center mt-2">
                {user?.subscriptionPlan !== 'Free' ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Active</span>
                  </>
                ) : (
                  <span className="opacity-75">No active subscription</span>
                )}
              </div>
            </div>
            <div className="flex items-end">
              {/**
               * Subscription button logic:
               * - Free users: show Upgrade link
               * - School License:
               *    - only show Manage Subscription when user is school admin
               *    - otherwise show a managed-by-admin message
               * - Other paid plans (e.g., Pro): show Manage Subscription if user is not part of a school
               */}
              {user?.subscriptionPlan === 'Free' ? (
                <Link
                  to="/pricing"
                  className="w-full bg-white dark:bg-slate-800 dark:text-brand-400 text-brand-600 px-6 py-3 rounded-lg text-sm font-bold hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors text-center"
                >
                  Upgrade Plan →
                </Link>
              ) : user?.subscriptionPlan === 'School' ? (
                /* Only show Manage Subscription if user is the school owner OR a promoted teacher admin */
                (user?.isSchoolAdmin) ? (
                  <Link
                    to="/pricing"
                    className="w-full bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors text-center border border-white/20"
                  >
                    Manage Subscription
                  </Link>
                ) : (
                  <div className="w-full bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                    <p className="text-sm text-center text-white">
                      📚 School License managed by administrator
                    </p>
                  </div>
                )
              ) : (
                /* Non-school paid plans (Pro, etc.) */
                <Link
                  to="/pricing"
                  className="w-full bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors text-center border border-white/20"
                >
                  Manage Subscription
                </Link>
              )}
              {/* Usage Display for All Plans */}
              {usage && (
                <div className="mt-4 w-full bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                  <div className="flex justify-between items-center text-white mb-2">
                    <span className="text-sm font-medium">Monthly Usage</span>
                    <span className="text-sm font-bold">
                      {usage.used} / {usage.limit}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${usage.remaining === 0 ? 'bg-red-400' : 'bg-green-400'}`}
                      style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-white/80 mt-2 text-center">
                    {usage.remaining} generations remaining this month
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-md border border-slate-200 dark:border-slate-700 min-h-[300px]">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">Saved Lesson Notes</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
            {savedNotes.length} Saved
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-300">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-brand-500" />
            <p>Loading your notes...</p>
          </div>
        ) : savedNotes.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No notes saved yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Generate a lesson note and click 'Save' to see it here.</p>
            <div className="mt-6">
              <Link
                to="/generator"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
              >
                <Sparkles className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Generate First Note
              </Link>
            </div>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
            {savedNotes.map((note) => (
              <li key={note.id || Math.random()}>
                <Link
                  to="/result"
                  state={{ lessonNote: note }}
                  className="block hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-brand-600 truncate">{note.topic} <span className="text-slate-400 dark:text-slate-400 font-normal">- {note.subtopic}</span></p>
                      <div className="ml-2 flex-shrink-0 flex items-center">
                        <button
                          onClick={(e) => handleEdit(note, e)}
                          className="text-slate-400 dark:text-slate-300 hover:text-brand-600 p-2 rounded-full hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors mr-1"
                          title="Edit Note"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => note.id && handleDelete(note.id, e)}
                          className="text-slate-400 dark:text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                          title="Delete Note"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-slate-500 mr-6">
                          <BookOpen className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                          {note.subject}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0 sm:ml-6">
                          Class: {note.classLevel}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                        <p>
                          {note.date || note.createdAt?.split('T')[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div >
  );
};

export default Dashboard;
