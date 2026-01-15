import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyToolsSection } from '../MyToolsSection';
import { MyTool } from '@/lib/types/home.types';

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
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// Mock useRouter
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockTools: MyTool[] = [
    { id: '1', name: 'Tool 1', icon: 'https://example.com/icon1.png', url: '/tool/1', color: '#FF0000' },
    { id: '2', name: 'Tool 2', icon: 'https://example.com/icon2.png', url: '/tool/2', color: '#00FF00' },
    { id: '3', name: 'Tool 3', icon: 'https://example.com/icon3.png', url: '/tool/3', color: '#0000FF' },
];

describe('MyToolsSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Issue #36: Empty state
     */
    it('renders empty state when no tools provided', () => {
        render(<MyToolsSection tools={[]} />);
        expect(screen.getByText(/No tools saved yet/i)).toBeInTheDocument();
    });

    /**
     * Issue #36: Renders correct number of tools
     */
    it('renders all provided tools', () => {
        render(<MyToolsSection tools={mockTools} />);
        expect(screen.getByText('Tool 1')).toBeInTheDocument();
        expect(screen.getByText('Tool 2')).toBeInTheDocument();
        expect(screen.getByText('Tool 3')).toBeInTheDocument();
    });

    /**
     * Issue #38: Redirects to login when not authenticated
     */
    it('redirects to login when edit clicked and not authenticated', async () => {
        render(<MyToolsSection tools={mockTools} isAuthenticated={false} />);

        const editButton = screen.getByRole('button', { name: /edit my tools/i });
        await userEvent.click(editButton);

        expect(mockPush).toHaveBeenCalledWith('/login?redirect=/');
    });

    /**
     * Issue #38: Edit button opens modal when authenticated
     * Note: Modal is lazy loaded, so we just verify the click handler works
     */
    it('does not redirect when edit clicked and authenticated', async () => {
        render(<MyToolsSection tools={mockTools} isAuthenticated={true} />);

        const editButton = screen.getByRole('button', { name: /edit my tools/i });
        await userEvent.click(editButton);

        // Should NOT redirect to login when authenticated
        expect(mockPush).not.toHaveBeenCalled();
    });

    /**
     * Issue #8: Alt text for images
     */
    it('has proper alt text for tool icons', () => {
        render(<MyToolsSection tools={mockTools} />);
        expect(screen.getByAltText('Tool 1 icon')).toBeInTheDocument();
        expect(screen.getByAltText('Tool 2 icon')).toBeInTheDocument();
    });

    /**
     * Issue #7: Accessibility - Links have proper aria-labels
     */
    it('tool links have proper aria-labels', () => {
        render(<MyToolsSection tools={mockTools} />);
        expect(screen.getByRole('link', { name: /open tool 1/i })).toBeInTheDocument();
    });
});
