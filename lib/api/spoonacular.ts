import { Recipe } from "../datasets";
import {
  SpoonacularFindByIngredientsResponse,
  SpoonacularRecipeInfo,
} from "./types";

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

// Fallback instruction text when no instructions are available
const FALLBACK_INSTRUCTION = "See full recipe for instructions.";

/**
 * Determine recipe difficulty based on cook time and ingredient count
 */
function calculateDifficulty(
  cookTimeMinutes: number,
  ingredientCount: number
): "easy" | "medium" | "hard" {
  if (cookTimeMinutes > 60 || ingredientCount > 12) {
    return "hard";
  } else if (cookTimeMinutes > 30 || ingredientCount > 8) {
    return "medium";
  }
  return "easy";
}

/**
 * Convert Spoonacular recipe info to our Recipe format
 */
function mapSpoonacularToRecipe(info: SpoonacularRecipeInfo): Recipe {
  // Deduplicate ingredients by converting to Set then back to Array
  const ingredientsList = Array.from(
    new Set(info.extendedIngredients.map((ing) => ing.name.toLowerCase().trim()))
  );

  let instructions: string[] = [];
  if (info.analyzedInstructions && info.analyzedInstructions.length > 0) {
    instructions = info.analyzedInstructions[0].steps.map((step) => step.step);
  }

  if (instructions.length === 0) {
    instructions = [FALLBACK_INSTRUCTION];
  }

  return {
    id: info.id.toString(),
    name: info.title,
    ingredients: ingredientsList,
    instructions,
    cookTime: info.readyInMinutes,
    servings: info.servings,
    cuisine: info.cuisines.length > 0 ? info.cuisines[0] : undefined,
    difficulty: calculateDifficulty(info.readyInMinutes, ingredientsList.length),
  };
}

/**
 * Validate that the response has the expected structure for recipe info
 */
function isValidRecipeInfo(data: unknown): data is SpoonacularRecipeInfo {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.title === "string" &&
    typeof obj.readyInMinutes === "number" &&
    typeof obj.servings === "number" &&
    Array.isArray(obj.extendedIngredients)
  );
}

/**
 * Validate ingredients array input
 */
function validateIngredients(ingredients: string[]): void {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error("Ingredients array must not be empty");
  }
  for (const ing of ingredients) {
    if (typeof ing !== "string" || ing.trim().length === 0) {
      throw new Error("All ingredients must be non-empty strings");
    }
  }
}

/**
 * Check if Spoonacular API is available
 */
export function isSpoonacularAvailable(): boolean {
  return !!SPOONACULAR_API_KEY && SPOONACULAR_API_KEY !== "your_spoonacular_api_key_here";
}

/**
 * Search recipes by ingredients using Spoonacular API
 * @param ingredients - List of ingredient names to search by
 * @param limit - Maximum number of recipes to return (default: 10)
 * @returns Promise<Recipe[]> - Array of recipes matching the ingredients
 */
export async function searchRecipesByIngredients(
  ingredients: string[],
  limit: number = 10
): Promise<Recipe[]> {
  if (!isSpoonacularAvailable()) {
    throw new Error("Spoonacular API key is not configured");
  }

  validateIngredients(ingredients);

  const ingredientsParam = ingredients.join(",");

  // First, find recipes by ingredients
  const findResponse = await fetch(
    `${SPOONACULAR_BASE_URL}/recipes/findByIngredients?apiKey=${SPOONACULAR_API_KEY}&ingredients=${encodeURIComponent(ingredientsParam)}&number=${limit}&ranking=1&ignorePantry=true`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!findResponse.ok) {
    throw new Error(`Spoonacular API error: ${findResponse.status} ${findResponse.statusText}`);
  }

  const findResults: SpoonacularFindByIngredientsResponse[] = await findResponse.json();

  if (findResults.length === 0) {
    return [];
  }

  // Get detailed information for each recipe (including instructions)
  const recipeIds = findResults.map((r) => r.id).join(",");
  const infoResponse = await fetch(
    `${SPOONACULAR_BASE_URL}/recipes/informationBulk?apiKey=${SPOONACULAR_API_KEY}&ids=${recipeIds}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!infoResponse.ok) {
    throw new Error(`Spoonacular API error: ${infoResponse.status} ${infoResponse.statusText}`);
  }

  const recipeInfos: unknown[] = await infoResponse.json();

  // Validate and map responses to our Recipe format
  return recipeInfos.filter(isValidRecipeInfo).map(mapSpoonacularToRecipe);
}

/**
 * Get a single recipe by ID from Spoonacular
 * @param id - Recipe ID
 * @returns Promise<Recipe | null> - Recipe details or null if not found
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  if (!isSpoonacularAvailable()) {
    throw new Error("Spoonacular API key is not configured");
  }

  const response = await fetch(
    `${SPOONACULAR_BASE_URL}/recipes/${encodeURIComponent(id)}/information?apiKey=${SPOONACULAR_API_KEY}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
  }

  const info: unknown = await response.json();

  if (!isValidRecipeInfo(info)) {
    throw new Error("Invalid recipe data received from API");
  }

  return mapSpoonacularToRecipe(info);
}
