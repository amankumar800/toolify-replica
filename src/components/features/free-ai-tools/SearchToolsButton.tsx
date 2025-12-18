'use client';

/**
 * Search Tools Button Component
 * 
 * A client component that focuses the header search input when clicked.
 * Implements Requirement 12.1: "Search Tools" button on main page focuses header search input
 */

interface SearchToolsButtonProps {
  className?: string;
}

export function SearchToolsButton({ className }: SearchToolsButtonProps) {
  const handleClick = () => {
    // Find the search input in the header and focus it
    const searchInput = document.querySelector<HTMLInputElement>(
      '[data-search-input="header"]'
    );
    
    if (searchInput) {
      // Scroll to top to ensure header is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Focus the input after a short delay to allow scroll to complete
      setTimeout(() => {
        searchInput.focus();
      }, 300);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className || "inline-flex items-center px-6 py-3 bg-gray-100 text-[var(--foreground)] rounded-lg font-medium hover:bg-gray-200 transition-colors"}
    >
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      Search Tools
    </button>
  );
}
