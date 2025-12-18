# Page Cloning Agent

A development tool that automates cloning web pages into Next.js components and data files. This agent analyzes source pages, extracts all data, and implements identical clones following the project's existing patterns and conventions.

## Overview

The Page Cloning Agent is a reusable workflow that enables exact replication of pages from a hosted source website into this Next.js project. When provided with a URL, the agent:

1. **Analyzes** the source page structure using Playwright browser automation
2. **Extracts** all content (text, images, links, metadata) with 100% data completeness
3. **Plans** the implementation using existing project patterns
4. **Implements** React components, data files, and services
5. **Verifies** visual parity and functionality against the source

## Directory Structure

```
tools/page-cloning-agent/
├── README.md                           # This file
└── lib/
    ├── services/
    │   ├── page-cloning.service.ts           # Main orchestrator service
    │   ├── page-cloning.service.test.ts
    │   ├── page-cloning-analyze.service.ts   # Page analysis phase
    │   ├── page-cloning-analyze.service.test.ts
    │   ├── page-cloning-extract.service.ts   # Data extraction phase
    │   ├── page-cloning-extract.service.test.ts
    │   ├── page-cloning-plan.service.ts      # Implementation planning
    │   ├── page-cloning-plan.service.test.ts
    │   ├── page-cloning-verify.service.ts    # Clone verification
    │   ├── page-cloning-verify.service.test.ts
    │   ├── page-cloning-progress.service.ts  # Progress tracking
    │   ├── page-cloning-progress.service.test.ts
    │   ├── rate-limiter.service.ts           # Request rate limiting
    │   ├── rate-limiter.service.test.ts
    │   ├── dependency-resolver.service.ts    # Dependency resolution
    │   └── dependency-resolver.service.test.ts
    ├── utils/
    │   ├── cloning-errors.ts                 # Error classification & recovery
    │   ├── cloning-errors.test.ts
    │   ├── link-utils.ts                     # URL and link handling
    │   ├── link-utils.test.ts
    │   ├── image-config.ts                   # Image configuration
    │   ├── image-config.test.ts
    │   ├── dynamic-content.ts                # Dynamic content detection
    │   ├── dynamic-content.test.ts
    │   ├── changelog.ts                      # Changelog generation
    │   ├── changelog.test.ts
    │   ├── sanitize.ts                       # HTML/XSS sanitization
    │   ├── sanitize.test.ts
    │   ├── seo-generator.ts                  # SEO metadata generation
    │   ├── component-generator.ts            # React component generation
    │   ├── jsdoc-generator.ts                # JSDoc comment generation
    │   ├── jsdoc-generator.test.ts
    │   └── service-generator.ts              # Service layer generation
    └── types/
        ├── page-cloning.ts                   # Core type definitions
        ├── page-cloning.test.ts
        └── page-cloning.schemas.ts           # Zod validation schemas
```

## Usage

### Basic Usage with Orchestrator

```typescript
import { createOrchestrator } from './tools/page-cloning-agent/lib/services/page-cloning.service';

// Create and initialize the orchestrator
const orchestrator = await createOrchestrator({
  sourceUrl: 'https://example.com/page-to-clone',
  featureName: 'my-feature',
  pageSlug: 'page-name',
  isDynamicRoute: false,
  verbose: true,
});

// Execute phases in order
const analyzeResult = await orchestrator.executeAnalyzePhase({
  snapshot: playwrightSnapshot,
  title: pageTitle,
});

const extractResult = await orchestrator.executeExtractPhase({
  html: pageHtml,
});

const planResult = await orchestrator.executePlanPhase();

const implementResult = await orchestrator.executeImplementPhase();
// ... agent creates files based on implementation plan ...
await orchestrator.markImplementPhaseComplete(filesCreated, filesModified);

const verifyResult = await orchestrator.executeVerifyPhase({
  sourceSnapshot,
  cloneSnapshot,
});

// Get final result
const result = await orchestrator.complete();
```

### High-Level Clone Function

