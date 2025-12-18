/**
 * JSDoc Comment Generator Utility
 * 
 * Provides functions to generate JSDoc comments for components and services.
 * Used by the Page Cloning Agent to document generated code.
 * 
 * @module jsdoc-generator
 * @see Requirements 26.1, 26.4, 26.5
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Parameter definition for JSDoc @param tags
 */
export interface ParamDefinition {
  /** Parameter name */
  name: string;
  /** TypeScript type */
  type: string;
  /** Description of the parameter */
  description: string;
  /** Whether the parameter is optional */
  optional?: boolean;
  /** Default value if optional */
  defaultValue?: string;
}

/**
 * Return type definition for JSDoc @returns tag
 */
export interface ReturnDefinition {
  /** TypeScript type */
  type: string;
  /** Description of the return value */
  description: string;
}

/**
 * Example definition for JSDoc @example tag
 */
export interface ExampleDefinition {
  /** Description of the example */
  description?: string;
  /** Code snippet */
  code: string;
}

/**
 * Configuration for generating component JSDoc
 */
export interface ComponentDocConfig {
  /** Component name */
  name: string;
  /** Component description */
  description: string;
  /** Props definitions */
  props?: ParamDefinition[];
  /** Usage examples */
  examples?: ExampleDefinition[];
  /** Source URL if cloned from external site */
  sourceUrl?: string;
  /** Extraction/creation date */
  createdAt?: string;
  /** Requirement references */
  requirements?: string[];
  /** Additional notes or deviations */
  notes?: string[];
  /** Whether the component is a client component */
  isClientComponent?: boolean;
  /** Module/file path for @module tag */
  module?: string;
  /** Related components or files */
  see?: string[];
}

/**
 * Configuration for generating service JSDoc
 */
export interface ServiceDocConfig {
  /** Service name */
  name: string;
  /** Service description */
  description: string;
  /** Module/file path for @module tag */
  module?: string;
  /** Source URL if data is from external site */
  sourceUrl?: string;
  /** Extraction/creation date */
  createdAt?: string;
  /** Requirement references */
  requirements?: string[];
  /** Related files */
  see?: string[];
}

/**
 * Configuration for generating function JSDoc
 */
export interface FunctionDocConfig {
  /** Function name */
  name: string;
  /** Function description */
  description: string;
  /** Parameters */
  params?: ParamDefinition[];
  /** Return value */
  returns?: ReturnDefinition;
  /** Usage examples */
  examples?: ExampleDefinition[];
  /** Whether the function is async */
  isAsync?: boolean;
  /** Whether the function can throw */
  throws?: string;
  /** Requirement references */
  requirements?: string[];
}

/**
 * Configuration for data file header comment
 */
export interface DataFileHeaderConfig {
  /** Description of the data */
  description: string;
  /** Source URL where data was extracted from */
  sourceUrl: string;
  /** ISO timestamp when data was extracted */
  extractedAt: string;
  /** Number of items in the data */
  itemCount?: number;
  /** Data schema or type reference */
  schema?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Formats a date string for display in comments
 * 
 * @param isoDate - ISO date string
 * @returns Formatted date string
 */
export function formatDateForComment(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return isoDate;
  }
}

/**
 * Wraps text to a maximum line length for JSDoc comments
 * 
 * @param text - Text to wrap
 * @param maxLength - Maximum line length (default 80)
 * @param prefix - Prefix for each line (default ' * ')
 * @returns Wrapped text
 */
export function wrapText(text: string, maxLength: number = 80, prefix: string = ' * '): string {
  const effectiveLength = maxLength - prefix.length;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= effectiveLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.map(line => prefix + line).join('\n');
}

/**
 * Formats a parameter for JSDoc @param tag
 * 
 * @param param - Parameter definition
 * @returns Formatted @param line
 */
export function formatParam(param: ParamDefinition): string {
  const optionalMarker = param.optional ? '?' : '';
  const defaultValue = param.defaultValue ? ` (default: ${param.defaultValue})` : '';
  return ` * @param ${param.name}${optionalMarker} - ${param.description}${defaultValue}`;
}

/**
 * Formats a return value for JSDoc @returns tag
 * 
 * @param returns - Return definition
 * @returns Formatted @returns line
 */
export function formatReturns(returns: ReturnDefinition): string {
  return ` * @returns ${returns.description}`;
}

/**
 * Formats an example for JSDoc @example tag
 * 
 * @param example - Example definition
 * @returns Formatted @example block
 */
