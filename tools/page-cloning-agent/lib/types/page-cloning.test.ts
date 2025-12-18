/**
 * Property-Based Tests for Page Cloning Agent Data Models
 * 
 * Tests that:
 * - Property 2: JSON serialization round-trip preserves data
 * - Property 3: Generated data conforms to Zod schemas (TypeScript interface conformance)
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  PhaseResultSchema,
  CloneProgressSchema,
  PageAnalysisSchema,
  ExtractedDataSchema,
  ImplementationPlanSchema,
  ProgressFileSchema,
  DependencyGraphSchema,
  QAResultSchema,
  PageMetadataSchema,
  TextBlockSchema,
  ImageDataSchema,
  LinkDataSchema,
  ListDataSchema,
  FormDataSchema,
  ComponentPlanSchema,
  DataFilePlanSchema,
  ErrorLogSchema,
  PageDependencySchema,
} from './page-cloning.schemas';

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates valid ISO datetime strings
 */
const datetimeArbitrary = fc
  .integer({ min: 0, max: 4102444800000 })
  .map((timestamp) => new Date(timestamp).toISOString());

/**
 * Generates valid URLs
 */
const urlArbitrary = fc.webUrl();

/**
 * Generates valid slugs (lowercase alphanumeric with hyphens)
 */
const slugArbitrary = fc
  .stringMatching(/^[a-z][a-z0-9-]*[a-z0-9]$/)
  .filter((s) => s.length >= 2 && s.length <= 50 && !s.includes('--'));


/**
 * Generates PhaseType values
 */
const phaseTypeArbitrary = fc.constantFrom('analyze', 'extract', 'plan', 'implement', 'verify');

/**
 * Generates PhaseResultStatus values
 */
const phaseResultStatusArbitrary = fc.constantFrom('success', 'failed', 'needs_retry');

/**
 * Generates PhaseStatusType values
 */
const phaseStatusTypeArbitrary = fc.constantFrom('pending', 'in_progress', 'completed', 'failed');

/**
 * Generates ProgressStatusType values
 */
const progressStatusTypeArbitrary = fc.constantFrom('in_progress', 'completed', 'failed', 'paused');

/**
 * Generates SectionType values
 */
const sectionTypeArbitrary = fc.constantFrom('header', 'sidebar', 'main', 'footer', 'panel', 'modal');

/**
 * Generates InteractiveElementType values
 */
const interactiveElementTypeArbitrary = fc.constantFrom('button', 'link', 'accordion', 'dropdown', 'tab', 'form');

/**
 * Generates LinkType values
 */
const linkTypeArbitrary = fc.constantFrom('internal', 'external', 'anchor');

/**
 * Generates TextTagType values
 */
const textTagTypeArbitrary = fc.constantFrom('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'div');

/**
 * Generates DependencyType values
 */
const dependencyTypeArbitrary = fc.constantFrom('component', 'data', 'route', 'service');

/**
 * Generates DependencyStatusType values
 */
const dependencyStatusTypeArbitrary = fc.constantFrom('exists', 'needs_creation', 'stub');

// =============================================================================
// Complex Type Arbitraries
// =============================================================================

/**
 * Generates JSON-safe values (excludes -0 which doesn't survive JSON round-trip)
 */
const jsonSafeValueArbitrary = fc.jsonValue().map((v) => JSON.parse(JSON.stringify(v)));

/**
 * Generates safe dictionary keys (excludes __proto__ and other special JS properties)
 */
const safeDictKeyArbitrary = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => !['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'].includes(s));

/**
 * Generates PhaseResult objects
 * Note: We use JSON-safe values and filter undefined to ensure round-trip compatibility
 */
const phaseResultArbitrary = fc.record({
  phase: phaseTypeArbitrary,
  status: phaseResultStatusArbitrary,
  data: fc.option(jsonSafeValueArbitrary, { nil: undefined }),
  errors: fc.option(fc.array(fc.string({ maxLength: 100 }), { maxLength: 5 }), { nil: undefined }),
  timestamp: datetimeArbitrary,
});

/**
 * Generates PageMetadata objects
 */
const pageMetadataArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ maxLength: 300 }),
  ogTitle: fc.string({ maxLength: 100 }),
  ogDescription: fc.string({ maxLength: 300 }),
  ogImage: urlArbitrary,
  canonical: urlArbitrary,
});

/**
 * Generates TextBlock objects
 */
const textBlockArbitrary = fc.record({
  id: fc.uuid(),
  content: fc.string({ maxLength: 500 }),
  tag: textTagTypeArbitrary,
  order: fc.nat({ max: 1000 }),
});

/**
 * Generates ImageData objects
 */
