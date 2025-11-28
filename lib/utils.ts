import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for proper class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format cooking time into human-readable string
 */
export function formatCookTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Normalize ingredient names for better matching
 */
export function normalizeIngredient(ingredient: string): string {
  return ingredient.toLowerCase().trim();
}

/**
 * Generate a slug from an ingredient name for duplicate prevention
 * Normalizes capitalization and spacing to create a consistent identifier
 */
export function generateIngredientSlug(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a user ingredient matches a recipe ingredient using flexible matching
 * Supports case-insensitive partial matches (e.g., "cauliflower" matches "Cauliflower Rice")
 * Uses word boundary matching to prevent false positives (e.g., "rice" won't match "licorice")
 */
export function ingredientMatches(userIngredient: string, recipeIngredient: string): boolean {
  const userLower = userIngredient.toLowerCase().trim();
  const recipeLower = recipeIngredient.toLowerCase().trim();
  
  // Exact match
  if (userLower === recipeLower) {
    return true;
  }
  
  // Word boundary regex for partial matching
  // Matches if the ingredient appears as a whole word or at word boundaries
  const userRegex = new RegExp(`\\b${escapeRegex(userLower)}\\b`, 'i');
  const recipeRegex = new RegExp(`\\b${escapeRegex(recipeLower)}\\b`, 'i');
  
  // Check if user ingredient is a complete word within recipe ingredient
  // or if recipe ingredient is a complete word within user ingredient
  return userRegex.test(recipeLower) || recipeRegex.test(userLower);
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
