import { MetadataRoute } from 'next';
import { getTools, getCategories } from '@/lib/services/tools.service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Static Routes
    const routes = ['', '/submit'].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
    }));

    // Dynamic Tools
    const { tools } = await getTools(undefined, undefined, 1, 1000); // Fetch all for sitemap
    const toolRoutes = tools.map((tool) => ({
        url: `${baseUrl}/tool/${tool.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Dynamic Categories
    const categories = await getCategories();
    const categoryRoutes = categories.map((cat) => ({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    return [...routes, ...categoryRoutes, ...toolRoutes];
}
