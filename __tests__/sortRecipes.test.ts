import { describe, it, expect } from "vitest";
import { parseMatchPercentage, filterAndSortRecipes } from "../lib/sortRecipes";

describe("parseMatchPercentage", () => {
  describe("string percentage formats", () => {
    it("should parse '85%' as 85", () => {
      expect(parseMatchPercentage("85%")).toBe(85);
    });

    it("should parse '85' as 85", () => {
      expect(parseMatchPercentage("85")).toBe(85);
    });

    it("should parse '100%' as 100", () => {
      expect(parseMatchPercentage("100%")).toBe(100);
    });

    it("should parse '0%' as 0", () => {
      expect(parseMatchPercentage("0%")).toBe(0);
    });

    it("should handle whitespace", () => {
      expect(parseMatchPercentage("  85%  ")).toBe(85);
      expect(parseMatchPercentage("  85  ")).toBe(85);
    });
  });

  describe("number formats", () => {
    it("should parse 85 as 85", () => {
      expect(parseMatchPercentage(85)).toBe(85);
    });

    it("should parse 100 as 100", () => {
      expect(parseMatchPercentage(100)).toBe(100);
    });

    it("should parse 0 as 0", () => {
      expect(parseMatchPercentage(0)).toBe(0);
    });
  });

  describe("fraction formats (0,1]", () => {
    it("should parse 0.85 as 85 (fraction to percentage)", () => {
      expect(parseMatchPercentage(0.85)).toBe(85);
    });

    it("should parse '0.85' as 85 (string fraction)", () => {
      expect(parseMatchPercentage("0.85")).toBe(85);
    });

    it("should parse 1 as 100 (boundary case)", () => {
      expect(parseMatchPercentage(1)).toBe(100);
    });

    it("should parse 0.5 as 50", () => {
      expect(parseMatchPercentage(0.5)).toBe(50);
    });

    it("should parse 0.01 as 1", () => {
      expect(parseMatchPercentage(0.01)).toBe(1);
    });
  });

  describe("null/undefined handling", () => {
    it("should return 0 for null", () => {
      expect(parseMatchPercentage(null)).toBe(0);
    });

    it("should return 0 for undefined", () => {
      expect(parseMatchPercentage(undefined)).toBe(0);
    });
  });

  describe("invalid values", () => {
    it("should return 0 for empty string", () => {
      expect(parseMatchPercentage("")).toBe(0);
    });

    it("should return 0 for whitespace-only string", () => {
      expect(parseMatchPercentage("   ")).toBe(0);
    });

    it("should return 0 for non-numeric string", () => {
      expect(parseMatchPercentage("abc")).toBe(0);
    });

    it("should return 0 for negative values", () => {
      expect(parseMatchPercentage(-10)).toBe(0);
      expect(parseMatchPercentage("-10")).toBe(0);
    });

    it("should return 0 for NaN", () => {
      expect(parseMatchPercentage(NaN)).toBe(0);
    });

    it("should return 0 for Infinity", () => {
      expect(parseMatchPercentage(Infinity)).toBe(0);
    });
  });
});

describe("filterAndSortRecipes", () => {
  describe("filtering", () => {
    it("should exclude recipes with 0% match", () => {
      const recipes = [
        { id: "1", coverageScore: 0.5 },
        { id: "2", coverageScore: 0 },
        { id: "3", coverageScore: 0.8 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(2);
      expect(result.map((r) => r.id)).toEqual(["3", "1"]);
    });

    it("should exclude recipes with null/undefined match", () => {
      const recipes = [
        { id: "1", coverageScore: 0.5 },
        { id: "2", coverageScore: null },
        { id: "3", coverageScore: undefined },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("1");
    });

    it("should exclude recipes with negative match", () => {
      const recipes = [
        { id: "1", coverageScore: 0.5 },
        { id: "2", coverageScore: -0.1 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("1");
    });
  });

  describe("sorting", () => {
    it("should sort recipes by match descending", () => {
      const recipes = [
        { id: "1", coverageScore: 0.3 },
        { id: "2", coverageScore: 0.9 },
        { id: "3", coverageScore: 0.6 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.id)).toEqual(["2", "3", "1"]);
    });

    it("should handle equal match percentages", () => {
      const recipes = [
        { id: "1", coverageScore: 0.5 },
        { id: "2", coverageScore: 0.5 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.length).toBe(2);
      // Order should be stable (original order preserved for equal values)
    });
  });

  describe("match property variants", () => {
    it("should work with coverageScore property", () => {
      const recipes = [
        { id: "1", coverageScore: 0.8 },
        { id: "2", coverageScore: 0.4 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.id)).toEqual(["1", "2"]);
    });

    it("should work with match property", () => {
      const recipes = [
        { id: "1", match: 80 },
        { id: "2", match: 40 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.id)).toEqual(["1", "2"]);
    });

    it("should work with matchPercentage property", () => {
      const recipes = [
        { id: "1", matchPercentage: "80%" },
        { id: "2", matchPercentage: "40%" },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.id)).toEqual(["1", "2"]);
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

    it("should not mutate original array", () => {
      const recipes = [
        { id: "1", coverageScore: 0.3 },
        { id: "2", coverageScore: 0.9 },
      ];
      const originalOrder = [...recipes];
      filterAndSortRecipes(recipes);
      expect(recipes).toEqual(originalOrder);
    });

    it("should not mutate original recipe objects", () => {
      const recipe = { id: "1", coverageScore: 0.5 };
      const recipes = [recipe];
      const result = filterAndSortRecipes(recipes);
      expect(result[0]).toBe(recipe); // Same reference
    });
  });
});
