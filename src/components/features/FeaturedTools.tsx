import { getTools } from '@/lib/services/tools.service';
import { ToolGrid } from './ToolGrid';

export async function FeaturedTools() {
    const tools = await getTools({ limit: 12 });

    return <ToolGrid initialTools={tools} />;
}
