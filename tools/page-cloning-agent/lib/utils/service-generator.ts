/**
 * Service Generator Utility
 * 
 * Generates service layer code following project patterns.
 * Used by the Page Cloning Agent to create services, data fetchers, and cache wrappers.
 * 
 * Requirements: 5.5, 5.6
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Error code definition for service errors
 */
export interface ErrorCodeDefinition {
  /** Error code name */
  code: string;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Description for JSDoc */
  description?: string;
}

/**
 * Method definition for service class
 */
export interface ServiceMethodDefinition {
  /** Method name */
  name: string;
  /** JSDoc description */
  description: string;
  /** Method parameters */
  params: Array<{
    name: string;
    type: string;
    optional?: boolean;
    defaultValue?: string;
    description?: string;
  }>;
  /** Return type */
  returnType: string;
  /** Whether the method is async */
  async: boolean;
  /** Cache key pattern (if caching is used) */
  cacheKey?: string;
  /** Method body */
  body: string;
  /** Requirement references */
  requirements?: string[];
}

/**
 * Configuration for generating a service
 */
export interface ServiceConfig {
  /** Service name (PascalCase, without 'Service' suffix) */
  name: string;
  /** JSDoc description */
  description: string;
  /** Data directory path (e.g., '@/data/free-ai-tools') */
  dataPath: string;
  /** Types import path */
  typesPath: string;
  /** Types to import */
  types: string[];
  /** Zod schemas to import (optional) */
  schemas?: string[];
  /** Error codes for custom error class */
  errorCodes: ErrorCodeDefinition[];
  /** Cache TTL in milliseconds (default: 3600000 = 1 hour) */
  cacheTTL?: number;
  /** Service methods */
  methods: ServiceMethodDefinition[];
  /** Additional imports */
  imports?: Array<{
    module: string;
    imports: string[];
    isTypeOnly?: boolean;
  }>;
  /** Requirement references */
  requirements?: string[];
}

/**
 * Configuration for generating a data fetcher
 */
export interface DataFetcherConfig {
  /** Function name */
  name: string;
  /** JSDoc description */
  description: string;
  /** Data file path pattern */
  dataPath: string;
  /** Return type */
  returnType: string;
  /** Zod schema for validation (optional) */
  schema?: string;
  /** Parameters */
  params?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  /** Whether to use dynamic import */
  dynamicImport?: boolean;
  /** Error handling behavior */
  errorHandling?: 'throw' | 'return-null' | 'return-empty';
  /** Requirement references */
  requirements?: string[];
}

/**
 * Configuration for generating a cache wrapper
 */
