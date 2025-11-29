/**
 * Utility for filtering and sorting recipes by match percentage.
 *
 * Accepted match formats:
 * - "85%" or "85" (string percentages)
 * - 85 (number percentage)
 * - 0.85 or "0.85" (fractions in range (0,1] are converted to percentage)
 * - null/undefined are treated as 0
 * - Unparseable values are treated as 0
 *
 * Behavior:
 * - Normalizes all match values to a percentage number in range 0-100
 * - Filters out recipes with match <= 0
 * - Sorts remaining recipes by match percentage descending (highest first)
 * - Does not mutate original recipe objects
 */

/**
 * Parses a match value and normalizes it to a percentage number (0-100).
 * Returns 0 for unparseable or invalid values.
 */
export function parseMatchPercentage(
  match: string | number | null | undefined
): number {
  if (match === null || match === undefined) {
    return 0;
  }

  let numValue: number;

  if (typeof match === "string") {
    // Remove % sign and whitespace
    const cleaned = match.replace(/%/g, "").trim();
    if (cleaned === "") {
      return 0;
    }
    numValue = parseFloat(cleaned);
  } else if (typeof match === "number") {
    numValue = match;
  } else {
    return 0;
  }

  // Check if the parsed value is a valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return 0;
  }

  // Treat numbers in range (0, 1] as fractions (0.85 -> 85)
  if (numValue > 0 && numValue <= 1) {
    numValue = numValue * 100;
  }

  // Return 0 for negative values
  if (numValue < 0) {
    return 0;
  }

  return numValue;
}

/**
 * Gets the match value from a recipe object by checking common property names.
 */
function getMatchValue(recipe: Record<string, unknown>): unknown {
  return (
    (recipe as { coverageScore?: unknown }).coverageScore ??
    (recipe as { match?: unknown }).match ??
    (recipe as { matchPercentage?: unknown }).matchPercentage ??
    0
  );
}

/**
 * Filters out recipes with match <= 0 and sorts remaining recipes
 * by match percentage from highest to lowest.
 *
 * @param recipes - Array of recipe objects with a match property (coverageScore, match, or matchPercentage)
 * @returns New array of filtered and sorted recipes (does not mutate original)
 */
export function filterAndSortRecipes<T>(recipes?: T[] | null): T[] {
  if (!recipes || !Array.isArray(recipes)) {
    return [];
  }

  // Create a copy with parsed match percentages
  const recipesWithParsedMatch = recipes.map((recipe) => {
    // Try different properties that might contain match info
    const matchValue = getMatchValue(recipe as Record<string, unknown>);
    const parsedMatch = parseMatchPercentage(
      matchValue as string | number | null | undefined
    );
    return { recipe, parsedMatch };
  });

  // Filter out recipes with match <= 0
  const filtered = recipesWithParsedMatch.filter((item) => item.parsedMatch > 0);

  // Sort by match percentage descending
  filtered.sort((a, b) => b.parsedMatch - a.parsedMatch);

  // Return the original recipe objects (not mutated)
  return filtered.map((item) => item.recipe);
}
