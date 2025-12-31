'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/Toast';
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider';
import {
  TextField,
  ToggleField,
  FormLayout,
} from '@/components/admin/form-fields';
import { adminCreateSchema, adminEditSchema } from '@/lib/utils/admin-validation';
import { Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { AdminFormData } from '@/lib/types/admin-forms';
import type { AdminStatus } from '@/lib/services/admin-crud.types';

// ============================================================================
// Types
// ============================================================================

interface AdminDetail {
  id: string;
  email: string;
  status: AdminStatus;
  is_active: boolean;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AdminFormProps {
  isNew: boolean;
  initialData?: AdminDetail;
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status }: { status: AdminStatus }) {
  const statusConfig: Record<AdminStatus, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' },
    locked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Locked' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Admin form component for creating and editing admin users
 * Requirements: 11.4, 11.5
 */
export function AdminForm({ isNew, initialData }: AdminFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { setHasUnsavedChanges } = useUnsavedChanges();

  // Form state
  const [formData, setFormData] = useState<AdminFormData>({
    email: initialData?.email ?? '',
    password: '',
    is_active: initialData?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    if (isNew) {
      const hasChanges = formData.email !== '' || formData.password !== '';
      setHasUnsavedChanges(hasChanges);
    } else {
      const hasChanges =
        formData.email !== initialData?.email ||
        formData.password !== '' ||
        formData.is_active !== initialData?.is_active;
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialData, isNew, setHasUnsavedChanges]);

  // Update form field
  const updateField = <K extends keyof AdminFormData>(
    field: K,
    value: AdminFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const schema = isNew ? adminCreateSchema : adminEditSchema;
    
    // For edit, only include password if it's been changed
    const dataToValidate = isNew
      ? formData
      : {
          ...formData,
          password: formData.password || undefined,
        };

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!newErrors[path]) {
          newErrors[path] = issue.message;
        }
      }
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        variant: 'error',
        message: 'Please fix the validation errors before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isNew
        ? '/api/admin/admins'
        : `/api/admin/admins/${initialData?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      // For edit, only include password if it's been changed
      const submitData = isNew
        ? formData
        : {
            email: formData.email,
            is_active: formData.is_active,
            ...(formData.password ? { password: formData.password } : {}),
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isNew ? 'create' : 'update'} admin`);
      }

      setHasUnsavedChanges(false);

      addToast({
        variant: 'success',
        message: `Admin ${isNew ? 'created' : 'updated'} successfully`,
      });

      router.push('/admin/admins');
    } catch (error) {
      console.error('Error saving admin:', error);
      addToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save admin',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Main Form Fields */}
      <FormLayout>
        <div className="space-y-6">
          <TextField
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => updateField('email', value)}
            required
            error={errors.email}
            placeholder="admin@example.com"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Password {isNew && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={isNew ? 'Enter password' : 'Leave blank to keep current password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.
            </p>
          </div>

          <ToggleField
            name="is_active"
            label="Active"
            value={formData.is_active ?? true}
            onChange={(value) => updateField('is_active', value)}
            helpText="Inactive admins cannot log in to the admin panel"
          />
        </div>
      </FormLayout>

      {/* Read-only Status Fields (Edit only) */}
      {!isNew && initialData && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Current Status</label>
              <div className="mt-1">
                <StatusBadge status={initialData.status} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Last Login</label>
              <p className="mt-1 text-sm text-gray-900">
                {initialData.last_login_at
                  ? new Date(initialData.last_login_at).toLocaleString()
                  : 'Never'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Failed Login Attempts</label>
              <p className={`mt-1 text-sm ${
                initialData.failed_login_attempts >= 3 ? 'text-red-600 font-medium' : 'text-gray-900'
              }`}>
                {initialData.failed_login_attempts}
              </p>
            </div>

            {initialData.locked_until && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Locked Until</label>
                <p className="mt-1 text-sm text-red-600">
                  {new Date(initialData.locked_until).toLocaleString()}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500">Created</label>
              <p className="mt-1 text-sm text-gray-900">
                {initialData.created_at
                  ? new Date(initialData.created_at).toLocaleString()
                  : 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {initialData.updated_at
                  ? new Date(initialData.updated_at).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/admins')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isNew ? 'Create Admin' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
