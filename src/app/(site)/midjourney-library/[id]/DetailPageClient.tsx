'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailPageClientProps {
    srefCode: string;
    promptText: string;
}

export function DetailPageClient({ srefCode, promptText }: DetailPageClientProps) {
    const [copiedSref, setCopiedSref] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);

    const handleCopySref = async () => {
        await navigator.clipboard.writeText(`--sref ${srefCode}`);
        setCopiedSref(true);
        setTimeout(() => setCopiedSref(false), 2000);
    };

    const handleCopyPrompt = async () => {
        await navigator.clipboard.writeText(promptText);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    return (
        <div className="space-y-4">
            {/* SREF Code Box */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">SREF Code</span>
                    <button
                        onClick={handleCopySref}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            copiedSref
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/10 text-gray-300 hover:bg-purple-500/20 hover:text-purple-400"
                        )}
                    >
                        {copiedSref ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedSref ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <p className="font-mono text-2xl md:text-3xl font-bold text-white">
                    --sref {srefCode}
                </p>
            </div>

            {/* Full Prompt */}
            <div className="bg-[#1a2333] rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Full Prompt</span>
                    <button
                        onClick={handleCopyPrompt}
                        className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded text-xs transition-all",
                            copiedPrompt
                                ? "bg-green-500/20 text-green-400"
                                : "text-gray-400 hover:text-white"
                        )}
                    >
                        {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedPrompt ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <p className="font-mono text-sm text-gray-300 leading-relaxed">
                    {promptText}
                </p>
            </div>
        </div>
    );
}
