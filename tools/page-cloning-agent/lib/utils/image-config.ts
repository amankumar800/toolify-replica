/**
 * Image Domain Configuration Utility
 * 
 * Provides functions to manage Next.js image remote patterns configuration.
 * Extracts image domains from URLs and updates next.config.js accordingly.
 * 
 * @module image-config
 * @see Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents a remote pattern configuration for Next.js images
 */
export interface RemotePattern {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
}

/**
 * Result of extracting image domains
 */
export interface ExtractedDomains {
  domains: string[];
  patterns: RemotePattern[];
  invalidUrls: string[];
}

/**
 * Result of updating the Next.js config
 */
export interface UpdateResult {
  success: boolean;
  addedDomains: string[];
  existingDomains: string[];
  errors: string[];
}

/**
 * Extracts the hostname from an image URL
 * Handles various URL formats including CDN paths
 * 
 * @param url - The image URL to extract domain from
 * @returns The hostname or null if invalid
 * 
 * @example
 * extractHostname('https://images.example.com/path/to/image.jpg');
 * // Returns: 'images.example.com'
 */
export function extractHostname(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Handle protocol-relative URLs
    const normalizedUrl = url.startsWith('//') ? `https:${url}` : url;
    
    // Only process absolute URLs
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      return null;
    }

    const parsed = new URL(normalizedUrl);
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

/**
 * Extracts unique image domains from an array of image URLs
 * Captures full absolute URLs including CDN paths
 * 
 * @param imageUrls - Array of image URLs to process
 * @returns Object containing unique domains, patterns, and invalid URLs
 * 
 * @example
 * extractImageDomains([
 *   'https://images.example.com/img1.jpg',
 *   'https://cdn.example.com/img2.png',
 *   'invalid-url'
 * ]);
 * // Returns: { domains: ['images.example.com', 'cdn.example.com'], patterns: [...], invalidUrls: ['invalid-url'] }
 */
export function extractImageDomains(imageUrls: string[]): ExtractedDomains {
  const domainsSet = new Set<string>();
  const patterns: RemotePattern[] = [];
  const invalidUrls: string[] = [];

  for (const url of imageUrls) {
    const hostname = extractHostname(url);
    
    if (hostname) {
      if (!domainsSet.has(hostname)) {
        domainsSet.add(hostname);
        
        // Determine protocol from URL
        const protocol = url.startsWith('http://') ? 'http' : 'https';
        
        patterns.push({
          protocol: protocol as 'http' | 'https',
          hostname,
        });
      }
    } else if (url && typeof url === 'string' && url.trim()) {
      // Only track non-empty strings as invalid
      invalidUrls.push(url);
    }
  }

  return {
    domains: Array.from(domainsSet).sort(),
    patterns: patterns.sort((a, b) => a.hostname.localeCompare(b.hostname)),
    invalidUrls,
  };
}

/**
 * Checks if a domain already exists in the Next.js config
 * 
 * @param domain - The domain to check
 * @param configPath - Path to next.config.js (defaults to project root)
 * @returns True if domain exists in remotePatterns
 */
export function checkDomainExists(domain: string, configPath?: string): boolean {
  const existingDomains = getExistingDomains(configPath);
  return existingDomains.includes(domain);
}

/**
 * Gets the list of existing domains from next.config.js
 * 
 * @param configPath - Path to next.config.js (defaults to project root)
 * @returns Array of existing domain hostnames
 */
export function getExistingDomains(configPath?: string): string[] {
  const resolvedPath = configPath || path.join(process.cwd(), 'next.config.js');
  
  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    return parseDomainsFromConfig(content);
  } catch {
    return [];
  }
}

/**
 * Parses domain hostnames from next.config.js content
 * 
 * @param configContent - The content of next.config.js
 * @returns Array of hostnames found in remotePatterns
 */
export function parseDomainsFromConfig(configContent: string): string[] {
  const domains: string[] = [];
  
  // Match hostname values in remotePatterns
  // Handles both single and double quotes
  const hostnamePattern = /hostname:\s*['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = hostnamePattern.exec(configContent)) !== null) {
    domains.push(match[1]);
  }
  
  return domains;
}

