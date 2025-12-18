# Implementation Plan

- [x] 1. Set up tools directory structure






  - [x] 1.1 Create tools/page-cloning-agent/lib/services/ directory



  - [x] 1.2 Create tools/page-cloning-agent/lib/utils/ directory





  - [x] 1.3 Create tools/page-cloning-agent/lib/types/ directory





  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Move service files to tools directory






  - [x] 2.1 Move page-cloning.service.ts and page-cloning.service.test.ts


  - [x] 2.2 Move page-cloning-analyze.service.ts and page-cloning-analyze.service.test.ts


  - [x] 2.3 Move page-cloning-extract.service.ts and page-cloning-extract.service.test.ts


  - [x] 2.4 Move page-cloning-plan.service.ts and page-cloning-plan.service.test.ts


  - [x] 2.5 Move page-cloning-verify.service.ts and page-cloning-verify.service.test.ts


  - [x] 2.6 Move page-cloning-progress.service.ts and page-cloning-progress.service.test.ts


  - [x] 2.7 Move rate-limiter.service.ts and rate-limiter.service.test.ts


  - [x] 2.8 Move dependency-resolver.service.ts and dependency-resolver.service.test.ts

  - _Requirements: 1.1, 2.1, 2.5_

- [x] 3. Move utility files to tools directory





  - [x] 3.1 Move cloning-errors.ts and cloning-errors.test.ts



  - [x] 3.2 Move link-utils.ts and link-utils.test.ts


  - [x] 3.3 Move image-config.ts and image-config.test.ts

  - [x] 3.4 Move dynamic-content.ts and dynamic-content.test.ts



  - [x] 3.5 Move changelog.ts and changelog.test.ts


  - [x] 3.6 Move sanitize.ts and sanitize.test.ts

  - [x] 3.7 Move seo-generator.ts



  - [x] 3.8 Move component-generator.ts


  - [x] 3.9 Move jsdoc-generator.ts and jsdoc-generator.test.ts


  - [x] 3.10 Move service-generator.ts

  - _Requirements: 1.2, 2.2, 2.5_

- [x] 4. Move type files to tools directory






  - [x] 4.1 Move page-cloning.ts and page-cloning.test.ts


  - [x] 4.2 Move page-cloning.schemas.ts

  - _Requirements: 1.3, 2.3_

- [x] 5. Update import paths in moved files






  - [x] 5.1 Update imports in all service files to use relative paths


  - [x] 5.2 Update imports in all utility files to use relative paths


  - [x] 5.3 Update imports in all type files to use relative paths

  - _Requirements: 3.3_

- [x] 6. Delete orphaned files

  - [x] 6.1 Delete src/lib/utils/code-generators.test.ts (orphaned test file)
  - [x] 6.2 Delete PAGE_CLONING_AGENT.md (will be migrated to tools README)


  - _Requirements: 5.1, 5.2_


- [x] 7. Create tools/page-cloning-agent/README.md





  - [x] 7.1 Migrate content from PAGE_CLONING_AGENT.md with updated file paths


  - [x] 7.2 Add directory structure diagram showing services, utils, and types organization


  - [x] 7.3 Add usage instructions with correct file paths

  - [x] 7.4 Add "Promoting Utilities to Production" section documenting the process


  - _Requirements: 2.4, 7.2, 7.3, 8.2_

- [x] 8. Update project configuration files
  - [x] 8.1 Update tsconfig.json to include tools directory in the include array
  - [x] 8.2 Update vitest.config.ts to include tools/**/*.test.ts pattern
  - _Requirements: 4.1, 4.2_

- [x] 9. Checkpoint - Verify build and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update Kiro steering file
  - [x] 10.1 Update .kiro/steering/page-cloning.md with new file paths referencing tools/page-cloning-agent/
  - _Requirements: 6.3_

- [x] 11. Update project README.md
  - [x] 11.1 Add "Project Structure" section describing separation between src/ (production) and tools/ (development utilities)
  - _Requirements: 7.1_

- [x] 12. Write property-based tests for structure verification
  - [x] 12.1 Write property test for production directories containing no cloning files
    - **Property 1: Production directories contain no cloning files**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [x] 12.2 Write property test for tools directory containing all cloning files
    - **Property 2: Tools directory contains all cloning files**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  - [x] 12.3 Write property test for test file co-location
    - **Property 3: Test files are co-located with source files**
    - **Validates: Requirements 2.5**
  - [x] 12.4 Write property test for import paths using relative references
    - **Property 4: Import paths use relative references**
    - **Validates: Requirements 3.3**
  - [x] 12.5 Write property test for no orphaned test files
    - **Property 5: No orphaned test files exist**
    - **Validates: Requirements 5.1**
  - [x] 12.6 Write property test for Kiro steering file paths
    - **Property 6: Kiro steering file paths reference tools directory**
    - **Validates: Requirements 6.3**
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.5, 3.3, 5.1, 6.3_

- [x] 13. Create refactoring summary
  - [x] 13.1 Create REFACTORING_SUMMARY.md documenting all files moved, deleted, and modified
  - [x] 13.2 Include verification results (build, lint, test status)
  - _Requirements: 5.3_

- [x] 14. Final Checkpoint - Verify all tests pass
  - Ensure all tests pass, ask the user if questions arise.
