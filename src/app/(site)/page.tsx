import { Suspense } from 'react';
import { Hero } from '@/components/features/Hero';
import { FeaturedTools } from '@/components/features/FeaturedTools';
import { Sidebar } from '@/components/features/Sidebar';
import { Container } from '@/components/layout/Container';
import { GridSkeleton } from '@/components/features/GridSkeleton';

// Revalidate simulation (or 3600 for ISR)
export const revalidate = 3600;

export default function HomePage() {
  return (
    <div className="min-h-screen pb-20">
      <Hero />

      <Container>
        <div className="flex">
          {/* Sidebar - Server Component - Needs to be async too? 
               Sidebar uses getCategories. If Sidebar is async, we should wrap it in Suspense too
               or let it block only the sidebar part. 
               For now, let's assume Sidebar is fast or we wrap it.
           */}
          <Suspense fallback={<div className="w-64 hidden lg:block animate-pulse bg-gray-100 h-screen" />}>
            <Sidebar />
          </Suspense>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Featured AI Tools</h2>
              <div className="flex gap-2 text-sm">
                <span className="text-[var(--muted-foreground)]">Sort by:</span>
                <button type="button" className="font-medium hover:text-[var(--primary)]">Popular</button>
                <button type="button" className="font-medium hover:text-[var(--primary)]">Newest</button>
              </div>
            </div>

            {/* Streaming Boundary */}
            <Suspense fallback={<GridSkeleton />}>
              <FeaturedTools />
            </Suspense>
          </main>
        </div>
      </Container>
    </div>
  );
}
