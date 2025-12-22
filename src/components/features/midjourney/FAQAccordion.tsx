'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { FAQ } from '@/lib/types/prompt';
import { cn } from '@/lib/utils';

interface FAQAccordionProps {
    faqs: FAQ[];
    className?: string;
}

export function FAQAccordion({ faqs, className }: FAQAccordionProps) {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(prev => prev === id ? null : id);
    };

    return (
        <div className={cn("space-y-3", className)}>
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            {faqs.map(faq => (
                <div
                    key={faq.id}
                    className="border border-gray-700 rounded-xl overflow-hidden bg-white/5"
                >
                    <button
                        onClick={() => toggle(faq.id)}
                        className="flex items-center justify-between w-full p-4 text-left hover:bg-white/5 transition-colors"
                    >
                        <span className="font-medium text-white pr-4">{faq.question}</span>
                        {openId === faq.id
                            ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                            : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                        }
                    </button>
                    <div
                        className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            openId === faq.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        )}
                    >
                        <p className="px-4 pb-4 text-gray-400 leading-relaxed">
                            {faq.answer}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
