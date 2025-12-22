'use client';

import { Twitter, Facebook, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialShareProps {
    url?: string;
    title?: string;
    className?: string;
}

export function SocialShare({ url, title, className }: SocialShareProps) {
    const [copied, setCopied] = useState(false);

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = title || 'Check out this Midjourney style!';

    const handleTwitterShare = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const handleFacebookShare = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const buttonClass = "flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110";

    return (
        <div className={cn("flex gap-2", className)}>
            <button
                onClick={handleTwitterShare}
                className={buttonClass}
                aria-label="Share on Twitter"
            >
                <Twitter className="w-4 h-4 text-white" />
            </button>
            <button
                onClick={handleFacebookShare}
                className={buttonClass}
                aria-label="Share on Facebook"
            >
                <Facebook className="w-4 h-4 text-white" />
            </button>
            <button
                onClick={handleCopyLink}
                className={cn(buttonClass, copied && "bg-green-500/20")}
                aria-label="Copy link"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                ) : (
                    <Link2 className="w-4 h-4 text-white" />
                )}
            </button>
        </div>
    );
}
