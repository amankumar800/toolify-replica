'use server';

import { getTools } from '@/lib/services/tools.service';

export async function searchToolsAction(query: string) {
    return await getTools({ search: query });
}

export async function filterToolsAction(category: string | undefined, page: number) {
    const limit = 20;
    const offset = (page - 1) * limit;
    return await getTools({ category, limit, offset });
}
