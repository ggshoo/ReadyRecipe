import { describe, it, expect } from "vitest";
import {
  parseMatchValue,
  filterAndSortRecipes,
} from "../src/utils/sortRecipes";

describe("parseMatchValue", () => {
  describe("handles string with percent sign", () => {
    it("should parse '85%' as 85", () => {
      expect(parseMatchValue("85%")).toBe(85);
    });

    it("should parse '100%' as 100", () => {
      expect(parseMatchValue("100%")).toBe(100);
    });

    it("should parse '0%' as 0", () => {
      expect(parseMatchValue("0%")).toBe(0);
    });

    it("should parse '50.5%' as 50.5", () => {
      expect(parseMatchValue("50.5%")).toBe(50.5);
    });
  });

  describe("handles plain string numbers", () => {
    it("should parse '85' as 85", () => {
      expect(parseMatchValue("85")).toBe(85);
    });

    it("should parse '100' as 100", () => {
      expect(parseMatchValue("100")).toBe(100);
    });

    it("should parse '0' as 0", () => {
      expect(parseMatchValue("0")).toBe(0);
    });
  });

  describe("handles number values", () => {
    it("should return 85 for integer 85", () => {
      expect(parseMatchValue(85)).toBe(85);
    });

    it("should return 100 for integer 100", () => {
      expect(parseMatchValue(100)).toBe(100);
    });

    it("should return 0 for integer 0", () => {
      expect(parseMatchValue(0)).toBe(0);
    });
  });

  describe("handles fractional values (0, 1]", () => {
    it("should convert 0.85 to 85", () => {
      expect(parseMatchValue(0.85)).toBe(85);
    });

    it("should convert 0.5 to 50", () => {
      expect(parseMatchValue(0.5)).toBe(50);
    });

    it("should convert 1 to 100", () => {
      expect(parseMatchValue(1)).toBe(100);
    });

    it("should convert 0.01 to 1", () => {
      expect(parseMatchValue(0.01)).toBe(1);
    });

    it("should convert string '0.85' to 85", () => {
      expect(parseMatchValue("0.85")).toBe(85);
    });

    it("should convert string '0.5' to 50", () => {
      expect(parseMatchValue("0.5")).toBe(50);
    });

    it("should convert string '1' to 100", () => {
      expect(parseMatchValue("1")).toBe(100);
    });
  });

  describe("handles null/undefined", () => {
    it("should return 0 for null", () => {
      expect(parseMatchValue(null)).toBe(0);
    });

    it("should return 0 for undefined", () => {
      expect(parseMatchValue(undefined)).toBe(0);
    });
  });

  describe("handles unparseable values", () => {
    it("should return 0 for invalid string", () => {
      expect(parseMatchValue("invalid")).toBe(0);
    });

    it("should return 0 for empty string", () => {
      expect(parseMatchValue("")).toBe(0);
    });

    it("should return 0 for NaN", () => {
      expect(parseMatchValue(NaN)).toBe(0);
    });

    it("should return 0 for Infinity", () => {
      expect(parseMatchValue(Infinity)).toBe(0);
    });

    it("should return 0 for negative Infinity", () => {
      expect(parseMatchValue(-Infinity)).toBe(0);
    });
  });

  describe("handles whitespace", () => {
    it("should handle leading/trailing whitespace in strings", () => {
      expect(parseMatchValue("  85  ")).toBe(85);
      expect(parseMatchValue("  85%  ")).toBe(85);
    });
  });
});

describe("filterAndSortRecipes", () => {
  interface TestRecipe {
    name: string;
    match?: string | number | null;
    coverageScore?: number;
  }

  describe("filtering", () => {
    it("should filter out recipes with match 0", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 85 },
        { name: "Recipe B", match: 0 },
        { name: "Recipe C", match: 50 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(2);
      expect(result.map((r) => r.name)).toEqual(["Recipe A", "Recipe C"]);
    });

    it("should filter out recipes with match '0%'", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: "85%" },
        { name: "Recipe B", match: "0%" },
        { name: "Recipe C", match: "50%" },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(2);
    });

    it("should filter out recipes with null match", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 85 },
        { name: "Recipe B", match: null },
        { name: "Recipe C", match: 50 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(2);
    });

    it("should filter out recipes with undefined match", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 85 },
        { name: "Recipe B" }, // undefined match
        { name: "Recipe C", match: 50 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(2);
    });

    it("should filter out recipes with negative match", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 85 },
        { name: "Recipe B", match: -10 },
        { name: "Recipe C", match: 50 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(2);
    });
  });

  describe("sorting", () => {
    it("should sort recipes by match descending", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 50 },
        { name: "Recipe B", match: 85 },
        { name: "Recipe C", match: 70 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual([
        "Recipe B",
        "Recipe C",
        "Recipe A",
      ]);
    });

    it("should handle mixed match formats", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: "50%" },
        { name: "Recipe B", match: 0.85 }, // fraction -> 85
        { name: "Recipe C", match: "70" },
        { name: "Recipe D", match: 100 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual([
        "Recipe D",
        "Recipe B",
        "Recipe C",
        "Recipe A",
      ]);
    });

    it("should handle equal match values (stable)", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 50 },
        { name: "Recipe B", match: 50 },
        { name: "Recipe C", match: 50 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(3);
    });
  });

  describe("no mutation", () => {
    it("should not mutate the original array", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 50 },
        { name: "Recipe B", match: 85 },
        { name: "Recipe C", match: 70 },
      ];
      const originalOrder = [...recipes];
      filterAndSortRecipes(recipes);
      expect(recipes).toEqual(originalOrder);
    });

    it("should return original recipe objects (not copies)", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 50 },
        { name: "Recipe B", match: 85 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result[0]).toBe(recipes[1]); // Recipe B should be first
      expect(result[1]).toBe(recipes[0]); // Recipe A should be second
    });
  });

  describe("edge cases", () => {
    it("should return empty array for null input", () => {
      const result = filterAndSortRecipes(null);
      expect(result).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      const result = filterAndSortRecipes(undefined);
      expect(result).toEqual([]);
    });

    it("should return empty array for empty input", () => {
      const result = filterAndSortRecipes([]);
      expect(result).toEqual([]);
    });

    it("should return empty array when all recipes have 0 match", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", match: 0 },
        { name: "Recipe B", match: "0%" },
        { name: "Recipe C", match: null },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toEqual([]);
    });
  });

  describe("custom match key", () => {
    it("should use coverageScore when specified", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", coverageScore: 0.5 },
        { name: "Recipe B", coverageScore: 0.85 },
        { name: "Recipe C", coverageScore: 0.7 },
      ];
      const result = filterAndSortRecipes(recipes, "coverageScore");
      expect(result.map((r) => r.name)).toEqual([
        "Recipe B",
        "Recipe C",
        "Recipe A",
      ]);
    });

    it("should filter out zero coverageScore", () => {
      const recipes: TestRecipe[] = [
        { name: "Recipe A", coverageScore: 0.5 },
        { name: "Recipe B", coverageScore: 0 },
        { name: "Recipe C", coverageScore: 0.7 },
      ];
      const result = filterAndSortRecipes(recipes, "coverageScore");
      expect(result.length).toBe(2);
      expect(result.map((r) => r.name)).toEqual(["Recipe C", "Recipe A"]);
    });
  });
});
