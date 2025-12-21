import { render, screen } from '@testing-library/react';
import { CompactToolCard } from '../CompactToolCard';
import { FeaturedTool } from '@/lib/types/home.types';

// Mock Next.js components
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ alt, onError, ...props }: { alt: string; onError?: () => void }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={alt} onError={onError} {...props} />
    ),
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

const mockTool: FeaturedTool = {
    id: 'test-tool',
    name: 'Test Tool',
    icon: 'https://example.com/icon.png',
    iconBgColor: '#E8F5E9',
    description: 'A test tool description for testing purposes.',
    isFree: false,
    slug: 'test-tool',
    websiteUrl: 'https://testtool.com',
};

describe('CompactToolCard', () => {
    /**
     * Renders tool name
     */
    it('renders tool name', () => {
        render(<CompactToolCard {...mockTool} />);
        expect(screen.getByText('Test Tool')).toBeInTheDocument();
    });

    /**
     * Renders tool description
     */
    it('renders tool description', () => {
        render(<CompactToolCard {...mockTool} />);
        expect(screen.getByText(/A test tool description/i)).toBeInTheDocument();
    });

    /**
     * Links to correct tool page
     */
    it('links to correct tool page', () => {
        render(<CompactToolCard {...mockTool} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/tool/test-tool');
    });

    /**
     * Issue #1: Shows Free badge when isFree is true
     */
    it('shows Free badge when isFree is true', () => {
        render(<CompactToolCard {...mockTool} isFree={true} />);
        expect(screen.getByText('Free')).toBeInTheDocument();
    });

    /**
     * Does not show Free badge when isFree is false
     */
    it('does not show Free badge when isFree is false', () => {
        render(<CompactToolCard {...mockTool} isFree={false} />);
        expect(screen.queryByText('Free')).not.toBeInTheDocument();
    });

    /**
     * Issue #8: Has proper alt text
     */
    it('has proper alt text for icon', () => {
        render(<CompactToolCard {...mockTool} />);
        expect(screen.getByAltText('Test Tool AI tool icon')).toBeInTheDocument();
    });

    /**
     * Issue #7: Has proper aria-label
     */
    it('has proper aria-label for accessibility', () => {
        render(<CompactToolCard {...mockTool} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('aria-label', expect.stringContaining('Test Tool'));
    });

    /**
     * Issue #7: Has proper aria-label indicating Free status
     */
    it('aria-label indicates Free status', () => {
        render(<CompactToolCard {...mockTool} isFree={true} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('aria-label', expect.stringContaining('Free'));
    });
});
