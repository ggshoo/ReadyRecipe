"use server";

import { CANONICAL_INGREDIENTS } from "./datasets";
import { generateIngredientSlug, normalizeIngredient } from "./utils";

/**
 * Ingredient interface for type safety
 */
export interface Ingredient {
  name: string;
  slug: string;
  isCustom: boolean;
}

/**
 * In-memory store for custom ingredients (for MVP without database)
 * In production, this would be stored in Supabase or similar
 */
const customIngredients: Map<string, Ingredient> = new Map();

/**
 * Initialize canonical ingredients with slugs
 */
function getCanonicalIngredientsMap(): Map<string, Ingredient> {
  const map = new Map<string, Ingredient>();
  CANONICAL_INGREDIENTS.forEach((name) => {
    const slug = generateIngredientSlug(name);
    map.set(slug, { name, slug, isCustom: false });
  });
  return map;
}

const canonicalIngredientsMap = getCanonicalIngredientsMap();

/**
 * Get all available ingredients (canonical + custom)
 * Returns a combined list with duplicates prevented by slug matching
 */
export async function getAllIngredients(): Promise<Ingredient[]> {
  const combined = new Map<string, Ingredient>();

  // Add canonical ingredients first
  canonicalIngredientsMap.forEach((ingredient, slug) => {
    combined.set(slug, ingredient);
  });

  // Add custom ingredients (won't overwrite canonical due to slug matching)
  customIngredients.forEach((ingredient, slug) => {
    if (!combined.has(slug)) {
      combined.set(slug, ingredient);
    }
  });

  return Array.from(combined.values());
}

/**
 * Get all ingredient names (for backward compatibility)
 * Returns both canonical and custom ingredient names
 */
export async function getAllIngredientNames(): Promise<string[]> {
  const ingredients = await getAllIngredients();
  return ingredients.map((ing) => ing.name);
}

/**
 * Get an ingredient by slug
 */
export async function getIngredientBySlug(
  slug: string
): Promise<Ingredient | null> {
  // Check canonical first
  if (canonicalIngredientsMap.has(slug)) {
    return canonicalIngredientsMap.get(slug)!;
  }

  // Check custom ingredients
  if (customIngredients.has(slug)) {
    return customIngredients.get(slug)!;
  }

  return null;
}

/**
 * Add a new custom ingredient
 * Returns the created ingredient or existing ingredient if duplicate found
 */
export async function addIngredient(name: string): Promise<Ingredient> {
  const normalizedName = normalizeIngredient(name);
  const slug = generateIngredientSlug(normalizedName);

  // Check if already exists in canonical
  if (canonicalIngredientsMap.has(slug)) {
    return canonicalIngredientsMap.get(slug)!;
  }

  // Check if already exists in custom
  if (customIngredients.has(slug)) {
    return customIngredients.get(slug)!;
  }

  // Create new custom ingredient
  const newIngredient: Ingredient = {
    name: normalizedName,
    slug,
    isCustom: true,
  };

  customIngredients.set(slug, newIngredient);
  return newIngredient;
}

/**
 * Check if an ingredient exists (by name or slug)
 */
export async function ingredientExists(nameOrSlug: string): Promise<boolean> {
  const slug = generateIngredientSlug(nameOrSlug);
  return canonicalIngredientsMap.has(slug) || customIngredients.has(slug);
}

/**
 * Search ingredients by partial name match
 * Searches both canonical and custom ingredients
 */
export async function searchIngredients(query: string): Promise<Ingredient[]> {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const allIngredients = await getAllIngredients();
  return allIngredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(normalizedQuery)
  );
}
