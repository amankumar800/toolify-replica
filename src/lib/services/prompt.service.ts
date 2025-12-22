import { Prompt, AspectRatio, PromptType, FilterGroup, FAQ } from '@/lib/types/prompt';
import { cache } from 'react';

// Categories for midjourney styles
const CATEGORIES = [
    'Illustration', 'Photorealistic', 'Anime', '3D Render',
    'Logo Design', 'UI Design', 'Architecture', 'Fantasy',
    'Portrait', 'Abstract', 'Vintage', 'Minimalist'
];

// Style titles for more realistic display
const STYLE_TITLES = [
    'Pop Graphic', 'Neo Expressionism', 'Ethereal Dreams', 'Cyberpunk Noir',
    'Soft Watercolor', 'Bold Vector', 'Vintage Film', 'High Fashion',
    'Digital Surrealism', 'Clean Minimalist', 'Anime Aesthetic', 'Dark Fantasy'
];

// Mock specific Midjourney-style images
const MOCK_IMAGES = [
    'https://images.unsplash.com/photo-1549880338-65ddcdfd017b',
    'https://images.unsplash.com/photo-1550064824-8f993041ffd3',
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968'
];

const MOCK_PROMPTS_TEXT = [
    "Cyberpunk city street at night, neon rain, reflecting puddles, cinematic lighting --ar 16:9 --v 5.2",
    "Portrait of an elderly warrior, scarred face, intricate armor details, soft natural lighting --style raw",
    "Isometric 3D render of a cozy cottage in the woods, clay texture, vibrant colors, sunshine",
    "Oil painting of a storm at sea, dramatic waves, dark clouds, lightning striking a lighthouse",
    "Minimalist logo design for a tech startup, geometric shapes, blue and white color palette, vector style",
    "Ethereal forest scene with bioluminescent plants, mist, magical atmosphere, fantasy art style",
    "Futuristic spacecraft interior, clean white surfaces, holographic displays, sci-fi concept art",
    "Vintage photograph of a jazz club in the 1920s, sepia tones, moody lighting, elegant patrons"
];

const STYLE_DESCRIPTIONS = [
    "This aesthetic is characterized by high saturation, bold color blocking, and graphic elements reminiscent of pop art movements.",
    "Features soft, dreamlike qualities with ethereal lighting and a sense of otherworldly beauty.",
    "A dark, atmospheric style with neon accents, urban decay, and futuristic technology elements.",
    "Warm, organic textures with handcrafted appearance and natural color palettes.",
    "Clean lines, geometric precision, and a focus on negative space and simplicity.",
    "Rich, vibrant colors with dynamic compositions and expressive brushwork.",
    "Moody, cinematic lighting with film grain and vintage color grading.",
    "Ultra-detailed, hyperrealistic rendering with perfect lighting and textures."
];

const TAGS_POOL = [
    'vibrant', 'moody', 'cinematic', 'ethereal', 'minimalist', 'detailed',
    'abstract', 'realistic', 'fantasy', 'sci-fi', 'vintage', 'modern',
    'dark', 'bright', 'colorful', 'monochrome', 'soft', 'sharp',
    'organic', 'geometric', 'surreal', 'natural', 'urban', 'peaceful'
];

// Generate deterministic SREF codes
const generateSrefCode = (index: number): string => {
    return String(1000000000 + (index * 12345678) % 9000000000);
};

// Deterministic mock generation
const generatePrompts = (count: number = 100): Prompt[] => {
    return Array.from({ length: count }).map((_, i) => {
        const imageIndex = i % MOCK_IMAGES.length;
        const promptIndex = i % MOCK_PROMPTS_TEXT.length;
        const categoryIndex = i % CATEGORIES.length;
        const styleIndex = i % STYLE_TITLES.length;
        const descIndex = i % STYLE_DESCRIPTIONS.length;
        const aspectRatio: AspectRatio = (i % 3 === 0) ? 'portrait' : (i % 3 === 1 ? 'landscape' : 'square');
        const type: PromptType = i % 2 === 0 ? 'sref' : 'prompt';

        // Generate 3-5 tags per prompt
        const tagCount = 3 + (i % 3);
        const tags = Array.from({ length: tagCount }).map((_, j) =>
            TAGS_POOL[(i + j) % TAGS_POOL.length]
        );

        // Generate gallery images
        const galleryImages = Array.from({ length: 4 }).map((_, j) =>
            `${MOCK_IMAGES[(imageIndex + j) % MOCK_IMAGES.length]}?w=600&q=80`
        );

        return {
            id: `prompt-${i}`,
            imageUrl: `${MOCK_IMAGES[imageIndex]}?w=800&q=80`,
            promptText: MOCK_PROMPTS_TEXT[promptIndex],
            srefCode: type === 'sref' ? generateSrefCode(i) : undefined,
            styleTitle: `${STYLE_TITLES[styleIndex]} ${Math.floor(i / STYLE_TITLES.length) + 1}`,
            styleDescription: STYLE_DESCRIPTIONS[descIndex],
            category: CATEGORIES[categoryIndex],
            type,
            aspectRatio,
            tags,
            author: `Artist${1000 + i}`,
            likes: 100 + (i * 7) % 500,
            views: 1000 + (i * 23) % 5000,
            dateAdded: new Date(Date.now() - (i * 3600000)).toISOString(),
            galleryImages
        };
    });
};

const getDatabase = cache(() => {
    return generatePrompts(100);
});

// Tag counts for the tag cloud
export const getTagCounts = cache(async (): Promise<{ tag: string; count: number }[]> => {
    const prompts = getDatabase();
    const tagCounts = new Map<string, number>();

    prompts.forEach(prompt => {
        prompt.tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
    });

    return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
});

