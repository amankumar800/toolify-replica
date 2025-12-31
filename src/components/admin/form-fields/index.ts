/**
 * Admin Form Field Components
 * 
 * Reusable form field components for the admin panel with consistent
 * styling, validation error display, and accessibility features.
 * 
 * Requirements: 13.2, 14.3, 14.4, 22.3, 22.6
 */

// Base form fields
export { TextField, type TextFieldProps, type BaseFieldProps } from './TextField';
export { TextareaField, type TextareaFieldProps } from './TextareaField';
export { NumberField, type NumberFieldProps } from './NumberField';
export { SelectField, type SelectFieldProps, type SelectOption } from './SelectField';

// Advanced form fields
export { MultiSelectField, type MultiSelectFieldProps } from './MultiSelectField';
export { SearchableSelectField, type SearchableSelectFieldProps } from './SearchableSelectField';
export { ToggleField, type ToggleFieldProps } from './ToggleField';
export { DateField, type DateFieldProps } from './DateField';

// Specialized form fields
export { RichTextField, type RichTextFieldProps } from './RichTextField';
export { ImageUploadField, type ImageUploadFieldProps } from './ImageUploadField';
export { TagInputField, type TagInputFieldProps } from './TagInputField';
export { JsonEditorField, type JsonEditorFieldProps } from './JsonEditorField';
export { IconPickerField, type IconPickerFieldProps, type IconOption } from './IconPickerField';


// Form layout components
export {
  FormLayout,
  FormSection,
  FormRow,
  FormActions,
  FormDivider,
  ReadOnlyField,
  type FormLayoutProps,
  type FormSectionProps,
  type FormRowProps,
  type FormActionsProps,
  type ReadOnlyFieldProps,
} from './FormLayout';
