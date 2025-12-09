import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock environment variable before importing the module
const originalEnv = process.env;

describe("api-clients", () => {
  beforeEach(() => {
    // Reset module cache
    vi.resetModules();
    // Clone the environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("isSpoonacularAvailable", () => {
    it("should return false when API key is not set", async () => {
      delete process.env.SPOONACULAR_API_KEY;
      const { isSpoonacularAvailable } = await import("../lib/api");
      expect(isSpoonacularAvailable()).toBe(false);
    });

    it("should return false when API key is the placeholder value", async () => {
      process.env.SPOONACULAR_API_KEY = "your_spoonacular_api_key_here";
      const { isSpoonacularAvailable } = await import("../lib/api");
      expect(isSpoonacularAvailable()).toBe(false);
    });

    it("should return true when API key is a real value", async () => {
      process.env.SPOONACULAR_API_KEY = "real_api_key_12345";
      const { isSpoonacularAvailable } = await import("../lib/api");
      expect(isSpoonacularAvailable()).toBe(true);
    });
  });

  describe("searchRecipesByIngredients", () => {
    it("should throw error when API key is not configured", async () => {
      delete process.env.SPOONACULAR_API_KEY;
      const { spoonacularSearchRecipesByIngredients } = await import("../lib/api");
      
      await expect(spoonacularSearchRecipesByIngredients(["chicken", "rice"])).rejects.toThrow(
        "Spoonacular API key is not configured"
      );
    });

    it("should throw error when ingredients array is empty", async () => {
      process.env.SPOONACULAR_API_KEY = "test_key_12345";
      const { spoonacularSearchRecipesByIngredients } = await import("../lib/api");
      
      await expect(spoonacularSearchRecipesByIngredients([])).rejects.toThrow(
        "Ingredients array must not be empty"
      );
    });

    it("should throw error when ingredients contain empty strings", async () => {
      process.env.SPOONACULAR_API_KEY = "test_key_12345";
      const { spoonacularSearchRecipesByIngredients } = await import("../lib/api");
      
      await expect(spoonacularSearchRecipesByIngredients(["chicken", ""])).rejects.toThrow(
        "All ingredients must be non-empty strings"
      );
    });

    it("should throw error when ingredients contain whitespace-only strings", async () => {
      process.env.SPOONACULAR_API_KEY = "test_key_12345";
      const { spoonacularSearchRecipesByIngredients } = await import("../lib/api");
      
      await expect(spoonacularSearchRecipesByIngredients(["chicken", "   "])).rejects.toThrow(
        "All ingredients must be non-empty strings"
      );
    });
  });

  describe("getRecipeById", () => {
    it("should throw error when API key is not configured", async () => {
      delete process.env.SPOONACULAR_API_KEY;
      const { getRecipeById } = await import("../lib/api");
      
      await expect(getRecipeById("12345")).rejects.toThrow(
        "Spoonacular API key is not configured"
      );
    });
  });
});

describe("Recipe transformation", () => {
  // Test that the Recipe interface is compatible with both mock and API data
  it("should have consistent Recipe structure", async () => {
    const { MOCK_RECIPES } = await import("../lib/datasets");
    
    // Verify mock recipes have all required fields
    for (const recipe of MOCK_RECIPES.slice(0, 3)) {
      expect(recipe).toHaveProperty("id");
      expect(recipe).toHaveProperty("name");
      expect(recipe).toHaveProperty("ingredients");
      expect(recipe).toHaveProperty("instructions");
      expect(recipe).toHaveProperty("cookTime");
      expect(recipe).toHaveProperty("servings");
      expect(Array.isArray(recipe.ingredients)).toBe(true);
      expect(Array.isArray(recipe.instructions)).toBe(true);
      expect(typeof recipe.cookTime).toBe("number");
      expect(typeof recipe.servings).toBe("number");
    }
  });
});
