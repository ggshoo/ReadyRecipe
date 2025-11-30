/**
 * Utility for filtering and sorting recipes by match percentage.
 *
 * Accepted match formats:
 * - String with percent sign: "85%", "0.85%"
 * - Numeric string: "85", "0.85"
 * - Number: 85, 0.85
 * - null/undefined (treated as 0)
 *
 * Normalization rules:
 * - Numbers in range (0, 1] are treated as fractions (0.85 -> 85%)
 * - Numbers > 1 are treated as percentages (85 -> 85%)
 * - Unparseable values are treated as 0
 *
 * Behavior:
 * - Filters out recipes with match <= 0
 * - Sorts remaining recipes by match descending (highest -> lowest)
 * - Does not mutate original array; returns a new array referencing original objects
 */

/**
 * Interface for recipe objects with a coverage score property.
 * The coverageScore can be in various formats (string, number, null, undefined).
 */
interface RecipeWithCoverageScore {
  coverageScore?: number | string | null;
}

/**
 * Normalizes a match value to a percentage (0-100).
 *
 * @param match - The match value in various formats
 * @returns Normalized percentage value (0-100), or 0 for invalid/unparseable values
 *
 * @example
 * normalizeMatch("85%") // 85
 * normalizeMatch("85") // 85
 * normalizeMatch(85) // 85
 * normalizeMatch(0.85) // 85
 * normalizeMatch("0.85") // 85
 * normalizeMatch(null) // 0
 * normalizeMatch(undefined) // 0
 * normalizeMatch("invalid") // 0
 */
export function normalizeMatch(match: number | string | null | undefined): number {
  // Handle null/undefined
  if (match === null || match === undefined) {
    return 0;
  }

  let numericValue: number;

  if (typeof match === "string") {
    // Remove percent sign and whitespace
    const cleaned = match.replace(/%/g, "").trim();
    numericValue = parseFloat(cleaned);
  } else if (typeof match === "number") {
    numericValue = match;
  } else {
    return 0;
  }

  // Check if parsing failed
  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return 0;
  }

  // Normalize: numbers in range (0, 1] are treated as fractions
  // e.g., 0.85 -> 85, but 0 stays 0, and values > 1 stay as-is
  if (numericValue > 0 && numericValue <= 1) {
    return numericValue * 100;
  }

  return numericValue;
}

/**
 * Filters and sorts recipes by match percentage.
 *
 * @param recipes - Array of recipe objects with a coverageScore property
 * @returns A new array containing only recipes with match > 0, sorted by match descending
 *
 * @example
 * const recipes = [
 *   { name: "Recipe A", coverageScore: 0.5 },
 *   { name: "Recipe B", coverageScore: 0.85 },
 *   { name: "Recipe C", coverageScore: 0 },
 * ];
 * filterAndSortRecipes(recipes);
 * // Returns: [{ name: "Recipe B", coverageScore: 0.85 }, { name: "Recipe A", coverageScore: 0.5 }]
 */
export function filterAndSortRecipes<T extends RecipeWithCoverageScore>(
  recipes?: T[] | null
): T[] {
  // Handle null/undefined input
  if (!recipes || !Array.isArray(recipes)) {
    return [];
  }

  // Filter out recipes with match <= 0 and sort by match descending
  // .filter() returns a new array, so no need for .slice() before sort
  return recipes
    .filter((recipe) => normalizeMatch(recipe.coverageScore) > 0)
    .sort((a, b) => {
      const matchA = normalizeMatch(a.coverageScore);
      const matchB = normalizeMatch(b.coverageScore);
      return matchB - matchA; // Descending order
    });
}
