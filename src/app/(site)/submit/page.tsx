'use client';

import { Container } from '@/components/layout/Container';
import { useState } from 'react';

export default function SubmitPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen py-20 flex items-center justify-center">
                <Container>
                    <div className="max-w-xl mx-auto bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-green-900 mb-2">Submission Received!</h2>
                        <p className="text-green-700 mb-8">
                            Thank you for submitting your tool. Our team will review it shortly and add it to the directory if it meets our criteria.
                        </p>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Submit Another Tool
                        </button>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-16 bg-gray-50/50">
            <Container>
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">Submit Your AI Tool</h1>
                        <p className="text-[var(--muted-foreground)]">
                            Join the largest AI directory and reach thousands of users daily.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 md:p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tool Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. ChatGPT"
                                />
                            </div>

                            <div>
                                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">Website URL <span className="text-red-500">*</span></label>
                                <input
                                    type="url"
                                    id="url"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="shortDesc" className="block text-sm font-medium text-gray-700 mb-1">Short Description <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="shortDesc"
                                    required
                                    maxLength={100}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                                    placeholder="One sentence pitch (max 100 chars)"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                                    placeholder="Tell us what makes your tool special..."
                                />
                            </div>

                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                                <select
                                    id="category"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                                >
                                    <option value="">Select a category...</option>
                                    <option value="chatbot">AI Chatbot</option>
                                    <option value="image">AI Image Generator</option>
                                    <option value="copywriting">Copywriting</option>
                                    <option value="video">AI Video</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 mb-1">Pricing Model</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="pricing" value="free" className="text-[var(--primary)]" />
                                        <span className="text-sm">Free</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="pricing" value="freemium" defaultChecked className="text-[var(--primary)]" />
                                        <span className="text-sm">Freemium</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="pricing" value="paid" className="text-[var(--primary)]" />
                                        <span className="text-sm">Paid</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full bg-[var(--primary)] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                            >
                                Submit Tool
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-4">
                                By submitting, you agree to our Terms of Service.
                            </p>
                        </div>
                    </form>
                </div>
            </Container>
        </div>
    );
}
