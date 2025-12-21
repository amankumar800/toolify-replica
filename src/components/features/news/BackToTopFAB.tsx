"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToTopFABProps {
    threshold?: number; // Fix #11: Configurable threshold
}

export function BackToTopFAB({ threshold = 400 }: BackToTopFABProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Fix #6: Throttle scroll listener using requestAnimationFrame
    useEffect(() => {
        let ticking = false;

        const toggleVisibility = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsVisible(window.scrollY > threshold);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", toggleVisibility, { passive: true });
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, [threshold]);

    const scrollToTop = useCallback(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }, []);

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-6 right-6 z-50 p-3 rounded-full",
                "bg-primary text-primary-foreground shadow-lg",
                "hover:bg-primary/90 hover:scale-110",
                "transition-all duration-300 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
            )}
            aria-label="Back to top"
        >
            <ArrowUp className="w-5 h-5" />
        </button>
    );
}
