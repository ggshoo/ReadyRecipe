import { describe, it, expect } from "vitest";
import {
  normalizeMatchValue,
  filterAndSortRecipes,
  filterAndSortRecipeScores,
} from "../lib/sortRecipes";

describe("normalizeMatchValue", () => {
  describe("string percentage format", () => {
    it("should handle string with percentage sign", () => {
      expect(normalizeMatchValue("85%")).toBe(85);
      expect(normalizeMatchValue("100%")).toBe(100);
      expect(normalizeMatchValue("0%")).toBe(0);
      expect(normalizeMatchValue("50.5%")).toBe(50.5);
    });

    it("should handle string with percentage sign and whitespace", () => {
      expect(normalizeMatchValue(" 85% ")).toBe(85);
      expect(normalizeMatchValue("85 %")).toBe(85);
    });
  });

  describe("string number format", () => {
    it("should handle string without percentage sign", () => {
      expect(normalizeMatchValue("85")).toBe(85);
      expect(normalizeMatchValue("100")).toBe(100);
      expect(normalizeMatchValue("50.5")).toBe(50.5);
    });

    it("should handle string with whitespace", () => {
      expect(normalizeMatchValue(" 85 ")).toBe(85);
    });
  });

  describe("string fraction format", () => {
    it("should treat string fractions (0,1] as percentages", () => {
      expect(normalizeMatchValue("0.85")).toBe(85);
      expect(normalizeMatchValue("0.5")).toBe(50);
      expect(normalizeMatchValue("1")).toBe(100);
      expect(normalizeMatchValue("1.0")).toBe(100);
    });

    it("should handle very small fractions", () => {
      expect(normalizeMatchValue("0.01")).toBe(1);
      expect(normalizeMatchValue("0.001")).toBeCloseTo(0.1);
    });
  });

  describe("number format", () => {
    it("should handle plain numbers", () => {
      expect(normalizeMatchValue(85)).toBe(85);
      expect(normalizeMatchValue(100)).toBe(100);
      expect(normalizeMatchValue(50.5)).toBe(50.5);
    });

    it("should handle zero", () => {
      expect(normalizeMatchValue(0)).toBe(0);
    });
  });

  describe("number fraction format", () => {
    it("should treat number fractions (0,1] as percentages", () => {
      expect(normalizeMatchValue(0.85)).toBe(85);
      expect(normalizeMatchValue(0.5)).toBe(50);
      expect(normalizeMatchValue(1)).toBe(100);
    });
  });

  describe("null and undefined", () => {
    it("should return 0 for null", () => {
      expect(normalizeMatchValue(null)).toBe(0);
    });

    it("should return 0 for undefined", () => {
      expect(normalizeMatchValue(undefined)).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should return 0 for NaN", () => {
      expect(normalizeMatchValue(NaN)).toBe(0);
    });

    it("should return 0 for Infinity", () => {
      expect(normalizeMatchValue(Infinity)).toBe(0);
    });

    it("should return 0 for -Infinity", () => {
      expect(normalizeMatchValue(-Infinity)).toBe(0);
    });

    it("should return 0 for unparseable strings", () => {
      expect(normalizeMatchValue("abc")).toBe(0);
      expect(normalizeMatchValue("")).toBe(0);
      expect(normalizeMatchValue("not a number")).toBe(0);
    });

    it("should handle negative numbers as 0", () => {
      expect(normalizeMatchValue(-10)).toBe(0);
      expect(normalizeMatchValue("-10")).toBe(0);
    });

    it("should handle numbers greater than 100", () => {
      expect(normalizeMatchValue(150)).toBe(150);
      expect(normalizeMatchValue("150")).toBe(150);
    });
  });
});

