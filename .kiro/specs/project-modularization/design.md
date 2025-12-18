# Design Document: Project Modularization

## Overview

This design document outlines the technical approach for separating the page-cloning-agent development tooling from the production codebase. The refactoring will create a clear boundary between production code (src/) and development tools (tools/), improving maintainability and reducing cognitive load when working on features.

## Architecture

### Current State

```
src/
└── lib/
    ├── services/          # Mixed: production + cloning services
    ├── utils/             # Mixed: production + cloning utilities  
    └── types/             # Mixed: production + cloning types
```

### Target State

```
src/
└── lib/
    ├── services/          # Production only: tools, free-ai-tools, admin, auth, prompt
    ├── utils/             # Production only: free-ai-tools-utils, icon-mapping, mock-generator
    ├── types/             # Production only: tool, free-ai-tools, prompt
    └── utils.ts           # Production: cn() utility

tools/
└── page-cloning-agent/
    ├── README.md          # Usage documentation
    └── lib/
        ├── services/      # All page-cloning services + rate-limiter + dependency-resolver
        ├── utils/         # All cloning utilities
        └── types/         # page-cloning types and schemas
```

## Components and Interfaces

### File Movement Plan

#### Services to Move (src/lib/services/ → tools/page-cloning-agent/lib/services/)

| Source File | Target File |
|-------------|-------------|
| page-cloning.service.ts | page-cloning.service.ts |
| page-cloning.service.test.ts | page-cloning.service.test.ts |
| page-cloning-analyze.service.ts | page-cloning-analyze.service.ts |
| page-cloning-analyze.service.test.ts | page-cloning-analyze.service.test.ts |
| page-cloning-extract.service.ts | page-cloning-extract.service.ts |
| page-cloning-extract.service.test.ts | page-cloning-extract.service.test.ts |
| page-cloning-plan.service.ts | page-cloning-plan.service.ts |
| page-cloning-plan.service.test.ts | page-cloning-plan.service.test.ts |
| page-cloning-verify.service.ts | page-cloning-verify.service.ts |
| page-cloning-verify.service.test.ts | page-cloning-verify.service.test.ts |
| page-cloning-progress.service.ts | page-cloning-progress.service.ts |
| page-cloning-progress.service.test.ts | page-cloning-progress.service.test.ts |
| rate-limiter.service.ts | rate-limiter.service.ts |
| rate-limiter.service.test.ts | rate-limiter.service.test.ts |
| dependency-resolver.service.ts | dependency-resolver.service.ts |
| dependency-resolver.service.test.ts | dependency-resolver.service.test.ts |

#### Utilities to Move (src/lib/utils/ → tools/page-cloning-agent/lib/utils/)

| Source File | Target File |
|-------------|-------------|
| cloning-errors.ts | cloning-errors.ts |
| cloning-errors.test.ts | cloning-errors.test.ts |
| link-utils.ts | link-utils.ts |
| link-utils.test.ts | link-utils.test.ts |
| image-config.ts | image-config.ts |
| image-config.test.ts | image-config.test.ts |
| dynamic-content.ts | dynamic-content.ts |
| dynamic-content.test.ts | dynamic-content.test.ts |
| changelog.ts | changelog.ts |
| changelog.test.ts | changelog.test.ts |
| sanitize.ts | sanitize.ts |
| sanitize.test.ts | sanitize.test.ts |
| seo-generator.ts | seo-generator.ts |
| component-generator.ts | component-generator.ts |
| jsdoc-generator.ts | jsdoc-generator.ts |
| jsdoc-generator.test.ts | jsdoc-generator.test.ts |
| service-generator.ts | service-generator.ts |

#### Types to Move (src/lib/types/ → tools/page-cloning-agent/lib/types/)

| Source File | Target File |
|-------------|-------------|
| page-cloning.ts | page-cloning.ts |
| page-cloning.test.ts | page-cloning.test.ts |
| page-cloning.schemas.ts | page-cloning.schemas.ts |

