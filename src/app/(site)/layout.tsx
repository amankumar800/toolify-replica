import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/ui/SkipLink';

export default function SiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Skip link for keyboard navigation - WCAG 2.1 AA Requirement 16.2 */}
            <SkipLink targetId="main-content" />
            <Header />
            <main id="main-content" className="flex-1" tabIndex={-1}>
                {children}
            </main>
            <Footer />
        </div>
    );
}
