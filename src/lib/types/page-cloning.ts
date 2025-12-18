/**
 * Page Cloning Agent - TypeScript Interfaces
 * 
 * This file contains all TypeScript interfaces for the Page Cloning Agent workflow.
 * The agent orchestrates multiple phases to clone pages from source websites.
 * 
 * @see .kiro/specs/page-cloning-agent/design.md for detailed documentation
 * @requirements 3.8, 5.3
 */

// =============================================================================
// Type Aliases (Union Types for Type Safety)
// =============================================================================

/** Workflow phase types */
export type PhaseType = 'analyze' | 'extract' | 'plan' | 'implement' | 'verify';

/** Status of an individual phase */
export type PhaseStatusType = 'pending' | 'in_progress' | 'completed' | 'failed';

/** Overall progress status */
export type ProgressStatusType = 'in_progress' | 'completed' | 'failed' | 'paused';

/** Result status for a phase */
export type PhaseResultStatus = 'success' | 'failed' | 'needs_retry';

/** DOM section types */
export type SectionType = 'header' | 'sidebar' | 'main' | 'footer' | 'panel' | 'modal';

/** Interactive element types */
export type InteractiveElementType = 'button' | 'link' | 'accordion' | 'dropdown' | 'tab' | 'form';

/** Link types */
export type LinkType = 'internal' | 'external' | 'anchor';

/** HTML text tag types */
export type TextTagType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'li' | 'div';

/** Dependency types */
export type DependencyType = 'component' | 'data' | 'route' | 'service';

/** Dependency status types */
export type DependencyStatusType = 'exists' | 'needs_creation' | 'stub';

// =============================================================================
// Core Workflow Types
// =============================================================================

/**
 * Result of executing a workflow phase
 */
export interface PhaseResult {
  /** The phase that was executed */
  phase: PhaseType;
  /** Status of the phase execution */
  status: PhaseResultStatus;
  /** Data produced by the phase (type varies by phase) */
  data?: unknown;
  /** Errors encountered during execution */
  errors?: string[];
  /** ISO timestamp of when the phase completed */
  timestamp: string;
}


/**
 * Overall progress tracking for a clone operation
 */
export interface CloneProgress {
  /** URL of the source page being cloned */
  sourceUrl: string;
  /** Slug identifier for the page */
  pageSlug: string;
  /** ISO timestamp when cloning started */
  startedAt: string;
  /** Results from each completed phase */
  phases: PhaseResult[];
  /** Currently executing phase */
  currentPhase: PhaseType;
  /** ISO timestamp when cloning completed (if finished) */
  completedAt?: string;
  /** List of files created during implementation */
  filesCreated: string[];
  /** List of files modified during implementation */
  filesModified: string[];
}

// =============================================================================
// Page Analysis Types
// =============================================================================

/**
 * Navigation pattern found on the page
 */
export interface NavigationPattern {
  /** Type of navigation link */
  type: LinkType;
  /** URL or anchor target */
  href: string;
  /** Display text of the link */
  text: string;
}

/**
 * DOM section structure
 */
export interface Section {
  /** Unique identifier for the section */
  id: string;
  /** Type of section */
  type: SectionType;
  /** CSS selector to locate the section */
  selector: string;
  /** Nested child sections */
  children: Section[];
}

/**
 * Interactive element on the page
 */
export interface InteractiveElement {
  /** Type of interactive element */
  type: InteractiveElementType;
  /** CSS selector to locate the element */
  selector: string;
  /** Description of the action this element performs */
  action: string;
}

/**
 * Complete analysis of a source page
 */
export interface PageAnalysis {
  /** URL of the analyzed page */
  url: string;
  /** Page title */
  title: string;
  /** Identified DOM sections */
  sections: Section[];
  /** Navigation patterns found */
  navigation: NavigationPattern[];
  /** Interactive elements found */
  interactiveElements: InteractiveElement[];
  /** Responsive breakpoints identified (e.g., ['768px', '1024px']) */
  responsiveBreakpoints: string[];
  /** URLs of pages this page depends on or links to */
  dependencies: string[];
}

