export type PricingType = 'Free' | 'Freemium' | 'Paid' | 'Free Trial' | 'Contact for Pricing';

export interface Tool {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    image: string; // URL
    websiteUrl: string;
    pricing: PricingType;
    categories: string[];
    tags: string[];
    savedCount: number;
    reviewCount: number;
    reviewScore: number; // 0-5
    verified?: boolean; // New: Blue tick support
    isNew?: boolean;    // New: "New" badge
    isFeatured?: boolean; // New: "Fire" icon
    dateAdded?: string; // ISO Date string
}

export type Category = {
    id: string;
    name: string;
    slug: string;
    count: number;
    description?: string;
    // Computed fields
    toolCount?: number;
};

export interface CategoryGroup {
    id: string;
    name: string;
    iconName?: string; // New: Lucide icon mapping key
    categories: Category[];
}
