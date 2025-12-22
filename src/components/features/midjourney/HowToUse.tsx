'use client';

import { Palette, Clipboard, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HowToUseProps {
    className?: string;
}

export function HowToUse({ className }: HowToUseProps) {
    const steps = [
        {
            icon: Palette,
            title: 'Choose a Style',
            description: 'Browse our library and find the perfect aesthetic for your project'
        },
        {
            icon: Clipboard,
            title: 'Copy the Code',
            description: 'Click the copy button to copy the SREF code or full prompt'
        },
        {
            icon: Lightbulb,
            title: 'Create Art',
            description: 'Paste into Midjourney with your subject and generate amazing art'
        }
    ];

    return (
        <div className={cn("py-8", className)}>
            <h3 className="text-lg font-semibold text-white mb-6 text-center">How to Use</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                    <div
                        key={step.title}
                        className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-colors"
                    >
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                            <step.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-sm text-purple-400 font-medium mb-2">Step {index + 1}</div>
                        <h4 className="text-white font-semibold mb-2">{step.title}</h4>
                        <p className="text-gray-400 text-sm">{step.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
