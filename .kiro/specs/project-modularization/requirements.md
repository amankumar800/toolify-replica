# Requirements Document

## Introduction

This specification defines the requirements for modularizing the toolify_replica project to achieve clear separation between production code and development tooling. The primary goal is to isolate the page-cloning-agent (a development utility for cloning web pages) from the main production application, making the codebase more maintainable, reducing context overload when working on features, and enabling LLM-assisted development with minimal file context.

## Glossary

- **Production Code**: Code that runs in the deployed application serving end users (src/app, src/components, src/lib for core services)
- **Page Cloning Agent**: A development tool that automates cloning web pages into Next.js components and data files
- **Cloning-Related Files**: Files with names containing "page-cloning", "cloning", or files that exclusively support the page-cloning functionality (rate-limiter, sanitize, link-utils, image-config, etc.)
- **Orphaned Code**: Files that exist in the codebase but are not imported or used by any other file
- **Tools Directory**: A dedicated directory (tools/) at project root for development utilities separate from production source code
- **Modular Architecture**: Code organization where each feature/module is self-contained with minimal cross-dependencies
- **Path Alias**: TypeScript/webpack configuration that maps import paths (e.g., @/ maps to src/)

## Requirements

### Requirement 1

**User Story:** As a senior developer, I want the page-cloning-agent code separated from production code, so that I can work on production features without context overload from development tooling.

#### Acceptance Criteria

1. WHEN a developer navigates to the src/lib/services directory THEN the directory SHALL contain only production services without any files containing "page-cloning" or "cloning" in their names
2. WHEN a developer navigates to the src/lib/utils directory THEN the directory SHALL contain only production utilities without any files containing "page-cloning", "cloning", "sanitize", "link-utils", "image-config", "changelog", "dynamic-content", "seo-generator", "component-generator", "jsdoc-generator", or "service-generator" in their names
3. WHEN a developer navigates to the src/lib/types directory THEN the directory SHALL contain only production types without any files containing "page-cloning" in their names
4. THE src/lib/utils.ts file SHALL remain in src/lib/ as it contains the production cn() utility function

### Requirement 2

**User Story:** As a developer, I want all page-cloning-agent files organized in a dedicated tools directory, so that I can easily locate and work on the cloning functionality in isolation.

#### Acceptance Criteria

1. THE tools/page-cloning-agent/lib/services directory SHALL contain all services with "page-cloning" in their names plus rate-limiter.service.ts and dependency-resolver.service.ts
2. THE tools/page-cloning-agent/lib/utils directory SHALL contain all cloning-related utilities (cloning-errors.ts, link-utils.ts, image-config.ts, dynamic-content.ts, changelog.ts, sanitize.ts, seo-generator.ts, component-generator.ts, jsdoc-generator.ts, service-generator.ts)
3. THE tools/page-cloning-agent/lib/types directory SHALL contain page-cloning.ts and page-cloning.schemas.ts
4. THE tools/page-cloning-agent directory SHALL contain a README.md file migrated from PAGE_CLONING_AGENT.md with updated file paths
5. WHEN test files exist for cloning-related source files THEN the test files SHALL be co-located with their source files in the tools/page-cloning-agent directory

### Requirement 3

**User Story:** As a developer, I want all import paths updated correctly after file relocation, so that the codebase compiles and builds without errors.

#### Acceptance Criteria

1. WHEN TypeScript compilation runs via `npm run build` THEN the compiler SHALL report zero errors
2. WHEN ESLint runs via `npm run lint` THEN the linter SHALL report zero new errors related to import paths
3. WHEN a page-cloning service imports another cloning-related file THEN the import path SHALL use relative paths within tools/page-cloning-agent (not @/ aliases)
4. WHEN the test suite runs via `npm run test` THEN all tests SHALL pass

### Requirement 4

**User Story:** As a developer, I want the project configuration updated to support the new directory structure, so that builds, tests, and linting work correctly with the tools directory.

#### Acceptance Criteria

1. THE tsconfig.json SHALL include the tools directory in the include array for TypeScript compilation
2. THE vitest.config.ts SHALL include test file patterns that match files in the tools directory
3. IF path aliases are needed for the tools directory THEN tsconfig.json SHALL define a @tools/ alias mapping to tools/

### Requirement 5

**User Story:** As a developer, I want orphaned code handled appropriately, so that the codebase remains clean without unused files.

#### Acceptance Criteria

1. WHEN a test file exists without a corresponding source file (e.g., code-generators.test.ts) THEN the test file SHALL be deleted
2. WHEN orphaned cloning-related files are identified THEN the files SHALL be moved to tools/page-cloning-agent with their dependencies
3. THE refactoring process SHALL produce a summary documenting all files moved, deleted, or modified

### Requirement 6

**User Story:** As a developer, I want Kiro-specific configuration files to remain in the .kiro directory, so that Kiro IDE features continue to work correctly.

#### Acceptance Criteria

1. THE .kiro/specs/page-cloning-agent directory SHALL remain in its current location
2. THE .kiro/steering/page-cloning.md file SHALL remain in its current location
3. WHEN file paths are referenced in .kiro/steering/page-cloning.md THEN the paths SHALL be updated to reflect the new tools/page-cloning-agent location

### Requirement 7

**User Story:** As a developer, I want clear documentation of the new project structure, so that team members understand where to find and add code.

#### Acceptance Criteria

1. THE project README.md SHALL include a section describing the separation between src/ (production) and tools/ (development utilities)
2. THE tools/page-cloning-agent/README.md SHALL contain complete usage instructions with correct file paths
3. THE tools/page-cloning-agent/README.md SHALL include a directory structure diagram showing the organization of services, utils, and types

### Requirement 8

**User Story:** As a developer, I want a strategy for handling shared utilities, so that if production code later needs a utility from tools/, there is a clear process.

#### Acceptance Criteria

1. IF a production file requires a utility currently in tools/page-cloning-agent THEN the utility SHALL be moved back to src/lib/utils with appropriate documentation
2. THE tools/page-cloning-agent/README.md SHALL document the process for promoting a utility from tools/ to src/lib/ if needed
