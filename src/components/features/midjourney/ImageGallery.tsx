'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
    images: string[];
    alt: string;
    className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (!images.length) return null;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Main Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-800">
                <Image
                    src={images[selectedIndex]}
                    alt={`${alt} - Image ${selectedIndex + 1}`}
                    fill
                    className="object-cover transition-opacity duration-300"
                    sizes="(max-width: 768px) 100vw, 600px"
                />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                "relative aspect-square rounded-lg overflow-hidden transition-all duration-200",
                                selectedIndex === index
                                    ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900"
                                    : "opacity-60 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="150px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
