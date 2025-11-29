/**
 * Recipe sorting and filtering utility.
 *
 * This module provides a utility function to filter and sort recipe results
 * by their match percentage. Recipes with 0% or negative match are excluded,
 * and remaining recipes are sorted in descending order (highest match first).
 *
 * @module sortRecipes
 */

/**
 * Parses a match value from various formats and normalizes it to a percentage (0-100).
 *
 * Accepted formats:
 * - "85%" -> 85
 * - "85" -> 85
 * - 85 -> 85
 * - 0.85 -> 85 (values in range (0, 1] are treated as fractions)
 * - "0.85" -> 85 (string fractions are also converted)
 * - null/undefined -> 0
 * - Unparseable values -> 0
 *
 * @param value - The match value to parse
 * @returns A normalized percentage number in the range 0-100
 */
export function parseMatchValue(value: string | number | null | undefined): number {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 0;
  }

  // Handle number values
  if (typeof value === "number") {
    // Check for NaN or Infinity
    if (!Number.isFinite(value)) {
      return 0;
    }
    // Values in range (0, 1] are treated as fractions (e.g., 0.85 -> 85)
    if (value > 0 && value <= 1) {
      return value * 100;
    }
    return value;
  }

  // Handle string values
  if (typeof value === "string") {
    // Remove percent sign and whitespace
    const cleanedValue = value.replace(/%/g, "").trim();

    // Try to parse as number
    const parsed = parseFloat(cleanedValue);

    // Check if parsing failed
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    // Values in range (0, 1] are treated as fractions
    if (parsed > 0 && parsed <= 1) {
      return parsed * 100;
    }

    return parsed;
  }

  // Unparseable type
  return 0;
}

/**
 * Filters and sorts recipe objects by their match percentage.
 *
 * This function:
 * 1. Parses match values from various formats (see parseMatchValue)
 * 2. Filters out recipes with match <= 0
 * 3. Sorts remaining recipes by match in descending order (highest first)
 * 4. Returns a new array without mutating the original
 *
 * @typeParam T - The recipe type, may have a match property or provide a custom key
 * @param recipes - Array of recipe objects, or null/undefined
 * @param matchKey - Optional key to extract the match value from (defaults to "match")
 * @returns A new array of recipes filtered and sorted by match percentage
 *
 * @example
 * // Using default "match" property
 * const recipes = [
 *   { name: 'Recipe A', match: '85%' },
 *   { name: 'Recipe B', match: 0.45 },
 *   { name: 'Recipe C', match: 0 },
 *   { name: 'Recipe D', match: '100' }
 * ];
 * const sorted = filterAndSortRecipes(recipes);
 * // Returns: [Recipe D (100%), Recipe A (85%), Recipe B (45%)]
 * // Recipe C is excluded due to 0% match
 *
 * @example
 * // Using custom key
 * const recipes = [
 *   { name: 'Recipe A', coverageScore: 0.85 },
 *   { name: 'Recipe B', coverageScore: 0.45 },
 * ];
 * const sorted = filterAndSortRecipes(recipes, 'coverageScore');
 */
export function filterAndSortRecipes<T>(
  recipes?: T[] | null,
  matchKey: keyof T | "match" = "match" as keyof T
): T[] {
  // Handle null/undefined input
  if (!recipes) {
    return [];
  }

  // Create a new array with parsed match values, without mutating originals
  const recipesWithParsedMatch = recipes.map((recipe) => {
    // Access the match value using the provided key
    const matchValue = recipe[matchKey as keyof T] as string | number | null | undefined;
    return {
      original: recipe,
      parsedMatch: parseMatchValue(matchValue),
    };
  });

  // Filter out recipes with match <= 0
  const filtered = recipesWithParsedMatch.filter((item) => item.parsedMatch > 0);

  // Sort by match percentage in descending order
  filtered.sort((a, b) => b.parsedMatch - a.parsedMatch);

  // Return original recipe objects in the sorted order
  return filtered.map((item) => item.original);
}
