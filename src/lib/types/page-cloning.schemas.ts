/**
 * Page Cloning Agent - Zod Schemas for Runtime Validation
 * 
 * This file contains Zod schemas matching all TypeScript interfaces
 * for runtime validation of JSON data.
 * 
 * @see ./page-cloning.ts for TypeScript interfaces
 * @requirements 5.4, 12.6
 */

import { z } from 'zod';

// =============================================================================
// Type Alias Schemas (Union Types)
// =============================================================================

export const PhaseTypeSchema = z.enum(['analyze', 'extract', 'plan', 'implement', 'verify']);

export const PhaseStatusTypeSchema = z.enum(['pending', 'in_progress', 'completed', 'failed']);

export const ProgressStatusTypeSchema = z.enum(['in_progress', 'completed', 'failed', 'paused']);

export const PhaseResultStatusSchema = z.enum(['success', 'failed', 'needs_retry']);

export const SectionTypeSchema = z.enum(['header', 'sidebar', 'main', 'footer', 'panel', 'modal']);

export const InteractiveElementTypeSchema = z.enum(['button', 'link', 'accordion', 'dropdown', 'tab', 'form']);

export const LinkTypeSchema = z.enum(['internal', 'external', 'anchor']);

export const TextTagTypeSchema = z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'div']);

export const DependencyTypeSchema = z.enum(['component', 'data', 'route', 'service']);

export const DependencyStatusTypeSchema = z.enum(['exists', 'needs_creation', 'stub']);

// =============================================================================
// Core Workflow Schemas
// =============================================================================

export const PhaseResultSchema = z.object({
  phase: PhaseTypeSchema,
  status: PhaseResultStatusSchema,
  data: z.unknown().optional(),
  errors: z.array(z.string()).optional(),
  timestamp: z.string(),
});

export const CloneProgressSchema = z.object({
  sourceUrl: z.string(),
  pageSlug: z.string(),
  startedAt: z.string(),
  phases: z.array(PhaseResultSchema),
  currentPhase: PhaseTypeSchema,
  completedAt: z.string().optional(),
  filesCreated: z.array(z.string()),
  filesModified: z.array(z.string()),
});


// =============================================================================
// Page Analysis Schemas
// =============================================================================

export const NavigationPatternSchema = z.object({
  type: LinkTypeSchema,
  href: z.string(),
  text: z.string(),
});

// Section is recursive, so we need to use z.lazy
export const SectionSchema: z.ZodType<{
  id: string;
  type: 'header' | 'sidebar' | 'main' | 'footer' | 'panel' | 'modal';
  selector: string;
  children: Array<{
    id: string;
    type: 'header' | 'sidebar' | 'main' | 'footer' | 'panel' | 'modal';
    selector: string;
    children: unknown[];
  }>;
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: SectionTypeSchema,
    selector: z.string(),
    children: z.array(SectionSchema),
  })
);

export const InteractiveElementSchema = z.object({
  type: InteractiveElementTypeSchema,
  selector: z.string(),
  action: z.string(),
});

export const PageAnalysisSchema = z.object({
  url: z.string(),
  title: z.string(),
  sections: z.array(SectionSchema),
  navigation: z.array(NavigationPatternSchema),
  interactiveElements: z.array(InteractiveElementSchema),
  responsiveBreakpoints: z.array(z.string()),
  dependencies: z.array(z.string()),
});

// =============================================================================
// Data Extraction Schemas
// =============================================================================

export const PageMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogTitle: z.string(),
  ogDescription: z.string(),
  ogImage: z.string(),
  canonical: z.string(),
});

export const TextBlockSchema = z.object({
  id: z.string(),
  content: z.string(),
  tag: TextTagTypeSchema,
  order: z.number(),
});

export const ImageDataSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const LinkDataSchema = z.object({
  href: z.string(),
  text: z.string(),
  type: LinkTypeSchema,
  attributes: z.record(z.string(), z.string()),
});

export const ListDataSchema = z.object({
  id: z.string(),
  items: z.array(z.string()),
  ordered: z.boolean(),
  order: z.number(),
});

export const FormFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  validation: z.string().optional(),
});

export const FormDataSchema = z.object({
  id: z.string(),
  action: z.string(),
  method: z.string(),
  fields: z.array(FormFieldSchema),
});

export const ItemCountsSchema = z.object({
  text: z.number(),
  images: z.number(),
  links: z.number(),
  listItems: z.number(),
});

