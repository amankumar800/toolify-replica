export type AspectRatio = 'portrait' | 'landscape' | 'square';
export type PromptType = 'sref' | 'prompt';

export interface Prompt {
    id: string;
    imageUrl: string;
    promptText: string;
    srefCode?: string;           // e.g., "1200447477"
    styleTitle?: string;         // e.g., "Pop Graphic 3"
    styleDescription?: string;   // Detailed description of the style
    category: string;            // Primary category
    type: PromptType;            // sref or prompt
    aspectRatio: AspectRatio;
    tags: string[];
    author: string;
    likes: number;
    views: number;
    dateAdded: string;           // ISO
    galleryImages?: string[];    // Additional example images
}

export interface FilterCategory {
    id: string;
    name: string;
    count: number;
}

export interface FilterGroup {
    id: string;
    name: string;
    categories: FilterCategory[];
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
}
