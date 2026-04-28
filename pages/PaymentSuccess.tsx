import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from '../components/Icons';

const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const plan = searchParams.get('plan') || 'Pro';
    const amount = searchParams.get('amount') || '3,500';

    useEffect(() => {
        // Auto-redirect after 10 seconds
        const timer = setTimeout(() => {
            navigate('/dashboard');
        }, 10000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="bg-green-100 rounded-full p-4">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Payment Successful!
                </h1>

                <p className="text-slate-600 mb-6">
                    Welcome to the <span className="font-semibold text-brand-600">{plan} Plan</span>
                </p>

                <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase mb-3">Payment Details</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Plan:</span>
                            <span className="font-semibold text-slate-900">{plan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Amount:</span>
                            <span className="font-semibold text-slate-900">₦{amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Status:</span>
                            <span className="font-semibold text-green-600">Confirmed</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        📧 A receipt has been sent to your email address.
                    </p>
                </div>

                <div className="space-y-3">
                    {plan === 'School' ? (
                        <button
                            onClick={() => navigate('/school')}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>Manage Your School</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/generator')}
                        className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                    >
                        Start Creating Lesson Notes
                    </button>
                </div>

                <p className="text-xs text-slate-500 mt-6">
                    Redirecting to dashboard in 10 seconds...
                </p>
            </div>
        </div>
    );
};

export default PaymentSuccess;
