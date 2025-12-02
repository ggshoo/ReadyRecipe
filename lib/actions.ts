"use server";

import { MOCK_RECIPES, Recipe } from "./datasets";
import {
  generateEmbedding,
  cosineSimilarity,
  calculateCoverageScore,
  calculateExactMatches,
} from "./ai/embeddings";
import { ingredientMatches } from "./utils";
import { isSpoonacularAvailable, searchRecipesByIngredients } from "./api-clients";

export interface RecipeScore {
  recipe: Recipe;
  similarityScore: number;
  coverageScore: number;
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

      // Calculate similarity score
      const similarityScore = cosineSimilarity(userEmbedding, recipeEmbedding);

      // Calculate coverage score (what % of recipe ingredients user has)
      const coverageScore = calculateCoverageScore(
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

      // Combined score: weighted average of similarity, coverage, and exact matches
      // Higher weight on coverage and exact matches for better UX
      const combinedScore =
        similarityScore * 0.3 +
        coverageScore * 0.5 +
        (exactMatches / recipe.ingredients.length) * 0.2;

      return {
        recipe,
        similarityScore,
        coverageScore,
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
 * Uses Spoonacular API when available, falls back to mock recipes
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

    let recipes: Recipe[];

    // Try to fetch from Spoonacular API if available
    if (isSpoonacularAvailable()) {
      try {
        console.log("Using Spoonacular API to fetch recipes...");
        recipes = await searchRecipesByIngredients(selectedIngredients, 15);
        console.log(`Fetched ${recipes.length} recipes from Spoonacular API`);
      } catch (apiError) {
        console.error("Spoonacular API error, falling back to mock recipes:", apiError);
        recipes = MOCK_RECIPES;
      }
    } else {
      console.log("Spoonacular API not configured, using mock recipes");
      recipes = MOCK_RECIPES;
    }

    // Score all recipes
    const scoredRecipes = await scoreRecipes(recipes, selectedIngredients, userEmbedding);

    // Sort by combined score (highest first)
    scoredRecipes.sort((a, b) => b.combinedScore - a.combinedScore);

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
