import React, { useState } from 'react';
import { PaystackButton } from 'react-paystack';
import { CheckCircle, Loader2, Sparkles, Shield, ChevronRight, X } from '../components/Icons';
import { db } from '../database';
import { useNavigate, Link } from 'react-router-dom';
import { showAlert } from '../utils/alerts';
import { SystemSettings } from '../types';

const Pricing: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [pendingPlan, setPendingPlan] = useState<'Pro' | 'School' | null>(null);
    const user = db.auth.getCurrentUser();

    React.useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/settings/pricing`);
                const data = await response.json();
                if (data.success) {
                    setSettings(data.data);
                }
            } catch (error) {
                console.error('Failed to load pricing settings:', error);
            }
        };
        loadSettings();
    }, []);

    const publicKey = settings?.paystackPublicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

    const handleSuccess = async (reference: any, plan: 'Pro' | 'School') => {
        setLoading(true);
        try {
            if (plan === 'School' && user?.schoolId && !user?.isSchoolAdmin) {
                showAlert.error('Admin Access Required', 'Only school administrators can purchase or manage the School License.');
                return;
            }
            await db.payment.verify(reference.reference, plan);
            await db.auth.refreshUser();
            const amount = plan === 'Pro'
                ? (settings?.proPlanPrice || 2500).toLocaleString()
                : (settings?.schoolPlanPrice || 20000).toLocaleString();
            navigate(`/payment/success?plan=${plan}&amount=${amount}&ref=${reference.reference}`);
        } catch (error) {
            showAlert.error('Payment Error', 'Payment verification failed. Please contact support if you were debited.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        showAlert.info("Payment Cancelled", "Your transaction was not completed.");
    }

    const componentProps = (amount: number, plan: 'Pro' | 'School') => ({
        email: user?.email || 'customer@example.com',
        amount: amount * 100,
        publicKey,
        text: "Subscribe Now",
        onSuccess: (ref: any) => handleSuccess(ref, plan),
        onClose: handleClose,
    });

    const isCurrentPlan = (planName: string) => {
        if (!user) return false;
        if (planName === 'Free' && (!user.subscriptionPlan || user.subscriptionPlan === 'Free')) return true;
        return user.subscriptionPlan?.toLowerCase() === planName.toLowerCase();
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden pb-20 relative">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#16A34A]/5 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-0 left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse delay-700"></div>
            </div>

            {/* Subscription Warning Modal */}
            {showWarning && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full mb-6">
                            <Shield className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">Active Subscription</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 font-medium italic">
                            Replacing your <span className="text-[#16A34A] font-bold">"{user?.subscriptionPlan}"</span> plan with <span className="text-[#16A34A] font-bold">"{pendingPlan}"</span> will immediately update your account benefits.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { setShowWarning(false); setPendingPlan(null); }}
                                className="px-6 py-4 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            {pendingPlan && (
                                <PaystackButton
                                    className="px-6 py-4 bg-[#16A34A] text-white rounded-2xl font-black hover:shadow-lg hover:shadow-[#16A34A]/20 transition-all"
                                    {...componentProps(
                                        pendingPlan === 'Pro' ? (settings?.proPlanPrice || 2500) : (settings?.schoolPlanPrice || 20000),
                                        pendingPlan
                                    )}
                                    text="Confirm Change"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-24 pb-16">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 mb-16 lg:mb-32">
                    <div className="text-center lg:text-left space-y-6 animate-in fade-in slide-in-from-left-8 duration-1000">
                        <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 mx-auto lg:mx-0">
                            <span className="text-[#16A34A] text-xs font-black uppercase tracking-widest leading-none">Pricing</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                            Plans for every <span className="text-[#16A34A]">teacher</span>
                        </h1>
                        <p className="max-w-xl mx-auto lg:mx-0 text-lg lg:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                            Start for free and upgrade as you need more power for your classroom.
                        </p>
                    </div>

                    <div className="relative group animate-in fade-in zoom-in duration-1000 hidden lg:block">
                        <div className="absolute inset-0 bg-[#16A34A]/5 blur-[80px] rounded-full group-hover:scale-110 transition-transform"></div>
                        <img
                            src="/hero-illustration.png"
                            className="relative z-10 h-80 w-auto drop-shadow-[0_25px_25px_rgba(22,163,74,0.1)] rounded-[3rem]"
                            alt="Teacher Illustration"
                        />
                    </div>
                </header>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Free Plan */}
                    <div className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/20 dark:shadow-black/20 hover:shadow-inherit transition-all hover:-translate-y-2">
                        <div className="mb-10">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{settings?.freePlanName || 'Free Starter'}</h3>
                            <p className="text-slate-400 text-sm font-medium italic">Perfect for trying out TeachAide.</p>
                        </div>
                        <div className="mb-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">₦0</span>
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">/mo</span>
                            </div>
                        </div>
                        <div className="mb-10">
                            {user ? (
                                <button disabled className="w-full py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-lg transition-all border border-slate-100 dark:border-slate-700 cursor-default">
                                    {isCurrentPlan('Free') ? 'Current Plan' : 'Active'}
                                </button>
                            ) : (
                                <Link
                                    to="/signup"
                                    className="block w-full text-center py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/10 hover:shadow-slate-900/30 transition-all hover:-translate-y-1"
                                >
                                    Get Started for Free
                                </Link>
                            )}
                        </div>
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-[0.3em]">What's Included</p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                                    <CheckCircle className="w-5 h-5 text-[#16A34A]" /> {settings?.freePlanLessonLimit || 16} Lesson Notes per month
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                                    <CheckCircle className="w-5 h-5 text-[#16A34A]" /> Basic Subjects Only
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold opacity-40">
                                    <X className="w-5 h-5" /> No PDF Export
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="group relative bg-[#16A34A]/5 dark:bg-slate-900 rounded-[2.5rem] p-10 border-2 border-[#16A34A] shadow-2xl shadow-[#16A34A]/10 transition-all hover:-translate-y-2 overflow-hidden">
                        <div className="absolute top-0 right-0 px-6 py-2 bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl">Most Popular</div>
                        <div className="mb-10">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{settings?.proPlanName || 'Professional'}</h3>
                            <p className="text-slate-500 text-sm font-medium italic">For serious teachers.</p>
                        </div>
                        <div className="mb-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">₦{(settings?.proPlanPrice || 2500).toLocaleString()}</span>
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">/mo</span>
                            </div>
                        </div>
                        <div className="mb-10">
                            {user ? (
                                user?.schoolId && !user?.isSchoolAdmin ? (
                                    <button
                                        className="w-full py-5 bg-slate-500 text-white rounded-2xl font-black text-lg cursor-not-allowed opacity-50"
                                        onClick={() => showAlert.info('School Managed', 'Your subscription is managed by your school.')}
                                    >
                                        Managed by School
                                    </button>
                                ) : isCurrentPlan('Pro') ? (
                                    <button disabled className="w-full py-5 bg-[#16A34A]/10 text-[#16A34A] border-2 border-[#16A34A]/20 rounded-2xl font-black text-lg cursor-default">Current Plan</button>
                                ) : (
                                    <button
                                        onClick={() => { if (user.subscriptionPlan !== 'Free') { setPendingPlan('Pro'); setShowWarning(true); } else { /* Paystack handles click if not disabled */ } }}
                                        className="w-full group/btn relative"
                                    >
                                        <PaystackButton
                                            className="w-full py-5 bg-[#16A34A] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#16A34A]/30 hover:shadow-[#16A34A]/50 transition-all relative z-10"
                                            {...componentProps(settings?.proPlanPrice || 2500, 'Pro')}
                                            text={user.subscriptionPlan && user.subscriptionPlan !== 'Free' ? "Change Plan" : "Subscribe Now"}
                                        />
                                    </button>
                                )
                            ) : (
                                <Link to="/login?redirect=/pricing" className="block w-full text-center py-5 bg-[#16A34A] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#16A34A]/30 hover:shadow-[#16A34A]/50 transition-all">Subscribe Now</Link>
                            )}
                        </div>
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-[0.3em]">What's Included</p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                                    <CheckCircle className="w-5 h-5 text-[#16A34A]" /> {settings?.proPlanLessonLimit || 1000} Lesson Notes per month
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                                    <CheckCircle className="w-5 h-5 text-[#16A34A]" /> All Subjects
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                                    <CheckCircle className="w-5 h-5 text-[#16A34A]" /> PDF & DOC Export
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                                    <CheckCircle className="w-5 h-5 text-[#16A34A]" /> Save History
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* School License */}
                    <div className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/20 dark:shadow-black/20 transition-all hover:-translate-y-2">
                        <div className="mb-10">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{settings?.schoolPlanName || 'School License'}</h3>
                            <p className="text-slate-400 text-sm font-medium italic">For Headmasters and Owners.</p>
                        </div>
                        <div className="mb-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">₦{(settings?.schoolPlanPrice || 20000).toLocaleString()}</span>
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">/term</span>
                            </div>
                        </div>
                        <div className="mb-10">
                            {user ? (
                                isCurrentPlan('School') ? (
                                    <button disabled className="w-full py-5 bg-slate-900/10 dark:bg-slate-800 text-slate-900 dark:text-slate-500 rounded-2xl font-black text-lg cursor-default">Current Plan</button>
                                ) : (
                                    <PaystackButton
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/30 hover:shadow-slate-900/50 transition-all"
                                        {...componentProps(settings?.schoolPlanPrice || 20000, 'School')}
                                    />
                                )
                            ) : (
                                <Link to="/login?redirect=/pricing" className="block w-full text-center py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/30 hover:shadow-slate-900/50 transition-all">Subscribe Now</Link>
                            )}
                        </div>
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-[0.3em]">What's Included</p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                                    <CheckCircle className="w-5 h-5 text-[#16A34A]" /> Multi-Teacher Access
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
                                    <CheckCircle className="w-5 h-5 text-[#16A34A]" /> Admin Dashboard
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* FAQ / Support Section */}
                <div className="mt-24 lg:mt-40 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#16A34A]/5 to-transparent blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-8 lg:p-20 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="relative z-10 w-full lg:w-1/2 space-y-6 text-center lg:text-left">
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Have questions?</h2>
                            <p className="text-lg lg:text-xl text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed">
                                We're here to help. Contact our support team if you have any questions about plans or billing.
                            </p>
                            <div className="pt-4">
                                <button
                                    onClick={() => navigate('/contact')}
                                    className="inline-flex items-center justify-center px-10 py-5 bg-[#16A34A] text-white text-lg font-black rounded-2xl shadow-2xl shadow-[#16A34A]/20 hover:shadow-[#16A34A]/40 hover:-translate-y-1 transition-all active:scale-95 group"
                                >
                                    Contact Support <ChevronRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 w-full lg:w-1/3 animate-in fade-in zoom-in duration-1000">
                            <img
                                src="/support-illustration.png"
                                className="w-full h-auto drop-shadow-[0_25px_25px_rgba(22,163,74,0.15)] rounded-[2rem]"
                                alt="Support Representative"
                            />
                            <div className="absolute top-[-20px] left-[-20px] bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                                <div className="w-10 h-10 bg-[#16A34A]/10 rounded-xl flex items-center justify-center text-[#16A34A]">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {loading && (
                <div className="fixed inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#16A34A]" />
                    <p className="text-sm font-black text-[#16A34A] uppercase tracking-widest">Processing Payment...</p>
                </div>
            )}
        </div>
    );
};

export default Pricing;