// =============================================================================
// Data Extraction Types
// =============================================================================

/**
 * SEO and meta information from the page
 */
export interface PageMetadata {
  /** Page title tag content */
  title: string;
  /** Meta description content */
  description: string;
  /** Open Graph title */
  ogTitle: string;
  /** Open Graph description */
  ogDescription: string;
  /** Open Graph image URL */
  ogImage: string;
  /** Canonical URL */
  canonical: string;
}

/**
 * Text content block from the page
 */
export interface TextBlock {
  /** Unique identifier */
  id: string;
  /** Text content */
  content: string;
  /** HTML tag type */
  tag: TextTagType;
  /** Order of appearance on page (0-indexed) */
  order: number;
}

/**
 * Image data extracted from the page
 */
export interface ImageData {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
}

/**
 * Link data extracted from the page
 */
export interface LinkData {
  /** Link URL */
  href: string;
  /** Link display text */
  text: string;
  /** Type of link */
  type: LinkType;
  /** Additional HTML attributes */
  attributes: Record<string, string>;
}


/**
 * List data extracted from the page
 */
export interface ListData {
  /** Unique identifier */
  id: string;
  /** List items content */
  items: string[];
  /** Whether the list is ordered (ol) or unordered (ul) */
  ordered: boolean;
  /** Order of appearance on page (0-indexed) */
  order: number;
}

/**
 * Form field data
 */
export interface FormField {
  /** Field name attribute */
  name: string;
  /** Input type (text, email, password, etc.) */
  type: string;
  /** Field label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Validation pattern or rules */
  validation?: string;
}

/**
 * Form data extracted from the page
 */
export interface FormData {
  /** Unique identifier */
  id: string;
  /** Form action URL */
  action: string;
  /** HTTP method (GET, POST) */
  method: string;
  /** Form fields */
  fields: FormField[];
}

/**
 * Item counts for verification
 */
export interface ItemCounts {
  /** Number of text blocks */
  text: number;
  /** Number of images */
  images: number;
  /** Number of links */
  links: number;
  /** Number of list items */
  listItems: number;
}

/**
 * Complete extracted data from a source page
 */
export interface ExtractedData {
  /** Page metadata (SEO, Open Graph, etc.) */
  metadata: PageMetadata;
  /** All text content blocks */
  textContent: TextBlock[];
  /** All images */
  images: ImageData[];
  /** All links */
  links: LinkData[];
  /** All lists */
  lists: ListData[];
  /** All forms */
  forms: FormData[];
  /** JSON-LD structured data */
  structuredData: Record<string, unknown>;
  /** ISO timestamp when data was extracted */
  extractedAt: string;
  /** Counts of extracted items for verification */
  itemCounts: ItemCounts;
}

// =============================================================================
// Implementation Planning Types
// =============================================================================

/**
 * Plan for creating a component
 */
export interface ComponentPlan {
  /** Component name */
  name: string;
  /** File path where component will be created */
  path: string;
  /** Props the component will accept */
  props: string[];
  /** Path to existing component to reuse, or null if creating new */
  reusesExisting: string | null;
}

/**
 * Plan for creating a data file
 */
export interface DataFilePlan {
  /** File path where data will be stored */
  path: string;
  /** JSON schema for the data structure */
  schema: Record<string, unknown>;
  /** Mapping from source data fields to target fields */
  sourceMapping: Record<string, string>;
}

/**
 * Plan for updating a service file
 */
export interface ServiceUpdate {
  /** Path to the service file */
  path: string;
  /** Functions to add or modify */
  functions: string[];
}

/**
 * Plan for creating a type definition
 */
export interface TypeDefinition {
  /** Type/interface name */
  name: string;
  /** File path where type will be defined */
  path: string;
  /** Properties of the type */
  properties: Record<string, string>;
}

/**
 * Plan for updating a config file
 */
export interface ConfigUpdate {
  /** Path to the config file */
  path: string;
  /** Changes to apply */
  changes: Record<string, unknown>;
}

/**
 * Complete implementation plan for a page clone
 */
