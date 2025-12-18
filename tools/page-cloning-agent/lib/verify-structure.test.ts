/**
 * Property-based tests for verifying project modularization structure.
 * These tests ensure the separation between production code (src/) and
 * development tools (tools/page-cloning-agent/).
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Cloning-related file patterns that should NOT be in production directories
const CLONING_FILE_PATTERNS = [
  'page-cloning',
  'cloning-errors',
  'rate-limiter',
  'dependency-resolver',
  'sanitize',
  'link-utils',
  'image-config',
  'dynamic-content',
  'changelog',
  'seo-generator',
  'component-generator',
  'jsdoc-generator',
  'service-generator',
];

// Helper to recursively get all files in a directory
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) {
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Helper to check if a filename matches cloning patterns
function isCloningFile(filename: string): boolean {
  const basename = path.basename(filename).toLowerCase();
  return CLONING_FILE_PATTERNS.some((pattern) => basename.includes(pattern));
}

describe('Project Modularization - Structure Verification', () => {
  // Use process.cwd() which is the workspace root when running vitest
  const projectRoot = process.cwd();

  describe('Property 1: Production directories contain no cloning files', () => {
    it('src/lib/services/ contains no cloning-related files', () => {
      const servicesDir = path.join(projectRoot, 'src/lib/services');
      const files = getAllFiles(servicesDir);
      const cloningFiles = files.filter(isCloningFile);

      expect(cloningFiles).toEqual([]);
    });

    it('src/lib/utils/ contains no cloning-related files', () => {
      const utilsDir = path.join(projectRoot, 'src/lib/utils');
      const files = getAllFiles(utilsDir);
      const cloningFiles = files.filter(isCloningFile);

      expect(cloningFiles).toEqual([]);
    });

    it('src/lib/types/ contains no cloning-related files', () => {
      const typesDir = path.join(projectRoot, 'src/lib/types');
      const files = getAllFiles(typesDir);
      const cloningFiles = files.filter(isCloningFile);

      expect(cloningFiles).toEqual([]);
    });
  });


  describe('Property 2: Tools directory contains all cloning files', () => {
    const expectedServices = [
      'page-cloning.service.ts',
      'page-cloning-analyze.service.ts',
      'page-cloning-extract.service.ts',
      'page-cloning-plan.service.ts',
      'page-cloning-verify.service.ts',
      'page-cloning-progress.service.ts',
      'rate-limiter.service.ts',
      'dependency-resolver.service.ts',
    ];

    const expectedUtils = [
      'cloning-errors.ts',
      'link-utils.ts',
      'image-config.ts',
      'dynamic-content.ts',
      'changelog.ts',
      'sanitize.ts',
      'seo-generator.ts',
      'component-generator.ts',
      'jsdoc-generator.ts',
      'service-generator.ts',
    ];

    const expectedTypes = ['page-cloning.ts', 'page-cloning.schemas.ts'];

    it('tools/page-cloning-agent/lib/services/ contains all expected service files', () => {
      const servicesDir = path.join(projectRoot, 'tools/page-cloning-agent/lib/services');
      const files = fs.readdirSync(servicesDir);

      expectedServices.forEach((expectedFile) => {
        expect(files).toContain(expectedFile);
      });
    });

    it('tools/page-cloning-agent/lib/utils/ contains all expected utility files', () => {
      const utilsDir = path.join(projectRoot, 'tools/page-cloning-agent/lib/utils');
      const files = fs.readdirSync(utilsDir);

      expectedUtils.forEach((expectedFile) => {
        expect(files).toContain(expectedFile);
      });
    });

    it('tools/page-cloning-agent/lib/types/ contains all expected type files', () => {
      const typesDir = path.join(projectRoot, 'tools/page-cloning-agent/lib/types');
      const files = fs.readdirSync(typesDir);

      expectedTypes.forEach((expectedFile) => {
        expect(files).toContain(expectedFile);
      });
    });
  });

  describe('Property 3: Test files are co-located with source files', () => {
    it('all test files in tools/page-cloning-agent have corresponding source files', () => {
      const toolsLibDir = path.join(projectRoot, 'tools/page-cloning-agent/lib');
      const allFiles = getAllFiles(toolsLibDir);
      // Exclude verification test files (they don't need corresponding source files)
      const testFiles = allFiles.filter(
        (f) => f.endsWith('.test.ts') && !f.includes('verify-structure')
      );

      const orphanedTests: string[] = [];

      testFiles.forEach((testFile) => {
        const sourceFile = testFile.replace('.test.ts', '.ts');
        if (!fs.existsSync(sourceFile)) {
          orphanedTests.push(testFile);
        }
      });

      expect(orphanedTests).toEqual([]);
    });
  });


  describe('Property 4: Import paths use relative references', () => {
    it('files in tools/page-cloning-agent use relative imports for internal references', () => {
      const toolsLibDir = path.join(projectRoot, 'tools/page-cloning-agent/lib');
      const allFiles = getAllFiles(toolsLibDir);
      const tsFiles = allFiles.filter(
        (f) => f.endsWith('.ts') && !f.endsWith('.test.ts')
      );

      const filesWithAbsoluteImports: string[] = [];

      tsFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line) => {
          // Check for @/ imports that reference tools/page-cloning-agent files
          // Exclude string literals (code generation)
          if (
            line.includes("from '@/") &&
            !line.includes("'@/") && // Not inside a string literal
            !line.includes('"@/') // Not inside a string literal
          ) {
            // This is an actual import statement with @/ path
            if (
              line.includes('page-cloning') ||
              line.includes('cloning-errors') ||
              line.includes('sanitize') ||
              line.includes('link-utils')
            ) {
              filesWithAbsoluteImports.push(file);
            }
          }
        });
      });

      expect(filesWithAbsoluteImports).toEqual([]);
    });
  });

  describe('Property 5: No orphaned test files exist', () => {
    it('src/lib/utils/code-generators.test.ts does not exist', () => {
      const orphanedFile = path.join(
        projectRoot,
        'src/lib/utils/code-generators.test.ts'
      );
      expect(fs.existsSync(orphanedFile)).toBe(false);
    });

    it('PAGE_CLONING_AGENT.md does not exist in project root', () => {
      const oldReadme = path.join(projectRoot, 'PAGE_CLONING_AGENT.md');
      expect(fs.existsSync(oldReadme)).toBe(false);
    });
  });

  describe('Property 6: Kiro steering file paths reference tools directory', () => {
    it('.kiro/steering/page-cloning.md references tools/page-cloning-agent paths', () => {
      const steeringFile = path.join(
        projectRoot,
        '.kiro/steering/page-cloning.md'
      );
      const content = fs.readFileSync(steeringFile, 'utf-8');

      // Should reference tools/page-cloning-agent
      expect(content).toContain('tools/page-cloning-agent');

      // Should NOT reference old src/lib paths for cloning files
      expect(content).not.toContain('src/lib/services/page-cloning');
      expect(content).not.toContain('src/lib/utils/sanitize');
      expect(content).not.toContain('src/lib/utils/cloning-errors');
    });
  });
});
