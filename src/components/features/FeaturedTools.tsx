import { getTools } from '@/lib/services/tools.service';
import { ToolGrid } from './ToolGrid';

export async function FeaturedTools() {
    // Deliberate delay is already in getTools (300ms) to demo streaming
    const { tools } = await getTools(undefined, undefined, 1, 12);

    return <ToolGrid initialTools={tools} />;
}