// Category counts
export const getCategoryCounts = cache(async (): Promise<{ category: string; count: number }[]> => {
    const prompts = getDatabase();
    const categoryCounts = new Map<string, number>();

    prompts.forEach(prompt => {
        categoryCounts.set(prompt.category, (categoryCounts.get(prompt.category) || 0) + 1);
    });

    return Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
});

// Filter groups for advanced filters modal
export const getFilterGroups = cache(async (): Promise<FilterGroup[]> => {
    return [
        {
            id: 'genre',
            name: 'Art Genre & Theme',
            categories: [
                { id: 'illustration', name: 'Illustration', count: 5340 },
                { id: 'photography', name: 'Photography', count: 4280 },
                { id: 'abstract', name: 'Abstract', count: 3120 },
                { id: 'portrait', name: 'Portrait', count: 2890 },
                { id: 'landscape', name: 'Landscape', count: 2450 }
            ]
        },
        {
            id: 'movement',
            name: 'Art Movement & Period',
            categories: [
                { id: 'modern', name: 'Modern', count: 4120 },
                { id: 'contemporary', name: 'Contemporary', count: 3890 },
                { id: 'renaissance', name: 'Renaissance', count: 1230 },
                { id: 'impressionism', name: 'Impressionism', count: 980 },
                { id: 'surrealism', name: 'Surrealism', count: 850 }
            ]
        },
        {
            id: 'medium',
            name: 'Medium & Technique',
            categories: [
                { id: 'digital', name: 'Digital Art', count: 6780 },
                { id: 'oil-painting', name: 'Oil Painting', count: 2340 },
                { id: 'watercolor', name: 'Watercolor', count: 1890 },
                { id: '3d-render', name: '3D Render', count: 3450 },
                { id: 'vector', name: 'Vector Art', count: 1120 }
            ]
        },
        {
            id: 'style',
            name: 'Visual Style',
            categories: [
                { id: 'vibrant', name: 'Vibrant', count: 2635 },
                { id: 'moody', name: 'Moody', count: 2180 },
                { id: 'minimal', name: 'Minimalist', count: 1890 },
                { id: 'cinematic', name: 'Cinematic', count: 1670 },
                { id: 'ethereal', name: 'Ethereal', count: 1230 }
            ]
        }
    ];
});

// FAQs
export const getFAQs = cache(async (): Promise<FAQ[]> => {
    return [
        {
            id: 'what-is-sref',
            question: 'What are Midjourney SREF codes?',
            answer: 'SREF (Style Reference) codes are unique identifiers in Midjourney that allow you to apply a specific aesthetic style to your generations. Simply add --sref [code] to your prompt to use a style.'
        },
        {
            id: 'how-to-use',
            question: 'How do I use these styles in Midjourney?',
            answer: 'Copy the SREF code or full prompt, paste it into Midjourney, and add your own subject description. For example: "a cat in a garden --sref 1234567890" will apply that style to your cat image.'
        },
        {
            id: 'aspect-ratios',
            question: 'What aspect ratios work best?',
            answer: 'The aspect ratio depends on your use case. Use --ar 16:9 for landscapes and wallpapers, --ar 1:1 for social media posts, --ar 9:16 for mobile wallpapers, and --ar 3:4 for portraits.'
        },
        {
            id: 'version',
            question: 'Which Midjourney version should I use?',
            answer: 'Most SREF codes work best with Midjourney v5.2 or v6. Some styles may produce different results on different versions, so experiment to find what works best for your needs.'
        }
    ];
});

export const getPrompts = cache(async (count: number = 20): Promise<Prompt[]> => {
    const prompts = getDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
    return prompts.slice(0, count);
});

export const getPromptsByType = cache(async (type: PromptType, count: number = 50): Promise<Prompt[]> => {
    const prompts = getDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
    return prompts.filter(p => p.type === type).slice(0, count);
});

export const getPromptsByCategory = cache(async (category: string, count: number = 50): Promise<Prompt[]> => {
    const prompts = getDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
    return prompts.filter(p => p.category.toLowerCase() === category.toLowerCase()).slice(0, count);
});

export const getPromptsByTag = cache(async (tag: string, count: number = 50): Promise<Prompt[]> => {
    const prompts = getDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
    return prompts.filter(p => p.tags.includes(tag.toLowerCase())).slice(0, count);
});

export const searchPrompts = cache(async (query: string): Promise<Prompt[]> => {
    const prompts = getDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
    const lowerQuery = query.toLowerCase();
    return prompts.filter(p =>
        p.promptText.toLowerCase().includes(lowerQuery) ||
        p.styleTitle?.toLowerCase().includes(lowerQuery) ||
        p.tags.some(t => t.includes(lowerQuery)) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
});

export const getPromptById = cache(async (id: string): Promise<Prompt | undefined> => {
    const prompts = getDatabase();
    await new Promise(resolve => setTimeout(resolve, 50));
    return prompts.find(p => p.id === id);
});

export const getRelatedPrompts = cache(async (prompt: Prompt): Promise<Prompt[]> => {
    const prompts = getDatabase();
    return prompts
        .filter(p => p.id !== prompt.id && (p.category === prompt.category || p.tags.some(t => prompt.tags.includes(t))))
        .slice(0, 6);
});

export const getAdjacentPrompts = cache(async (currentId: string): Promise<{ prev: Prompt | null; next: Prompt | null }> => {
    const prompts = getDatabase();
    const currentIndex = prompts.findIndex(p => p.id === currentId);

    return {
        prev: currentIndex > 0 ? prompts[currentIndex - 1] : null,
        next: currentIndex < prompts.length - 1 ? prompts[currentIndex + 1] : null
    };
});
