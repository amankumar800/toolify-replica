import { Container } from '@/components/layout/Container';
import { RankingTable } from '@/components/features/RankingTable';
import { getTools } from '@/lib/services/tools.service';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Top AI Website & AI Tools Analysis', // Exact match for Toolify title
    description: 'Discover the most popular and trending AI tools ranked by monthly traffic and growth.',
};

export default async function RankingPage() {
    // In a real app, we'd have a specific sort params for "visits"
    // For now, we reuse the tool service but we know our mock data now supports it.
    // We will fetch more tools to make a good list (e.g., 50)
    const { tools } = await getTools(undefined, undefined, 1, 50, 'popular');

    // Simulate sorting by the new field if the service doesn't do it perfectly (since service sorts by savedCount for 'popular')
    // We want specifically 'monthlyVisits' for this page.
    const rankedTools = [...tools].sort((a, b) => (b.monthlyVisits || 0) - (a.monthlyVisits || 0));

    // Get the current Date for the header (e.g., "Top AI Tools - December 2025")
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    return (
        <div className="pb-20">
            <div className="bg-gray-50/50 border-b border-[var(--border)] py-12 mb-8">
                <Container>
                    <h1 className="text-3xl font-extrabold mb-4">
                        Top AI Website & AI Tools in {month} {year}
                    </h1>
                    <p className="text-[var(--muted-foreground)] max-w-3xl">
                        Analyze the most popular AI tools based on traffic and growth trends.
                        Our leaderboard is updated daily to help you spot the next big thing in AI.
                    </p>
                </Container>
            </div>

            <Container>
                <div className="flex flex-col gap-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-2">
                        <span className="font-bold">ℹ️ Info:</span>
                        This ranking is based on estimated monthly visits and growth trends.
                    </div>

                    <RankingTable tools={rankedTools} />
                </div>
            </Container>
        </div>
    );
}
