import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { SearchBar } from '@/components/features/SearchBar';

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center py-20">
            <Container>
                <h1 className="text-6xl font-extrabold text-[var(--primary)] mb-6">404</h1>
                <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
                <p className="text-[var(--muted-foreground)] mb-8 max-w-md mx-auto">
                    The tool or page you are looking for doesn&apos;t exist. It might have been moved or deleted.
                </p>

                <div className="max-w-md mx-auto mb-12">
                    <SearchBar variant="header" />
                </div>

                <div className="space-y-4">
                    <p className="font-semibold text-gray-900">Popular Categories:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link href="/category/ai-chatbot" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-[var(--radius-sm)] transition-colors">
                            AI Chatbot
                        </Link>
                        <Link href="/category/ai-image-generator" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-[var(--radius-sm)] transition-colors">
                            AI Image Generator
                        </Link>
                        <Link href="/" className="bg-[var(--primary)] text-white hover:bg-opacity-90 px-4 py-2 rounded-[var(--radius-sm)] transition-colors">
                            Go Home
                        </Link>
                    </div>
                </div>
            </Container>
        </div>
    );
}
