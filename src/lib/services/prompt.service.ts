import { Prompt, AspectRatio } from '@/lib/types/prompt';
import { cache } from 'react';

// Mock specific Midjourney-style images
const MOCK_IMAGES = [
    'https://images.unsplash.com/photo-1549880338-65ddcdfd017b', // Mountain
    'https://images.unsplash.com/photo-1550064824-8f993041ffd3', // Architecture
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e', // Landscape
    'https://placehold.co/800x600?text=Tech', // Technology
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'  // Abstract
];

const MOCK_PROMPTS_TEXT = [
    "Cyberpunk city street at night, neon rain, reflecting puddles, cinematic lighting --ar 16:9 --v 5.2",
    "Portrait of an elderly warrior, scarred face, intricate armor details, soft natural lighting --style raw",
    "Isometric 3D render of a cozy cottage in the woods, clay texture, vibrant colors, sunshine",
    "Oil painting of a storm at sea, dramatic waves, dark clouds, lightning striking a lighthouse",
    "Minimalist logo design for a tech startup, geometric shapes, blue and white color palette, vector style"
];

// Deterministic mock generation
const generatePrompts = (count: number = 50): Prompt[] => {
    return Array.from({ length: count }).map((_, i) => {
        // Deterministic properties
        const imageIndex = i % MOCK_IMAGES.length;
        const promptIndex = i % MOCK_PROMPTS_TEXT.length;
        const aspectRatio: AspectRatio = (i % 3 === 0) ? 'portrait' : (i % 3 === 1 ? 'landscape' : 'square');

        return {
            id: `prompt-${i}`,
            imageUrl: `${MOCK_IMAGES[imageIndex]}?w=800&q=80`,
            promptText: MOCK_PROMPTS_TEXT[promptIndex],
            aspectRatio,
            tags: ['midjourney', 'v5.2', 'realistic', 'art', `style-${i}`],
            author: `User${1000 + i}`,
            likes: 100 + (i * 7) % 500,
            dateAdded: new Date(Date.now() - (i * 3600000)).toISOString()
        };
    });
};

const getDatabase = cache(() => {
    return generatePrompts(100);
});

export const getPrompts = cache(async (count: number = 20): Promise<Prompt[]> => {
    const prompts = getDatabase();
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return prompts.slice(0, count);
});

export const getPromptById = cache(async (id: string): Promise<Prompt | undefined> => {
    const prompts = getDatabase();
    await new Promise(resolve => setTimeout(resolve, 100));
    return prompts.find(p => p.id === id);
});

export const getRelatedPrompts = cache(async (prompt: Prompt): Promise<Prompt[]> => {
    const prompts = getDatabase();
    // Return generic recommendations
    // In real app, match tags or aspect ratio
    return prompts
        .filter(p => p.id !== prompt.id && p.aspectRatio === prompt.aspectRatio)
        .slice(0, 6);
});
