/**
 * Shared types for recipe API clients
 */

/**
 * Response type for Spoonacular's findByIngredients endpoint
 */
export interface SpoonacularFindByIngredientsResponse {
  id: number;
  title: string;
  image: string;
  imageType: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: SpoonacularIngredient[];
  usedIngredients: SpoonacularIngredient[];
  unusedIngredients: SpoonacularIngredient[];
  likes: number;
}

export interface SpoonacularIngredient {
  id: number;
  amount: number;
  unit: string;
  unitLong: string;
  unitShort: string;
  aisle: string;
  name: string;
  original: string;
  originalName: string;
  meta: string[];
  image: string;
}

/**
 * Response type for Spoonacular's recipe information endpoint
 */
export interface SpoonacularRecipeInfo {
  id: number;
  title: string;
  readyInMinutes: number;
  servings: number;
  cuisines: string[];
  extendedIngredients: {
    id: number;
    name: string;
    original: string;
    amount: number;
    unit: string;
  }[];
  analyzedInstructions: {
    name: string;
    steps: {
      number: number;
      step: string;
    }[];
  }[];
}

/**
 * Response type for TheMealDB's meal search endpoint
 */
export interface TheMealDBMeal {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory: string;
  strArea: string;
  strTags: string;
  strYoutube: string;
  strInstructions: string;
  strSource: string;
  [key: string]: string | null; // For dynamic ingredient/measurement fields
}
