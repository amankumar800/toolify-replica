export type PricingType = 'Free' | 'Freemium' | 'Paid' | 'Free Trial';

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
    verified?: boolean;
    dateAdded?: string; // ISO Date string
}

export type Category = {
    id: string;
    name: string;
    slug: string;
    count: number;
};

export interface CategoryGroup {
    id: string;
    name: string;
    categories: Category[];
}