const imageDataArbitrary = fc.record({
  src: urlArbitrary,
  alt: fc.string({ maxLength: 200 }),
  width: fc.option(fc.nat({ max: 4000 }), { nil: undefined }),
  height: fc.option(fc.nat({ max: 4000 }), { nil: undefined }),
});

/**
 * Generates LinkData objects
 */
const linkDataArbitrary = fc.record({
  href: urlArbitrary,
  text: fc.string({ maxLength: 200 }),
  type: linkTypeArbitrary,
  attributes: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z][a-z0-9-]*$/.test(s)),
    fc.string({ maxLength: 100 }),
    { maxKeys: 5 }
  ),
});

/**
 * Generates ListData objects
 */
const listDataArbitrary = fc.record({
  id: fc.uuid(),
  items: fc.array(fc.string({ maxLength: 200 }), { maxLength: 20 }),
  ordered: fc.boolean(),
  order: fc.nat({ max: 1000 }),
});

/**
 * Generates FormField objects
 */
const formFieldArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom('text', 'email', 'password', 'number', 'checkbox', 'radio', 'select'),
  label: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  placeholder: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  required: fc.option(fc.boolean(), { nil: undefined }),
  validation: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});

/**
 * Generates FormData objects
 */
const formDataArbitrary = fc.record({
  id: fc.uuid(),
  action: urlArbitrary,
  method: fc.constantFrom('GET', 'POST'),
  fields: fc.array(formFieldArbitrary, { maxLength: 10 }),
});


/**
 * Generates ItemCounts objects
 */
const itemCountsArbitrary = fc.record({
  text: fc.nat({ max: 1000 }),
  images: fc.nat({ max: 500 }),
  links: fc.nat({ max: 1000 }),
  listItems: fc.nat({ max: 500 }),
});

/**
 * Generates ExtractedData objects
 */
const extractedDataArbitrary = fc.record({
  metadata: pageMetadataArbitrary,
  textContent: fc.array(textBlockArbitrary, { maxLength: 5 }),
  images: fc.array(imageDataArbitrary, { maxLength: 5 }),
  links: fc.array(linkDataArbitrary, { maxLength: 5 }),
  lists: fc.array(listDataArbitrary, { maxLength: 3 }),
  forms: fc.array(formDataArbitrary, { maxLength: 2 }),
  structuredData: fc.dictionary(safeDictKeyArbitrary, jsonSafeValueArbitrary, { maxKeys: 5 }),
  extractedAt: datetimeArbitrary,
  itemCounts: itemCountsArbitrary,
});

/**
 * Generates ComponentPlan objects
 */
const componentPlanArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  path: fc.string({ minLength: 1, maxLength: 100 }),
  props: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 10 }),
  reusesExisting: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
});

/**
 * Generates DataFilePlan objects
 */
const dataFilePlanArbitrary = fc.record({
  path: fc.string({ minLength: 1, maxLength: 100 }),
  schema: fc.dictionary(safeDictKeyArbitrary, jsonSafeValueArbitrary, { maxKeys: 10 }),
  sourceMapping: fc.dictionary(
    safeDictKeyArbitrary,
    fc.string({ minLength: 1, maxLength: 30 }),
    { maxKeys: 10 }
  ),
});

/**
 * Generates ServiceUpdate objects
 */
const serviceUpdateArbitrary = fc.record({
  path: fc.string({ minLength: 1, maxLength: 100 }),
  functions: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
});

/**
 * Generates TypeDefinition objects
 */
const typeDefinitionArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  path: fc.string({ minLength: 1, maxLength: 100 }),
  properties: fc.dictionary(
    safeDictKeyArbitrary,
    fc.string({ minLength: 1, maxLength: 50 }),
    { maxKeys: 20 }
  ),
});

/**
 * Generates ConfigUpdate objects
 */
const configUpdateArbitrary = fc.record({
  path: fc.string({ minLength: 1, maxLength: 100 }),
  changes: fc.dictionary(safeDictKeyArbitrary, jsonSafeValueArbitrary, { maxKeys: 10 }),
});

/**
 * Generates ImplementationPlan objects
 */
const implementationPlanArbitrary = fc.record({
  pageRoute: fc.string({ minLength: 1, maxLength: 100 }),
  components: fc.array(componentPlanArbitrary, { maxLength: 5 }),
  dataFiles: fc.array(dataFilePlanArbitrary, { maxLength: 3 }),
  serviceUpdates: fc.array(serviceUpdateArbitrary, { maxLength: 3 }),
  typeDefinitions: fc.array(typeDefinitionArbitrary, { maxLength: 5 }),
  configUpdates: fc.array(configUpdateArbitrary, { maxLength: 3 }),
});

/**
 * Generates ErrorLog objects
 */