```typescript
import { clonePage } from './tools/page-cloning-agent/lib/services/page-cloning.service';

const result = await clonePage(
  {
    sourceUrl: 'https://example.com/page',
    featureName: 'example-feature',
    pageSlug: 'page',
  },
  {
    navigateAndSnapshot: async (url) => {
      // Use Playwright to navigate and capture
      return { snapshot, title, html };
    },
    implementFiles: async (plan, data) => {
      // Create files based on plan
      return { filesCreated, filesModified };
    },
    getCloneSnapshot: async (route) => {
      // Navigate to clone and capture
      return { snapshot, html };
    },
  }
);
```

### Using Individual Services

```typescript
// Analyze a page
import { analyzePage } from './tools/page-cloning-agent/lib/services/page-cloning-analyze.service';
const analysis = analyzePage(snapshot, sourceUrl, title);

// Extract data from HTML
import { extractPageData } from './tools/page-cloning-agent/lib/services/page-cloning-extract.service';
const data = extractPageData(html, sourceUrl);

// Create implementation plan
import { createImplementationPlan } from './tools/page-cloning-agent/lib/services/page-cloning-plan.service';
const plan = createImplementationPlan(analysis, data, options);

// Verify clone against source
import { verifyClone } from './tools/page-cloning-agent/lib/services/page-cloning-verify.service';
const verification = verifyClone(sourceSnapshot, cloneSnapshot);
```

### Error Handling

```typescript
import {
  ScrapingError,
  classifyError,
  getRecoveryStrategy,
  detectCaptcha,
} from './tools/page-cloning-agent/lib/utils/cloning-errors';

// Check for CAPTCHA
if (detectCaptcha(snapshot)) {
  console.log('CAPTCHA detected - manual intervention required');
}

// Classify and handle errors
try {
  // ... cloning operation
} catch (error) {
  const classified = classifyError(error, { phase: 'extract', url });
  const recovery = getRecoveryStrategy(classified);
  
  if (recovery.action === 'retry') {
    // Retry with backoff
  } else if (recovery.action === 'pause') {
    // Wait for user intervention
  }
}
```

### Rate Limiting

```typescript
import { RateLimiter } from './tools/page-cloning-agent/lib/services/rate-limiter.service';

const rateLimiter = new RateLimiter();

// Wait between requests (minimum 2 seconds)
await rateLimiter.waitBetweenRequests();
await navigateToPage(url1);

await rateLimiter.waitBetweenRequests();
await navigateToPage(url2);
```

## Workflow Phases

### 1. Analyze Phase
- Loads page using Playwright browser
- Captures accessibility snapshot for DOM structure
- Identifies sections, interactive elements, and navigation patterns
- Detects responsive breakpoints

### 2. Extract Phase
- Extracts all visible text content with formatting
- Captures image URLs, alt text, and dimensions
- Extracts all links (internal and external)
- Captures metadata (title, description, Open Graph, structured data)
- Sanitizes content to prevent XSS

### 3. Plan Phase
- Analyzes existing project patterns
- Identifies reusable components
- Creates implementation plan with:
  - TypeScript interfaces
  - Data files structure
  - Component hierarchy
  - Service functions
  - Route configuration

### 4. Implement Phase
- Returns implementation plan for agent execution
- Agent creates files using IDE tools (fsWrite, strReplace)
- Tracks created and modified files

### 5. Verify Phase
- Compares clone against source using snapshots
- Verifies visual parity
- Checks for TypeScript/lint errors
- Runs tests
- Iterates with fixes if needed (max 3 attempts)

## Progress Tracking

Progress is saved to `.kiro/specs/page-cloning-agent/progress/{page-slug}.json`:

```json
{
  "sourceUrl": "https://example.com/page",
  "pageSlug": "page",
  "phases": {
    "analyze": { "status": "completed", "timestamp": "..." },
    "extract": { "status": "completed", "timestamp": "..." },
    "plan": { "status": "in_progress", "timestamp": "..." },
    "implement": { "status": "not_started" },
    "verify": { "status": "not_started" }
  },
  "extractedData": { ... },
  "implementationPlan": { ... },
  "filesCreated": [],
  "filesModified": [],
  "errors": []
}
```

