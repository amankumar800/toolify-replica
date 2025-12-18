'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  className?: string;
}

/**
 * AdBanner Component
 * 
 * Displays a sponsored content banner at the top of the CategorySidebar.
 * Per Requirement 3.7: Display AD_Banner with avatar, name, description, and CTA.
 */
export function AdBanner({ className }: AdBannerProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border border-[var(--border)] bg-gradient-to-br from-purple-50 to-white p-4 cursor-pointer hover:shadow-md transition-shadow',
        'focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2',
        className
      )}
      onClick={() => window.open('https://crepal.ai?utm_source=toolify', '_blank', 'noopener,noreferrer')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open('https://crepal.ai?utm_source=toolify', '_blank', 'noopener,noreferrer');
        }
      }}
      aria-label="Sponsored: CrePal AI - Get Started Now"
    >
      {/* AD Badge */}
      <span className="absolute top-2 right-2 text-[10px] font-medium text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
        AD
      </span>

      {/* Content */}
      <div className="flex flex-col gap-3">
        {/* Avatar and Name */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--muted)] flex-shrink-0">
            <Image
              src="/globe.svg"
              alt="CrePal AI Avatar"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <span className="font-semibold text-sm text-[var(--foreground)]">
            CrePal AI
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          All-in-one AI video agent that helps you create viral AI videos
        </p>

        {/* CTA Button */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">
          <span>Get Started Now</span>
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
