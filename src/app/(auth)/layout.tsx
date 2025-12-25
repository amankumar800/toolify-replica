import { Container } from '@/components/layout/Container';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // AI Tools Book login page is often simple, centered on a clean background.
    // We can add a subtle gradient or pattern here.
    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    {children}
                </div>
            </div>

            {/* Right Side - Visual/Marketing (Hidden on mobile) */}
            <div className="hidden bg-muted lg:block bg-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
                {/* Placeholder for a nice hero image or 3D element */}
                <div className="flex h-full items-center justify-center text-center p-10">
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Discovery Engine for AI</h2>
                        <p className="text-muted-foreground">Join thousands of users exploring the future of tools.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
