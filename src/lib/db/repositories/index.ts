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
  type ToolSubmission,
  type ToolSearchResult,
  type FullTextSearchOptions,
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

// User favorites repository
export {
  createUserFavoritesRepository,
  type UserFavoritesRepository,
  type UserFavoriteRow,
  type UserFavoriteInsert,
  type UserFavoriteUpdate,
  MAX_SHORTCUTS_PER_USER,
} from './user-favorites.repository';

// Midjourney prompts repository
export {
  createMidjourneyPromptsRepository,
  type MidjourneyPromptsRepository,
  type MidjourneyPromptRow,
  type MidjourneyPromptInsert,
  type MidjourneyPromptUpdate,
  type MidjourneyPromptSortBy,
  type MidjourneyPromptListOptions,
} from './midjourney-prompts.repository';

// AI News repository
export {
  createAINewsRepository,
  type AINewsRepository,
  type AINewsRow,
  type AINewsInsert,
  type AINewsUpdate,
  type AINewsListOptions,
} from './ai-news.repository';

// Admins repository
export {
  createAdminsRepository,
  isAccountLocked,
  LOCKOUT_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  type AdminsRepository,
  type AdminRecord,
  type AdminInsert,
} from './admins.repository';

// Company Pages repository
export {
  createCompanyPagesRepository,
  type CompanyPagesRepository,
  type CompanyPageInsert,
  type CompanyPageUpdate,
} from './company-pages.repository';
