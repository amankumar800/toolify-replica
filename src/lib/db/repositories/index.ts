/**
 * Repository layer barrel export.
 * Provides data access abstractions for database operations.
 *
 * @module repositories
 */

// Base repository
export {
  createBaseRepository,
  type BaseRepository,
  type FindAllOptions,
} from './base.repository';

// Tools repository
export {
  createToolsRepository,
  type ToolsRepository,
  type ToolRow,
  type ToolInsert,
  type ToolUpdate,
  type ToolWithCategories,
} from './tools.repository';

// Categories repository
export {
  createCategoriesRepository,
  type CategoriesRepository,
  type CategoryRow,
  type CategoryInsert,
  type CategoryUpdate,
  type CategoryWithToolCount,
} from './categories.repository';

// Subcategories repository
export {
  createSubcategoriesRepository,
  type SubcategoriesRepository,
  type SubcategoryRow,
  type SubcategoryInsert,
  type SubcategoryUpdate,
  type SubcategoryWithTools,
} from './subcategories.repository';

// FAQs repository
export {
  createFaqsRepository,
  type FaqsRepository,
  type FaqRow,
  type FaqInsert,
  type FaqUpdate,
} from './faqs.repository';

// Featured tools repository
export {
  createFeaturedToolsRepository,
  type FeaturedToolsRepository,
  type FeaturedToolRow,
  type FeaturedToolInsert,
  type FeaturedToolUpdate,
  type FeaturedToolWithTool,
} from './featured-tools.repository';
