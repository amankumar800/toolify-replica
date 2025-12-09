'use server';

import { searchTools, getTools } from '@/lib/services/tools.service';

export async function searchToolsAction(query: string) {
    return await searchTools(query);
}

export async function filterToolsAction(category: string | undefined, page: number) {
    return await getTools(undefined, category, page);
}
