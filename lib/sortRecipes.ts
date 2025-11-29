/**
 * Utility functions for filtering and sorting recipes by match percentage.
 *
 * This module provides robust parsing of various match percentage formats
 * and filters out recipes with zero or negative match percentages.
 */

/**
 * Interface for objects that have a match property.
 * The match can be in various formats: "85%", "85", 85, 0.85, "0.85", null, or undefined.
 */
export interface RecipeWithMatch {
  coverageScore?: number | string | null;
  match?: number | string | null;
}

/**
 * Parses a match value from various formats into a normalized percentage (0-100).
 *
 * Supported formats:
 * - String with percent sign: "85%" -> 85
 * - String number: "85" -> 85, "0.85" -> 85
 * - Number: 85 -> 85, 0.85 -> 85
 * - null/undefined -> 0
 *
 * Numbers in the range (0, 1] are treated as fractions and converted to percentages.
 * Unparseable values default to 0.
 *
 * @param match - The match value to parse (can be string, number, null, or undefined)
 * @returns A normalized percentage value between 0-100
 */
export function parseMatchPercentage(
  match: string | number | null | undefined
): number {
  // Handle null/undefined
  if (match == null) {
    return 0;
  }

  let value: number;

  if (typeof match === "string") {
    // Remove whitespace and percent sign if present
    const cleaned = match.trim().replace(/%$/, "");

    // Parse the cleaned string
    value = parseFloat(cleaned);

    // Handle unparseable strings
    if (isNaN(value)) {
      return 0;
    }
  } else if (typeof match === "number") {
    // Handle NaN numbers
    if (isNaN(match)) {
      return 0;
    }
    value = match;
  } else {
    // Unknown type
    return 0;
  }

  // Numbers in range (0, 1] are treated as fractions (e.g., 0.85 -> 85)
  // 0 stays as 0, negative numbers stay negative (will be filtered out later)
  if (value > 0 && value <= 1) {
    value = value * 100;
  }

  return value;
}

/**
 * Extracts the match value from a recipe object.
 * Supports both 'coverageScore' (used by RecipeScore) and 'match' properties.
 *
 * @param recipe - A recipe object that may have coverageScore or match property
 * @returns The match value (number, string, null, or undefined)
 */
function getMatchValue<T extends RecipeWithMatch>(
  recipe: T
): number | string | null | undefined {
  // Prioritize coverageScore (used by RecipeScore in this codebase)
  if ("coverageScore" in recipe && recipe.coverageScore !== undefined) {
    return recipe.coverageScore;
  }

  // Fall back to match property
  if ("match" in recipe && recipe.match !== undefined) {
    return recipe.match;
  }

  return undefined;
}

/**
 * Filters and sorts an array of recipes by match percentage.
 *
 * This function:
 * 1. Handles null/undefined input gracefully by returning an empty array
 * 2. Parses match values from various formats
 * 3. Filters out recipes with match percentage <= 0
 * 4. Sorts remaining recipes by match percentage in descending order
 * 5. Does NOT mutate the original array or recipe objects
 *
 * @param recipes - An array of recipe objects with a coverageScore or match property
 * @returns A new array of recipes, filtered and sorted by match percentage (highest first)
 *
 * @example
 * const recipes = [
 *   { name: 'Recipe A', coverageScore: 0.5 },
 *   { name: 'Recipe B', coverageScore: 0.85 },
 *   { name: 'Recipe C', coverageScore: 0 },
 * ];
 * const sorted = filterAndSortRecipes(recipes);
 * // Returns [{ name: 'Recipe B', coverageScore: 0.85 }, { name: 'Recipe A', coverageScore: 0.5 }]
 */
export function filterAndSortRecipes<T extends RecipeWithMatch>(
  recipes?: T[] | null
): T[] {
  // Handle null/undefined/empty input
  if (!recipes || recipes.length === 0) {
    return [];
  }

  // Create a shallow copy to avoid mutating the original array
  // and add parsed match percentages for sorting
  const recipesWithParsedMatch = recipes.map((recipe) => ({
    recipe,
    parsedMatch: parseMatchPercentage(getMatchValue(recipe)),
  }));

  // Filter out recipes with match <= 0
  const filteredRecipes = recipesWithParsedMatch.filter(
    (item) => item.parsedMatch > 0
  );

  // Sort by parsed match percentage in descending order (highest first)
  filteredRecipes.sort((a, b) => b.parsedMatch - a.parsedMatch);

  // Return only the recipe objects (not the wrapper objects)
  return filteredRecipes.map((item) => item.recipe);
}
