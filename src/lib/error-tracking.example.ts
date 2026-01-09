/**
 * Error Tracking Usage Examples
 * 
 * This file demonstrates how to use the error tracking utility
 * throughout your application. Delete this file after reviewing.
 * 
 * @example API Route Integration
 * @example React Component Integration
 * @example Service Layer Integration
 */

// ============================================================================
// Example 1: API Route Integration
// ============================================================================

/*
// In your API route (e.g., src/app/api/admin/tools/route.ts):

import { captureError, createScopedTracker } from '@/lib/error-tracking';

// Option A: Direct usage
export async function GET(request: NextRequest) {
  try {
    const data = await fetchTools();
    return NextResponse.json(data);
  } catch (error) {
    captureError(error, {
      component: 'ToolsAPI',
      action: 'GET',
      category: 'database',
      metadata: { endpoint: '/api/admin/tools' }
    });
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

// Option B: Scoped tracker (recommended for multiple operations)
const tracker = createScopedTracker('ToolsAPI');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    tracker.breadcrumb('Creating new tool', { name: body.name });
    
    const tool = await createTool(body);
    return NextResponse.json(tool);
  } catch (error) {
    tracker.error(error, { action: 'POST', metadata: { body } });
    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}
*/

// ============================================================================
// Example 2: React Component Integration
// ============================================================================

/*
// In your React component:

'use client';

import { ErrorBoundary, withErrorBoundary } from '@/components/providers/ErrorBoundary';
import { captureError, addBreadcrumb } from '@/lib/error-tracking';

// Option A: Wrap with ErrorBoundary component
function ToolsPage() {
  return (
    <ErrorBoundary componentName="ToolsPage">
      <ToolsList />
    </ErrorBoundary>
  );
}

// Option B: Use HOC
const SafeToolsList = withErrorBoundary(ToolsList, {
  componentName: 'ToolsList',
  fallback: <div>Failed to load tools</div>
});

// Option C: Manual error handling in event handlers
function ToolCard({ tool }) {
  const handleDelete = async () => {
    try {
      addBreadcrumb({ category: 'user-action', message: `Deleting tool: ${tool.id}` });
      await deleteTool(tool.id);
    } catch (error) {
      captureError(error, {
        component: 'ToolCard',
        action: 'delete',
        metadata: { toolId: tool.id }
      });
      // Show user-friendly error
      toast.error('Failed to delete tool');
    }
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}
*/

// ============================================================================
// Example 3: Service Layer Integration
// ============================================================================

/*
// In your service (e.g., src/lib/services/tools.service.ts):

import { withErrorTracking, createScopedTracker } from '@/lib/error-tracking';

// Option A: Wrap entire function
export const getToolById = withErrorTracking(
  async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  { component: 'ToolsService', action: 'getToolById', category: 'database' }
);

// Option B: Scoped tracker for service class
class ToolsService {
  private tracker = createScopedTracker('ToolsService');
  
  async create(data: ToolInput) {
    try {
      this.tracker.breadcrumb('Creating tool', { name: data.name });
      // ... create logic
    } catch (error) {
      this.tracker.error(error, { action: 'create' });
      throw error;
    }
  }
}
*/

// ============================================================================
// Example 4: Setting User Context (on login)
// ============================================================================

/*
// In your auth provider or login handler:

import { setUserContext } from '@/lib/error-tracking';

// On successful login
async function handleLogin(credentials) {
  const user = await login(credentials);
  
  // Set user context for all future errors
  setUserContext({
    id: user.id,
    email: user.email,
    role: user.role
  });
  
  return user;
}

// On logout
async function handleLogout() {
  await logout();
  
  // Clear user context
  setUserContext(null);
}
*/

// ============================================================================
// Example 5: Replacing console.error with captureError
// ============================================================================

/*
// Before (scattered console.error):
try {
  await saveData();
} catch (error) {
  console.error('Error saving data:', error);  // Lost in production!
}

// After (tracked in Sentry):
import { captureError } from '@/lib/error-tracking';

try {
  await saveData();
} catch (error) {
  captureError(error, {
    component: 'DataService',
    action: 'saveData',
    category: 'database'
  });
}
*/

export {};