/**
 * Generates a remote pattern entry string for next.config.js
 * 
 * @param pattern - The remote pattern to generate
 * @returns Formatted string for insertion into config
 */
export function generatePatternEntry(pattern: RemotePattern): string {
  const parts = [
    `            {`,
    `                protocol: '${pattern.protocol}',`,
    `                hostname: '${pattern.hostname}',`,
  ];
  
  if (pattern.port) {
    parts.push(`                port: '${pattern.port}',`);
  }
  
  if (pattern.pathname) {
    parts.push(`                pathname: '${pattern.pathname}',`);
  }
  
  parts.push(`            },`);
  
  return parts.join('\n');
}

/**
 * Updates next.config.js to add new image domains
 * Only adds domains that don't already exist
 * 
 * @param domains - Array of domains to add
 * @param configPath - Path to next.config.js (defaults to project root)
 * @returns Result object with success status and details
 * 
 * @example
 * updateNextConfig(['images.newsite.com', 'cdn.newsite.com']);
 * // Updates next.config.js with new remote patterns
 */
export function updateNextConfig(domains: string[], configPath?: string): UpdateResult {
  const resolvedPath = configPath || path.join(process.cwd(), 'next.config.js');
  const result: UpdateResult = {
    success: false,
    addedDomains: [],
    existingDomains: [],
    errors: [],
  };

  try {
    // Read existing config
    let content: string;
    try {
      content = fs.readFileSync(resolvedPath, 'utf-8');
    } catch {
      result.errors.push(`Config file not found: ${resolvedPath}`);
      return result;
    }

    // Get existing domains
    const existingDomains = parseDomainsFromConfig(content);
    
    // Filter out domains that already exist
    const newDomains: string[] = [];
    for (const domain of domains) {
      if (existingDomains.includes(domain)) {
        result.existingDomains.push(domain);
      } else {
        newDomains.push(domain);
      }
    }

    // If no new domains, return success
    if (newDomains.length === 0) {
      result.success = true;
      return result;
    }

    // Generate new pattern entries
    const newEntries = newDomains.map(domain => 
      generatePatternEntry({ protocol: 'https', hostname: domain })
    ).join('\n');

    // Find the insertion point (after remotePatterns: [)
    const insertionPattern = /remotePatterns:\s*\[/;
    const match = insertionPattern.exec(content);
    
    if (!match) {
      result.errors.push('Could not find remotePatterns array in config');
      return result;
    }

    // Insert new entries after the opening bracket
    const insertionIndex = match.index + match[0].length;
    const updatedContent = 
      content.slice(0, insertionIndex) + 
      '\n' + newEntries +
      content.slice(insertionIndex);

    // Write updated config
    fs.writeFileSync(resolvedPath, updatedContent, 'utf-8');
    
    result.success = true;
    result.addedDomains = newDomains;
    
  } catch (error) {
    result.errors.push(`Failed to update config: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Validates that all required domains are configured in next.config.js
 * 
 * @param requiredDomains - Array of domains that must be configured
 * @param configPath - Path to next.config.js (defaults to project root)
 * @returns Object with validation result and missing domains
 */
export function validateDomainConfiguration(
  requiredDomains: string[],
  configPath?: string
): { valid: boolean; missingDomains: string[]; configuredDomains: string[] } {
  const existingDomains = getExistingDomains(configPath);
  const missingDomains = requiredDomains.filter(d => !existingDomains.includes(d));
  
  return {
    valid: missingDomains.length === 0,
    missingDomains,
    configuredDomains: existingDomains,
  };
}

/**
 * Processes image data and ensures all domains are configured
 * Combines extraction and configuration update in one operation
 * 
 * @param imageUrls - Array of image URLs from extracted data
 * @param configPath - Path to next.config.js (defaults to project root)
 * @returns Combined result of extraction and configuration update
 */
export function processImageDomains(
  imageUrls: string[],
  configPath?: string
): { extracted: ExtractedDomains; updated: UpdateResult } {
  const extracted = extractImageDomains(imageUrls);
  const updated = updateNextConfig(extracted.domains, configPath);
  
  return { extracted, updated };
}
