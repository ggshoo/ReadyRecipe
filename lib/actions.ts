"use server";

import { MOCK_RECIPES, Recipe } from "./datasets";
import {
  generateEmbedding,
  cosineSimilarity,
  calculateIngredientMatchRate,
  calculateExactMatches,
} from "./ai/embeddings";
import { ingredientMatches } from "./utils";
import {
  isSpoonacularAvailable,
  spoonacularSearchRecipesByIngredients,
  isTheMealDBAvailable,
  themealdbSearchMealsByIngredients,
} from "./api";

export interface RecipeScore {
  recipe: Recipe;
  similarityScore: number;
  ingredientMatchRate: number;
  utilizationScore: number;
  exactMatches: number;
  combinedScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

/**
 * Score recipes based on ingredient matching
 * Used for both API-fetched and mock recipes
 */
async function scoreRecipes(
  recipes: Recipe[],
  selectedIngredients: string[],
  userEmbedding: number[]
): Promise<RecipeScore[]> {
  return Promise.all(
    recipes.map(async (recipe) => {
      // Generate embedding for recipe ingredients
      const recipeIngredientsText = recipe.ingredients.join(", ");
      const recipeEmbedding = await generateEmbedding(recipeIngredientsText);

      // Calculate similarity score (clamp to 0-1 range in case of negative values from fallback embedding)
      let similarityScore = cosineSimilarity(userEmbedding, recipeEmbedding);
      similarityScore = Math.max(0, Math.min(1, similarityScore)); // Clamp to [0, 1]

      // Calculate ingredient match rate (what % of user's ingredients are in this recipe?)
      const ingredientMatchRate = calculateIngredientMatchRate(
        selectedIngredients,
        recipe.ingredients
      );

      // Calculate exact matches
      const exactMatches = calculateExactMatches(
        selectedIngredients,
        recipe.ingredients
      );

      // Identify matched and missing ingredients using flexible matching
      const matchedIngredients = recipe.ingredients.filter((recipeIngredient) =>
        selectedIngredients.some((userIngredient) =>
          ingredientMatches(userIngredient, recipeIngredient)
        )
      );
      const missingIngredients = recipe.ingredients.filter(
        (recipeIngredient) =>
          !selectedIngredients.some((userIngredient) =>
            ingredientMatches(userIngredient, recipeIngredient)
          )
      );

      // Calculate utilization score: what % of recipe ingredients do user have?
      // E.g., recipe has 10 ingredients, user has 2 of them = 2/10 = 20% recipe coverage
      const utilizationScore = recipe.ingredients.length === 0 ? 0 : matchedIngredients.length / recipe.ingredients.length;

      // Calculate exact match percentage (only true exact matches, not partial)
      const exactMatchPercentage = recipe.ingredients.length > 0 
        ? exactMatches / recipe.ingredients.length 
        : 0;

      // Combined score: weighted average prioritizing what user is looking for
      // - Ingredient Match Rate (50%): what % of user's ingredients are in this recipe? (most important)
      // - Exact Matches (35%): recipes with ingredients user specifically asked for
      // - Similarity (15%): recipes semantically aligned with user's ingredients
      const combinedScore =
        (ingredientMatchRate * 0.5) +      // 50%: User ingredient match rate (most important)
        (exactMatchPercentage * 0.35) +  // 35%: Exact ingredient matches
        (similarityScore * 0.15);        // 15%: Semantic similarity

      // Debug logging for top recipes
      if (combinedScore > 0.3) {
        console.log(`[SCORE] ${recipe.name}: combined=${combinedScore.toFixed(3)}, exact=${exactMatches}/${recipe.ingredients.length}, match=${ingredientMatchRate.toFixed(3)}, similarity=${similarityScore.toFixed(3)}`);
      }

      return {
        recipe,
        similarityScore,
        ingredientMatchRate,
        utilizationScore,
        exactMatches,
        combinedScore,
        matchedIngredients,
        missingIngredients,
      };
    })
  );
}

/**
 * Main server action to generate recipe recommendations
 * Takes user-selected ingredients and returns ranked recipes
 * Fetches from multiple sources (Spoonacular, TheMealDB) and scores them together
 */
export async function generateRecipes(
  selectedIngredients: string[]
): Promise<RecipeScore[]> {
  if (!selectedIngredients || selectedIngredients.length === 0) {
    return [];
  }

  try {
    // Create ingredient text for embedding
    const userIngredientsText = selectedIngredients.join(", ");
    const userEmbedding = await generateEmbedding(userIngredientsText);

    const recipeMap = new Map<string, Recipe>(); // Use map to deduplicate by ID

    // Try Spoonacular API first if available
    if (isSpoonacularAvailable()) {
      try {
        console.log("Fetching from Spoonacular API...");
        const spoonacularRecipes = await spoonacularSearchRecipesByIngredients(selectedIngredients, 15);
        console.log(`Fetched ${spoonacularRecipes.length} recipes from Spoonacular`);
        spoonacularRecipes.forEach((recipe) => recipeMap.set(recipe.id, recipe));
      } catch (apiError) {
        console.error("Spoonacular API error:", apiError);
      }
    }

    // Try TheMealDB if available
    if (isTheMealDBAvailable()) {
      try {
        console.log("Fetching from TheMealDB...");
        const themealdbRecipes = await themealdbSearchMealsByIngredients(selectedIngredients, 15);
        console.log(`Fetched ${themealdbRecipes.length} recipes from TheMealDB`);
        themealdbRecipes.forEach((recipe) => recipeMap.set(recipe.id, recipe));
      } catch (apiError) {
        console.error("TheMealDB API error:", apiError);
      }
    }

    // Always include mock recipes alongside API results for better coverage
    // Deduplicate by recipe name to avoid exact duplicates
    let recipes: Recipe[];
    const apiRecipes = Array.from(recipeMap.values());
    const apiRecipeNames = new Set(apiRecipes.map((r) => r.name.toLowerCase()));
    
    // Add mock recipes that aren't already in API results
    const mockRecipesToAdd = MOCK_RECIPES.filter(
      (mockRecipe) => !apiRecipeNames.has(mockRecipe.name.toLowerCase())
    );
    
    recipes = [...apiRecipes, ...mockRecipesToAdd];
    console.log(`Total recipes: ${apiRecipes.length} from API + ${mockRecipesToAdd.length} unique from mocks = ${recipes.length}`);

    // Score all recipes together
    const scoredRecipes = await scoreRecipes(recipes, selectedIngredients, userEmbedding);

    // Sort by combined score (highest first)
    scoredRecipes.sort((a, b) => b.combinedScore - a.combinedScore);

    // Log top 5 results for debugging
    console.log("\n=== TOP RESULTS ===");
    scoredRecipes.slice(0, 5).forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.recipe.name}: score=${result.combinedScore.toFixed(3)}, exact=${result.exactMatches}/${result.recipe.ingredients.length}, coverage=${result.ingredientMatchRate.toFixed(3)}\n`);
    });
    console.log("=== END RESULTS ===\n");

    // Return top results
    return scoredRecipes;
  } catch (error) {
    console.error("Error generating recipes:", error);
    throw new Error("Failed to generate recipe recommendations");
  }
}

/**
 * Save a recipe to favorites (placeholder for future Supabase integration)
 */
export async function saveRecipe(recipeId: string): Promise<boolean> {
  // TODO: Implement with Supabase when user auth is added
  console.log("Saving recipe:", recipeId);
  return true;
}

/**
 * Get saved recipes (placeholder for future Supabase integration)
 */
export async function getSavedRecipes(): Promise<Recipe[]> {
  // TODO: Implement with Supabase when user auth is added
  return [];
}
