'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, Search, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MyTool } from '@/lib/types/home.types';
import { FALLBACK_ICON_URL } from '@/lib/constants/home.constants';
import { useDebounce } from '@/hooks/useDebounce';

// =============================================================================
// Constants
// =============================================================================

const MAX_TOOLS = 20;

// =============================================================================
// Types
// =============================================================================

interface AvailableTool {
    id: string;
    name: string;
    slug: string;
    icon: string;
    isFavorited: boolean;
}

interface MyToolsEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTools: MyTool[];
    onToolsChange: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function MyToolsEditModal({
    isOpen,
    onClose,
    currentTools,
    onToolsChange,
}: MyToolsEditModalProps) {
    // =========================================================================
    // State
    // =========================================================================

    const [searchQuery, setSearchQuery] = useState('');
    const [availableTools, setAvailableTools] = useState<AvailableTool[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [localTools, setLocalTools] = useState<MyTool[]>(currentTools);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    const modalRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debouncedSearch = useDebounce(searchQuery, 300);

    // =========================================================================
    // Effects
    // =========================================================================

    // Sync local tools with props
    useEffect(() => {
        setLocalTools(currentTools);
    }, [currentTools]);

    // Fetch available tools
    useEffect(() => {
        if (!isOpen) return;

        const fetchTools = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    q: debouncedSearch,
                    page: page.toString(),
                    limit: '20',
                });

                const res = await fetch(`/api/my-tools/available?${params}`);
                if (!res.ok) throw new Error('Failed to fetch tools');

                const data = await res.json();

                if (page === 1) {
                    setAvailableTools(data.tools);
                } else {
                    setAvailableTools(prev => [...prev, ...data.tools]);
                }
                setHasMore(data.pagination.hasMore);
            } catch (err) {
                setError('Failed to load tools. Please try again.');
                console.error('[MyToolsEditModal] Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTools();
    }, [isOpen, debouncedSearch, page]);

    // Reset on search change
    useEffect(() => {
        setPage(1);
        setAvailableTools([]);
    }, [debouncedSearch]);

    // Focus search input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle ESC key (pattern from DeleteModal)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll (pattern from DeleteModal)
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // =========================================================================
    // Handlers
    // =========================================================================

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    const handleAddTool = useCallback(async (tool: AvailableTool) => {
        if (localTools.length >= MAX_TOOLS) {
            setError(`Maximum ${MAX_TOOLS} tools allowed`);
            return;
        }

        setIsAdding(tool.id);
        setError(null);

        try {
            const res = await fetch('/api/my-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toolId: tool.id, toolName: tool.name }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add tool');
            }

            // Optimistic update
            const newTool: MyTool = {
                id: tool.id,
                name: tool.name,
                icon: tool.icon,
                url: `/tool/${tool.slug}`,
                color: '#4285F4', // Default color, will be updated on refresh
            };
            setLocalTools(prev => [...prev, newTool]);

            // Mark as favorited in available list
            setAvailableTools(prev =>
                prev.map(t => t.id === tool.id ? { ...t, isFavorited: true } : t)
            );

            onToolsChange();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add tool');
        } finally {
            setIsAdding(null);
        }
    }, [localTools.length, onToolsChange]);

    const handleRemoveTool = useCallback(async (toolId: string) => {
        setIsRemoving(toolId);
        setError(null);

        try {
            const res = await fetch(`/api/my-tools?toolId=${encodeURIComponent(toolId)}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove tool');
            }

            // Optimistic update
            setLocalTools(prev => prev.filter(t => t.id !== toolId));

            // Mark as not favorited in available list
            setAvailableTools(prev =>
                prev.map(t => t.id === toolId ? { ...t, isFavorited: false } : t)
            );

            onToolsChange();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove tool');
        } finally {
            setIsRemoving(null);
        }
    }, [onToolsChange]);

    const handleImageError = useCallback((id: string) => {
        setFailedImages(prev => new Set(prev).add(id));
    }, []);

    const handleLoadMore = useCallback(() => {
        setPage(prev => prev + 1);
    }, []);

    // =========================================================================
    // Render
    // =========================================================================

    if (!isOpen) return null;

    const atLimit = localTools.length >= MAX_TOOLS;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-tools-edit-title"
        >
            <div
                ref={modalRef}
                className="w-full max-w-lg max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 id="my-tools-edit-title" className="text-lg font-semibold text-gray-900">
                        Edit My Tools
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Your Tools */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Your Tools ({localTools.length}/{MAX_TOOLS})
                    </h3>
                    {localTools.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                            No tools added yet. Search below to add some!
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {localTools.map(tool => (
                                <div
                                    key={tool.id}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full group"
                                >
                                    <Image
                                        src={failedImages.has(tool.id) ? FALLBACK_ICON_URL : tool.icon}
                                        alt=""
                                        width={16}
                                        height={16}
                                        className="rounded"
                                        onError={() => handleImageError(tool.id)}
                                        unoptimized
                                    />
                                    <span className="text-sm text-gray-700">{tool.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTool(tool.id)}
                                        disabled={isRemoving === tool.id}
                                        className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                        aria-label={`Remove ${tool.name}`}
                                    >
                                        {isRemoving === tool.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="px-6 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search tools to add..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl border-none outline-none text-sm focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1"
                            aria-label="Search tools"
                        />
                    </div>
                </div>

                {/* Available Tools */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        {debouncedSearch ? `Results for "${debouncedSearch}"` : 'Popular Tools'}
                    </h3>

                    {isLoading && availableTools.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : availableTools.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                            {debouncedSearch ? 'No tools found' : 'No tools available'}
                        </p>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                {availableTools.map(tool => {
                                    const isInMyTools = localTools.some(t => t.id === tool.id);
                                    return (
                                        <div
                                            key={tool.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Image
                                                    src={failedImages.has(tool.id) ? FALLBACK_ICON_URL : tool.icon}
                                                    alt=""
                                                    width={32}
                                                    height={32}
                                                    className="rounded-lg flex-shrink-0"
                                                    onError={() => handleImageError(tool.id)}
                                                    unoptimized
                                                />
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {tool.name}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleAddTool(tool)}
                                                disabled={isInMyTools || atLimit || isAdding === tool.id}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                                    isInMyTools
                                                        ? 'bg-green-100 text-green-700 cursor-default'
                                                        : atLimit
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50'
                                                )}
                                                aria-label={isInMyTools ? `${tool.name} already added` : `Add ${tool.name}`}
                                            >
                                                {isAdding === tool.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : isInMyTools ? (
                                                    'Added'
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4" />
                                                        Add
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {hasMore && (
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={isLoading}
                                    className="w-full mt-4 py-2.5 text-sm font-medium text-[var(--primary)] hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : (
                                        'Load More'
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
