import Link from 'next/link';
import { Container } from './Container';
import { getSocialPlatformIcon, SOCIAL_PLATFORMS } from '@/lib/utils/icon-mapping';
import { getSocialLinks } from '@/lib/services/social-links.service';

export async function Footer() {
    const linksData = await getSocialLinks();

    // Get active social links (platforms with non-empty URLs)
    const activeSocialLinks = SOCIAL_PLATFORMS.filter(
        (platform) => linksData.socialLinks[platform] && linksData.socialLinks[platform]!.trim() !== ''
    );

    return (
        <footer className="border-t border-[var(--border)] bg-[var(--background)] py-12 mt-auto">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="font-bold text-lg mb-4">AI Tools Book</h3>
                        <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm">
                            Discover the best AI tools for your workflow. We curate and review the latest artificial intelligence software to help you stay ahead.
                        </p>
                        {activeSocialLinks.length > 0 && (
                            <div className="flex gap-4">
                                {activeSocialLinks.map((platform) => {
                                    const Icon = getSocialPlatformIcon(platform);
                                    const url = linksData.socialLinks[platform];
                                    if (!Icon || !url) return null;
                                    
                                    return (
                                        <a
                                            key={platform}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                            aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                        >
                                            <Icon className="w-5 h-5 text-gray-600" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
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
                            <li><Link href="/ai-news" className="hover:text-[var(--primary)] transition-colors">Blog</Link></li>
                            <li><Link href="/ai-news#newsletter" className="hover:text-[var(--primary)] transition-colors">Newsletter</Link></li>
                            {linksData.externalLinks.community && (
                                <li>
                                    <a 
                                        href={linksData.externalLinks.community} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hover:text-[var(--primary)] transition-colors"
                                        data-testid="footer-community-link"
                                    >
                                        Community
                                    </a>
                                </li>
                            )}
                            {linksData.externalLinks.help_center && (
                                <li>
                                    <a 
                                        href={linksData.externalLinks.help_center} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hover:text-[var(--primary)] transition-colors"
                                        data-testid="footer-help-center-link"
                                    >
                                        Help Center
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
                            <li><Link href="/about" className="hover:text-[var(--primary)] transition-colors" data-testid="footer-about-link">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-[var(--primary)] transition-colors" data-testid="footer-contact-link">Contact</Link></li>
                            <li><Link href="/privacy" className="hover:text-[var(--primary)] transition-colors" data-testid="footer-privacy-link">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-[var(--primary)] transition-colors" data-testid="footer-terms-link">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--muted-foreground)]">
                    <div>
                        &copy; {new Date().getFullYear()} AI Tools Book. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-[var(--primary)]">Privacy</Link>
                        <Link href="/terms" className="hover:text-[var(--primary)]">Terms</Link>
                        <a href="#" className="hover:text-[var(--primary)]">Cookies</a>
                    </div>
                </div>
            </Container>
        </footer>
    );
}