#### Files to Delete

| File | Reason |
|------|--------|
| src/lib/utils/code-generators.test.ts | Orphaned test file with no corresponding source |
| PAGE_CLONING_AGENT.md | Migrated to tools/page-cloning-agent/README.md |

### Kiro Configuration Handling

The following Kiro-specific files remain in their current locations to preserve IDE functionality:

| File/Directory | Action | Notes |
|----------------|--------|-------|
| .kiro/specs/page-cloning-agent/ | Keep in place | Spec files for Kiro IDE |
| .kiro/steering/page-cloning.md | Keep in place, update paths | Steering file with updated file references |

The .kiro/steering/page-cloning.md file will have all file path references updated from `src/lib/` to `tools/page-cloning-agent/lib/`.

### Documentation Updates

#### Project README.md

Add a new section describing the project structure:

```markdown
## Project Structure

### Production Code (src/)
Contains all code that runs in the deployed application:
- `src/app/` - Next.js pages and API routes
- `src/components/` - React components
- `src/lib/` - Core services, utilities, and types

### Development Tools (tools/)
Contains development utilities separate from production:
- `tools/page-cloning-agent/` - Web page cloning automation tool
```

#### tools/page-cloning-agent/README.md

The README must include:
1. Overview and purpose
2. Directory structure diagram:
```
tools/page-cloning-agent/
├── README.md
└── lib/
    ├── services/
    │   ├── page-cloning.service.ts
    │   ├── page-cloning-analyze.service.ts
    │   ├── page-cloning-extract.service.ts
    │   ├── page-cloning-plan.service.ts
    │   ├── page-cloning-verify.service.ts
    │   ├── page-cloning-progress.service.ts
    │   ├── rate-limiter.service.ts
    │   └── dependency-resolver.service.ts
    ├── utils/
    │   ├── cloning-errors.ts
    │   ├── link-utils.ts
    │   ├── image-config.ts
    │   ├── dynamic-content.ts
    │   ├── changelog.ts
    │   ├── sanitize.ts
    │   ├── seo-generator.ts
    │   ├── component-generator.ts
    │   ├── jsdoc-generator.ts
    │   └── service-generator.ts
    └── types/
        ├── page-cloning.ts
        └── page-cloning.schemas.ts
```
3. Usage instructions with correct file paths
4. Process for promoting utilities to production (see Shared Utilities Strategy)

### Shared Utilities Strategy

If production code later requires a utility currently in tools/page-cloning-agent/:

1. **Identify the need**: Document why the utility is needed in production
2. **Move the file**: Copy the utility from `tools/page-cloning-agent/lib/utils/` to `src/lib/utils/`
3. **Update imports**: Update all imports in both tools/ and src/ to reference the new location
4. **Add documentation**: Add a comment in the utility explaining it was promoted from tools/
5. **Update tools README**: Note the promotion in tools/page-cloning-agent/README.md

This process is documented in tools/page-cloning-agent/README.md under a "Promoting Utilities to Production" section.

### Refactoring Summary

Upon completion, a `REFACTORING_SUMMARY.md` file will be created documenting:
- All files moved (source → destination)
- All files deleted (with reasons)
- All files modified (configuration changes)
- Verification results (build, lint, test status)

### Import Path Updates

All imports within the tools/page-cloning-agent directory will use relative paths:

```typescript
// Before (in src/lib/services/page-cloning.service.ts)
import { PageAnalysis } from '../types/page-cloning';
import { sanitizeContent } from '../utils/sanitize';

// After (in tools/page-cloning-agent/lib/services/page-cloning.service.ts)
import { PageAnalysis } from '../types/page-cloning';
import { sanitizeContent } from '../utils/sanitize';
```

The relative paths remain the same since the directory structure is preserved within tools/page-cloning-agent/lib/.

## Data Models

