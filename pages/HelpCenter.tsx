import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, BookOpen, MessageCircle, FileText, Search } from '../components/Icons';
import { useBranding } from '../contexts/BrandingContext';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
                <span className="font-medium text-slate-900 dark:text-slate-100">{question}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
            </button>
            {isOpen && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {answer}
                </div>
            )}
        </div>
    );
};

export const HelpCenter: React.FC = () => {
    const branding = useBranding();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const faqs = [
        {
            q: "How does the AI lesson generation work?",
            a: "Our AI analyzes the subject, topic, and class level you provide to generate a structured lesson note aligned with educational standards. It creates objectives, content, presentation steps, and evaluations automatically."
        },
        {
            q: "Is there a limit to how many lessons I can generate?",
            a: "Free tier users have a weekly limit of 2 lesson notes. Pro and School plans offer unlimited generations."
        },
        {
            q: "Can I edit the generated content?",
            a: "Yes! Once a lesson note or assessment is generated, you can copy it to your clipboard or download it as a text file to make any necessary adjustments."
        },
        {
            q: "How do I add students to my class?",
            a: "Go to the 'Class Manager' tab in your dashboard. You can add students manually or manage them if you are part of a school plan."
        },
        {
            q: "What payment methods do you accept?",
            a: "We accept all major cards and bank transfers via Paystack, ensuring secure and seamless transactions."
        }
    ];

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-900 flex flex-col">
            <main className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">How can we help you?</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Find answers to common questions about using {branding.siteName} to streamline your teaching workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Getting Started</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">New to {branding.siteName}? Learn the basics of setting up your account and generating your first lesson.</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Billing & Plans</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Everything you need to know about our Free, Pro, and School subscription tiers.</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Support</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Need direct help? Contact our support team for assistance with technical issues.</p>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    {faqs.map((faq, i) => (
                        <FAQItem key={i} question={faq.q} answer={faq.a} />
                    ))}
                </div>
            </main>
        </div>
    );
};
