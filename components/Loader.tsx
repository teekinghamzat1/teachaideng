import React from 'react';
import { BookOpen } from './Icons';
import { useBranding } from '../contexts/BrandingContext';

interface LoaderProps {
    fullscreen?: boolean;
    message?: string;
}

const Loader: React.FC<LoaderProps> = ({ fullscreen = false, message = 'Loading...' }) => {
    const branding = useBranding();

    const content = (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="relative mb-6">
                {/* Pulsing glow background */}
                <div className="absolute inset-0 bg-brand-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>

                {/* Floating icon */}
                <div className="relative w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex items-center justify-center border border-white/20 dark:border-slate-700 animate-float">
                    <BookOpen className="w-10 h-10 text-brand-600" />
                </div>
            </div>

            {/* Branded Text with shimmering effect */}
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2 relative group uppercase overflow-hidden">
                <span className="relative z-10">{branding.siteName}</span>
                <div className="absolute inset-x-0 h-0.5 bottom-0 bg-brand-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                {/* Shimmer overlay */}
                <div className="absolute inset-0 z-20 animate-shimmer pointer-events-none"></div>
            </h3>

            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                {message}
            </p>
        </div>
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center">
                <div className="max-w-xs w-full bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700 p-4 rounded-3xl shadow-2xl backdrop-blur-xl">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default Loader;