export function formatExample(example: ExampleDefinition): string {
  const lines: string[] = [' * @example'];
  if (example.description) {
    lines.push(` * ${example.description}`);
  }
  lines.push(' * ```typescript');
  example.code.split('\n').forEach(line => {
    lines.push(` * ${line}`);
  });
  lines.push(' * ```');
  return lines.join('\n');
}

// =============================================================================
// Component Documentation Generator
// =============================================================================

/**
 * Generates JSDoc comment for a React component
 * 
 * @param config - Component documentation configuration
 * @returns JSDoc comment string
 * 
 * @example
 * generateComponentDocs({
 *   name: 'ToolCard',
 *   description: 'Displays a tool card with name, description, and link.',
 *   props: [
 *     { name: 'tool', type: 'Tool', description: 'The tool data to display' },
 *   ],
 *   sourceUrl: 'https://toolify.ai/tools',
 *   createdAt: '2025-12-15T10:00:00Z',
 * });
 */
export function generateComponentDocs(config: ComponentDocConfig): string {
  const {
    name,
    description,
    props = [],
    examples = [],
    sourceUrl,
    createdAt,
    requirements = [],
    notes = [],
    isClientComponent = false,
    module,
    see = [],
  } = config;

  const lines: string[] = ['/**'];

  // Component name and description
  lines.push(` * ${name} Component`);
  lines.push(' *');
  lines.push(` * ${description}`);

  // Client component note
  if (isClientComponent) {
    lines.push(' *');
    lines.push(' * This is a client component that requires browser APIs.');
  }

  // Source URL and extraction date
  if (sourceUrl || createdAt) {
    lines.push(' *');
    if (sourceUrl) {
      lines.push(` * @source ${sourceUrl}`);
    }
    if (createdAt) {
      lines.push(` * @created ${formatDateForComment(createdAt)}`);
    }
  }

  // Props documentation
  if (props.length > 0) {
    lines.push(' *');
    for (const prop of props) {
      lines.push(formatParam(prop));
    }
  }

  // Examples
  for (const example of examples) {
    lines.push(' *');
    lines.push(formatExample(example));
  }

  // Notes and deviations
  if (notes.length > 0) {
    lines.push(' *');
    lines.push(' * @remarks');
    for (const note of notes) {
      lines.push(` * - ${note}`);
    }
  }

  // Requirements
  if (requirements.length > 0) {
    lines.push(' *');
    lines.push(` * @requirements ${requirements.join(', ')}`);
  }

  // Module
  if (module) {
    lines.push(` * @module ${module}`);
  }

  // See also
  for (const ref of see) {
    lines.push(` * @see ${ref}`);
  }

  lines.push(' */');

  return lines.join('\n');
}

// =============================================================================
// Service Documentation Generator
// =============================================================================

/**
 * Generates JSDoc file header comment for a service
 * 
 * @param config - Service documentation configuration
 * @returns JSDoc comment string
 * 
 * @example
 * generateServiceDocs({
 *   name: 'FreeAIToolsService',
 *   description: 'Service for fetching and managing free AI tools data.',
 *   module: 'free-ai-tools.service',
 *   sourceUrl: 'https://toolify.ai/free-ai-tools',
 *   requirements: ['5.5', '5.6'],
 * });
 */
export function generateServiceDocs(config: ServiceDocConfig): string {
  const {
    name,
    description,
    module,
    sourceUrl,
    createdAt,
    requirements = [],
    see = [],
  } = config;

  const lines: string[] = ['/**'];

  // Service name and description
  lines.push(` * ${name}`);
  lines.push(' *');
  lines.push(` * ${description}`);

  // Source URL and extraction date
  if (sourceUrl || createdAt) {
    lines.push(' *');
    if (sourceUrl) {
      lines.push(` * Data source: ${sourceUrl}`);
    }
    if (createdAt) {
      lines.push(` * Last updated: ${formatDateForComment(createdAt)}`);
    }
  }

  // Module
  if (module) {
    lines.push(' *');
    lines.push(` * @module ${module}`);
  }

  // Requirements
  if (requirements.length > 0) {
    lines.push(` * @requirements ${requirements.join(', ')}`);
  }

  // See also
  for (const ref of see) {
    lines.push(` * @see ${ref}`);
  }

  lines.push(' */');

  return lines.join('\n');
}

// =============================================================================
// Function Documentation Generator
// =============================================================================

/**
 * Generates JSDoc comment for a function
 * 
 * @param config - Function documentation configuration
 * @returns JSDoc comment string
 * 
 * @example
 * generateFunctionDocs({
 *   name: 'getToolBySlug',
 *   description: 'Fetches a tool by its URL slug.',
 *   params: [
 *     { name: 'slug', type: 'string', description: 'The URL slug of the tool' },
 *   ],
 *   returns: { type: 'Promise<Tool>', description: 'The tool data' },
 *   isAsync: true,
 *   throws: 'NotFoundError if tool does not exist',
 * });
 */