export const ExtractedDataSchema = z.object({
  metadata: PageMetadataSchema,
  textContent: z.array(TextBlockSchema),
  images: z.array(ImageDataSchema),
  links: z.array(LinkDataSchema),
  lists: z.array(ListDataSchema),
  forms: z.array(FormDataSchema),
  structuredData: z.record(z.string(), z.unknown()),
  extractedAt: z.string(),
  itemCounts: ItemCountsSchema,
});


// =============================================================================
// Implementation Planning Schemas
// =============================================================================

export const ComponentPlanSchema = z.object({
  name: z.string(),
  path: z.string(),
  props: z.array(z.string()),
  reusesExisting: z.string().nullable(),
});

export const DataFilePlanSchema = z.object({
  path: z.string(),
  schema: z.record(z.string(), z.unknown()),
  sourceMapping: z.record(z.string(), z.string()),
});

export const ServiceUpdateSchema = z.object({
  path: z.string(),
  functions: z.array(z.string()),
});

export const TypeDefinitionSchema = z.object({
  name: z.string(),
  path: z.string(),
  properties: z.record(z.string(), z.string()),
});

export const ConfigUpdateSchema = z.object({
  path: z.string(),
  changes: z.record(z.string(), z.unknown()),
});

export const ImplementationPlanSchema = z.object({
  pageRoute: z.string(),
  components: z.array(ComponentPlanSchema),
  dataFiles: z.array(DataFilePlanSchema),
  serviceUpdates: z.array(ServiceUpdateSchema),
  typeDefinitions: z.array(TypeDefinitionSchema),
  configUpdates: z.array(ConfigUpdateSchema),
});

// =============================================================================
// Progress Tracking Schemas
// =============================================================================

export const PhaseStatusSchema = z.object({
  status: PhaseStatusTypeSchema,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  error: z.string().optional(),
});

export const ErrorLogSchema = z.object({
  phase: PhaseTypeSchema,
  error: z.string(),
  timestamp: z.string(),
  resolution: z.string().optional(),
});

export const ProgressFileSchema = z.object({
  sourceUrl: z.string(),
  pageSlug: z.string(),
  startedAt: z.string(),
  lastUpdatedAt: z.string(),
  status: ProgressStatusTypeSchema,
  phases: z.object({
    analyze: PhaseStatusSchema,
    extract: PhaseStatusSchema,
    plan: PhaseStatusSchema,
    implement: PhaseStatusSchema,
    verify: PhaseStatusSchema,
  }),
  extractedData: ExtractedDataSchema.optional(),
  implementationPlan: ImplementationPlanSchema.optional(),
  filesCreated: z.array(z.string()),
  filesModified: z.array(z.string()),
  errors: z.array(ErrorLogSchema),
  verificationAttempts: z.number(),
  completedAt: z.string().optional(),
});

// =============================================================================
// Dependency Schemas
// =============================================================================

export const PageDependencySchema = z.object({
  type: DependencyTypeSchema,
  path: z.string(),
  status: DependencyStatusTypeSchema,
  dependsOn: z.array(z.string()),
});

export const DependencyGraphSchema = z.object({
  pageSlug: z.string(),
  dependencies: z.array(PageDependencySchema),
  sharedComponents: z.array(z.string()),
  sharedData: z.array(z.string()),
  linkedPages: z.array(z.string()),
});

// =============================================================================
// QA Schemas
// =============================================================================

export const ResponsiveDesignResultSchema = z.object({
  mobile: z.boolean(),
  tablet: z.boolean(),
  desktop: z.boolean(),
});

export const QAResultSchema = z.object({
  textContentMatch: z.boolean(),
  imagesDisplayed: z.boolean(),
  linksWorking: z.boolean(),
  responsiveDesign: ResponsiveDesignResultSchema,
  keyboardNavigation: z.boolean(),
  noConsoleErrors: z.boolean(),
  typescriptClean: z.boolean(),
  testsPass: z.boolean(),
  deviations: z.array(z.string()),
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type PhaseResultZ = z.infer<typeof PhaseResultSchema>;
export type CloneProgressZ = z.infer<typeof CloneProgressSchema>;
export type PageAnalysisZ = z.infer<typeof PageAnalysisSchema>;
export type ExtractedDataZ = z.infer<typeof ExtractedDataSchema>;
export type ImplementationPlanZ = z.infer<typeof ImplementationPlanSchema>;
export type ProgressFileZ = z.infer<typeof ProgressFileSchema>;
export type DependencyGraphZ = z.infer<typeof DependencyGraphSchema>;
export type QAResultZ = z.infer<typeof QAResultSchema>;
