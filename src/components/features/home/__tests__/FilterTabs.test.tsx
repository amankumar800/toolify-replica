import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterTabs } from '../FilterTabs';

// Mock Next.js router
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => mockSearchParams,
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

describe('FilterTabs', () => {
    beforeEach(() => {
        mockPush.mockClear();
        mockSearchParams.delete('filter');
    });

    /**
     * Issue #6: ARIA roles
     */
    it('has proper ARIA roles for accessibility', () => {
        render(<FilterTabs />);

        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Filter tools by category');

        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThan(0);
    });

    /**
     * Issue #6: aria-selected attribute
     */
    it('sets aria-selected on active tab', () => {
        render(<FilterTabs activeTab="new" />);

        const newTab = screen.getByRole('tab', { name: /new/i });
        expect(newTab).toHaveAttribute('aria-selected', 'true');

        const todayTab = screen.getByRole('tab', { name: /today/i });
        expect(todayTab).toHaveAttribute('aria-selected', 'false');
    });

    /**
     * Issue #2: Tab changes trigger onTabChange
     */
    it('calls onTabChange when tab is clicked', async () => {
        const onTabChange = jest.fn();
        render(<FilterTabs onTabChange={onTabChange} syncWithUrl={false} />);

        const newTab = screen.getByRole('tab', { name: /new/i });
        await userEvent.click(newTab);

        expect(onTabChange).toHaveBeenCalledWith('new');
    });

    /**
     * Issue #2: URL sync
     */
    it('updates URL when tab is clicked and syncWithUrl is true', async () => {
        render(<FilterTabs syncWithUrl={true} />);

        const savedTab = screen.getByRole('tab', { name: /most saved/i });
        await userEvent.click(savedTab);

        expect(mockPush).toHaveBeenCalledWith('?filter=most-saved', { scroll: false });
    });

    /**
     * Issue #12: Most Used has checkmark icon
     */
    it('renders checkmark icon for Most Used tab', () => {
        render(<FilterTabs />);

        // CheckCircle2 icon should be present for most-used tab
        const mostUsedTab = screen.getByRole('tab', { name: /most used/i });
        expect(mostUsedTab).toBeInTheDocument();
        // The SVG icon would be inside
        expect(mostUsedTab.querySelector('svg')).toBeInTheDocument();
    });

    /**
     * Default tabs are rendered
     */
    it('renders all default tabs', () => {
        render(<FilterTabs />);

        expect(screen.getByRole('tab', { name: /today/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /new/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /most saved/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /most used/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /browser extension/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /apps/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /discord of ai/i })).toBeInTheDocument();
    });
});
