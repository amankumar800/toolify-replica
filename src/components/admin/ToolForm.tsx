'use client';

import { useTransition } from 'react';
import { createToolAction } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ToolForm() {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            await createToolAction(null, formData);
            // In real app, handle success (toast, redirect)
            alert('Tool created!');
        });
    };

    return (
        <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input name="name" id="name" placeholder="ChatGTP" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input name="slug" id="slug" placeholder="chat-gpt" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pricing">Pricing</Label>
                    <Input name="pricing" id="pricing" placeholder="Freemium" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input name="websiteUrl" id="websiteUrl" type="url" placeholder="https://..." required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input name="image" id="image" type="url" placeholder="https://..." />
                <p className="text-xs text-gray-500">For now, just paste an external image URL.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description (Markdown)</Label>
                <textarea
                    name="description"
                    id="description"
                    rows={5}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="# Features..."
                    required
                />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving...' : 'Create Tool'}
            </Button>
        </form>
    );
}
