import { render, screen } from '@testing-library/react';
import { CategoryGrid } from '../CategoryGrid';
import { CategoryItem } from '@/lib/types/home.types';

// Mock Next.js Link
jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

const mockCategories: CategoryItem[] = [
    { id: '1', name: 'Chatbots', slug: 'chatbots', icon: '💬', toolCount: 6355, color: '#F3F4F6' },
    { id: '2', name: 'Image Generation', slug: 'image-generation', icon: '🎨', toolCount: 9443, color: '#F3F4F6' },
    { id: '3', name: 'Coding', slug: 'coding', icon: '💻', toolCount: 8903, color: '#F3F4F6' },
];

describe('CategoryGrid', () => {
    /**
     * Issue #36: Empty state
     */
    it('renders empty state when no categories provided', () => {
        render(<CategoryGrid categories={[]} />);
        expect(screen.getByText(/No categories available/i)).toBeInTheDocument();
    });

    /**
     * Renders section title
     */
    it('renders section title', () => {
        render(<CategoryGrid categories={mockCategories} />);
        expect(screen.getByText('Free AI Tools by Category')).toBeInTheDocument();
    });

    /**
     * Renders all categories
     */
    it('renders all provided categories', () => {
        render(<CategoryGrid categories={mockCategories} />);
        expect(screen.getByText('Chatbots')).toBeInTheDocument();
        expect(screen.getByText('Image Generation')).toBeInTheDocument();
        expect(screen.getByText('Coding')).toBeInTheDocument();
    });

    /**
     * Shows tool counts with proper formatting
     */
    it('formats tool counts with locale string', () => {
        render(<CategoryGrid categories={mockCategories} />);
        expect(screen.getByText('6,355 tools')).toBeInTheDocument();
        expect(screen.getByText('9,443 tools')).toBeInTheDocument();
    });

    /**
     * Links to correct category pages
     */
    it('links to correct category pages', () => {
        render(<CategoryGrid categories={mockCategories} />);
        const chatbotsLink = screen.getByRole('link', { name: /chatbots/i });
        expect(chatbotsLink).toHaveAttribute('href', '/free-ai-tools/chatbots');
    });

    /**
     * Issue #52: Emoji icons are decorative (aria-hidden)
     */
    it('emoji icons have aria-hidden', () => {
        render(<CategoryGrid categories={mockCategories} />);
        const emojiElements = screen.getAllByText('💬');
        expect(emojiElements[0].parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    /**
     * Issue #7: Category links have proper aria-labels
     */
    it('category links have descriptive aria-labels', () => {
        render(<CategoryGrid categories={mockCategories} />);
        const chatbotsLink = screen.getByRole('link', { name: /chatbots - 6,355 tools/i });
        expect(chatbotsLink).toBeInTheDocument();
    });

    /**
     * Renders "All Free AI Tools" button
     */
    it('renders All Free AI Tools button', () => {
        render(<CategoryGrid categories={mockCategories} />);
        const allToolsLink = screen.getByRole('link', { name: /all free ai tools/i });
        expect(allToolsLink).toHaveAttribute('href', '/free-ai-tools');
    });

    /**
     * Issue #14, #39: Does not render carousel arrow
     */
    it('does not render non-functional carousel arrow', () => {
        render(<CategoryGrid categories={mockCategories} />);
        // Should not have a "Next categories" button
        expect(screen.queryByRole('button', { name: /next categories/i })).not.toBeInTheDocument();
    });
});
