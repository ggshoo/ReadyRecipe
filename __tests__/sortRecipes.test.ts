import { describe, it, expect } from "vitest";
import { parseMatchPercentage, filterAndSortRecipes } from "../lib/sortRecipes";

describe("parseMatchPercentage", () => {
  describe("number inputs", () => {
    it("should return percentage values as-is when > 1", () => {
      expect(parseMatchPercentage(85)).toBe(85);
      expect(parseMatchPercentage(100)).toBe(100);
      expect(parseMatchPercentage(50)).toBe(50);
    });

    it("should convert fractional values (0, 1] to percentage", () => {
      expect(parseMatchPercentage(0.85)).toBe(85);
      expect(parseMatchPercentage(0.5)).toBe(50);
      expect(parseMatchPercentage(1)).toBe(100);
      expect(parseMatchPercentage(0.01)).toBe(1);
    });

    it("should return 0 for zero", () => {
      expect(parseMatchPercentage(0)).toBe(0);
    });

    it("should handle negative numbers", () => {
      expect(parseMatchPercentage(-10)).toBe(-10);
    });
  });

  describe("string inputs", () => {
    it("should parse percentage strings with % sign", () => {
      expect(parseMatchPercentage("85%")).toBe(85);
      expect(parseMatchPercentage("100%")).toBe(100);
      expect(parseMatchPercentage("50%")).toBe(50);
    });

    it("should parse numeric strings without % sign", () => {
      expect(parseMatchPercentage("85")).toBe(85);
      expect(parseMatchPercentage("100")).toBe(100);
    });

    it("should parse decimal strings and convert fractions", () => {
      expect(parseMatchPercentage("0.85")).toBe(85);
      expect(parseMatchPercentage("0.5")).toBe(50);
    });

    it("should handle whitespace", () => {
      expect(parseMatchPercentage(" 85% ")).toBe(85);
      expect(parseMatchPercentage("  0.5  ")).toBe(50);
    });

    it("should return 0 for unparseable strings", () => {
      expect(parseMatchPercentage("abc")).toBe(0);
      expect(parseMatchPercentage("")).toBe(0);
      expect(parseMatchPercentage("not a number")).toBe(0);
    });
  });

  describe("null/undefined inputs", () => {
    it("should return 0 for null", () => {
      expect(parseMatchPercentage(null)).toBe(0);
    });

    it("should return 0 for undefined", () => {
      expect(parseMatchPercentage(undefined)).toBe(0);
    });
  });

  describe("invalid inputs", () => {
    it("should return 0 for objects", () => {
      expect(parseMatchPercentage({})).toBe(0);
      expect(parseMatchPercentage({ value: 85 })).toBe(0);
    });

    it("should return 0 for arrays", () => {
      expect(parseMatchPercentage([85])).toBe(0);
    });

    it("should return 0 for NaN", () => {
      expect(parseMatchPercentage(NaN)).toBe(0);
    });

    it("should return 0 for Infinity", () => {
      expect(parseMatchPercentage(Infinity)).toBe(0);
      expect(parseMatchPercentage(-Infinity)).toBe(0);
    });
  });
});

describe("filterAndSortRecipes", () => {
  describe("filtering", () => {
    it("should filter out recipes with match <= 0", () => {
      const recipes = [
        { name: "Recipe A", coverageScore: 0.85 },
        { name: "Recipe B", coverageScore: 0 },
        { name: "Recipe C", coverageScore: 0.5 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toEqual(["Recipe A", "Recipe C"]);
    });

    it("should filter out recipes with null/undefined match", () => {
      const recipes = [
        { name: "Recipe A", coverageScore: 0.85 },
        { name: "Recipe B", coverageScore: null },
        { name: "Recipe C" },
      ];
      const result = filterAndSortRecipes(recipes as unknown[]);
      expect(result).toHaveLength(1);
      expect((result[0] as { name: string }).name).toBe("Recipe A");
    });

    it("should filter out recipes with negative match", () => {
      const recipes = [
        { name: "Recipe A", coverageScore: 0.85 },
        { name: "Recipe B", coverageScore: -0.5 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Recipe A");
    });
  });

  describe("sorting", () => {
    it("should sort recipes by match percentage descending", () => {
      const recipes = [
        { name: "Recipe A", coverageScore: 0.5 },
        { name: "Recipe B", coverageScore: 0.85 },
        { name: "Recipe C", coverageScore: 0.3 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual([
        "Recipe B",
        "Recipe A",
        "Recipe C",
      ]);
    });

    it("should handle equal match percentages", () => {
      const recipes = [
        { name: "Recipe A", coverageScore: 0.5 },
        { name: "Recipe B", coverageScore: 0.5 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
    });
  });

  describe("immutability", () => {
    it("should not mutate original recipe objects", () => {
      const original = { name: "Recipe A", coverageScore: 0.85 };
      const recipes = [original];
      const originalStr = JSON.stringify(original);

      filterAndSortRecipes(recipes);

      expect(JSON.stringify(original)).toBe(originalStr);
    });

    it("should not mutate original array", () => {
      const recipes = [
        { name: "Recipe A", coverageScore: 0.3 },
        { name: "Recipe B", coverageScore: 0.85 },
      ];
      const originalOrder = [...recipes.map((r) => r.name)];

      filterAndSortRecipes(recipes);

      expect(recipes.map((r) => r.name)).toEqual(originalOrder);
    });
  });

  describe("edge cases", () => {
    it("should return empty array for null input", () => {
      expect(filterAndSortRecipes(null)).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      expect(filterAndSortRecipes(undefined)).toEqual([]);
    });

    it("should return empty array for empty array input", () => {
      expect(filterAndSortRecipes([])).toEqual([]);
    });

    it("should handle various match property names", () => {
      // coverageScore
      const recipes1 = [{ name: "A", coverageScore: 0.85 }];
      expect(filterAndSortRecipes(recipes1)).toHaveLength(1);

      // match
      const recipes2 = [{ name: "A", match: 85 }];
      expect(filterAndSortRecipes(recipes2)).toHaveLength(1);

      // score
      const recipes3 = [{ name: "A", score: 0.85 }];
      expect(filterAndSortRecipes(recipes3)).toHaveLength(1);
    });
  });

  describe("integration with various match formats", () => {
    it("should handle percentage strings", () => {
      const recipes = [
        { name: "Recipe A", match: "85%" },
        { name: "Recipe B", match: "50%" },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Recipe A");
    });

    it("should handle mixed match formats", () => {
      const recipes = [
        { name: "Recipe A", coverageScore: 0.3 },
        { name: "Recipe B", coverageScore: 0.85 },
        { name: "Recipe C", coverageScore: 0 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Recipe B");
      expect(result[1].name).toBe("Recipe A");
    });
  });
});
