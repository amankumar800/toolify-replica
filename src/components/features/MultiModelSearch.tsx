'use client';

import { useState } from 'react';
import { Search, Sparkles, MessageSquare, Globe, Zap, Database } from 'lucide-react';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper if @/lib/utils is missing, but usually create-next-app adds it. 
// I'll define a local one just in case or rely on imports.
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

type ModelTab = {
    id: string;
    label: string;
    icon: React.ElementType;
    placeholder: string;
    color: string;
};

const TABS: ModelTab[] = [
    { id: 'aitoolsbook', label: 'AI Tools Book', icon: Database, placeholder: 'Search 10,000+ AI Tools...', color: 'text-blue-600' },
    { id: 'chatgpt', label: 'ChatGPT', icon: MessageSquare, placeholder: 'Ask ChatGPT anything...', color: 'text-green-600' },
    { id: 'perplexity', label: 'Perplexity', icon: Globe, placeholder: 'Ask Perplexity...', color: 'text-teal-600' },
    { id: 'claude', label: 'Claude', icon: Sparkles, placeholder: 'Ask Claude...', color: 'text-orange-600' },
    { id: 'google', label: 'Google', icon: Zap, placeholder: 'Ask Google Gemini...', color: 'text-blue-500' },
];

export function MultiModelSearch({ className }: { className?: string }) {
    const [activeTab, setActiveTab] = useState('aitoolsbook');
    const activeModel = TABS.find(t => t.id === activeTab) || TABS[0];

    return (
        <div className={cn("w-full max-w-4xl mx-auto", className)}>
            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                                isActive
                                    ? "bg-white border-transparent shadow-md text-gray-900 ring-1 ring-black/5"
                                    : "bg-white/50 border-transparent hover:bg-white/80 text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? tab.color : "text-gray-400")} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Search Input */}
            <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
                <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden p-2">
                    <div className="pl-4 pr-3 text-gray-400">
                        <Search className="w-6 h-6" />
                    </div>
                    <input
                        type="text"
                        className="w-full py-3 px-2 text-lg text-gray-900 placeholder:text-gray-400 bg-transparent border-none focus:ring-0 focus:outline-none"
                        placeholder={activeModel.placeholder}
                    />
                    <button className="hidden sm:flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                        Search
                    </button>
                    <button className="sm:hidden p-3 bg-gray-900 text-white rounded-xl">
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Helper Text */}
            <div className="mt-4 text-center text-sm text-[var(--muted-foreground)] opacity-80">
                {activeTab === 'aitoolsbook' && (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        27,558 AIs and 459 categories updated daily
                    </span>
                )}
            </div>
        </div>
    );
}
