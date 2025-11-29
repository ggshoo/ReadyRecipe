/**
 * Utility for filtering and sorting recipes by match percentage
 */

/**
 * Parse a match value to a normalized percentage (0-100)
 * Handles various formats: "85%", "85", 85, 0.85, "0.85", null/undefined
 * - Numbers in (0, 1] are treated as fractions and multiplied by 100
 * - Unparseable values return 0
 */
export function parseMatchPercentage(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  let numValue: number;

  if (typeof value === "number") {
    numValue = value;
  } else if (typeof value === "string") {
    // Remove % sign and whitespace, then parse
    const cleaned = value.replace(/%/g, "").trim();
    numValue = parseFloat(cleaned);
  } else {
    return 0;
  }

  // Check for NaN or invalid numbers
  if (isNaN(numValue) || !isFinite(numValue)) {
    return 0;
  }

  // Treat numbers in (0, 1] as fractions (e.g., 0.85 -> 85)
  if (numValue > 0 && numValue <= 1) {
    numValue = numValue * 100;
  }

  return numValue;
}

/**
 * Get the match percentage from a recipe object
 * Looks for common property names that represent match score
 */
function getMatchFromRecipe<T extends object>(recipe: T): number {
  // Priority order for match properties
  const matchKeys = [
    "match",
    "matchPercentage",
    "coverageScore",
    "score",
    "similarity",
  ];

  for (const key of matchKeys) {
    if (key in recipe) {
      return parseMatchPercentage((recipe as Record<string, unknown>)[key]);
    }
  }

  return 0;
}

/**
 * Filter and sort recipes by match percentage
 * - Filters out recipes with match <= 0
 * - Sorts remaining recipes by match percentage descending
 * - Does not mutate original recipe objects
 *
 * @param recipes - Array of recipe objects or null/undefined
 * @returns Filtered and sorted array of recipes
 */
export function filterAndSortRecipes<T extends object>(
  recipes?: T[] | null
): T[] {
  if (!recipes || !Array.isArray(recipes)) {
    return [];
  }

  // Create copies with calculated match percentages
  const recipesWithMatch = recipes.map((recipe) => ({
    original: recipe,
    matchPercentage: getMatchFromRecipe(recipe),
  }));

  // Filter out recipes with match <= 0
  const filtered = recipesWithMatch.filter((item) => item.matchPercentage > 0);

  // Sort by match percentage descending
  filtered.sort((a, b) => b.matchPercentage - a.matchPercentage);

  // Return original recipe objects (not mutated)
  return filtered.map((item) => item.original);
}
