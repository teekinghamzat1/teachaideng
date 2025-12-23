import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from '../components/Icons';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8 text-center">
            <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
                    <span className="text-[200px] font-black">404</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mb-8 animate-pulse">
                        <Search className="w-12 h-12 text-brand-600 dark:text-brand-400" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                        Oops! Page not found
                    </h1>

                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
                        We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-brand-600 hover:bg-brand-700 transition-all transform hover:scale-105"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Back to Home
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 dark:border-slate-700 text-base font-medium rounded-full text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-16 text-slate-400 dark:text-slate-500 text-sm">
                <p>Think this is an error? <Link to="/contact" className="text-brand-600 hover:underline">Let us know</Link>.</p>
            </div>
        </div>
    );
};

export default NotFound;
