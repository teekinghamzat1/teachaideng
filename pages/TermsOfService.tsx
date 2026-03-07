import React from 'react';
import { useBranding } from '../contexts/BrandingContext';

export const TermsOfService: React.FC = () => {
    const branding = useBranding();
    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-900 flex flex-col">
            <main className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Terms of Service</h1>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">1. Agreement to Terms</h2>
                        <p className="text-slate-700 dark:text-slate-300">
                            This platform ({branding.siteName}) is operated by <strong>Cognovia Technologies Ltd</strong>,
                            a company registered in Nigeria (RC: 9394151). By accessing or using our services, you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our platform.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">2. Use of Services</h2>
                        <ul className="list-disc pl-6 space-y-4 text-slate-700 dark:text-slate-300">
                            <li>You must be a teacher or educational professional to use this service.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You agree not to use the platform for any illegal or unauthorized purpose.</li>
                            <li>The AI-generated content (lesson notes, assessments) should be reviewed for accuracy by the teacher before classroom use.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">3. Intellectual Property</h2>
                        <p className="text-slate-700 dark:text-slate-300">
                            All content, features, and functionality of {branding.siteName} are owned by Cognovia Technologies Ltd and are protected by international copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">4. Limitation of Liability</h2>
                        <p className="text-slate-700 dark:text-slate-300">
                            Cognovia Technologies Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">5. Governing Law</h2>
                        <p className="text-slate-700 dark:text-slate-300">
                            These terms shall be governed by and defined following the laws of Nigeria. Cognovia Technologies Ltd and yourself irrevocably consent that the courts of Nigeria shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                        </p>
                    </section>

                    <section className="mb-8 border-t border-slate-200 dark:border-slate-800 pt-8 mt-12">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">6. Contact Us</h2>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                            If you have any questions about these Terms, please contact us at: <a href="mailto:hello@teachaide.ng" className="text-brand-600 hover:underline">hello@teachaide.ng</a>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default TermsOfService;