export function generateFunctionDocs(config: FunctionDocConfig): string {
  const {
    name,
    description,
    params = [],
    returns,
    examples = [],
    isAsync = false,
    throws,
    requirements = [],
  } = config;

  const lines: string[] = ['/**'];

  // Function description
  lines.push(` * ${description}`);

  // Async note
  if (isAsync) {
    lines.push(' *');
    lines.push(' * This function is asynchronous.');
  }

  // Parameters
  if (params.length > 0) {
    lines.push(' *');
    for (const param of params) {
      lines.push(formatParam(param));
    }
  }

  // Returns
  if (returns) {
    lines.push(' *');
    lines.push(formatReturns(returns));
  }

  // Throws
  if (throws) {
    lines.push(' *');
    lines.push(` * @throws ${throws}`);
  }

  // Examples
  for (const example of examples) {
    lines.push(' *');
    lines.push(formatExample(example));
  }

  // Requirements
  if (requirements.length > 0) {
    lines.push(' *');
    lines.push(` * @requirements ${requirements.join(', ')}`);
  }

  lines.push(' */');

  return lines.join('\n');
}

// =============================================================================
// Data File Header Generator
// =============================================================================

/**
 * Generates a JSON comment header for data files
 * Note: JSON doesn't support comments, so this returns a _metadata object
 * 
 * @param config - Data file header configuration
 * @returns Metadata object to include in JSON
 * 
 * @example
 * generateDataFileHeader({
 *   description: 'Free AI tools organized by category',
 *   sourceUrl: 'https://toolify.ai/free-ai-tools',
 *   extractedAt: '2025-12-15T10:00:00Z',
 *   itemCount: 150,
 * });
 */
export function generateDataFileHeader(config: DataFileHeaderConfig): Record<string, unknown> {
  const {
    description,
    sourceUrl,
    extractedAt,
    itemCount,
    schema,
  } = config;

  const metadata: Record<string, unknown> = {
    description,
    sourceUrl,
    extractedAt,
  };

  if (itemCount !== undefined) {
    metadata.itemCount = itemCount;
  }

  if (schema) {
    metadata.schema = schema;
  }

  return { _metadata: metadata };
}

/**
 * Generates a TypeScript comment header for data files
 * Used when data is imported as a TypeScript module
 * 
 * @param config - Data file header configuration
 * @returns Comment string
 */
export function generateDataFileComment(config: DataFileHeaderConfig): string {
  const {
    description,
    sourceUrl,
    extractedAt,
    itemCount,
    schema,
  } = config;

  const lines: string[] = ['/**'];

  lines.push(` * ${description}`);
  lines.push(' *');
  lines.push(` * Source: ${sourceUrl}`);
  lines.push(` * Extracted: ${formatDateForComment(extractedAt)}`);

  if (itemCount !== undefined) {
    lines.push(` * Items: ${itemCount}`);
  }

  if (schema) {
    lines.push(' *');
    lines.push(` * @see ${schema} for type definitions`);
  }

  lines.push(' */');

  return lines.join('\n');
}

// =============================================================================
// Inline Comment Generators
// =============================================================================

/**
 * Generates an inline comment explaining complex logic
 * 
 * @param explanation - The explanation text
 * @param multiline - Whether to use multiline format
 * @returns Comment string
 */
export function generateInlineComment(explanation: string, multiline: boolean = false): string {
  if (multiline || explanation.length > 60) {
    const lines = ['/*'];
    // Split into lines of ~70 chars
    const words = explanation.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= 70) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(` * ${currentLine}`);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(` * ${currentLine}`);
    
    lines.push(' */');
    return lines.join('\n');
  }
  
  return `// ${explanation}`;
}

/**
 * Generates a deviation comment explaining why implementation differs from source
 * 
 * @param deviation - Description of the deviation
 * @param reason - Reason for the deviation
 * @returns Comment string
 */
export function generateDeviationComment(deviation: string, reason: string): string {
  return `/*
 * DEVIATION FROM SOURCE:
 * ${deviation}
 * 
 * REASON:
 * ${reason}
 */`;
}

/**
 * Generates a TODO comment for future work
 * 
 * @param task - Description of the task
 * @param reference - Optional reference (e.g., issue number, requirement)
 * @returns Comment string
 */
export function generateTodoComment(task: string, reference?: string): string {
  const refPart = reference ? ` [${reference}]` : '';
  return `// TODO${refPart}: ${task}`;
}
