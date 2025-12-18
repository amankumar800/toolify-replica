---
inclusion: manual
---

# Page Cloning Agent

> **Full instructions:** See #[[file:tools/page-cloning-agent/README.md]]

## Quick Command
```
Clone [URL] to [feature-name]
```

## Example
```
Clone https://toolify.ai/free-ai-tools/chatbots to chatbots
```

## 5-Phase Process

1. **Navigate & Analyze**
   - Open URL with browser tools
   - Handle bot protection (wait for CAPTCHA)
   - Scroll to load lazy content
   - Identify page type (list/detail/form)

2. **Extract Data**
   - Extract text, images, links, metadata
   - Try API interception for dynamic sites
   - Handle pagination if needed
   - Sanitize all content

3. **Plan Implementation**
   - Determine route structure (static/dynamic)
   - Plan file organization
   - Reference existing services

4. **Implement**
   - Create TypeScript types
   - Create data service
   - Create page + loading + error
   - Create components

5. **Verify & Iterate**
   - Check TypeScript errors
   - Compare with source visually
   - Fix issues (max 5 iterations)

## Files Created
```
src/app/(site)/{feature}/page.tsx      # Page
src/app/(site)/{feature}/loading.tsx   # Loading skeleton
src/app/(site)/{feature}/error.tsx     # Error boundary
src/app/(site)/{feature}/[slug]/       # Dynamic route (if needed)
src/data/{feature}/{slug}.json         # Extracted data
src/lib/types/{feature}.ts             # TypeScript types
src/lib/services/{feature}.service.ts  # Data service
src/components/features/{feature}/     # Components
```

## Key References
- #[[file:tools/page-cloning-agent/README.md]] - Complete instructions
- #[[file:.kiro/specs/page-cloning-agent/design.md]] - Architecture
- #[[file:tools/page-cloning-agent/lib/services/page-cloning-analyze.service.ts]] - Analysis
- #[[file:tools/page-cloning-agent/lib/services/page-cloning-extract.service.ts]] - Extraction
- #[[file:tools/page-cloning-agent/lib/services/page-cloning-plan.service.ts]] - Planning
- #[[file:tools/page-cloning-agent/lib/services/page-cloning-verify.service.ts]] - Verification
- #[[file:tools/page-cloning-agent/lib/services/page-cloning-progress.service.ts]] - Progress tracking
- #[[file:tools/page-cloning-agent/lib/utils/sanitize.ts]] - Content sanitization
- #[[file:tools/page-cloning-agent/lib/utils/cloning-errors.ts]] - Error handling

## Requirements
- Next.js Image for images (add domains to next.config.js)
- Next.js Link for internal links
- External links: `target="_blank" rel="noopener noreferrer"`
- Tailwind CSS for styling
- Responsive design (mobile-first)
- SEO metadata (title, description, OG tags)
- Loading skeleton + Error boundary
- TypeScript with proper types
- ISR caching (`revalidate = 3600`)

## Performance Tips
- Virtualize lists with 100+ items
- Split large data files by category
- Use lazy loading for images
