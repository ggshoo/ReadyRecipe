import { describe, it, expect } from "vitest";
import {
  parseMatchPercentage,
  filterAndSortRecipes,
} from "../lib/sortRecipes";

describe("parseMatchPercentage", () => {
  describe("string with percent sign", () => {
    it("should parse '85%' as 85", () => {
      expect(parseMatchPercentage("85%")).toBe(85);
    });

    it("should parse '100%' as 100", () => {
      expect(parseMatchPercentage("100%")).toBe(100);
    });

    it("should parse '0%' as 0", () => {
      expect(parseMatchPercentage("0%")).toBe(0);
    });

    it("should handle whitespace around percent string", () => {
      expect(parseMatchPercentage("  85%  ")).toBe(85);
    });
  });

  describe("string number (no percent sign)", () => {
    it("should parse '85' as 85", () => {
      expect(parseMatchPercentage("85")).toBe(85);
    });

    it("should parse '0.85' as 85 (fraction conversion)", () => {
      expect(parseMatchPercentage("0.85")).toBe(85);
    });

    it("should parse '1' as 100 (fraction conversion)", () => {
      expect(parseMatchPercentage("1")).toBe(100);
    });

    it("should parse '0' as 0", () => {
      expect(parseMatchPercentage("0")).toBe(0);
    });
  });

  describe("number values", () => {
    it("should parse 85 as 85", () => {
      expect(parseMatchPercentage(85)).toBe(85);
    });

    it("should parse 0.85 as 85 (fraction conversion)", () => {
      expect(parseMatchPercentage(0.85)).toBe(85);
    });

    it("should parse 1 as 100 (fraction conversion)", () => {
      expect(parseMatchPercentage(1)).toBe(100);
    });

    it("should parse 0 as 0", () => {
      expect(parseMatchPercentage(0)).toBe(0);
    });

    it("should handle NaN", () => {
      expect(parseMatchPercentage(NaN)).toBe(0);
    });

    it("should handle negative numbers", () => {
      expect(parseMatchPercentage(-5)).toBe(-5);
    });
  });

  describe("null and undefined", () => {
    it("should parse null as 0", () => {
      expect(parseMatchPercentage(null)).toBe(0);
    });

    it("should parse undefined as 0", () => {
      expect(parseMatchPercentage(undefined)).toBe(0);
    });
  });

  describe("unparseable values", () => {
    it("should parse empty string as 0", () => {
      expect(parseMatchPercentage("")).toBe(0);
    });

    it("should parse non-numeric string as 0", () => {
      expect(parseMatchPercentage("abc")).toBe(0);
    });

    it("should parse whitespace-only string as 0", () => {
      expect(parseMatchPercentage("   ")).toBe(0);
    });
  });
});

describe("filterAndSortRecipes", () => {
  describe("filtering behavior", () => {
    it("should filter out recipes with 0% match", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: 0 },
        { name: "C", coverageScore: 0.3 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toEqual(["A", "C"]);
    });

    it("should filter out recipes with negative match", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: -10 },
        { name: "C", coverageScore: 0.3 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
    });

    it("should filter out recipes with null/undefined match", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 },
        { name: "B", coverageScore: null },
        { name: "C", coverageScore: undefined },
        { name: "D" }, // No coverageScore property
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("A");
    });
  });

  describe("sorting behavior", () => {
    it("should sort recipes by match percentage descending", () => {
      const recipes = [
        { name: "Low", coverageScore: 0.3 },
        { name: "High", coverageScore: 0.9 },
        { name: "Mid", coverageScore: 0.5 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual(["High", "Mid", "Low"]);
    });

    it("should handle various match formats while sorting", () => {
      const recipes = [
        { name: "Percent", coverageScore: "50%" },
        { name: "Number", coverageScore: 85 },
        { name: "Fraction", coverageScore: 0.7 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual(["Number", "Fraction", "Percent"]);
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
  });

  describe("immutability", () => {
    it("should not mutate the original array", () => {
      const recipes = [
        { name: "B", coverageScore: 0.5 },
        { name: "A", coverageScore: 0.9 },
      ];
      const originalOrder = [...recipes];
      filterAndSortRecipes(recipes);
      expect(recipes).toEqual(originalOrder);
    });

    it("should not mutate the original recipe objects", () => {
      const recipes = [{ name: "A", coverageScore: 0.5 }];
      const result = filterAndSortRecipes(recipes);
      // The returned objects should be the same references (shallow copy)
      expect(result[0]).toBe(recipes[0]);
    });
  });

  describe("match property support", () => {
    it("should support 'match' property in addition to 'coverageScore'", () => {
      const recipes = [
        { name: "A", match: 0.5 },
        { name: "B", match: 0.9 },
        { name: "C", match: 0 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toEqual(["B", "A"]);
    });

    it("should prioritize 'coverageScore' over 'match'", () => {
      const recipes = [
        { name: "A", coverageScore: 0.9, match: 0.1 },
        { name: "B", coverageScore: 0.5, match: 0.95 },
      ];
      const result = filterAndSortRecipes(recipes);
      // Should use coverageScore, so A (0.9) comes before B (0.5)
      expect(result.map((r) => r.name)).toEqual(["A", "B"]);
    });
  });
});
