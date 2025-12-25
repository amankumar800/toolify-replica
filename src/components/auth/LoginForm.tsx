'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmail, signUp } from '@/lib/services/auth.service';

/**
 * Validation schema for authentication form
 * - Email: Must be valid email format (Requirement 3.5)
 * - Password: Minimum 6 characters (Requirement 4.5)
 */
const authSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type AuthValues = z.infer<typeof authSchema>;

/**
 * LoginForm component for email/password authentication
 * Supports both sign-in and sign-up modes
 * 
 * Requirements:
 * - 3.3: Display user-friendly error messages on authentication failure
 * - 4.2: Inform user to check email when email confirmation is required
 */
export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<AuthValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: AuthValues) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (mode === 'signin') {
                const result = await signInWithEmail(data.email, data.password);
                if (result.success) {
                    // Redirect to callback URL or home page
                    const callbackUrl = searchParams.get('callbackUrl') || '/';
                    router.push(callbackUrl);
                    router.refresh();
                } else {
                    // Requirement 3.3: Display user-friendly error message
                    setError(result.error || 'Sign in failed. Please try again.');
                }
            } else {
                const result = await signUp(data.email, data.password);
                if (result.success) {
                    if (result.requiresEmailConfirmation) {
                        // Requirement 4.2: Inform user to check email
                        setSuccessMessage('Please check your email to confirm your account.');
                        reset();
                    } else {
                        // Auto-signed in, redirect to home
                        router.push('/');
                        router.refresh();
                    }
                } else {
                    setError(result.error || 'Sign up failed. Please try again.');
                }
            }
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'signin' ? 'signup' : 'signin');
        setError(null);
        setSuccessMessage(null);
    };

    const isSignIn = mode === 'signin';

    return (
        <div className="grid gap-6">
            <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold">
                    {isSignIn ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="text-balance text-muted-foreground">
                    {isSignIn
                        ? 'Enter your email below to sign in to your account'
                        : 'Enter your email below to create your account'}
                </p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{successMessage}</p>
                </div>
            )}

            <div className="grid gap-4">
                {/* Email Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            disabled={loading}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {isSignIn && (
                                <a
                                    href="#"
                                    className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-foreground"
                                >
                                    Forgot your password?
                                </a>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            disabled={loading}
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSignIn ? 'Sign In' : 'Sign Up'}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    {isSignIn ? (
                        <>
                            Don&apos;t have an account?{' '}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="underline hover:text-primary"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="underline hover:text-primary"
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
