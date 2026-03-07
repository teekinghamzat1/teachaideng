import React from 'react';
import { useBranding } from '../contexts/BrandingContext';

export const PrivacyPolicy: React.FC = () => {
    const branding = useBranding();
    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-900 flex flex-col">
            <main className="flex-grow pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Privacy Policy</h1>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <section className="mb-8">
                        <h2>1. Introduction</h2>
                        <p>
                            This platform (TeachAide) is operated by <strong>Cognovia Technologies Ltd</strong> ("we," "our," or "us"),
                            a company registered in Nigeria (RC: 9394151). We are the data controller responsible for your personal data and we
                            are committed to protecting your privacy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>2. Data We Collect</h2>
                        <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                            <li><strong>Usage Data</strong> includes information about how you use our website, products and services (e.g., lesson generation prompts).</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2>3. How We Use Your Data</h2>
                        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal or regulatory obligation.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2>4. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
                            In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2>5. Your Legal Rights</h2>
                        <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                            <li>Request access to your personal data.</li>
                            <li>Request correction of your personal data.</li>
                            <li>Request erasure of your personal data.</li>
                            <li>Object to processing of your personal data.</li>
                            <li>Request restriction of processing your personal data.</li>
                            <li>Request transfer of your personal data.</li>
                            <li>Right to withdraw consent.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2>6. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:privacy@teachaide.ai" className="text-brand-600 hover:text-brand-700">privacy@teachaide.ai</a>.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};
