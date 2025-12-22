import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, CheckCircle, FileText, Sparkles, BookOpen, Users, Calendar, Clipboard, Volume, Loader2 } from '../components/Icons';
import { db } from '../database';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization?: string;
  content: string;
  avatarUrl?: string;
}

const Home: React.FC = () => {
  const user = db.auth.getCurrentUser();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold mb-6 border border-brand-100">
              For Nigerian Teachers & Students
            </span>
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 dark:text-slate-100 sm:text-5xl md:text-6xl mb-6">
              Generate Lesson Notes in <span className="text-brand-600">Seconds</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-300">
              Stop spending hours writing notes by hand. Create standard, Ministry-compliant lesson notes, classwork, and exam questions instantly with AI.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                to={user ? "/generator" : "/login"}
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-brand-600 hover:bg-brand-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Start Generating <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center px-8 py-3 border border-slate-300 text-base font-medium rounded-full text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                View Pricing
              </Link>
            </div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      </section>

      {/* Demo/Preview Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
             <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-4 text-xs font-mono text-slate-500">Lesson_Note_Preview.pdf</span>
             </div>
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-32 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 p-4 space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-5/6"></div>
                    </div>
                     <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/3"></div>
                     <div className="h-20 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700"></div>
                </div>
                <div className="flex flex-col justify-center items-start space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Standard Structure</h3>
                    <ul className="space-y-3">
                    <li className="flex items-center text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-5 h-5 text-brand-500 mr-2" />
                            Behavioural Objectives
                        </li>
                    <li className="flex items-center text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-5 h-5 text-brand-500 mr-2" />
                            Instructional Materials
                        </li>
                    <li className="flex items-center text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-5 h-5 text-brand-500 mr-2" />
                            Presentation Steps (Teacher/Pupil)
                        </li>
                    <li className="flex items-center text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-5 h-5 text-brand-500 mr-2" />
                            Evaluation & Assignments
                        </li>
                    </ul>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-brand-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything a Teacher Needs
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Instant Lesson Notes',
                desc: 'Generate full structured notes for any subject and class level instantly.',
                icon: FileText
              },
              {
                title: 'AI Assessments & Quizzes',
                desc: 'Create objective (MCQ) and theory questions for your students automatically.',
                icon: Clipboard
              },
              {
                title: 'Class Management',
                desc: 'Store student details, manage subjects, and keep track of classroom notes.',
                icon: Users
              },
              {
                title: 'Weekly Timetable',
                desc: 'Build and organize your teaching schedule and export it as a document.',
                icon: Calendar
              },
               {
                title: 'Audio Lessons (TTS)',
                desc: 'Listen to your lesson notes read aloud for better accessibility and review.',
                icon: Volume
              },
              {
                title: 'Offline History',
                desc: 'Access your previously generated plans and notes even without an internet connection.',
                icon: BookOpen
              },
            ].map((feature, idx) => (
              <div key={idx} className="relative group bg-white dark:bg-slate-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-brand-50 text-brand-600 ring-4 ring-white">
                    <feature.icon className="h-8 w-8" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-brand-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-12">Loved by Nigerian Teachers</h2>
            <TestimonialsBlock />
        </div>
      </section>
    </div>
  );
};

const TestimonialsBlock: React.FC = () => {
  const [items, setItems] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await db.testimonials.getActive();
        if (mounted) setItems(data || []);
      } catch (e) {
        if (mounted) setItems([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (items === null) {
    return <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>;
  }

  if (!items || items.length === 0) return <div className="text-white text-sm">No testimonials yet — check back soon.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {items.map((t) => (
        <div key={t.id} className="bg-brand-800 rounded-xl p-6 text-left border border-brand-700 flex gap-4 items-start">
          {t.avatarUrl ? (
            <img src={t.avatarUrl} alt={t.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold">{t.name?.charAt(0)}</div>
          )}
          <div>
            <p className="text-brand-100 italic mb-4">"{t.content}"</p>
            <p className="text-white font-bold">{t.name}{t.role ? `, ${t.role}` : ''}</p>
            {t.organization && <p className="text-brand-200 text-sm">{t.organization}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;