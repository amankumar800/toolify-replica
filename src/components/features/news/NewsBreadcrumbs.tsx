import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface NewsBreadcrumbsProps {
    currentPage?: string;
}

export function NewsBreadcrumbs({ currentPage = "AI News Hub" }: NewsBreadcrumbsProps) {
    return (
        <nav className="flex items-center text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">
                Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-foreground font-medium">{currentPage}</span>
        </nav>
    );
}
