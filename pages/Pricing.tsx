import React, { useState } from 'react';
import { PaystackButton } from 'react-paystack';
import { CheckCircle, Loader2 } from '../components/Icons';
import { db } from '../database';
import { useNavigate } from 'react-router-dom';
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

    // TO USER: Replace with your actual Paystack Public Key in .env
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    const handleSuccess = async (reference: any, plan: 'Pro' | 'School') => {
        setLoading(true);
        try {
            // Defensive client-side guard: ensure only school admins can subscribe to School License
            if (plan === 'School' && user?.schoolId && !user?.isSchoolAdmin) {
                showAlert.error('Admin Access Required', 'Only school administrators can purchase or manage the School License. Please contact your school administrator.');
                return;
            }
            await db.payment.verify(reference.reference, plan);
            // Refresh user data to get updated subscription plan
            await db.auth.refreshUser();
            // Navigate to success page with payment details
            const amount = plan === 'Pro'
                ? (settings?.proPlanPrice || 2500).toLocaleString()
                : (settings?.schoolPlanPrice || 20000).toLocaleString();
            navigate(`/payment/success?plan=${plan}&amount=${amount}&ref=${reference.reference}`);
        } catch (error) {
            showAlert.error('Payment Error', 'Payment verification failed. Please contact support if you were debited.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        showAlert.info("Payment Cancelled", "Your transaction was not completed.");
    }

    const handleSubscribeClick = (plan: 'Pro' | 'School') => {
        // Check if user already has an active subscription
        if (user?.subscriptionPlan && user.subscriptionPlan !== 'Free') {
            setPendingPlan(plan);
            setShowWarning(true);
        } else {
            // Proceed normally - the PaystackButton will handle it
            return true;
        }
        return false;
    };

    const confirmSubscriptionChange = () => {
        setShowWarning(false);
        // Trigger the Paystack payment for the pending plan
        if (pendingPlan) {
            // We'll use a ref or state to trigger the payment
            // For now, we'll just close the modal and let user click again
            // The button text will change to "Change Plan" which shows the modal
        }
    };

    const componentProps = (amount: number, plan: 'Pro' | 'School') => ({
        email: user?.email || 'customer@example.com',
        amount: amount * 100, // Paystack is in kobo
        metadata: {
            name: user?.name || 'Customer',
            phone: '',
            custom_fields: []
        },
        publicKey,
        text: "Subscribe Now",
        onSuccess: (ref: any) => handleSuccess(ref, plan),
        onClose: handleClose,
    });

    if (!user) {
        // Fallback if not logged in - redirect to login
    }

    return (
        <>
            {/* Subscription Warning Modal */}
            {showWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
                            Active Subscription Detected
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
                            You currently have an active <span className="font-semibold text-brand-600">{user?.subscriptionPlan}</span> plan.
                            Subscribing to the <span className="font-semibold text-brand-600">{pendingPlan}</span> plan will replace your current subscription.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowWarning(false);
                                    setPendingPlan(null);
                                }}
                                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            {pendingPlan && (
                                <PaystackButton
                                    className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
                                    {...componentProps(
                                        pendingPlan === 'Pro'
                                            ? (settings?.proPlanPrice || 2500)
                                            : (settings?.schoolPlanPrice || 20000),
                                        pendingPlan
                                    )}
                                    text="Continue to Payment"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-900 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-base font-semibold text-brand-600 tracking-wide uppercase">Pricing</h2>
                        <p className="mt-1 text-4xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-5xl sm:tracking-tight lg:text-6xl">
                            Plans for every teacher
                        </p>
                        <p className="max-w-xl mt-5 mx-auto text-xl text-slate-500 dark:text-slate-300">
                            Start for free and upgrade as you need more power.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        {/* Free Plan */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-slate-900">{settings?.freePlanName || 'Free Starter'}</h3>
                                <p className="mt-4 text-sm text-slate-500">Perfect for trying out TeachAide.</p>
                                <p className="mt-8">
                                    <span className="text-4xl font-extrabold text-slate-900">₦{settings?.freePlanPrice || 0}</span>
                                    <span className="text-base font-medium text-slate-500">/{settings?.freePlanDuration === 'term' ? 'term' : settings?.freePlanDuration === 'year' ? 'yr' : 'mo'}</span>
                                </p>
                                <button disabled className="mt-8 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md py-2 text-sm font-semibold text-slate-500 dark:text-slate-200 text-center cursor-default">Current Plan</button>
                            </div>
                            <div className="pt-6 pb-8 px-6">
                                <h4 className="text-sm font-medium text-slate-900 tracking-wide uppercase">What's included</h4>
                                <ul className="mt-6 space-y-4">
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500 dark:text-slate-300">{settings?.freePlanLessonLimit || 10} Lesson Notes per month</span>
                                    </li>
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500">Basic Subjects Only</span>
                                    </li>
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500">No PDF Export</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl divide-y divide-slate-200 dark:divide-slate-700 border-2 border-brand-500 relative">
                            <div className="absolute top-0 right-0 -mr-1 -mt-1 w-24 rounded-bl-lg rounded-tr-lg bg-brand-500 text-center text-xs font-semibold text-white py-1">POPULAR</div>
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{settings?.proPlanName || 'Professional'}</h3>
                                <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">For serious teachers.</p>
                                <p className="mt-8">
                                    <span className="text-4xl font-extrabold text-slate-900">₦{(settings?.proPlanPrice || 2500).toLocaleString()}</span>
                                    <span className="text-base font-medium text-slate-500">/{settings?.proPlanDuration === 'term' ? 'term' : settings?.proPlanDuration === 'year' ? 'yr' : 'mo'}</span>
                                </p>

                                {user ? (
                                    <div className="mt-8">
                                        {user?.schoolId && !user?.isSchoolAdmin ? (
                                            <button
                                                className="block w-full bg-slate-500 border-slate-500 rounded-md py-2 text-sm font-semibold text-white text-center cursor-not-allowed"
                                                title="Your subscription is managed by your school"
                                                onClick={() => showAlert.info('School Managed', 'Your subscription is managed by your school. Please contact your administrator for plan upgrades.')}
                                            >
                                                Managed by School
                                            </button>
                                        ) : user.subscriptionPlan && user.subscriptionPlan !== 'Free' ? (
                                            <button
                                                onClick={() => {
                                                    setPendingPlan('Pro');
                                                    setShowWarning(true);
                                                }}
                                                className="block w-full bg-brand-600 border border-brand-600 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-brand-700 transition-colors"
                                            >
                                                Change Plan
                                            </button>
                                        ) : (
                                            <PaystackButton
                                                className="block w-full bg-brand-600 border border-brand-600 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-brand-700 transition-colors"
                                                {...componentProps(settings?.proPlanPrice || 2500, 'Pro')}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <a href="/login?redirect=/pricing" className="mt-8 block w-full bg-brand-600 border border-brand-600 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-brand-700">Login to Subscribe</a>
                                )}

                            </div>
                            <div className="pt-6 pb-8 px-6">
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 tracking-wide uppercase">What's included</h4>
                                <ul className="mt-6 space-y-4">
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500 dark:text-slate-300">{settings?.proPlanLessonLimit || 100} Lesson Notes per month</span>
                                    </li>
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500">All Subjects</span>
                                    </li>
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500">PDF & DOC Export</span>
                                    </li>
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500">Save History</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* School Plan */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{settings?.schoolPlanName || 'School License'}</h3>
                                <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">For Headmasters and Owners.</p>
                                <p className="mt-8">
                                    <span className="text-4xl font-extrabold text-slate-900">₦{(settings?.schoolPlanPrice || 20000).toLocaleString()}</span>
                                    <span className="text-base font-medium text-slate-500">/{settings?.schoolPlanDuration === 'term' ? 'term' : settings?.schoolPlanDuration === 'year' ? 'yr' : 'mo'}</span>
                                </p>
                                {user ? (
                                    <div className="mt-8">
                                        {user.subscriptionPlan && user.subscriptionPlan !== 'Free' ? (
                                            <button
                                                onClick={() => {
                                                    setPendingPlan('School');
                                                    setShowWarning(true);
                                                }}
                                                className="block w-full bg-slate-800 border-slate-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-slate-900 transition-colors"
                                            >
                                                Change Plan
                                            </button>
                                        ) : (
                                            // If the user belongs to a school but is NOT a school admin, do not render the payment button
                                            user?.schoolId && !user?.isSchoolAdmin ? (
                                                <button
                                                    className="block w-full bg-slate-500 border-slate-500 rounded-md py-2 text-sm font-semibold text-white text-center cursor-not-allowed"
                                                    title="Only school administrators can subscribe to School License"
                                                    onClick={() => showAlert.error('Admin Access Required', 'Only school administrators can purchase or manage the School License.')}
                                                >
                                                    School License (Contact Admin)
                                                </button>
                                            ) : (
                                                <PaystackButton
                                                    className="block w-full bg-slate-800 border-slate-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-slate-900 transition-colors"
                                                    {...componentProps(settings?.schoolPlanPrice || 20000, 'School')}
                                                />
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <a href="/login?redirect=/pricing" className="mt-8 block w-full bg-slate-800 border-slate-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-slate-900">Login to Subscribe</a>
                                )}
                            </div>
                            <div className="pt-6 pb-8 px-6">
                                <h4 className="text-sm font-medium text-slate-900 tracking-wide uppercase">What's included</h4>
                                <ul className="mt-6 space-y-4">
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500">Multi-Teacher Access</span>
                                    </li>
                                    <li className="flex space-x-3">
                                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                                        <span className="text-sm text-slate-500">Admin Dashboard</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Pricing;