describe("filterAndSortRecipes", () => {
  interface TestRecipe {
    name: string;
    match?: string | number | null;
  }

  it("should filter out recipes with 0 or negative match", () => {
    const recipes: TestRecipe[] = [
      { name: "Recipe A", match: 85 },
      { name: "Recipe B", match: 0 },
      { name: "Recipe C", match: -10 },
      { name: "Recipe D", match: 50 },
    ];
    const result = filterAndSortRecipes(recipes);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["Recipe A", "Recipe D"]);
  });

  it("should filter out recipes with null/undefined match", () => {
    const recipes: TestRecipe[] = [
      { name: "Recipe A", match: 85 },
      { name: "Recipe B", match: null },
      { name: "Recipe C", match: undefined },
      { name: "Recipe D" },
    ];
    const result = filterAndSortRecipes(recipes);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Recipe A");
  });

  it("should sort recipes by match percentage descending", () => {
    const recipes: TestRecipe[] = [
      { name: "Recipe A", match: 50 },
      { name: "Recipe B", match: 85 },
      { name: "Recipe C", match: 70 },
      { name: "Recipe D", match: 95 },
    ];
    const result = filterAndSortRecipes(recipes);
    expect(result.map((r) => r.name)).toEqual([
      "Recipe D",
      "Recipe B",
      "Recipe C",
      "Recipe A",
    ]);
  });

  it("should handle mixed match formats", () => {
    const recipes: TestRecipe[] = [
      { name: "Recipe A", match: "85%" },
      { name: "Recipe B", match: 0.5 },
      { name: "Recipe C", match: "95" },
      { name: "Recipe D", match: 70 },
    ];
    const result = filterAndSortRecipes(recipes);
    expect(result.map((r) => r.name)).toEqual([
      "Recipe C",
      "Recipe A",
      "Recipe D",
      "Recipe B",
    ]);
  });

  it("should not mutate the original array", () => {
    const recipes: TestRecipe[] = [
      { name: "Recipe B", match: 50 },
      { name: "Recipe A", match: 85 },
    ];
    const originalOrder = recipes.map((r) => r.name);
    filterAndSortRecipes(recipes);
    expect(recipes.map((r) => r.name)).toEqual(originalOrder);
  });

  it("should return a new array", () => {
    const recipes: TestRecipe[] = [
      { name: "Recipe A", match: 85 },
      { name: "Recipe B", match: 50 },
    ];
    const result = filterAndSortRecipes(recipes);
    expect(result).not.toBe(recipes);
  });

  it("should handle empty array", () => {
    const result = filterAndSortRecipes([]);
    expect(result).toEqual([]);
  });

  it("should handle array with all zero matches", () => {
    const recipes: TestRecipe[] = [
      { name: "Recipe A", match: 0 },
      { name: "Recipe B", match: "0%" },
      { name: "Recipe C", match: null },
    ];
    const result = filterAndSortRecipes(recipes);
    expect(result).toEqual([]);
  });
});

describe("filterAndSortRecipeScores", () => {
  interface TestRecipeScore {
    recipe: { id: string; name: string };
    coverageScore?: number;
    similarityScore: number;
  }

  it("should filter and sort by coverageScore", () => {
    const recipes: TestRecipeScore[] = [
      { recipe: { id: "1", name: "Recipe A" }, coverageScore: 0.5, similarityScore: 0.8 },
      { recipe: { id: "2", name: "Recipe B" }, coverageScore: 0.85, similarityScore: 0.6 },
      { recipe: { id: "3", name: "Recipe C" }, coverageScore: 0, similarityScore: 0.9 },
      { recipe: { id: "4", name: "Recipe D" }, coverageScore: 0.7, similarityScore: 0.7 },
    ];
    const result = filterAndSortRecipeScores(recipes);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.recipe.name)).toEqual([
      "Recipe B",
      "Recipe D",
      "Recipe A",
    ]);
  });

  it("should filter out recipes with undefined coverageScore", () => {
    const recipes: TestRecipeScore[] = [
      { recipe: { id: "1", name: "Recipe A" }, coverageScore: 0.5, similarityScore: 0.8 },
      { recipe: { id: "2", name: "Recipe B" }, similarityScore: 0.6 } as TestRecipeScore,
    ];
    const result = filterAndSortRecipeScores(recipes);
    expect(result).toHaveLength(1);
    expect(result[0].recipe.name).toBe("Recipe A");
  });

  it("should not mutate the original array", () => {
    const recipes: TestRecipeScore[] = [
      { recipe: { id: "1", name: "Recipe B" }, coverageScore: 0.5, similarityScore: 0.8 },
      { recipe: { id: "2", name: "Recipe A" }, coverageScore: 0.85, similarityScore: 0.6 },
    ];
    const originalOrder = recipes.map((r) => r.recipe.name);
    filterAndSortRecipeScores(recipes);
    expect(recipes.map((r) => r.recipe.name)).toEqual(originalOrder);
  });

  it("should return a new array", () => {
    const recipes: TestRecipeScore[] = [
      { recipe: { id: "1", name: "Recipe A" }, coverageScore: 0.85, similarityScore: 0.6 },
    ];
    const result = filterAndSortRecipeScores(recipes);
    expect(result).not.toBe(recipes);
  });
});
