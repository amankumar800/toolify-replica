/**
 * Component Generator Utility
 * 
 * Generates React component code following project patterns.
 * Used by the Page Cloning Agent to create components, pages, loading skeletons, and error boundaries.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Definition for a component prop
 */
export interface PropDefinition {
  /** Prop name */
  name: string;
  /** TypeScript type */
  type: string;
  /** Whether the prop is required */
  required: boolean;
  /** JSDoc description */
  description?: string;
  /** Default value (for optional props) */
  defaultValue?: string;
}

/**
 * Definition for an import statement
 */
export interface ImportDefinition {
  /** Module path */
  module: string;
  /** Named imports */
  imports: string[];
  /** Whether this is a default import */
  isDefault?: boolean;
  /** Whether this is a type-only import */
  isTypeOnly?: boolean;
}

/**
 * Configuration for generating a component
 */
export interface ComponentConfig {
  /** Component name (PascalCase) */
  name: string;
  /** JSDoc description */
  description: string;
  /** Props definitions */
  props: PropDefinition[];
  /** Add 'use client' directive */
  isClientComponent?: boolean;
  /** Additional imports */
  imports?: ImportDefinition[];
  /** Accept children prop */
  children?: boolean;
  /** Accept className prop */
  className?: boolean;
  /** Requirement references for JSDoc */
  requirements?: string[];
  /** Component body content */
  body?: string;
}

/**
 * Configuration for generating a page
 */
export interface PageConfig {
  /** Route path (e.g., 'free-ai-tools/[slug]') */
  route: string;
  /** Page title template */
  title: string;
  /** Meta description template */
  description: string;
  /** Service module to import */
  serviceName: string;
  /** Service import path */
  servicePath: string;
  /** Function to fetch data */
  dataFetcher: string;
  /** Components to import and render */
  components: Array<{ name: string; path: string }>;
  /** Dynamic route params */
  hasParams?: boolean;
  /** Param name for dynamic routes */
  paramName?: string;
  /** ISR revalidation time in seconds */
  revalidate?: number;
  /** Generate static params function */
  generateStaticParams?: boolean;
  /** Static params fetcher function */
  staticParamsFetcher?: string;
  /** Include JSON-LD structured data */
  jsonLd?: boolean;
  /** JSON-LD type (e.g., 'CollectionPage', 'Article') */
  jsonLdType?: string;
  /** Breadcrumb items */
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** Main content JSX */
  mainContent?: string;
}


/**
 * Skeleton section configuration
 */
export interface SkeletonSection {
  /** Section type */
  type: 'sidebar' | 'content' | 'panel' | 'header' | 'list' | 'grid';
  /** Number of skeleton items */
  items: number;
  /** Custom width class */
  width?: string;
}

/**
 * Configuration for loading skeleton
 */
export interface LoadingSkeletonConfig {
  /** Layout type */
  layout: 'single' | 'sidebar' | 'three-column';
  /** Skeleton sections */
  sections: SkeletonSection[];
  /** Timeout in milliseconds (default 10000) */
  timeout?: number;
  /** Include retry functionality */
  includeRetry?: boolean;
}

/**
 * Suggestion link for error boundary
 */
export interface SuggestionLink {
  /** Link text */
  name: string;
  /** Link href */
  href: string;
  /** Optional icon emoji */
  icon?: string;
}

/**
 * Configuration for error boundary
 */
