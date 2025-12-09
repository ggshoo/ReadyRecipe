import { Recipe } from "../datasets";
import { TheMealDBMeal } from "./types";

const THEMEALDB_BASE_URL = "https://www.themealdb.com/api/json/v1/1";

/**
 * Parse TheMealDB meal response to extract ingredients
 * Deduplicates ingredients to avoid showing the same ingredient multiple times
 */
function extractIngredients(meal: TheMealDBMeal): string[] {
  const ingredientsSet = new Set<string>();

  // TheMealDB stores ingredients as strIngredient1, strIngredient2, etc.
  // and measurements as strMeasure1, strMeasure2, etc.
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    if (ingredient && ingredient.trim().length > 0) {
      ingredientsSet.add(ingredient.toLowerCase().trim());
    }
  }

  return Array.from(ingredientsSet);
}

/**
 * Parse TheMealDB instructions into steps
 * Handles various formats: numbered steps, multi-line text, period-separated sentences
 */
function parseInstructions(strInstructions: string): string[] {
  if (!strInstructions || strInstructions.trim().length === 0) {
    return ["See full recipe for instructions."];
  }

  let steps: string[] = [];

  // First, try to split by explicit step markers like "Step X:" or "step X" (case insensitive)
  const explicitStepRegex = /step\s+\d+\s*:?/i;
  if (explicitStepRegex.test(strInstructions)) {
    // Split on step markers and filter out empty ones
    steps = strInstructions
      .split(explicitStepRegex)
      .map((step) => step.trim())
      .filter((step) => step.length > 5);
  }

  // If that didn't work, try splitting by newlines (for multi-line instructions)
  if (steps.length < 2) {
    const lineSteps = strInstructions
      .split(/\r?\n/)
      .map((step) => step.trim())
      .filter((step) => step.length > 5);

    // Only use line-based splitting if we get multiple meaningful lines
    if (lineSteps.length >= 2) {
      steps = lineSteps;
    }
  }

  // If still not enough steps, try splitting by periods (for sentence-based instructions)
  if (steps.length < 2) {
    // Only split on periods that are followed by a capital letter or digit + period
    // This avoids splitting on abbreviations
    steps = strInstructions
      .split(/\.\s+(?=[A-Z0-9])/g)
      .map((step) => step.trim())
      .filter((step) => step.length > 5)
      .map((step) => (step.endsWith(".") ? step : step + "."));
  }

  // Last resort: return the whole thing as one step
  if (steps.length === 0) {
    return [strInstructions.trim()];
  }

  return steps;
}

/**
 * Estimate cook time based on category and complexity
 * TheMealDB doesn't provide cook time, so we estimate
 */
function estimateCookTime(meal: TheMealDBMeal): number {
  const ingredientCount = extractIngredients(meal).length;

  // Heuristic: base time + time per ingredient
  if (meal.strCategory === "Dessert") {
    return Math.min(60, 20 + ingredientCount * 2);
  } else if (meal.strCategory === "Breakfast") {
    return Math.min(30, 10 + ingredientCount);
  } else if (meal.strCategory === "Seafood") {
    return Math.min(45, 25 + ingredientCount);
  } else {
    return Math.min(60, 30 + ingredientCount);
  }
}

/**
 * Estimate difficulty based on ingredient count and category
 */
function estimateDifficulty(
  ingredientCount: number,
  category: string
): "easy" | "medium" | "hard" {
  if (ingredientCount > 12 || category === "Seafood") {
    return "hard";
  } else if (ingredientCount > 8 || category === "Dessert") {
    return "medium";
  }
  return "easy";
}

/**
 * Convert TheMealDB meal to our Recipe format
 */
function mapTheMealDBToRecipe(meal: TheMealDBMeal): Recipe {
  const ingredients = extractIngredients(meal);
  const instructions = parseInstructions(meal.strInstructions);
  const cookTime = estimateCookTime(meal);
  const difficulty = estimateDifficulty(ingredients.length, meal.strCategory);

  return {
    id: `themealdb-${meal.idMeal}`,
    name: meal.strMeal,
    ingredients,
    instructions,
    cookTime,
    servings: 4, // TheMealDB doesn't provide servings, so default to 4
    cuisine: meal.strArea || undefined,
    difficulty,
  };
}

/**
 * Search for meals by a single ingredient
 * TheMealDB API: /filter.php?i=chicken
 */
async function searchMealsByIngredient(ingredient: string): Promise<Recipe[]> {
  try {
    console.log(`[TheMealDB] Searching for ingredient: ${ingredient}`);
    const response = await fetch(
      `${THEMEALDB_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`
    );

    if (!response.ok) {
      throw new Error(`TheMealDB API error: ${response.status}`);
    }

    const data: { meals: TheMealDBMeal[] | null } = await response.json();

    if (!data.meals || data.meals.length === 0) {
      console.log(`[TheMealDB] No results found for: ${ingredient}`);
      return [];
    }

    console.log(`[TheMealDB] Found ${data.meals.length} meals for: ${ingredient}`);

    // For search, we get basic data. We need to fetch full details for each meal
    const detailedMeals = await Promise.all(
      data.meals.slice(0, 10).map((basicMeal) => getMealDetails(basicMeal.idMeal))
    );

    const validMeals = detailedMeals.filter((meal): meal is Recipe => meal !== null);
    console.log(`[TheMealDB] Fetched ${validMeals.length} detailed meals for: ${ingredient}`);
    return validMeals;
  } catch (error) {
    console.error("TheMealDB ingredient search error:", error);
    return [];
  }
}

/**
 * Get full details for a meal by ID
 * TheMealDB API: /lookup.php?i=52772
 */
async function getMealDetails(mealId: string): Promise<Recipe | null> {
  try {
    const response = await fetch(
      `${THEMEALDB_BASE_URL}/lookup.php?i=${encodeURIComponent(mealId)}`
    );

    if (!response.ok) {
      return null;
    }

    const data: { meals: TheMealDBMeal[] | null } = await response.json();

    if (!data.meals || data.meals.length === 0) {
      return null;
    }

    return mapTheMealDBToRecipe(data.meals[0]);
  } catch (error) {
    console.error("TheMealDB meal details error:", error);
    return null;
  }
}

/**
 * Search for meals by multiple ingredients
 * Uses TheMealDB filter endpoint for each ingredient and combines results
 */
export async function searchMealsByIngredients(
  ingredients: string[],
  limit: number = 15
): Promise<Recipe[]> {
  if (!ingredients || ingredients.length === 0) {
    return [];
  }

  try {
    // Search for recipes containing ANY of the provided ingredients
    // Collect recipes from all ingredients to get better coverage
    const recipeMap = new Map<string, Recipe>();

    // Search for each ingredient and collect unique recipes
    for (const ingredient of ingredients) {
      if (recipeMap.size >= limit) {
        break; // Stop early once we have enough recipes
      }

      try {
        const recipes = await searchMealsByIngredient(ingredient.toLowerCase());
        recipes.forEach((recipe) => {
          // Use a map to avoid duplicates (by ID)
          recipeMap.set(recipe.id, recipe);
        });
      } catch (error) {
        console.error(`Error searching for ingredient "${ingredient}":`, error);
        // Continue to next ingredient if one fails
      }
    }

    // Return up to limit recipes
    return Array.from(recipeMap.values()).slice(0, limit);
  } catch (error) {
    console.error("TheMealDB search error:", error);
    return [];
  }
}

/**
 * Check if TheMealDB is available (it always is - no API key required)
 */
export function isTheMealDBAvailable(): boolean {
  return true; // Always available - no API key required
}
