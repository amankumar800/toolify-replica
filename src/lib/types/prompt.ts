export type AspectRatio = 'portrait' | 'landscape' | 'square';

export interface Prompt {
    id: string;
    imageUrl: string;
    promptText: string;
    aspectRatio: AspectRatio;
    tags: string[];
    author: string;
    likes: number;
    dateAdded: string; // ISO
}