const errorLogArbitrary = fc.record({
  phase: phaseTypeArbitrary,
  error: fc.string({ minLength: 1, maxLength: 500 }),
  timestamp: datetimeArbitrary,
  resolution: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
});

/**
 * Generates PhaseStatus objects
 */
const phaseStatusArbitrary = fc.record({
  status: phaseStatusTypeArbitrary,
  startedAt: fc.option(datetimeArbitrary, { nil: undefined }),
  completedAt: fc.option(datetimeArbitrary, { nil: undefined }),
  error: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
});

/**
 * Generates PageDependency objects
 */
const pageDependencyArbitrary = fc.record({
  type: dependencyTypeArbitrary,
  path: fc.string({ minLength: 1, maxLength: 100 }),
  status: dependencyStatusTypeArbitrary,
  dependsOn: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 5 }),
});

/**
 * Generates DependencyGraph objects
 */
const dependencyGraphArbitrary = fc.record({
  pageSlug: slugArbitrary,
  dependencies: fc.array(pageDependencyArbitrary, { maxLength: 10 }),
  sharedComponents: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 10 }),
  sharedData: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 10 }),
  linkedPages: fc.array(urlArbitrary, { maxLength: 10 }),
});

/**
 * Generates QAResult objects
 */
const qaResultArbitrary = fc.record({
  textContentMatch: fc.boolean(),
  imagesDisplayed: fc.boolean(),
  linksWorking: fc.boolean(),
  responsiveDesign: fc.record({
    mobile: fc.boolean(),
    tablet: fc.boolean(),
    desktop: fc.boolean(),
  }),
  keyboardNavigation: fc.boolean(),
  noConsoleErrors: fc.boolean(),
  typescriptClean: fc.boolean(),
  testsPass: fc.boolean(),
  deviations: fc.array(fc.string({ maxLength: 200 }), { maxLength: 10 }),
});


// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Page Cloning Agent - Property 2: JSON Serialization Round-Trip', () => {
  /**
   * **Feature: page-cloning-agent, Property 2: JSON Serialization Round-Trip**
   * **Validates: Requirements 5.2**
   * 
   * For any valid ExtractedData object, serializing to JSON with 2-space
   * indentation and parsing back SHALL produce an equivalent object.
   */

  it('PhaseResult: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(phaseResultArbitrary, (phaseResult) => {
        const serialized = JSON.stringify(phaseResult, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = PhaseResultSchema.parse(parsed);
        // Compare JSON-normalized versions (undefined fields are stripped by JSON.stringify)
        const normalizedOriginal = JSON.parse(JSON.stringify(phaseResult));
        expect(validated).toEqual(normalizedOriginal);
      }),
      { numRuns: 100 }
    );
  });

  it('PageMetadata: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(pageMetadataArbitrary, (metadata) => {
        const serialized = JSON.stringify(metadata, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = PageMetadataSchema.parse(parsed);
        expect(validated).toEqual(metadata);
      }),
      { numRuns: 100 }
    );
  });

  it('TextBlock: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(textBlockArbitrary, (textBlock) => {
        const serialized = JSON.stringify(textBlock, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = TextBlockSchema.parse(parsed);
        expect(validated).toEqual(textBlock);
      }),
      { numRuns: 100 }
    );
  });

  it('ImageData: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(imageDataArbitrary, (imageData) => {
        const serialized = JSON.stringify(imageData, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = ImageDataSchema.parse(parsed);
        expect(validated).toEqual(imageData);
      }),
      { numRuns: 100 }
    );
  });

  it('LinkData: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(linkDataArbitrary, (linkData) => {
        const serialized = JSON.stringify(linkData, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = LinkDataSchema.parse(parsed);
        expect(validated).toEqual(linkData);
      }),
      { numRuns: 100 }
    );
  });

  it('ListData: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(listDataArbitrary, (listData) => {
        const serialized = JSON.stringify(listData, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = ListDataSchema.parse(parsed);
        expect(validated).toEqual(listData);
      }),
      { numRuns: 100 }
    );
  });

  it('FormData: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(formDataArbitrary, (formData) => {
        const serialized = JSON.stringify(formData, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = FormDataSchema.parse(parsed);
        expect(validated).toEqual(formData);
      }),
      { numRuns: 100 }
    );
  });

  it('ExtractedData: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(extractedDataArbitrary, (extractedData) => {
        const serialized = JSON.stringify(extractedData, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = ExtractedDataSchema.parse(parsed);
        expect(validated).toEqual(extractedData);
      }),
      { numRuns: 100 }
    );
  });

  it('ComponentPlan: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(componentPlanArbitrary, (componentPlan) => {
        const serialized = JSON.stringify(componentPlan, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = ComponentPlanSchema.parse(parsed);
        expect(validated).toEqual(componentPlan);
      }),
      { numRuns: 100 }
    );
  });

  it('DataFilePlan: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(dataFilePlanArbitrary, (dataFilePlan) => {
        const serialized = JSON.stringify(dataFilePlan, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = DataFilePlanSchema.parse(parsed);
        expect(validated).toEqual(dataFilePlan);
      }),
      { numRuns: 100 }
    );
  });

  it('ImplementationPlan: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(implementationPlanArbitrary, (implementationPlan) => {
        const serialized = JSON.stringify(implementationPlan, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = ImplementationPlanSchema.parse(parsed);
        expect(validated).toEqual(implementationPlan);
      }),
      { numRuns: 100 }
    );
  });

  it('ErrorLog: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(errorLogArbitrary, (errorLog) => {
        const serialized = JSON.stringify(errorLog, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = ErrorLogSchema.parse(parsed);
        expect(validated).toEqual(errorLog);
      }),
      { numRuns: 100 }
    );
  });

  it('PageDependency: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(pageDependencyArbitrary, (pageDependency) => {
        const serialized = JSON.stringify(pageDependency, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = PageDependencySchema.parse(parsed);
        expect(validated).toEqual(pageDependency);
      }),
      { numRuns: 100 }
    );
  });

  it('DependencyGraph: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(dependencyGraphArbitrary, (dependencyGraph) => {
        const serialized = JSON.stringify(dependencyGraph, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = DependencyGraphSchema.parse(parsed);
        expect(validated).toEqual(dependencyGraph);
      }),
      { numRuns: 100 }
    );
  });

  it('QAResult: serialize → parse produces equivalent object', () => {
    fc.assert(
      fc.property(qaResultArbitrary, (qaResult) => {
        const serialized = JSON.stringify(qaResult, null, 2);
        const parsed = JSON.parse(serialized);
        const validated = QAResultSchema.parse(parsed);
        expect(validated).toEqual(qaResult);
      }),
      { numRuns: 100 }
    );
  });
});