export interface CacheWrapperConfig {
  /** Function name */
  name: string;
  /** JSDoc description */
  description: string;
  /** Wrapped function name */
  wrappedFunction: string;
  /** Cache key pattern */
  cacheKeyPattern: string;
  /** TTL in milliseconds */
  ttl: number;
  /** Parameters (same as wrapped function) */
  params: Array<{
    name: string;
    type: string;
  }>;
  /** Return type */
  returnType: string;
  /** Requirement references */
  requirements?: string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Formats method parameters for function signature
 */
function formatMethodParams(params: ServiceMethodDefinition['params']): string {
  if (!params.length) return '';
  
  return params
    .map(p => {
      const optional = p.optional ? '?' : '';
      const defaultVal = p.defaultValue ? ` = ${p.defaultValue}` : '';
      return `${p.name}${optional}: ${p.type}${defaultVal}`;
    })
    .join(', ');
}

/**
 * Formats JSDoc for a method
 */
function formatMethodJSDoc(method: ServiceMethodDefinition): string {
  const lines: string[] = ['/**', ` * ${method.description}`];
  
  if (method.params.length) {
    lines.push(' *');
    method.params.forEach(p => {
      const desc = p.description ? ` - ${p.description}` : '';
      lines.push(` * @param ${p.name}${desc}`);
    });
  }
  
  if (method.requirements?.length) {
    lines.push(' *');
    lines.push(` * Requirements: ${method.requirements.join(', ')}`);
  }
  
  lines.push(' */');
  return lines.join('\n');
}

/**
 * Indents code by specified number of spaces
 */
function indent(code: string, spaces: number): string {
  const indentation = ' '.repeat(spaces);
  return code
    .split('\n')
    .map(line => (line.trim() ? indentation + line : line))
    .join('\n');
}

// =============================================================================
// Service Generator
// =============================================================================

/**
 * Generates a service class following project patterns
 * 
 * Requirements: 5.5, 5.6
 * 
 * @param config - Service configuration
 * @returns Generated service code as string
 */
export function generateService(config: ServiceConfig): string {
  const {
    name,
    description,
    dataPath,
    typesPath,
    types,
    schemas = [],
    errorCodes,
    cacheTTL = 60 * 60 * 1000,
    methods,
    imports = [],
    requirements = [],
  } = config;

  const serviceName = `${name}Service`;
  const errorClassName = `${name}Error`;
  const errorCodeType = `${name}ErrorCode`;
  const lines: string[] = [];

  // File header
  const reqDoc = requirements.length ? `\n * \n * Requirements: ${requirements.join(', ')}` : '';
  lines.push(`/**
 * ${name} Data Service
 * 
 * ${description}${reqDoc}
 */`);
  lines.push('');

  // Imports
  const typeImports = schemas.length 
    ? `{\n  type ${types.join(',\n  type ')},\n  ${schemas.join(',\n  ')},\n}`
    : `{\n  type ${types.join(',\n  type ')},\n}`;
  
  lines.push(`import ${typeImports} from '${typesPath}';`);
  
  // Additional imports
  imports.forEach(imp => {
    const typePrefix = imp.isTypeOnly ? 'type ' : '';
    lines.push(`import ${typePrefix}{ ${imp.imports.join(', ')} } from '${imp.module}';`);
  });
  
  lines.push('');

  // Error handling section
  lines.push('// =============================================================================');
  lines.push('// Error Handling');
  lines.push('// =============================================================================');
  lines.push('');

  // Error code type
  lines.push('/**');
  lines.push(` * Error codes for ${errorClassName}`);
  lines.push(' */');
  lines.push(`export type ${errorCodeType} = ${errorCodes.map(e => `'${e.code}'`).join(' | ')};`);
  lines.push('');

  // Custom error class
  lines.push('/**');
  lines.push(` * Custom error class for ${name} service`);
  lines.push(' * Provides structured error responses with retry guidance');
  lines.push(' */');
  lines.push(`export class ${errorClassName} extends Error {
  constructor(
    message: string,
    public readonly code: ${errorCodeType},
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = '${errorClassName}';
  }

  /**
   * Returns a structured error response
   */
  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        retryGuidance: this.retryable 
          ? 'This error may be temporary. Please try again in a few moments.'
          : 'This error is not retryable. Please check your request and try again.',
      },
    };
  }
}`);
  lines.push('');

  // Cache types section
  lines.push('// =============================================================================');
  lines.push('// Cache Types');
  lines.push('// =============================================================================');
  lines.push('');
  lines.push(`interface CacheEntry<T> {
  data: T;
  expiry: number;
}`);
  lines.push('');

  // Service class section
  lines.push('// =============================================================================');
  lines.push('// Service Class');
  lines.push('// =============================================================================');
  lines.push('');

  lines.push('/**');
  lines.push(` * ${name} Data Service`);
  lines.push(' *');
  lines.push(` * ${description}`);
  lines.push(' */');
  lines.push(`class ${serviceName} {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly TTL = ${cacheTTL}; // ${Math.round(cacheTTL / 60000)} minutes in milliseconds
  private readonly dataPath = '${dataPath}';

  // ===========================================================================
  // Cache Management
  // ===========================================================================

  /**
   * Get cached data if not expired
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.data as T;
    }
    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set data in cache with TTL
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL,
    });
  }

  /**
   * Invalidate cache entries
   * @param key - Optional specific key to invalidate. If not provided, clears all cache.
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Check if a cache entry exists and is valid
   */
  isCacheValid(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && entry.expiry > Date.now();
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // ===========================================================================
  // Service Methods
  // ===========================================================================
`);

  // Generate methods
  methods.forEach(method => {
    lines.push('');
    lines.push(indent(formatMethodJSDoc(method), 2));
    
    const asyncKeyword = method.async ? 'async ' : '';
    const params = formatMethodParams(method.params);
    
    lines.push(`  ${asyncKeyword}${method.name}(${params}): ${method.async ? `Promise<${method.returnType}>` : method.returnType} {`);
    lines.push(indent(method.body, 4));
    lines.push('  }');
  });

  lines.push('}');
  lines.push('');

  // Export singleton
  lines.push('// =============================================================================');
  lines.push('// Export Singleton Instance');
  lines.push('// =============================================================================');
  lines.push('');
  lines.push(`export const ${name.charAt(0).toLowerCase() + name.slice(1)}Service = new ${serviceName}();`);
  lines.push('');
  lines.push('// Also export the class for testing purposes');
  lines.push(`export { ${serviceName} };`);

  return lines.join('\n');
}

// =============================================================================
// Data Fetcher Generator
// =============================================================================

/**
 * Generates a standalone data fetcher function
 * 
 * Requirements: 5.5, 5.6
 * 
 * @param config - Data fetcher configuration
 * @returns Generated data fetcher code as string
 */
export function generateDataFetcher(config: DataFetcherConfig): string {
  const {
    name,
    description,
    dataPath,
    returnType,
    schema,
    params = [],
    dynamicImport = true,
    errorHandling = 'throw',
    requirements = [],
  } = config;

  const lines: string[] = [];

  // JSDoc
  lines.push('/**');
  lines.push(` * ${description}`);
  if (params.length) {
    lines.push(' *');
    params.forEach(p => {
      const desc = p.description ? ` - ${p.description}` : '';
      lines.push(` * @param ${p.name}${desc}`);
    });
  }
  lines.push(` * @returns ${returnType}`);
  if (requirements.length) {
    lines.push(' *');
    lines.push(` * Requirements: ${requirements.join(', ')}`);
  }
  lines.push(' */');

  // Function signature
  const paramsStr = params.map(p => `${p.name}: ${p.type}`).join(', ');
  lines.push(`export async function ${name}(${paramsStr}): Promise<${returnType}> {`);

  // Function body
  if (dynamicImport) {
    lines.push('  try {');
    
    // Build import path
    const importPath = params.length 
      ? `\`${dataPath}\`` 
      : `'${dataPath}'`;
    
    lines.push(`    const data = await import(${importPath});`);
    
    if (schema) {
      lines.push(`    const validated = ${schema}.parse(data.default);`);
      lines.push('    return validated;');
    } else {
      lines.push('    return data.default;');
    }
    
    lines.push('  } catch (error) {');
    
    // Error handling
    if (errorHandling === 'return-null') {
      lines.push('    console.error(`Failed to fetch data: ${error}`);');
      lines.push('    return null;');
    } else if (errorHandling === 'return-empty') {
      lines.push('    console.error(`Failed to fetch data: ${error}`);');
      lines.push('    return [] as unknown as ' + returnType + ';');
    } else {
      lines.push('    if (error instanceof Error && error.message.includes(\'Cannot find module\')) {');
      lines.push(`      throw new Error('Data file not found: ${dataPath}');`);
      lines.push('    }');
      lines.push('    throw error;');
    }
    
    lines.push('  }');
  } else {
    // Static import (for build-time data)
    lines.push(`  const data = require('${dataPath}');`);
    if (schema) {
      lines.push(`  return ${schema}.parse(data);`);
    } else {
      lines.push('  return data;');
    }
  }

  lines.push('}');

  return lines.join('\n');
}

// =============================================================================
// Cache Wrapper Generator
// =============================================================================

/**
 * Generates a cache wrapper function using React's cache
 * 
 * Requirements: 5.5
 * 
 * @param config - Cache wrapper configuration
 * @returns Generated cache wrapper code as string
 */
export function generateCacheWrapper(config: CacheWrapperConfig): string {
  const {
    name,
    description,
    wrappedFunction,
    cacheKeyPattern,
    ttl,
    params,
    returnType,
    requirements = [],
  } = config;

  const lines: string[] = [];

  // JSDoc
  lines.push('/**');
  lines.push(` * ${description}`);
  lines.push(' *');
  lines.push(` * Wraps ${wrappedFunction} with caching (TTL: ${Math.round(ttl / 1000)}s)`);
  lines.push(` * Cache key pattern: ${cacheKeyPattern}`);
  if (params.length) {
    lines.push(' *');
    params.forEach(p => {
      lines.push(` * @param ${p.name} - ${p.type}`);
    });
  }
  if (requirements.length) {
    lines.push(' *');
    lines.push(` * Requirements: ${requirements.join(', ')}`);
  }
  lines.push(' */');

  // Import statement (to be added at top of file)
  lines.push("// Note: Add this import at the top of your file:");
  lines.push("// import { cache } from 'react';");
  lines.push('');

  // Cache wrapper using React's cache
  const paramsStr = params.map(p => `${p.name}: ${p.type}`).join(', ');
  const paramsNames = params.map(p => p.name).join(', ');
  
  lines.push(`export const ${name} = cache(async (${paramsStr}): Promise<${returnType}> => {`);
  lines.push(`  return ${wrappedFunction}(${paramsNames});`);
  lines.push('});');

  return lines.join('\n');
}

// =============================================================================
// Full Service File Generator
// =============================================================================

/**
 * Configuration for generating a complete service file
 */
export interface ServiceFileConfig {
  /** Service configuration */
  service: ServiceConfig;
  /** Additional data fetchers */
  dataFetchers?: DataFetcherConfig[];
  /** Cache wrappers */
  cacheWrappers?: CacheWrapperConfig[];
}

/**
 * Generates a complete service file with service class, data fetchers, and cache wrappers
 * 
 * @param config - Service file configuration
 * @returns Generated service file code as string
 */
export function generateServiceFile(config: ServiceFileConfig): string {
  const { service, dataFetchers = [], cacheWrappers = [] } = config;
  
  const parts: string[] = [];
  
  // Main service
  parts.push(generateService(service));
  
  // Data fetchers
  if (dataFetchers.length) {
    parts.push('');
    parts.push('// =============================================================================');
    parts.push('// Data Fetchers');
    parts.push('// =============================================================================');
    parts.push('');
    dataFetchers.forEach(fetcher => {
      parts.push(generateDataFetcher(fetcher));
      parts.push('');
    });
  }
  
  // Cache wrappers
  if (cacheWrappers.length) {
    parts.push('');
    parts.push('// =============================================================================');
    parts.push('// Cache Wrappers');
    parts.push('// =============================================================================');
    parts.push('');
    parts.push("import { cache } from 'react';");
    parts.push('');
    cacheWrappers.forEach(wrapper => {
      // Remove the note about imports since we added it above
      const code = generateCacheWrapper(wrapper)
        .split('\n')
        .filter(line => !line.startsWith('// Note:') && !line.startsWith("// import"))
        .join('\n');
      parts.push(code);
      parts.push('');
    });
  }
  
  return parts.join('\n');
}
