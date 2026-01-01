import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { createClient } from '@/lib/supabase/server';
import { createCompanyPagesRepository } from '@/lib/db/repositories/company-pages.repository';

export const revalidate = 3600; // ISR: revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const repo = createCompanyPagesRepository(supabase);
  const page = await repo.findBySlug('contact');

  return {
    title: page?.title || 'Contact',
    description: 'Get in touch with the AI Tools Book team.',
  };
}

export default async function ContactPage() {
  const supabase = await createClient();
  const repo = createCompanyPagesRepository(supabase);
  const page = await repo.findBySlug('contact');

  const hasContent = page?.content && page.content.trim().length > 0;

  return (
    <div className="min-h-screen py-16 bg-gray-50/50">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            {page?.title || 'Contact'}
          </h1>

          {hasContent ? (
            <div
              className="prose prose-lg max-w-none bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 md:p-8"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 md:p-8 text-center">
              <p className="text-[var(--muted-foreground)]">
                Content coming soon. Please check back later.
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
