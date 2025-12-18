/**
 * Unit Tests for JSDoc Comment Generator Utility
 * 
 * Tests JSDoc generation for components, services, and functions.
 * 
 * @see Requirements 26.1, 26.4, 26.5
 */

import { describe, it, expect } from 'vitest';
import {
  formatDateForComment,
  wrapText,
  formatParam,
  formatReturns,
  formatExample,
  generateComponentDocs,
  generateServiceDocs,
  generateFunctionDocs,
  generateDataFileHeader,
  generateDataFileComment,
  generateInlineComment,
  generateDeviationComment,
  generateTodoComment,
  type ComponentDocConfig,
  type ServiceDocConfig,
  type FunctionDocConfig,
  type DataFileHeaderConfig,
} from './jsdoc-generator';

// =============================================================================
// Unit Tests
// =============================================================================

describe('JSDoc Generator', () => {
  describe('formatDateForComment', () => {
    it('should format ISO date to YYYY-MM-DD', () => {
      const result = formatDateForComment('2025-12-15T10:00:00.000Z');
      expect(result).toBe('2025-12-15');
    });

    it('should handle invalid date gracefully', () => {
      const result = formatDateForComment('invalid');
      expect(result).toBe('invalid');
    });
  });

  describe('wrapText', () => {
    it('should wrap long text to multiple lines', () => {
      const longText = 'This is a very long description that should be wrapped across multiple lines to maintain readability in the generated JSDoc comments.';
      const result = wrapText(longText, 50, ' * ');
      
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      lines.forEach(line => {
        expect(line.startsWith(' * ')).toBe(true);
      });
    });

    it('should not wrap short text', () => {
      const shortText = 'Short text';
      const result = wrapText(shortText, 80, ' * ');
      
      expect(result).toBe(' * Short text');
    });
  });

  describe('formatParam', () => {
    it('should format required parameter', () => {
      const result = formatParam({
        name: 'slug',
        type: 'string',
        description: 'The URL slug',
      });
      
      expect(result).toBe(' * @param slug - The URL slug');
    });

    it('should format optional parameter with default', () => {
      const result = formatParam({
        name: 'limit',
        type: 'number',
        description: 'Maximum items',
        optional: true,
        defaultValue: '10',
      });
      
      expect(result).toBe(' * @param limit? - Maximum items (default: 10)');
    });
  });

  describe('formatReturns', () => {
    it('should format return value', () => {
      const result = formatReturns({
        type: 'Promise<Tool>',
        description: 'The tool data',
      });
      
      expect(result).toBe(' * @returns The tool data');
    });
  });

  describe('formatExample', () => {
    it('should format example with code block', () => {
      const result = formatExample({
        description: 'Basic usage',
        code: 'const tool = await getTool("slug");',
      });
      
      expect(result).toContain('@example');
      expect(result).toContain('Basic usage');
      expect(result).toContain('```typescript');
      expect(result).toContain('const tool = await getTool("slug");');
      expect(result).toContain('```');
    });

    it('should format example without description', () => {
      const result = formatExample({
        code: 'doSomething();',
      });
      
      expect(result).toContain('@example');
      expect(result).toContain('doSomething();');
    });
  });

  describe('generateComponentDocs', () => {
    it('should generate complete component documentation', () => {
      const config: ComponentDocConfig = {
        name: 'ToolCard',
        description: 'Displays a tool card with name and description.',
        props: [
          { name: 'tool', type: 'Tool', description: 'The tool data to display' },
          { name: 'className', type: 'string', description: 'Additional CSS classes', optional: true },
        ],
        sourceUrl: 'https://example.com/tools',
        createdAt: '2025-12-15T10:00:00.000Z',
        requirements: ['4.1', '4.2'],
        isClientComponent: true,
      };
      
      const result = generateComponentDocs(config);
      
      expect(result).toContain('/**');
      expect(result).toContain('ToolCard Component');
      expect(result).toContain('Displays a tool card');
      expect(result).toContain('client component');
      expect(result).toContain('@source https://example.com/tools');
      expect(result).toContain('@created 2025-12-15');
      expect(result).toContain('@param tool - The tool data to display');
      expect(result).toContain('@param className? - Additional CSS classes');
      expect(result).toContain('@requirements 4.1, 4.2');
      expect(result).toContain('*/');
    });

    it('should include notes and deviations', () => {
      const config: ComponentDocConfig = {
        name: 'SimpleComponent',
        description: 'A simple component.',
        notes: [
          'Uses system font instead of external font',
          'Simplified animation for performance',
        ],
      };
      
      const result = generateComponentDocs(config);
      
      expect(result).toContain('@remarks');
      expect(result).toContain('Uses system font');
      expect(result).toContain('Simplified animation');
    });

    it('should include examples', () => {
      const config: ComponentDocConfig = {
        name: 'Button',
        description: 'A button component.',
        examples: [
          { description: 'Primary button', code: '<Button variant="primary">Click</Button>' },
        ],
      };
      
      const result = generateComponentDocs(config);
      
      expect(result).toContain('@example');
      expect(result).toContain('Primary button');
      expect(result).toContain('<Button variant="primary">Click</Button>');
    });
  });

  describe('generateServiceDocs', () => {
    it('should generate service documentation', () => {
      const config: ServiceDocConfig = {
        name: 'FreeAIToolsService',
        description: 'Service for fetching and managing free AI tools data.',
        module: 'free-ai-tools.service',
        sourceUrl: 'https://toolify.ai/free-ai-tools',
        createdAt: '2025-12-15T10:00:00.000Z',
        requirements: ['5.5', '5.6'],
        see: ['src/lib/types/free-ai-tools.ts'],
      };
      
      const result = generateServiceDocs(config);
      
      expect(result).toContain('/**');
      expect(result).toContain('FreeAIToolsService');
      expect(result).toContain('Service for fetching');
      expect(result).toContain('Data source: https://toolify.ai/free-ai-tools');
      expect(result).toContain('Last updated: 2025-12-15');
      expect(result).toContain('@module free-ai-tools.service');
      expect(result).toContain('@requirements 5.5, 5.6');
      expect(result).toContain('@see src/lib/types/free-ai-tools.ts');
      expect(result).toContain('*/');
    });
  });

  describe('generateFunctionDocs', () => {
    it('should generate function documentation', () => {
      const config: FunctionDocConfig = {
        name: 'getToolBySlug',
        description: 'Fetches a tool by its URL slug.',
        params: [
          { name: 'slug', type: 'string', description: 'The URL slug of the tool' },
        ],
        returns: { type: 'Promise<Tool>', description: 'The tool data' },
        isAsync: true,
        throws: 'NotFoundError if tool does not exist',
        requirements: ['5.5'],
      };
      
      const result = generateFunctionDocs(config);
      
      expect(result).toContain('/**');
      expect(result).toContain('Fetches a tool by its URL slug');
      expect(result).toContain('asynchronous');
      expect(result).toContain('@param slug - The URL slug of the tool');
      expect(result).toContain('@returns The tool data');
      expect(result).toContain('@throws NotFoundError if tool does not exist');
      expect(result).toContain('@requirements 5.5');
      expect(result).toContain('*/');
    });

    it('should include examples', () => {
      const config: FunctionDocConfig = {
        name: 'add',
        description: 'Adds two numbers.',
        params: [
          { name: 'a', type: 'number', description: 'First number' },
          { name: 'b', type: 'number', description: 'Second number' },
        ],
        returns: { type: 'number', description: 'The sum' },
        examples: [
          { code: 'const sum = add(1, 2); // 3' },
        ],
      };
      
      const result = generateFunctionDocs(config);
      
      expect(result).toContain('@example');
      expect(result).toContain('const sum = add(1, 2); // 3');
    });
  });

  describe('generateDataFileHeader', () => {
    it('should generate metadata object for JSON', () => {
      const config: DataFileHeaderConfig = {
        description: 'Free AI tools organized by category',
        sourceUrl: 'https://toolify.ai/free-ai-tools',
        extractedAt: '2025-12-15T10:00:00.000Z',
        itemCount: 150,
        schema: 'src/lib/types/free-ai-tools.ts',
      };
      
      const result = generateDataFileHeader(config);
      
      expect(result._metadata).toBeDefined();
      expect((result._metadata as Record<string, unknown>).description).toBe('Free AI tools organized by category');
      expect((result._metadata as Record<string, unknown>).sourceUrl).toBe('https://toolify.ai/free-ai-tools');
      expect((result._metadata as Record<string, unknown>).extractedAt).toBe('2025-12-15T10:00:00.000Z');
      expect((result._metadata as Record<string, unknown>).itemCount).toBe(150);
      expect((result._metadata as Record<string, unknown>).schema).toBe('src/lib/types/free-ai-tools.ts');
    });
  });

  describe('generateDataFileComment', () => {
    it('should generate TypeScript comment for data file', () => {
      const config: DataFileHeaderConfig = {
        description: 'Free AI tools data',
        sourceUrl: 'https://toolify.ai/free-ai-tools',
        extractedAt: '2025-12-15T10:00:00.000Z',
        itemCount: 150,
        schema: 'src/lib/types/free-ai-tools.ts',
      };
      
      const result = generateDataFileComment(config);
      
      expect(result).toContain('/**');
      expect(result).toContain('Free AI tools data');
      expect(result).toContain('Source: https://toolify.ai/free-ai-tools');
      expect(result).toContain('Extracted: 2025-12-15');
      expect(result).toContain('Items: 150');
      expect(result).toContain('@see src/lib/types/free-ai-tools.ts');
      expect(result).toContain('*/');
    });
  });

  describe('generateInlineComment', () => {
    it('should generate single-line comment for short text', () => {
      const result = generateInlineComment('Simple explanation');
      expect(result).toBe('// Simple explanation');
    });

    it('should generate multi-line comment for long text', () => {
      const longText = 'This is a very long explanation that needs to be wrapped across multiple lines for better readability in the code.';
      const result = generateInlineComment(longText);
      
      expect(result).toContain('/*');
      expect(result).toContain('*/');
    });

    it('should force multi-line when requested', () => {
      const result = generateInlineComment('Short text', true);
      
      expect(result).toContain('/*');
      expect(result).toContain('*/');
    });
  });

  describe('generateDeviationComment', () => {
    it('should generate deviation comment', () => {
      const result = generateDeviationComment(
        'Using system font instead of Google Fonts',
        'Improves page load performance and privacy'
      );
      
      expect(result).toContain('DEVIATION FROM SOURCE');
      expect(result).toContain('Using system font');
      expect(result).toContain('REASON');
      expect(result).toContain('Improves page load performance');
    });
  });

  describe('generateTodoComment', () => {
    it('should generate TODO comment without reference', () => {
      const result = generateTodoComment('Implement error handling');
      expect(result).toBe('// TODO: Implement error handling');
    });

    it('should generate TODO comment with reference', () => {
      const result = generateTodoComment('Add pagination support', 'REQ-123');
      expect(result).toBe('// TODO [REQ-123]: Add pagination support');
    });
  });
});
