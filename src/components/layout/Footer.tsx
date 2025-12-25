import Link from 'next/link';
import { Container } from './Container';
import { Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-[var(--border)] bg-[var(--background)] py-12 mt-auto">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="font-bold text-lg mb-4">AI Tools Book</h3>
                        <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm">
                            Discover the best AI tools for your workflow. We curate and review the latest artificial intelligence software to help you stay ahead.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5 text-gray-600" />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" aria-label="LinkedIn">
                                <Linkedin className="w-5 h-5 text-gray-600" />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" aria-label="Facebook">
                                <Facebook className="w-5 h-5 text-gray-600" />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" aria-label="Instagram">
                                <Instagram className="w-5 h-5 text-gray-600" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
                            <li><Link href="/Best-trending-AI-Tools" className="hover:text-[var(--primary)] transition-colors">Ranking Leaderboard</Link></li>
                            <li><Link href="/midjourney-library" className="hover:text-[var(--primary)] transition-colors">Midjourney Library</Link></li>
                            <li><Link href="/submit" className="hover:text-[var(--primary)] transition-colors">Submit Tool</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Resources</h4>
                        <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Newsletter</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Community</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Help Center</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Contact</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--muted-foreground)]">
                    <div>
                        &copy; {new Date().getFullYear()} AI Tools Book. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-[var(--primary)]">Privacy</a>
                        <a href="#" className="hover:text-[var(--primary)]">Terms</a>
                        <a href="#" className="hover:text-[var(--primary)]">Cookies</a>
                    </div>
                </div>
            </Container>
        </footer>
    );
}
