import { describe, it, expect } from "vitest";
import { normalizeMatch, filterAndSortRecipes } from "../lib/sortRecipes";

describe("normalizeMatch", () => {
  describe("string with percent sign", () => {
    it("should parse '85%' as 85", () => {
      expect(normalizeMatch("85%")).toBe(85);
    });

    it("should parse '100%' as 100", () => {
      expect(normalizeMatch("100%")).toBe(100);
    });

    it("should parse '0%' as 0", () => {
      expect(normalizeMatch("0%")).toBe(0);
    });

    it("should parse '0.85%' as 0.85 (not a fraction since it has %)", () => {
      // When the string has %, the numeric value after removing % is used directly
      // 0.85 is in (0, 1] so it becomes 85
      expect(normalizeMatch("0.85%")).toBe(85);
    });
  });

  describe("numeric string without percent", () => {
    it("should parse '85' as 85", () => {
      expect(normalizeMatch("85")).toBe(85);
    });

    it("should parse '0.85' as 85 (fraction normalization)", () => {
      expect(normalizeMatch("0.85")).toBe(85);
    });

    it("should parse '0' as 0", () => {
      expect(normalizeMatch("0")).toBe(0);
    });

    it("should parse '1' as 100 (1 is in (0, 1] range)", () => {
      expect(normalizeMatch("1")).toBe(100);
    });
  });

  describe("number values", () => {
    it("should parse 85 as 85", () => {
      expect(normalizeMatch(85)).toBe(85);
    });

    it("should parse 0.85 as 85 (fraction normalization)", () => {
      expect(normalizeMatch(0.85)).toBe(85);
    });

    it("should parse 0 as 0", () => {
      expect(normalizeMatch(0)).toBe(0);
    });

    it("should parse 1 as 100 (1 is in (0, 1] range)", () => {
      expect(normalizeMatch(1)).toBe(100);
    });

    it("should parse 100 as 100", () => {
      expect(normalizeMatch(100)).toBe(100);
    });

    it("should parse 0.5 as 50", () => {
      expect(normalizeMatch(0.5)).toBe(50);
    });

    it("should parse 0.001 as 0.1 (very small fractions)", () => {
      expect(normalizeMatch(0.001)).toBeCloseTo(0.1);
    });
  });

  describe("null and undefined", () => {
    it("should return 0 for null", () => {
      expect(normalizeMatch(null)).toBe(0);
    });

    it("should return 0 for undefined", () => {
      expect(normalizeMatch(undefined)).toBe(0);
    });
  });

  describe("invalid values", () => {
    it("should return 0 for empty string", () => {
      expect(normalizeMatch("")).toBe(0);
    });

    it("should return 0 for non-numeric string", () => {
      expect(normalizeMatch("invalid")).toBe(0);
    });

    it("should return 0 for 'abc%'", () => {
      expect(normalizeMatch("abc%")).toBe(0);
    });

    it("should return 0 for NaN", () => {
      expect(normalizeMatch(NaN)).toBe(0);
    });

    it("should return 0 for Infinity", () => {
      expect(normalizeMatch(Infinity)).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace around percent", () => {
      expect(normalizeMatch(" 85% ")).toBe(85);
    });

    it("should handle negative values", () => {
      expect(normalizeMatch(-5)).toBe(-5);
    });

    it("should handle values just above 1", () => {
      expect(normalizeMatch(1.01)).toBe(1.01);
    });
  });
});

describe("filterAndSortRecipes", () => {
  describe("filtering", () => {
    it("should exclude recipes with coverageScore of 0", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: 0 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("A");
    });

    it("should exclude recipes with coverageScore of '0%'", () => {
      const recipes = [
        { name: "A", coverageScore: "50%" },
        { name: "B", coverageScore: "0%" },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("A");
    });

    it("should exclude recipes with null coverageScore", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: null },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("A");
    });

    it("should exclude recipes with undefined coverageScore", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: undefined },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("A");
    });

    it("should exclude recipes with invalid string coverageScore", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: "invalid" },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("A");
    });

    it("should exclude recipes with negative coverageScore", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: -0.1 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("A");
    });
  });

  describe("sorting", () => {
    it("should sort recipes by match descending", () => {
      const recipes = [
        { name: "A", coverageScore: 0.3 },
        { name: "B", coverageScore: 0.9 },
        { name: "C", coverageScore: 0.6 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual(["B", "C", "A"]);
    });

    it("should handle mixed format coverageScores", () => {
      const recipes = [
        { name: "A", coverageScore: "30%" },
        { name: "B", coverageScore: 0.9 },
        { name: "C", coverageScore: 60 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual(["B", "C", "A"]);
    });

    it("should maintain relative order for equal scores", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: 0.5 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      // Both should be present with same score
      expect(result.map((r) => r.coverageScore)).toEqual([0.5, 0.5]);
    });
  });

  describe("input handling", () => {
    it("should return empty array for null input", () => {
      expect(filterAndSortRecipes(null)).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      expect(filterAndSortRecipes(undefined)).toEqual([]);
    });

    it("should return empty array for empty array input", () => {
      expect(filterAndSortRecipes([])).toEqual([]);
    });

    it("should not mutate original array", () => {
      const recipes = [
        { name: "A", coverageScore: 0.3 },
        { name: "B", coverageScore: 0.9 },
      ];
      const original = [...recipes];
      filterAndSortRecipes(recipes);
      expect(recipes).toEqual(original);
    });

    it("should return references to original objects", () => {
      const recipeA = { name: "A", coverageScore: 0.5 };
      const recipes = [recipeA];
      const result = filterAndSortRecipes(recipes);
      expect(result[0]).toBe(recipeA);
    });
  });

  describe("integration with RecipeScore type", () => {
    it("should work with RecipeScore-like objects", () => {
      const recipes = [
        {
          recipe: { id: "1", name: "Recipe 1" },
          coverageScore: 0.3,
          similarityScore: 0.5,
        },
        {
          recipe: { id: "2", name: "Recipe 2" },
          coverageScore: 0.9,
          similarityScore: 0.8,
        },
        {
          recipe: { id: "3", name: "Recipe 3" },
          coverageScore: 0,
          similarityScore: 0.1,
        },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].recipe.name).toBe("Recipe 2");
      expect(result[1].recipe.name).toBe("Recipe 1");
    });
  });
});
