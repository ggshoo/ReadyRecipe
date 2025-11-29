/**
 * Utility functions for normalizing, filtering, and sorting recipe results
 * by match percentage.
 */

/**
 * Represents a recipe with a match value that can be in various formats.
 * The match value indicates how well the recipe matches the user's ingredients.
 */
export interface RecipeWithMatch {
  /** Match value in various formats: "85%", "85", 85, 0.85, "0.85", null/undefined */
  match?: string | number | null;
}

/**
 * Normalizes a match value from various formats into a percentage number (0-100).
 *
 * Supported formats:
 * - "85%" → 85
 * - "85" → 85
 * - 85 → 85
 * - 0.85 → 85 (values in (0,1] are treated as fractions)
 * - "0.85" → 85
 * - null/undefined → 0
 *
 * @param value - The match value to normalize
 * @returns A number between 0-100 representing the match percentage, or 0 if unparseable
 */
export function normalizeMatchValue(value: string | number | null | undefined): number {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 0;
  }

  // Handle string values
  if (typeof value === "string") {
    // Remove percentage sign and whitespace
    const cleanedValue = value.trim().replace(/%$/, "");

    // Try to parse as a number
    const parsed = parseFloat(cleanedValue);

    if (isNaN(parsed)) {
      return 0;
    }

    // If the value is a fraction (between 0 exclusive and 1 inclusive),
    // multiply by 100 to get percentage
    if (parsed > 0 && parsed <= 1) {
      return parsed * 100;
    }

    // Return the value, clamped to reasonable bounds
    return Math.max(0, parsed);
  }

  // Handle number values
  if (typeof value === "number") {
    if (isNaN(value) || !isFinite(value)) {
      return 0;
    }

    // If the value is a fraction (between 0 exclusive and 1 inclusive),
    // multiply by 100 to get percentage
    if (value > 0 && value <= 1) {
      return value * 100;
    }

    // Return the value, clamped to reasonable bounds
    return Math.max(0, value);
  }

  // Unknown type, return 0
  return 0;
}

/**
 * Filters out recipes with match percentage <= 0 and sorts the remaining
 * recipes in descending order by match percentage.
 *
 * This function does not mutate the original array or recipe objects.
 *
 * @param recipes - Array of recipes with match values
 * @param matchKey - The key to use for the match value (default: "match")
 * @returns A new array of recipes filtered and sorted by match percentage
 *
 * @example
 * ```typescript
 * const recipes = [
 *   { name: "Recipe A", match: "85%" },
 *   { name: "Recipe B", match: 0.5 },
 *   { name: "Recipe C", match: 0 },
 *   { name: "Recipe D", match: "95" },
 * ];
 * const sorted = filterAndSortRecipes(recipes);
 * // Result: [{ name: "Recipe D", match: "95" }, { name: "Recipe A", match: "85%" }, { name: "Recipe B", match: 0.5 }]
 * ```
 */
export function filterAndSortRecipes<T extends RecipeWithMatch>(
  recipes: T[],
  matchKey: keyof T = "match" as keyof T
): T[] {
  // Create a shallow copy to avoid mutating the original array
  return [...recipes]
    .map((recipe) => ({
      original: recipe,
      normalizedMatch: normalizeMatchValue(recipe[matchKey] as string | number | null | undefined),
    }))
    .filter(({ normalizedMatch }) => normalizedMatch > 0)
    .sort((a, b) => b.normalizedMatch - a.normalizedMatch)
    .map(({ original }) => original);
}

/**
 * Filters and sorts RecipeScore objects specifically.
 * Uses coverageScore as the match value.
 *
 * This function does not mutate the original array or recipe objects.
 *
 * @param recipes - Array of RecipeScore objects
 * @returns A new array of RecipeScore objects filtered and sorted by coverageScore
 */
export function filterAndSortRecipeScores<T extends { coverageScore?: number }>(
  recipes: T[]
): T[] {
  // Create a shallow copy to avoid mutating the original array
  return [...recipes]
    .map((recipe) => ({
      original: recipe,
      normalizedMatch: normalizeMatchValue(recipe.coverageScore),
    }))
    .filter(({ normalizedMatch }) => normalizedMatch > 0)
    .sort((a, b) => b.normalizedMatch - a.normalizedMatch)
    .map(({ original }) => original);
}
