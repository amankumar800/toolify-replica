"use client";

import { useState } from 'react';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

export function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid email address.');
            return;
        }

        setStatus('loading');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate success (in production, this would call a real API)
        setStatus('success');
        setMessage('Thanks for subscribing! Check your inbox for confirmation.');
        setEmail('');

        // Reset after 5 seconds
        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 5000);
    };

    return (
        <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Subscribe to Newsletter</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
                Get the latest AI news delivered to your inbox every morning.
            </p>

            {status === 'success' ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{message}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={status === 'loading'}
                    />

                    {status === 'error' && (
                        <p className="text-sm text-destructive">{message}</p>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Subscribing...
                            </>
                        ) : (
                            'Subscribe'
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
