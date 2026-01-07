'use server';

import { getTools } from '@/lib/services/tools.service';
import { globalSearch, quickSearch, type SearchOptions, type SearchResultType } from '@/lib/services/search.service';

export async function searchToolsAction(query: string) {
    return await getTools({ search: query });
}

export async function filterToolsAction(category: string | undefined, page: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    return await getTools({ category, limit, offset });
}

/**
 * Global search action - searches across tools, news, prompts, and categories
 */
export async function globalSearchAction(
    query: string,
    options?: {
        types?: SearchResultType[];
        limit?: number;
        offset?: number;
    }
) {
    return await globalSearch({
        query,
        types: options?.types,
        limit: options?.limit,
        offset: options?.offset,
    });
}

/**
 * Quick search action for typeahead dropdown
 */
export async function quickSearchAction(query: string, limit: number = 8) {
    return await quickSearch(query, limit);
}