Resume interrupted operations:

```typescript
const orchestrator = await createOrchestrator({
  sourceUrl: 'https://example.com/page',
  featureName: 'feature',
  pageSlug: 'page',
  resumeFromProgress: true,  // Resume from saved progress
});
```

## Configuration

### Kiro Steering File

The agent behavior is configured via `.kiro/steering/page-cloning.md`. This file contains:
- Workflow instructions
- File path references to `tools/page-cloning-agent/lib/`
- MCP server orchestration guidelines

### TypeScript Configuration

The `tools/` directory is included in `tsconfig.json`:

```json
{
  "include": ["src/**/*", "tools/**/*"]
}
```

### Test Configuration

Tests are configured in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts']
  }
})
```

## Promoting Utilities to Production

If production code (in `src/`) later requires a utility currently in `tools/page-cloning-agent/`:

### Process

1. **Identify the need**: Document why the utility is needed in production code

2. **Evaluate the utility**: Ensure it's generic enough for production use and doesn't have cloning-specific dependencies

3. **Move the file**: Copy the utility from `tools/page-cloning-agent/lib/utils/` to `src/lib/utils/`
   ```bash
   # Example: promoting sanitize.ts
   cp tools/page-cloning-agent/lib/utils/sanitize.ts src/lib/utils/sanitize.ts
   cp tools/page-cloning-agent/lib/utils/sanitize.test.ts src/lib/utils/sanitize.test.ts
   ```

4. **Update imports in tools/**: Update all imports in `tools/page-cloning-agent/` to reference the new location
   ```typescript
   // Before (in tools/page-cloning-agent/lib/services/...)
   import { sanitizeContent } from '../utils/sanitize';
   
   // After
   import { sanitizeContent } from '@/lib/utils/sanitize';
   ```

5. **Remove the original**: Delete the file from `tools/page-cloning-agent/lib/utils/`

6. **Add documentation**: Add a comment in the promoted utility explaining its origin
   ```typescript
   /**
    * HTML Sanitization Utility
    * 
    * Originally developed for page-cloning-agent, promoted to production
    * for use in user-generated content handling.
    * 
    * @module sanitize
    */
   ```

7. **Update this README**: Note the promotion in the changelog section below

### Candidates for Promotion

Utilities that may be useful in production:
- `sanitize.ts` - HTML sanitization for user content
- `link-utils.ts` - URL validation and transformation
- `image-config.ts` - Next.js image configuration helpers

### Promoted Utilities Log

| Utility | Promoted Date | Reason | New Location |
|---------|---------------|--------|--------------|
| (none yet) | - | - | - |

## Running Tests

```bash
# Run all tests including page-cloning-agent
npm run test

# Run only page-cloning-agent tests
npm run test -- tools/page-cloning-agent

# Run specific service tests
npm run test -- tools/page-cloning-agent/lib/services/page-cloning.service.test.ts
```

## Related Files

- **Spec Files**: `.kiro/specs/page-cloning-agent/` - Requirements, design, and tasks
- **Steering File**: `.kiro/steering/page-cloning.md` - Kiro IDE configuration
- **Progress Files**: `.kiro/specs/page-cloning-agent/progress/` - Saved progress for each clone operation

## Requirements Reference

This tool implements the requirements defined in `.kiro/specs/page-cloning-agent/requirements.md`, including:

- Page Analysis (Req 1)
- Data Extraction (Req 2)
- Project Pattern Analysis (Req 3)
- Component Implementation (Req 4)
- Data Storage (Req 5)
- Visual Parity Verification (Req 6)
- Link Integrity (Req 7)
- SEO and Metadata (Req 8)
- Error Handling (Req 9)
- Quality Assurance (Req 10)
- Workflow Execution (Req 11)
- Rate Limiting (Req 18)
- Dynamic Content Handling (Req 19)
- State Persistence (Req 21)