export interface ImplementationPlan {
  /** Route path for the new page */
  pageRoute: string;
  /** Components to create */
  components: ComponentPlan[];
  /** Data files to create */
  dataFiles: DataFilePlan[];
  /** Service files to update */
  serviceUpdates: ServiceUpdate[];
  /** Type definitions to create */
  typeDefinitions: TypeDefinition[];
  /** Config files to update */
  configUpdates: ConfigUpdate[];
}


// =============================================================================
// Progress Tracking Types
// =============================================================================

/**
 * Status of an individual phase in the progress file
 */
export interface PhaseStatus {
  /** Current status of the phase */
  status: PhaseStatusType;
  /** ISO timestamp when phase started */
  startedAt?: string;
  /** ISO timestamp when phase completed */
  completedAt?: string;
  /** Error message if phase failed */
  error?: string;
}

/**
 * Error log entry
 */
export interface ErrorLog {
  /** Phase where error occurred */
  phase: PhaseType;
  /** Error message */
  error: string;
  /** ISO timestamp when error occurred */
  timestamp: string;
  /** How the error was resolved (if applicable) */
  resolution?: string;
}

/**
 * Persistent progress file for tracking clone operations
 * Stored at: .kiro/specs/page-cloning-agent/progress/{page-slug}.json
 */
export interface ProgressFile {
  /** URL of the source page being cloned */
  sourceUrl: string;
  /** Slug identifier for the page */
  pageSlug: string;
  /** ISO timestamp when cloning started */
  startedAt: string;
  /** ISO timestamp of last update */
  lastUpdatedAt: string;
  /** Overall status of the clone operation */
  status: ProgressStatusType;
  /** Status of each phase */
  phases: {
    analyze: PhaseStatus;
    extract: PhaseStatus;
    plan: PhaseStatus;
    implement: PhaseStatus;
    verify: PhaseStatus;
  };
  /** Extracted data (saved after extract phase) */
  extractedData?: ExtractedData;
  /** Implementation plan (saved after plan phase) */
  implementationPlan?: ImplementationPlan;
  /** List of files created during implementation */
  filesCreated: string[];
  /** List of files modified during implementation */
  filesModified: string[];
  /** Log of errors encountered */
  errors: ErrorLog[];
  /** Number of verification attempts made */
  verificationAttempts: number;
  /** ISO timestamp when cloning completed (if finished) */
  completedAt?: string;
}

// =============================================================================
// Dependency Types
// =============================================================================

/**
 * A dependency that a page has on another resource
 */
export interface PageDependency {
  /** Type of dependency */
  type: DependencyType;
  /** Path to the dependency */
  path: string;
  /** Current status of the dependency */
  status: DependencyStatusType;
  /** Other dependencies this one depends on */
  dependsOn: string[];
}

/**
 * Complete dependency graph for a page
 */
export interface DependencyGraph {
  /** Slug of the page being analyzed */
  pageSlug: string;
  /** All dependencies identified */
  dependencies: PageDependency[];
  /** Paths to shared components */
  sharedComponents: string[];
  /** Paths to shared data files */
  sharedData: string[];
  /** URLs of linked pages (for future implementation) */
  linkedPages: string[];
}

// =============================================================================
// QA Types
// =============================================================================

/**
 * Responsive design verification results
 */
export interface ResponsiveDesignResult {
  /** Mobile breakpoint passes */
  mobile: boolean;
  /** Tablet breakpoint passes */
  tablet: boolean;
  /** Desktop breakpoint passes */
  desktop: boolean;
}

/**
 * Quality assurance verification results
 */
export interface QAResult {
  /** All text content matches source */
  textContentMatch: boolean;
  /** All images display correctly */
  imagesDisplayed: boolean;
  /** All links work (no 404s) */
  linksWorking: boolean;
  /** Responsive design verification */
  responsiveDesign: ResponsiveDesignResult;
  /** Keyboard navigation works for all interactive elements */
  keyboardNavigation: boolean;
  /** No console errors present */
  noConsoleErrors: boolean;
  /** No TypeScript compilation errors */
  typescriptClean: boolean;
  /** All tests pass */
  testsPass: boolean;
  /** List of deviations from source with justifications */
  deviations: string[];
}
