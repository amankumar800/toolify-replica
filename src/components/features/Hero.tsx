import { Container } from '@/components/layout/Container';
import { MultiModelSearch } from '@/components/features/MultiModelSearch';

export function Hero() {
    return (
        <div className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-[var(--primary)] rounded-full blur-[120px]" />
                <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-blue-400 rounded-full blur-[100px]" />
            </div>

            <Container className="relative z-10 flex flex-col items-center text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl">
                    Discover the Best <span className="text-[var(--primary)]">AI Tools</span> for Your Workflow
                </h1>
                <p className="text-lg md:text-xl text-[var(--muted-foreground)] mb-10 max-w-2xl">
                    Toolify.ai Replica is the largest directory of AI tools, updated daily with the latest innovations in artificial intelligence.
                </p>

                <MultiModelSearch className="mb-12" />

                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--muted-foreground)]">
                    <span className="font-semibold text-gray-900">Popular:</span>
                    {['ChatGPT', 'Midjourney', 'Copy.ai', 'Jasper'].map(tag => (
                        <span key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                            {tag}
                        </span>
                    ))}
                </div>
            </Container>
        </div>
    );
}
