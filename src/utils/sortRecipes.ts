/**
 * Utility for filtering and sorting recipes by match percentage.
 *
 * Accepted match formats:
 * - Percentage string: "85%", "0.85%"
 * - Numeric string: "85", "0.85"
 * - Number: 85, 0.85
 * - null/undefined: treated as 0
 *
 * Normalization:
 * - Values in range (0, 1] are treated as fractions and converted to percentages
 * - Values outside this range are treated as percentages directly
 * - Unparseable values are treated as 0
 *
 * Filtering:
 * - Recipes with match <= 0 are excluded from results
 *
 * Sorting:
 * - Recipes are sorted by match percentage in descending order (highest first)
 */

/**
 * Parses a match value from various formats and normalizes to a percentage (0-100).
 * - "85%" -> 85
 * - "85" -> 85
 * - 85 -> 85
 * - 0.85 -> 85 (values in (0, 1] are treated as fractions)
 * - "0.85" -> 85
 * - null/undefined/invalid -> 0
 */
function parseMatchValue(match: unknown): number {
  if (match === null || match === undefined) {
    return 0;
  }

  let numericValue: number;

  if (typeof match === "number") {
    numericValue = match;
  } else if (typeof match === "string") {
    // Remove percentage sign if present
    const cleanedString = match.replace(/%$/, "").trim();
    numericValue = parseFloat(cleanedString);
  } else {
    return 0;
  }

  // Check if value is valid
  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return 0;
  }

  // Normalize: values in (0, 1] are treated as fractions
  if (numericValue > 0 && numericValue <= 1) {
    return numericValue * 100;
  }

  return numericValue;
}

/**
 * Interface for objects that may have a match property.
 * The match can be in various formats.
 */
interface RecipeWithMatch {
  match?: unknown;
  coverageScore?: unknown;
}

/**
 * Gets the match value from a recipe object.
 * Checks for 'match' property first, then 'coverageScore'.
 */
function getMatchFromRecipe<T>(recipe: T): number {
  const rec = recipe as Record<string, unknown>;
  if ("match" in rec && rec.match !== undefined) {
    return parseMatchValue(rec.match);
  }
  if ("coverageScore" in rec && rec.coverageScore !== undefined) {
    return parseMatchValue(rec.coverageScore);
  }
  return 0;
}

/**
 * Filters and sorts recipes by match percentage.
 *
 * @param recipes - Array of recipe objects with a match/coverageScore property
 * @returns New array with recipes filtered (match > 0) and sorted (descending by match)
 *
 * @example
 * const recipes = [
 *   { name: 'A', match: '50%' },
 *   { name: 'B', match: 85 },
 *   { name: 'C', match: 0 },
 *   { name: 'D', coverageScore: 0.75 },
 * ];
 * filterAndSortRecipes(recipes);
 * // Returns [{ name: 'B', ... }, { name: 'D', ... }, { name: 'A', ... }]
 */
export function filterAndSortRecipes<T>(
  recipes?: T[] | null
): T[] {
  if (!recipes || !Array.isArray(recipes)) {
    return [];
  }

  // Create a copy to avoid mutating the original array
  // Filter out recipes with match <= 0
  const filtered = recipes.filter((recipe) => {
    const match = getMatchFromRecipe(recipe);
    return match > 0;
  });

  // Sort by match percentage in descending order
  return filtered.sort((a, b) => {
    const matchA = getMatchFromRecipe(a);
    const matchB = getMatchFromRecipe(b);
    return matchB - matchA;
  });
}