export interface ErrorBoundaryConfig {
  /** Error title */
  title: string;
  /** Error description */
  description: string;
  /** Suggestion links */
  suggestions?: SuggestionLink[];
  /** Show retry button */
  showRetry?: boolean;
  /** Show dev details in development */
  showDevDetails?: boolean;
  /** Fallback route */
  fallbackRoute?: string;
  /** Fallback route label */
  fallbackLabel?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Indents code by specified number of spaces
 */
export function indent(code: string, spaces: number): string {
  const indentation = ' '.repeat(spaces);
  return code
    .split('\n')
    .map(line => (line.trim() ? indentation + line : line))
    .join('\n');
}

/**
 * Formats import statements
 */
export function formatImports(imports: ImportDefinition[]): string {
  if (!imports.length) return '';

  return imports
    .map(imp => {
      const typePrefix = imp.isTypeOnly ? 'type ' : '';
      if (imp.isDefault && imp.imports.length === 1) {
        return `import ${typePrefix}${imp.imports[0]} from '${imp.module}';`;
      }
      if (imp.isDefault) {
        const [defaultImport, ...namedImports] = imp.imports;
        if (namedImports.length) {
          return `import ${typePrefix}${defaultImport}, { ${namedImports.join(', ')} } from '${imp.module}';`;
        }
        return `import ${typePrefix}${defaultImport} from '${imp.module}';`;
      }
      return `import ${typePrefix}{ ${imp.imports.join(', ')} } from '${imp.module}';`;
    })
    .join('\n');
}

/**
 * Formats props interface
 */
export function formatPropsInterface(name: string, props: PropDefinition[], children?: boolean, className?: boolean): string {
  const allProps = [...props];
  
  if (className) {
    allProps.push({
      name: 'className',
      type: 'string',
      required: false,
      description: 'Additional CSS classes',
    });
  }
  
  if (children) {
    allProps.push({
      name: 'children',
      type: 'React.ReactNode',
      required: false,
      description: 'Child elements',
    });
  }

  if (!allProps.length) return '';

  const propsContent = allProps
    .map(prop => {
      const optional = prop.required ? '' : '?';
      const comment = prop.description ? `  /** ${prop.description} */\n` : '';
      return `${comment}  ${prop.name}${optional}: ${prop.type};`;
    })
    .join('\n');

  return `interface ${name}Props {\n${propsContent}\n}`;
}

/**
 * Formats function parameters from props
 */
export function formatPropsDestructure(props: PropDefinition[], children?: boolean, className?: boolean): string {
  const allProps = props.map(p => {
    if (p.defaultValue && !p.required) {
      return `${p.name} = ${p.defaultValue}`;
    }
    return p.name;
  });
  
  if (className) allProps.push('className');
  if (children) allProps.push('children');
  
  if (!allProps.length) return '';
  return `{ ${allProps.join(', ')} }`;
}


// =============================================================================
// Component Generator
// =============================================================================

/**
 * Generates a React component following project patterns
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * 
 * @param config - Component configuration
 * @returns Generated component code as string
 */
export function generateComponent(config: ComponentConfig): string {
  const {
    name,
    description,
    props,
    isClientComponent = false,
    imports = [],
    children = false,
    className = false,
    requirements = [],
    body = '',
  } = config;

  const lines: string[] = [];

  // Add 'use client' directive if needed
  if (isClientComponent) {
    lines.push("'use client';");
    lines.push('');
  }

  // Default imports
  const defaultImports: ImportDefinition[] = [
    { module: 'react', imports: ['React'], isDefault: false },
  ];

  // Add cn import if className prop is used
  if (className) {
    defaultImports.push({ module: '@/lib/utils', imports: ['cn'] });
  }

  // Combine and format imports
  const allImports = [...defaultImports, ...imports];
  lines.push(formatImports(allImports));
  lines.push('');

  // Generate props interface
  const propsInterface = formatPropsInterface(name, props, children, className);
  if (propsInterface) {
    lines.push(propsInterface);
    lines.push('');
  }

  // Generate JSDoc comment
  const requirementsDoc = requirements.length
    ? `\n * \n * Requirements: ${requirements.join(', ')}`
    : '';
  lines.push(`/**
 * ${name} Component
 * 
 * ${description}${requirementsDoc}
 */`);

  // Generate component function
  const propsParam = formatPropsDestructure(props, children, className);
  const propsType = props.length || children || className ? `: ${name}Props` : '';
  
  const componentBody = body || generateDefaultComponentBody(name, className, children);

  lines.push(`export function ${name}(${propsParam ? `${propsParam}${propsType}` : ''}): React.ReactElement {
  return (
${indent(componentBody, 4)}
  );
}`);

  lines.push('');
  lines.push(`export default ${name};`);

  return lines.join('\n');
}

/**
 * Generates default component body
 */
function generateDefaultComponentBody(name: string, hasClassName: boolean, hasChildren: boolean): string {
  const classNameAttr = hasClassName
    ? `\n      className={cn(\n        'relative',\n        className\n      )}`
    : '';
  
  const childrenContent = hasChildren ? '{children}' : `{/* ${name} content */}`;

  return `<div${classNameAttr}>
  ${childrenContent}
</div>`;
}

// =============================================================================
// Page Generator
// =============================================================================

/**
 * Generates a Next.js App Router page following project patterns
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 * 
 * @param config - Page configuration
 * @returns Generated page code as string
 */
export function generatePage(config: PageConfig): string {
  const {
    route,
    title,
    description,
    serviceName,
    servicePath,
    dataFetcher,
    components,
    hasParams = false,
    paramName = 'slug',
    revalidate = 86400,
    generateStaticParams: genStaticParams = false,
    staticParamsFetcher,
    jsonLd = false,
    jsonLdType = 'WebPage',
    breadcrumbs = [],
    mainContent = '',
  } = config;

  const lines: string[] = [];

  // Imports
  lines.push("import { Metadata } from 'next';");
  lines.push("import { notFound } from 'next/navigation';");
  lines.push(`import { ${serviceName} } from '${servicePath}';`);
  
  // Component imports
  components.forEach(comp => {
    lines.push(`import { ${comp.name} } from '${comp.path}';`);
  });

  if (breadcrumbs.length) {
    lines.push("import { Breadcrumb } from '@/components/ui/Breadcrumb';");
  }

  lines.push('');

  // JSDoc
  lines.push(`/**
 * ${route} Page
 * 
 * Generated by Page Cloning Agent
 */`);
  lines.push('');

  // ISR revalidate
  lines.push(`// ISR: Revalidate every ${revalidate} seconds`);
  lines.push(`export const revalidate = ${revalidate};`);
  lines.push('');

  // generateStaticParams
  if (genStaticParams && staticParamsFetcher) {
    lines.push(`// Generate static params for all items`);
    lines.push(`export async function generateStaticParams() {
  try {
    const items = await ${serviceName}.${staticParamsFetcher}();
    return items.map((item) => ({ ${paramName}: item.${paramName} }));
  } catch {
    return [];
  }
}`);
    lines.push('');
  }

  // generateMetadata
  const paramsType = hasParams ? `{ params }: { params: Promise<{ ${paramName}: string }> }` : '';
  lines.push(`// Generate metadata for SEO`);
  lines.push(`export async function generateMetadata(${paramsType}): Promise<Metadata> {`);
  
  if (hasParams) {
    lines.push(`  const { ${paramName} } = await params;`);
    lines.push(`  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';`);
    lines.push('');
    lines.push('  try {');
    lines.push(`    const data = await ${serviceName}.${dataFetcher}(${paramName});`);
    lines.push(`    const pageTitle = \`${title}\`;`);
    lines.push(`    const pageDescription = \`${description}\`;`);
    lines.push('');
    lines.push('    return {');
    lines.push('      title: pageTitle,');
    lines.push('      description: pageDescription,');
    lines.push('      openGraph: {');
    lines.push('        title: pageTitle,');
    lines.push('        description: pageDescription,');
    lines.push(`        url: \`\${baseUrl}/${route.replace('[' + paramName + ']', `\${${paramName}}`)}\`,`);
    lines.push("        siteName: 'Toolify',");
    lines.push("        type: 'website',");
    lines.push('      },');
    lines.push('      alternates: {');
    lines.push(`        canonical: \`\${baseUrl}/${route.replace('[' + paramName + ']', `\${${paramName}}`)}\`,`);
    lines.push('      },');
    lines.push('    };');
    lines.push('  } catch {');
    lines.push('    return {');
    lines.push("      title: 'Not Found',");
    lines.push("      description: 'The requested page could not be found.',");
    lines.push('    };');
    lines.push('  }');
  } else {
    lines.push(`  return {`);
    lines.push(`    title: '${title}',`);
    lines.push(`    description: '${description}',`);
    lines.push('  };');
  }
  
  lines.push('}');
  lines.push('');

  // JSON-LD component
  if (jsonLd) {
    lines.push(generateJsonLdComponent(jsonLdType));
    lines.push('');
  }

  // Main page component
  lines.push(`/**`);
  lines.push(` * Main Page Component`);
  lines.push(` */`);
  lines.push(`export default async function Page(${hasParams ? `{ params }: { params: Promise<{ ${paramName}: string }> }` : ''}) {`);
  
  if (hasParams) {
    lines.push(`  const { ${paramName} } = await params;`);
    lines.push(`  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';`);
    lines.push('');
    lines.push('  let data;');
    lines.push('  try {');
    lines.push(`    data = await ${serviceName}.${dataFetcher}(${paramName});`);
    lines.push('  } catch {');
    lines.push('    notFound();');
    lines.push('  }');
  }

  lines.push('');
  lines.push('  return (');
  lines.push('    <>');
  
  if (jsonLd) {
    lines.push('      <JsonLdScript data={data} baseUrl={baseUrl} />');
  }
  
  lines.push('      <div className="container py-8">');
  
  if (breadcrumbs.length) {
    const breadcrumbItems = breadcrumbs
      .map(b => b.href ? `{ label: '${b.label}', href: '${b.href}' }` : `{ label: '${b.label}' }`)
      .join(', ');
    lines.push(`        <Breadcrumb items={[${breadcrumbItems}]} />`);
  }
  
  if (mainContent) {
    lines.push(indent(mainContent, 8));
  } else {
    lines.push('        <main className="flex-1">');
    lines.push('          {/* Page content */}');
    lines.push('        </main>');
  }
  
  lines.push('      </div>');
  lines.push('    </>');
  lines.push('  );');
  lines.push('}');

  return lines.join('\n');
}

/**
 * Generates JSON-LD script component
 */
function generateJsonLdComponent(type: string): string {
  return `/**
 * JSON-LD Structured Data Component
 */
function JsonLdScript({ data, baseUrl }: { data: unknown; baseUrl: string }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': '${type}',
    // Add structured data properties based on data
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}`;
}

