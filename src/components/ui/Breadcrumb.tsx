import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
    items: {
        label: string;
        href?: string;
    }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-toolify-gray-500 mb-6">
            <Link href="/" className="hover:text-toolify-purple-600 transition-colors flex items-center">
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-toolify-purple-600 transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-medium text-toolify-black">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}