describe('Page Cloning Agent - Property 3: TypeScript Interface Conformance', () => {
  /**
   * **Feature: page-cloning-agent, Property 3: TypeScript Interface Conformance**
   * **Validates: Requirements 5.3, 5.4, 12.6**
   * 
   * For any stored JSON data file, the data SHALL successfully validate
   * against its corresponding Zod schema without errors.
   */

  it('Generated PhaseResult data validates against schema', () => {
    fc.assert(
      fc.property(phaseResultArbitrary, (data) => {
        const result = PhaseResultSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated PageMetadata data validates against schema', () => {
    fc.assert(
      fc.property(pageMetadataArbitrary, (data) => {
        const result = PageMetadataSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated TextBlock data validates against schema', () => {
    fc.assert(
      fc.property(textBlockArbitrary, (data) => {
        const result = TextBlockSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated ImageData data validates against schema', () => {
    fc.assert(
      fc.property(imageDataArbitrary, (data) => {
        const result = ImageDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated LinkData data validates against schema', () => {
    fc.assert(
      fc.property(linkDataArbitrary, (data) => {
        const result = LinkDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated ListData data validates against schema', () => {
    fc.assert(
      fc.property(listDataArbitrary, (data) => {
        const result = ListDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated FormData data validates against schema', () => {
    fc.assert(
      fc.property(formDataArbitrary, (data) => {
        const result = FormDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated ExtractedData data validates against schema', () => {
    fc.assert(
      fc.property(extractedDataArbitrary, (data) => {
        const result = ExtractedDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated ComponentPlan data validates against schema', () => {
    fc.assert(
      fc.property(componentPlanArbitrary, (data) => {
        const result = ComponentPlanSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated DataFilePlan data validates against schema', () => {
    fc.assert(
      fc.property(dataFilePlanArbitrary, (data) => {
        const result = DataFilePlanSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated ImplementationPlan data validates against schema', () => {
    fc.assert(
      fc.property(implementationPlanArbitrary, (data) => {
        const result = ImplementationPlanSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated ErrorLog data validates against schema', () => {
    fc.assert(
      fc.property(errorLogArbitrary, (data) => {
        const result = ErrorLogSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated PageDependency data validates against schema', () => {
    fc.assert(
      fc.property(pageDependencyArbitrary, (data) => {
        const result = PageDependencySchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated DependencyGraph data validates against schema', () => {
    fc.assert(
      fc.property(dependencyGraphArbitrary, (data) => {
        const result = DependencyGraphSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Generated QAResult data validates against schema', () => {
    fc.assert(
      fc.property(qaResultArbitrary, (data) => {
        const result = QAResultSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
