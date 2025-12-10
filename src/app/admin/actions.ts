'use server';

import { createTool, updateTool, deleteTool } from '@/lib/services/admin.service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const ToolSchema = z.object({
    name: z.string().min(2, "Name is required"),
    slug: z.string().min(2, "Slug is required"),
    description: z.string().min(10, "Description must be at least 10 chars"),
    shortDescription: z.string().max(100, "Short description too long").optional(),
    websiteUrl: z.string().url("Invalid URL"),
    image: z.string().url("Invalid Image URL").optional().or(z.literal('')),
    pricing: z.string().default('Freemium'),
});

export async function createToolAction(prevState: unknown, formData: FormData) {
    try {
        const rawData = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            description: formData.get('description'),
            shortDescription: formData.get('shortDescription'),
            websiteUrl: formData.get('websiteUrl'),
            image: formData.get('image'),
            pricing: formData.get('pricing'),
        };

        const validateddev = ToolSchema.parse(rawData);

        // Type casting for known enum values
        const pricing = validateddev.pricing as 'Free' | 'Freemium' | 'Paid' | 'Contact for Pricing';

        await createTool({
            ...validateddev,
            pricing,
            shortDescription: validateddev.shortDescription || '', // Ensure string
            image: validateddev.image || 'https://placehold.co/600x400',
            tags: [],
            categories: []
        });

        revalidatePath('/admin/tools');
        revalidatePath('/'); // Update home page
        return { message: 'Tool created successfully' };
    } catch (e) {
        return { message: 'Failed to create tool', error: e };
    }
}

export async function deleteToolAction(id: string) {
    try {
        await deleteTool(id);
        revalidatePath('/admin/tools');
        revalidatePath('/');
    } catch (e) {
        throw new Error("Failed to delete tool");
    }
}
