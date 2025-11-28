import { describe, it, expect, beforeEach } from "vitest";

// Mock the server-side functions for testing
// We'll test the pure functions by simulating them locally

interface Ingredient {
  name: string;
  slug: string;
  isCustom: boolean;
}

// Replicate the generateIngredientSlug function for testing
function generateIngredientSlug(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// Replicate the normalizeIngredient function for testing
function normalizeIngredient(ingredient: string): string {
  return ingredient.toLowerCase().trim();
}

// Simple in-memory ingredient store for testing the logic
class IngredientStore {
  private canonicalIngredients: Map<string, Ingredient>;
  private customIngredients: Map<string, Ingredient>;

  constructor(canonicalList: string[]) {
    this.canonicalIngredients = new Map();
    this.customIngredients = new Map();
    
    canonicalList.forEach((name) => {
      const slug = generateIngredientSlug(name);
      this.canonicalIngredients.set(slug, { name, slug, isCustom: false });
    });
  }

  getAllIngredients(): Ingredient[] {
    const combined = new Map<string, Ingredient>();
    
    this.canonicalIngredients.forEach((ingredient, slug) => {
      combined.set(slug, ingredient);
    });
    
    this.customIngredients.forEach((ingredient, slug) => {
      if (!combined.has(slug)) {
        combined.set(slug, ingredient);
      }
    });
    
    return Array.from(combined.values());
  }

  addIngredient(name: string): Ingredient {
    const normalizedName = normalizeIngredient(name);
    const slug = generateIngredientSlug(name);

    if (this.canonicalIngredients.has(slug)) {
      return this.canonicalIngredients.get(slug)!;
    }

    if (this.customIngredients.has(slug)) {
      return this.customIngredients.get(slug)!;
    }

    const newIngredient: Ingredient = {
      name: normalizedName,
      slug,
      isCustom: true,
    };

    this.customIngredients.set(slug, newIngredient);
    return newIngredient;
  }

  ingredientExists(nameOrSlug: string): boolean {
    const slug = generateIngredientSlug(nameOrSlug);
    return this.canonicalIngredients.has(slug) || this.customIngredients.has(slug);
  }

  searchIngredients(query: string): Ingredient[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    return this.getAllIngredients().filter((ingredient) =>
      ingredient.name.toLowerCase().includes(normalizedQuery)
    );
  }
}

describe("IngredientStore", () => {
  let store: IngredientStore;

  beforeEach(() => {
    store = new IngredientStore([
      "chicken breast",
      "ground beef",
      "onion",
      "garlic",
    ]);
  });

  describe("getAllIngredients", () => {
    it("should return all canonical ingredients initially", () => {
      const ingredients = store.getAllIngredients();
      expect(ingredients).toHaveLength(4);
      expect(ingredients.map((i) => i.name)).toContain("chicken breast");
      expect(ingredients.map((i) => i.name)).toContain("ground beef");
    });

    it("should include custom ingredients after they are added", () => {
      store.addIngredient("mango");
      const ingredients = store.getAllIngredients();
      expect(ingredients).toHaveLength(5);
      expect(ingredients.map((i) => i.name)).toContain("mango");
    });
  });

  describe("addIngredient", () => {
    it("should add a new custom ingredient", () => {
      const result = store.addIngredient("mango");
      expect(result.name).toBe("mango");
      expect(result.slug).toBe("mango");
      expect(result.isCustom).toBe(true);
    });

    it("should normalize ingredient names", () => {
      const result = store.addIngredient("  MANGO  ");
      expect(result.name).toBe("mango");
    });

    it("should return existing canonical ingredient for duplicates", () => {
      const result = store.addIngredient("Chicken Breast");
      expect(result.name).toBe("chicken breast");
      expect(result.isCustom).toBe(false);
    });

    it("should return existing custom ingredient for duplicates", () => {
      store.addIngredient("mango");
      const result = store.addIngredient("MANGO");
      expect(result.name).toBe("mango");
      expect(result.isCustom).toBe(true);
    });

    it("should prevent duplicates with different spacing", () => {
      store.addIngredient("bell pepper");
      const result = store.addIngredient("BELL   PEPPER");
      expect(result.slug).toBe("bell-pepper");
      expect(store.getAllIngredients().filter((i) => i.slug === "bell-pepper")).toHaveLength(1);
    });
  });

  describe("ingredientExists", () => {
    it("should return true for canonical ingredients", () => {
      expect(store.ingredientExists("chicken breast")).toBe(true);
      expect(store.ingredientExists("ONION")).toBe(true);
    });

    it("should return true for custom ingredients after adding", () => {
      store.addIngredient("mango");
      expect(store.ingredientExists("mango")).toBe(true);
    });

    it("should return false for non-existent ingredients", () => {
      expect(store.ingredientExists("mango")).toBe(false);
    });
  });

  describe("searchIngredients", () => {
    it("should find ingredients by partial name match", () => {
      const results = store.searchIngredients("chick");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("chicken breast");
    });

    it("should find multiple matching ingredients", () => {
      const results = store.searchIngredients("on");
      expect(results.map((i) => i.name)).toContain("onion");
    });

    it("should be case-insensitive", () => {
      const results = store.searchIngredients("GARLIC");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("garlic");
    });

    it("should return empty array for empty query", () => {
      expect(store.searchIngredients("")).toHaveLength(0);
      expect(store.searchIngredients("   ")).toHaveLength(0);
    });

    it("should include custom ingredients in search", () => {
      store.addIngredient("mango");
      const results = store.searchIngredients("man");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("mango");
    });
  });
});

describe("Backward Compatibility", () => {
  it("should work with old recipe format using canonical ingredients", () => {
    const store = new IngredientStore([
      "chicken breast",
      "garlic",
      "soy sauce",
    ]);

    const oldRecipeIngredients = ["chicken breast", "garlic", "soy sauce"];
    
    oldRecipeIngredients.forEach((ingredient) => {
      expect(store.ingredientExists(ingredient)).toBe(true);
    });
  });

  it("should work with recipes that have mix of canonical and custom ingredients", () => {
    const store = new IngredientStore([
      "chicken breast",
      "garlic",
    ]);

    // Add custom ingredient
    store.addIngredient("thai basil");

    const recipeIngredients = ["chicken breast", "garlic", "thai basil"];
    
    recipeIngredients.forEach((ingredient) => {
      expect(store.ingredientExists(ingredient)).toBe(true);
    });
  });
});
