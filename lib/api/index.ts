/**
 * Unified export point for all recipe API clients
 * Provides a clean interface for recipe data fetching across multiple sources
 */

// Spoonacular exports
export {
  isSpoonacularAvailable,
  searchRecipesByIngredients as spoonacularSearchRecipesByIngredients,
  getRecipeById,
} from "./spoonacular";

// TheMealDB exports
export {
  isTheMealDBAvailable,
  searchMealsByIngredients as themealdbSearchMealsByIngredients,
} from "./themealdb";

// Type exports
export type {
  SpoonacularFindByIngredientsResponse,
  SpoonacularIngredient,
  SpoonacularRecipeInfo,
  TheMealDBMeal,
} from "./types";
