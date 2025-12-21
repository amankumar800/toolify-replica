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

const mockTools: MyTool[] = [
    { id: '1', name: 'Tool 1', icon: 'https://example.com/icon1.png', url: '/tool/1', color: '#FF0000' },
    { id: '2', name: 'Tool 2', icon: 'https://example.com/icon2.png', url: '/tool/2', color: '#00FF00' },
    { id: '3', name: 'Tool 3', icon: 'https://example.com/icon3.png', url: '/tool/3', color: '#0000FF' },
];

describe('MyToolsSection', () => {
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
     * Issue #38: Edit button disabled state
     */
    it('shows disabled Edit button when editable is false', () => {
        render(<MyToolsSection tools={mockTools} editable={false} />);
        const editSpan = screen.getByTitle('Login to edit your tools');
        expect(editSpan).toBeInTheDocument();
        expect(editSpan).toHaveClass('cursor-not-allowed');
    });

    /**
     * Issue #38: Edit button functional when editable
     */
    it('shows functional Edit button when editable is true', async () => {
        const onEditClick = jest.fn();
        render(<MyToolsSection tools={mockTools} editable={true} onEditClick={onEditClick} />);

        const editButton = screen.getByRole('button', { name: /edit my tools/i });
        await userEvent.click(editButton);

        expect(onEditClick).toHaveBeenCalledTimes(1);
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
