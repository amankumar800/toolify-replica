import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login',
    description: 'Login to your Toolify Replica account',
    alternates: {
        canonical: '/login', // Good SEO practice
    },
};

export default function LoginPage() {
    return (
        <div className="w-full">
            <LoginForm />
        </div>
    );
}