No data model changes required. This is a file organization refactoring only.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Production directories contain no cloning files
*For any* file in src/lib/services/, src/lib/utils/, or src/lib/types/, the filename SHALL NOT contain "page-cloning", "cloning-errors", "rate-limiter", "dependency-resolver", "sanitize", "link-utils", "image-config", "dynamic-content", "changelog", "seo-generator", "component-generator", "jsdoc-generator", or "service-generator"
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Tools directory contains all cloning files
*For any* cloning-related service, utility, or type file, the file SHALL exist in the tools/page-cloning-agent/lib/ directory structure
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Test files are co-located with source files
*For any* source file in tools/page-cloning-agent/lib/ that has a corresponding test, the test file SHALL be in the same directory as the source file
**Validates: Requirements 2.5**

### Property 4: Import paths use relative references
*For any* import statement in files within tools/page-cloning-agent/, if the import references another file within tools/page-cloning-agent/, the import path SHALL be a relative path (starting with ./ or ../)
**Validates: Requirements 3.3**

### Property 5: No orphaned test files exist
*For any* test file (*.test.ts) in the codebase, there SHALL exist a corresponding source file in the same directory
**Validates: Requirements 5.1**

### Property 6: Kiro steering file paths reference tools directory
*For any* file path reference in .kiro/steering/page-cloning.md that points to cloning-related files, the path SHALL reference tools/page-cloning-agent/ instead of src/lib/
**Validates: Requirements 6.3**

## Error Handling

### Build Failures
If TypeScript compilation fails after file movement:
1. Check import paths in moved files
2. Verify tsconfig.json includes tools directory
3. Check for circular dependencies

### Test Failures
If tests fail after file movement:
1. Verify vitest.config.ts includes tools directory patterns
2. Check test file imports reference correct paths
3. Verify mock paths are updated

## Testing Strategy

### Verification Approach

This refactoring uses a verification-based testing approach rather than traditional unit tests:

1. **Build Verification**: Run `npm run build` to verify TypeScript compilation succeeds
2. **Lint Verification**: Run `npm run lint` to verify no import errors
3. **Test Verification**: Run `npm run test` to verify all existing tests pass
4. **Directory Structure Verification**: Script to verify files are in correct locations

### Property-Based Testing

Using fast-check library for property verification:

1. **Directory Content Property**: Verify production directories contain only production files
2. **File Location Property**: Verify all cloning files are in tools directory
3. **Import Path Property**: Verify imports use relative paths within tools directory
4. **Test Co-location Property**: Verify no orphaned test files exist
5. **Steering Path Property**: Verify .kiro/steering paths reference tools/ directory

### Verification Script

A verification script will be created to validate the refactoring:

```typescript
// tools/page-cloning-agent/verify-structure.ts
export function verifyProductionDirectoriesClean(): boolean;
export function verifyCloningFilesInTools(): boolean;
export function verifyImportPaths(): boolean;
export function verifyNoOrphanedTests(): boolean;
export function verifySteeringPaths(): boolean;
```

## Configuration Changes

### tsconfig.json Updates

```json
{
  "include": [
    "src/**/*",
    "tools/**/*"  // Add tools directory
  ]
}
```

### vitest.config.ts Updates

```typescript
export default defineConfig({
  test: {
    include: [
      'src/**/*.test.ts',
      'tools/**/*.test.ts'  // Add tools directory
    ]
  }
})
```

## Migration Steps

1. Create tools/page-cloning-agent/lib/ directory structure
2. Move service files and update imports
3. Move utility files and update imports
4. Move type files and update imports
5. Delete orphaned files (code-generators.test.ts)
6. Migrate PAGE_CLONING_AGENT.md to tools/page-cloning-agent/README.md
7. Add directory structure diagram and usage instructions to README
8. Add "Promoting Utilities to Production" section to README
9. Update tsconfig.json to include tools directory
10. Update vitest.config.ts to include tools directory
11. Update .kiro/steering/page-cloning.md with new paths
12. Update project README.md with structure documentation (src/ vs tools/)
13. Run verification (build, lint, test)
14. Create REFACTORING_SUMMARY.md documenting all changes
