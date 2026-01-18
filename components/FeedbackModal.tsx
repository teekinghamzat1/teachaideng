import React, { useState, useEffect } from 'react';
import { Star, X, Loader2, Send } from './Icons';
import { db } from '../database';
import { showAlert } from '../utils/alerts';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            setUser(db.auth.getCurrentUser());
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            showAlert.warning('Rating Required', 'Please select a star rating.');
            return;
        }
        if (!content.trim()) {
            showAlert.warning('Review Required', 'Please share a brief opinion about TeachAide.');
            return;
        }

        setLoading(true);
        try {
            await db.testimonials.submit({
                name: user?.name || 'Anonymous User',
                role: user?.isSchoolAdmin ? 'School Admin' : 'Teacher',
                content: content.trim(),
                rating,
                avatarUrl: user?.avatar || null
            });
            showAlert.success('Thank You!', 'Your feedback has been submitted for review.');
            onClose();
        } catch (err) {
            console.error('Failed to submit feedback', err);
            showAlert.error('Error', 'Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative h-32 bg-brand-600 flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto shadow-lg mb-2">
                            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                        </div>
                        <h3 className="text-white font-bold text-xl">Rate Your Experience</h3>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                            How satisfied are you with the generated content?
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <Star
                                        className={`w-10 h-10 ${(hover || rating) >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            Share your opinion (This will be shown to others)
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all h-32 resize-none"
                            placeholder="Tell us what you like about TeachAide..."
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 hover:-translate-y-0.5'}`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Submit Review
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors py-2"
                        >
                            Maybe later
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
